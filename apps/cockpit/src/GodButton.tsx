import { useState } from "react";

export default function GodButton({ prNumber, disabled }: { prNumber: number; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function execute() {
    setBusy(true);
    setStatus("Triggering GitHub Actions...");
    try {
      const res = await fetch("/api/webhook/execute", {
        method: "POST",
        headers: {
          authorization: `Bearer ${import.meta.env.VITE_COCKPIT_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ pr_number: prNumber }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("âœ“ GitHub Actions triggered. Check workflow status.");
      } else {
        setStatus(`âœ— Failed: ${data.error || "Unknown error"}`);
      }
    } catch (e) {
      setStatus(`âœ— Network error: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  return (
    <div style={{ marginTop: 24, padding: 16, background: "#1a1d2a", borderRadius: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <b>ðŸ”¥ God Button</b>
        <span style={{ marginLeft: 8, opacity: 0.6 }}>PR #{prNumber}</span>
      </div>
      <button
        disabled={disabled || busy}
        onClick={execute}
        style={{
          background: disabled ? "#374151" : "#f59e0b",
          color: "#fff",
          border: 0,
          padding: "12px 24px",
          fontSize: 16,
          borderRadius: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          width: "100%",
        }}
      >
        {busy ? "â³ Executing..." : "ðŸš€ EXECUTE"}
      </button>
      {status && (
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>{status}</div>
      )}
      <div style={{ marginTop: 8, fontSize: 11, opacity: 0.5 }}>
        Triggers GitHub Actions â†’ runs mech checks â†’ merges PR â†’ updates Notion
      </div>
    </div>
  );
}