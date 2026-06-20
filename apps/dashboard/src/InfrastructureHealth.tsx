import { useEffect, useState } from 'react';

interface StateRecord {
  id: string;
  resource_type: string;
  status: 'active' | 'orphaned' | 'error' | 'unproxied';
  last_verified_at: string;
  metadata: string;
}

interface AuditEntry {
  event_id: string;
  action_type: string;
  success: number;
  message: string | null;
  created_at: string;
}

export default function InfrastructureHealth() {
  const [states, setStates] = useState<StateRecord[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/state')
      .then(r => r.json())
      .then(data => {
        if (data.results) {
          setStates(data.results);
          if (data.results.length > 0) {
            setLastScan(data.results[0].last_verified_at);
          }
        }
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });

    fetch('/api/audit?limit=10')
      .then(r => r.json())
      .then(data => {
        if (data.results) setAudit(data.results);
      });
  }, []);

  const workers = states.filter(s => s.resource_type === 'worker');
  const dns = states.filter(s => s.resource_type === 'dns');
  const orphans = states.filter(s => s.status === 'orphaned');

  if (loading) return (
    <div className="p-4 text-zinc-400 flex items-center gap-2">
      <div className="animate-spin h-4 w-4 border-2 border-zinc-500 border-t-transparent rounded-full" />
      Polling true state...
    </div>
  );

  if (error) return (
    <div className="p-4 text-rose-400 bg-rose-950/20 rounded border border-rose-900">
      Error: {error}
    </div>
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Infrastructure Health</h2>
        {lastScan && (
          <span className="text-xs text-zinc-500">
            Last scan: {new Date(lastScan).toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Active Workers" value={workers.length} color="text-emerald-400" />
        <StatCard label="DNS Records" value={dns.length} color="text-blue-400" />
        <StatCard 
          label="Orphaned Resources" 
          value={orphans.length} 
          color={orphans.length > 0 ? 'text-rose-400' : 'text-zinc-500'} 
        />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Workers</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {workers.length === 0 ? (
              <p className="text-xs text-zinc-600">No workers found</p>
            ) : workers.map(s => (
              <ResourceRow key={s.id} record={s} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">DNS Records</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {dns.length === 0 ? (
              <p className="text-xs text-zinc-600">No DNS records found</p>
            ) : dns.map(s => (
              <ResourceRow key={s.id} record={s} />
            ))}
          </div>
        </div>

        {audit.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Recent Activity</h3>
            <div className="space-y-1 text-xs">
              {audit.slice(0, 5).map(a => (
                <div key={a.event_id} className="flex items-center gap-2 text-zinc-500">
                  <span className={a.success ? 'text-emerald-400' : 'text-rose-400'}>
                    {a.success ? '✓' : '✗'}
                  </span>
                  <span className="text-zinc-400">{a.action_type}</span>
                  <span className="truncate">{a.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-zinc-950 p-4 rounded border border-zinc-800">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

function ResourceRow({ record }: { record: StateRecord }) {
  const meta = JSON.parse(record.metadata || '{}');
  const displayName = meta.name || record.id.split(':')[1] || record.id;
  
  return (
    <div className="flex items-center justify-between text-sm p-2 bg-zinc-950 rounded">
      <span className="text-zinc-300 font-mono truncate">{displayName}</span>
      <StatusBadge status={record.status} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
    orphaned: 'bg-rose-900/30 text-rose-400 border-rose-800',
    error: 'bg-amber-900/30 text-amber-400 border-amber-800',
    unproxied: 'bg-zinc-800 text-zinc-400 border-zinc-700'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs border ${colors[status] || colors.unproxied}`}>
      {status}
    </span>
  );
}