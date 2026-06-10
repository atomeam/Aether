import { useState } from 'react';

const BRIDGE_URL = 'https://bridge.a-to-mind.com';

const TIERS = [
  { name: 'Free', price: '$0', tagline: 'Explore the bridge API', features: ['Public bridge endpoints', 'Community support', 'Rate-limited access'] },
  { name: 'Pro', price: '$49/mo', tagline: 'Automation for one business', features: ['API key + priority rate limits', 'Council session logs & replay', 'Email support'] },
  { name: 'Enterprise', price: 'Custom', tagline: 'Your own agent council', features: ['Dedicated agent team', 'Custom integrations (Slack, Notion, Jira)', 'SLA + direct line'] },
];

export default function PricingContact() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const r = await fetch(`${BRIDGE_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, message }),
      });
      setStatus(r.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="pricing" className="relative z-10 max-w-5xl mx-auto px-6 py-20">
      <h2 className="text-2xl font-black uppercase tracking-[0.3em] text-white/90 text-center mb-2">Run Your Ops on AtoMind</h2>
      <p className="text-center text-white/40 text-xs uppercase tracking-widest mb-12">Autonomous agent teams. Measurable output. No babysitting.</p>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {TIERS.map((t) => (
          <div key={t.name} className="border border-white/10 bg-white/[0.02] p-6 flex flex-col hover:border-blue-500/40 transition-colors">
            <div className="text-blue-400 text-[10px] font-black uppercase tracking-[0.25em]">{t.name}</div>
            <div className="text-3xl font-black text-white my-2">{t.price}</div>
            <div className="text-white/40 text-xs mb-4">{t.tagline}</div>
            <ul className="space-y-2 text-white/60 text-xs flex-1">
              {t.features.map((f) => <li key={f}>— {f}</li>)}
            </ul>
            <a href="#contact" className="mt-6 block text-center py-2 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
              Get started
            </a>
          </div>
        ))}
      </div>

      <form id="contact" onSubmit={submit} className="max-w-xl mx-auto space-y-3">
        <h3 className="text-center text-white/70 text-xs font-black uppercase tracking-[0.25em] mb-4">Talk to the team</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
          className="w-full bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-500/50 outline-none" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required
          className="w-full bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-500/50 outline-none" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do you want to automate?" rows={4}
          className="w-full bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-500/50 outline-none" />
        <button type="submit" disabled={status === 'sending' || status === 'sent'}
          className="w-full py-3 border border-blue-500/40 text-blue-400 text-xs font-black uppercase tracking-[0.25em] hover:bg-blue-500 hover:text-white transition-all disabled:opacity-40">
          {status === 'sent' ? 'Received — we\'ll be in touch' : status === 'sending' ? 'Sending…' : status === 'error' ? 'Failed — retry' : 'Send'}
        </button>
      </form>
    </section>
  );
}
