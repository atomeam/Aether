addEventListener('fetch', e => e.respondWith(handle(e.request)));
async function handle(req) {
  const u = new URL(req.url);
  if (req.method === 'GET' && u.pathname === '/billing/health') return new Response(JSON.stringify({ok:true,version:process.env.COMMIT||'dev'}),{headers:{'Content-Type':'application/json'}});
  if (req.method === 'POST' && u.pathname === '/webhook/payment') {
    try {
      const p = JSON.parse(await req.text()), n = normalize(p);
      const r = await fetch(process.env.LEDGER_API_URL||'https://internal.ledger.local/runs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:n.provider,amount_cents:n.amount_cents,currency:n.currency,customer_email:n.customer_email,session_id:n.session_id,metadata:n.metadata||{},received_at:new Date().toISOString()})});
      if (!r.ok) return new Response('ledger fail',{status:502});
      return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});
    } catch(err) { return new Response('error',{status:500}); }
  }
  return new Response('not found',{status:404});
}
function normalize(p) {
  if (p?.payment?.amount) return {provider:'wix',amount_cents:Math.round((p.payment.amount.value||0)*100),currency:p.payment.amount.currency||'USD',customer_email:p.customer?.email||p.payment?.email||'',session_id:p.payment.id||p.id||'',metadata:p};
  if (p?.type && p?.data?.object) { const o=p.data.object; return {provider:'stripe',amount_cents:Math.round(o.amount_total||o.amount_subtotal||0),currency:o.currency||'usd',customer_email:o.customer_details?.email||'',session_id:o.id||'',metadata:o}; }
  return {provider:'unknown',amount_cents:Math.round((p.amount||0)*100),currency:p.currency||'usd',customer_email:p.email||'',session_id:p.id||'',metadata:p};
}
