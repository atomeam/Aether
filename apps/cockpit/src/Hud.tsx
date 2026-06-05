import { useEffect, useRef, useState } from "react";

type Frame = {
  ts: string; branch?: string; workingSet?: string | null; session?: string | null;
  testOutput?: string | null; subagents?: { name: string; status: string }[] | null;
};
const WS = (import.meta.env.VITE_COCKPIT_WS ?? "wss://devin.a-to-mind.com/api/ws")
  + `?t=${import.meta.env.VITE_COCKPIT_VIEWER_TOKEN}`;

export default function Hud() {
  const [frame, setFrame] = useState<Frame | null>(null);
  const [live, setLive] = useState(false);
  const ref = useRef<WebSocket | null>(null);

  useEffect(() => {
    let stop = false;
    function connect() {
      const ws = new WebSocket(WS); ref.current = ws;
      ws.onopen = () => setLive(true);
      ws.onclose = () => { setLive(false); if (!stop) setTimeout(connect, 1500); };
      ws.onmessage = (e) => { try { setFrame(JSON.parse(e.data)); } catch {} };
    }
    connect();
    return () => { stop = true; ref.current?.close(); };
  }, []);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: live ? "#22c55e" : "#ef4444" }} />
        <b>Live Devin Feed</b>
        <span style={{ opacity: 0.6 }}>{live ? "streaming" : "reconnectingâ€¦"}</span>
        {frame?.branch && <code style={{ marginLeft: "auto" }}>{frame.branch}</code>}
      </div>

      <Panel title="Working set (what Devin is holding)">
        {frame?.workingSet ?? <Empty>awaiting live feedâ€¦</Empty>}
      </Panel>
      <Panel title="Live test / AgentCoder output">
        {frame?.testOutput ?? <Empty>no test run captured yet</Empty>}
      </Panel>
      <Panel title="Sub-agent status (Council / Verifier)">
        {frame?.subagents?.length
          ? frame.subagents.map((s, i) => <div key={i}>â€¢ {s.name}: <b>{s.status}</b></div>)
          : <Empty>no sub-agents active</Empty>}
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0f1117", border: "1px solid #1f2430", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6, marginBottom: 6 }}>{title}</div>
      <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 13, lineHeight: 1.4 }}>{children}</pre>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <span style={{ opacity: 0.4, fontStyle: "italic" }}>{children}</span>;
}