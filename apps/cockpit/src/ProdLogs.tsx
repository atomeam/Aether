import { useEffect, useState } from "react";

type LogEntry = {
  ts: string;
  worker: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  requestId: string;
};

export default function ProdLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    // This would connect to the telemetry hub to receive prod logs
    // For now, we simulate with a timer
    const interval = setInterval(() => {
      const levels: ("INFO" | "WARN" | "ERROR")[] = ["INFO", "INFO", "INFO", "WARN", "ERROR"];
      const messages = [
        "Request processed successfully",
        "Database query completed in 12ms",
        "Cache hit rate: 87%",
        "Worker heartbeat received",
        "KV write operation completed",
        "D1 query executed",
      ];
      const newLog: LogEntry = {
        ts: new Date().toISOString(),
        worker: "bridge-prod",
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        requestId: Math.random().toString(36).substring(7),
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
      setLive(true);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const levelColor = (level: string) => {
    switch (level) {
      case "INFO": return "#22c55e";
      case "WARN": return "#f59e0b";
      case "ERROR": return "#ef4444";
      default: return "#6b7280";
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: live ? "#22c55e" : "#ef4444" }} />
        <b>Production Logs</b>
        <span style={{ opacity: 0.6 }}>{live ? "live" : "connecting…"}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.6 }}>Last 50 entries</span>
      </div>

      <div style={{ background: "#0f1117", border: "1px solid #1f2430", borderRadius: 10, padding: 12, maxHeight: 400, overflow: "auto" }}>
        {logs.length === 0 ? (
          <div style={{ opacity: 0.4, fontStyle: "italic", padding: 20, textAlign: "center" }}>
            awaiting production logs…
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ 
              padding: "8px 12px", 
              borderBottom: "1px solid #1f2430", 
              fontSize: 12,
              fontFamily: "monospace",
              display: "grid",
              gridTemplateColumns: "80px 60px 1fr 100px",
              gap: 12,
              alignItems: "center"
            }}>
              <div style={{ opacity: 0.6 }}>{new Date(log.ts).toLocaleTimeString()}</div>
              <div style={{ 
                color: levelColor(log.level), 
                fontWeight: 700, 
                fontSize: 11,
                textAlign: "center"
              }}>
                {log.level}
              </div>
              <div style={{ opacity: 0.9 }}>{log.message}</div>
              <div style={{ opacity: 0.4, fontSize: 10 }}>{log.requestId}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}