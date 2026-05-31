import { useEffect, useState } from 'react';
import { AgentCard } from './components/AgentCard';
import { TelemetryPanel } from './components/TelemetryPanel';
import { StatsBar } from './components/StatsBar';
import { getCrewSnapshot, getTelemetry } from './api';
import type { CrewSnapshot, TelemetryResponse } from './types';

/** Auto-refresh interval in ms */
const REFRESH_INTERVAL = 15_000;

export function App() {
  const [crew, setCrew] = useState<CrewSnapshot | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [crewData, telData] = await Promise.all([
      getCrewSnapshot(),
      getTelemetry(),
    ]);
    setCrew(crewData);
    setTelemetry(telData);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 animate-pulse">Loading crew room…</div>
      </div>
    );
  }

  const agents = crew?.agents ?? [];
  const activeAgents = agents.filter(a => a.status === 'active');
  const standbyAgents = agents.filter(a => a.status === 'standby' || a.status === 'on-ice');
  const offlineAgents = agents.filter(a => a.status === 'offline' || a.status === 'unknown');

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧑‍🚀</span>
            <div>
              <h1 className="text-xl font-bold text-gray-100">Crew Room</h1>
              <p className="text-xs text-gray-500">Aether · a-to-mind.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Live — refreshes every 15s</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Stats */}
        <StatsBar
          totalActive={crew?.totalActive ?? 0}
          totalPRs={crew?.totalPRs ?? 0}
          totalTasks={crew?.totalTasks ?? 0}
          updatedAt={crew?.updatedAt ?? null}
        />

        {/* Active Agents */}
        {activeAgents.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-4">
              Active ({activeAgents.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAgents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        )}

        {/* Standby / On Ice */}
        {standbyAgents.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">
              Standby / On Ice ({standbyAgents.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {standbyAgents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        )}

        {/* Offline */}
        {offlineAgents.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-400 mb-4">
              Offline ({offlineAgents.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offlineAgents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        )}

        {/* Telemetry */}
        {telemetry && (
          <section className="border-t border-gray-800 pt-6">
            <TelemetryPanel telemetry={telemetry.telemetry} date={telemetry.date} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-4 text-center text-xs text-gray-600">
        Aether Crew Room v0.1.0 · Mock data until bridge worker deploys
      </footer>
    </div>
  );
}
