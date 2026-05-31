import type { KVTelemetrySnapshot } from '../types';

interface Props {
  telemetry: Record<string, KVTelemetrySnapshot | null>;
  date: string;
}

function OpBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 text-gray-500 text-right font-mono">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-gray-400 text-right font-mono">{value}</span>
    </div>
  );
}

function WorkerTelemetry({ name, data }: { name: string; data: KVTelemetrySnapshot | null }) {
  if (!data) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-400">{name}</span>
          <span className="text-xs text-gray-600">no data</span>
        </div>
      </div>
    );
  }

  const totalOps = data.ops.get + data.ops.put + data.ops.delete + data.ops.list;
  const maxOp = Math.max(data.ops.get, data.ops.put, data.ops.delete, data.ops.list, 1);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-300">{name}</span>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{data.totalRequests} req</span>
          <span>{data.errors > 0 ? `⚠ ${data.errors} err` : '✓ 0 err'}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <OpBar label="GET" value={data.ops.get} max={maxOp} />
        <OpBar label="PUT" value={data.ops.put} max={maxOp} />
        <OpBar label="DEL" value={data.ops.delete} max={maxOp} />
        <OpBar label="LIST" value={data.ops.list} max={maxOp} />
      </div>

      <div className="mt-2 flex justify-between text-xs text-gray-600">
        <span>{totalOps} total ops</span>
        <span>{data.flushCount} flushes</span>
      </div>
    </div>
  );
}

export function TelemetryPanel({ telemetry, date }: Props) {
  const workers = Object.entries(telemetry);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-200">KV Telemetry</h2>
        <span className="text-xs text-gray-500 font-mono">{date}</span>
      </div>
      <div className="space-y-3">
        {workers.map(([name, data]) => (
          <WorkerTelemetry key={name} name={name} data={data} />
        ))}
      </div>
    </div>
  );
}
