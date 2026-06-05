import { useEffect, useState } from "react";
import Hud from "./Hud";
import GodButton from "./GodButton";
import ShadowMetrics from "./ShadowMetrics";

type Status = {
  doctor?: { score: number; checks: { name: string; ok: boolean }[] };
  guard?: { alerts: string[] };
  telemetry?: { branch: string; commits_24h: number };
  cie?: { open: number };
  evals?: { passRate: number };
  ejector?: { engaged: boolean };
};

const API = import.meta.env.VITE_COCKPIT_API ?? "/api";

export default function Cockpit() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [prNumber, setPrNumber] = useState(0);

  async function load() { setS(await (await fetch(`${API}/status`)).json()); }
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  async function eject(engaged: boolean) {
    setBusy(true);
    await fetch(`${API}/ejector`, { method: "POST", headers: { authorization: `Bearer ${import.meta.env.VITE_COCKPIT_TOKEN}` }, body: JSON.stringify({ engaged }) });
    await load(); setBusy(false);
  }

  const score = s?.doctor?.score ?? 0;
  const armorOk = (s?.guard?.alerts?.length ?? 0) === 0;
  const ejected = s?.ejector?.engaged ?? false;
  const canExecute = score >= 80 && armorOk && !ejected;

  return (
    <div style={{ fontFamily: "ui-sans-serif", padding: 24, background: "#0b0d12", color: "#e6e8ee", minHeight: "100vh" }}>
      <h1>ðŸ¤– Devin Cockpit</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        <Card title="Readiness" value={`${score}%`} good={score >= 80} />
        <Card title="Armor" value={armorOk ? "INTACT" : `${s?.guard?.alerts?.length} ALERTS`} good={armorOk} />
        <Card title="CIE proposals" value={`${s?.cie?.open ?? 0} open`} good />
        <Card title="Eval pass rate" value={`${Math.round((s?.evals?.passRate ?? 0) * 100)}%`} good={(s?.evals?.passRate ?? 0) >= 0.8} />
        <Card title="Branch" value={s?.telemetry?.branch ?? "â€”"} good />
        <Card title="Commits 24h" value={`${s?.telemetry?.commits_24h ?? 0}`} good />
      </div>

      <div style={{ marginTop: 24 }}>
        <button disabled={busy} onClick={() => eject(!ejected)}
          style={{ background: ejected ? "#16a34a" : "#dc2626", color: "#fff", border: 0, padding: "14px 28px", fontSize: 18, borderRadius: 10, cursor: "pointer" }}>
          {ejected ? "â–¶ RESUME MECH" : "â–  EJECT (kill all loops)"}
        </button>
        {ejected && <span style={{ marginLeft: 12, color: "#fbbf24" }}>Ejector engaged â€” autonomous loops halted.</span>}
      </div>

      {!armorOk && (
        <div style={{ marginTop: 16, background: "#3b0d0d", padding: 12, borderRadius: 8 }}>
          <b>Armor alerts:</b>
          <ul>{s?.guard?.alerts?.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 16 }}>ðŸ§  Live Nervous System</h2>
        <Hud />
      </div>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 16 }}>ðŸ”¥ Execution</h2>
        <div style={{ marginBottom: 16 }}>
          <label>PR Number: </label>
          <input
            type="number"
            value={prNumber}
            onChange={(e) => setPrNumber(parseInt(e.target.value) || 0)}
            style={{ background: "#151823", border: "1px solid #1f2430", color: "#e6e8ee", padding: 8, borderRadius: 4, width: 120 }}
          />
        </div>
        <GodButton prNumber={prNumber} disabled={!canExecute || prNumber === 0} />
        {!canExecute && (
          <div style={{ marginTop: 8, color: "#fbbf24", fontSize: 13 }}>
            God Button disabled: {score < 80 ? "Readiness < 80%" : ""} {!armorOk ? "Armor compromised" : ""} {ejected ? "Ejector engaged" : ""}
          </div>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 16 }}>⚡ Shadow Branch Metrics</h2>
        <ShadowMetrics />
      </div>
    </div>
  );
}

function Card({ title, value, good }: { title: string; value: string; good?: boolean }) {
  return (
    <div style={{ background: "#151823", borderRadius: 12, padding: 16, borderLeft: `4px solid ${good ? "#22c55e" : "#ef4444"}` }}>
      <div style={{ opacity: 0.7, fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
    </div>
  );
}