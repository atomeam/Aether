import { useEffect, useState } from "react";

type ShadowMetrics = {
  ts: string;
  worker: string;
  latency: number;
  errorRate: number;
  requests: number;
};

export default function ShadowMetrics() {
  const [metrics, setMetrics] = useState<ShadowMetrics | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    // This would connect to the telemetry hub to receive shadow metrics
    // For now, we simulate with a timer
    const interval = setInterval(() => {
      setMetrics({
        ts: new Date().toISOString(),
        worker: "bridge-shadow",
        latency: Math.floor(Math.random() * 200) + 10,
        errorRate: Math.random() < 0.05 ? 0.01 : 0,
        requests: Math.floor(Math.random() * 1000) + 100,
      });
      setLive(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: live ? "#22c55e" : "#ef4444" }} />
        <b>Shadow Branch Metrics</b>
        <span style={{ opacity: 0.6 }}>{live ? "live" : "connecting…"}</span>
        {metrics?.worker && <code style={{ marginLeft: "auto" }}>{metrics.worker}</code>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <MetricCard title="Latency" value={`${metrics?.latency ?? 0}ms`} good={(metrics?.latency ?? 0) < 100} />
        <MetricCard title="Error Rate" value={`${((metrics?.errorRate ?? 0) * 100).toFixed(2)}%`} good={(metrics?.errorRate ?? 0) < 0.01} />
        <MetricCard title="Requests" value={`${metrics?.requests ?? 0}`} good />
      </div>

      <div style={{ background: "#0f1117", border: "1px solid #1f2430", borderRadius: 10, padding: 12 }}>
        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6, marginBottom: 6 }}>Last Update</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>{metrics?.ts ?? "awaiting data…"}</div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, good }: { title: string; value: string; good?: boolean }) {
  return (
    <div style={{ background: "#151823", borderRadius: 8, padding: 12, borderLeft: `3px solid ${good ? "#22c55e" : "#ef4444"}` }}>
      <div style={{ opacity: 0.6, fontSize: 11 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}