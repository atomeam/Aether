export async function post_leadForwarder(req) {
  try {
    const b = await req.body.json(), p = {payment:{id:b.id||`wix_${Date.now()}`,amount:{value:Number(b.amount||0).toFixed(2),currency:b.currency||'USD'},email:b.email||''},metadata:{page:b.page||'',product_id:b.product_id||''}};
    const r = await fetch('https://<worker>/webhook/payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
    return r.ok?{status:200,body:{ok:true}}:{status:r.status,body:{ok:false,detail:await r.text()}};
  } catch(e) { return {status:500,body:{ok:false,error:e.message}}; }
}
