import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useBrain } from '../lib/brain-context';

interface NodeListProps {
  onSelect?: (node: { id: string; title: string }) => void;
  selectedId?: string;
}

export function NodeList({ onSelect, selectedId }: NodeListProps) {
  const { nodes, loading, syncStatus, deleteNode } = useBrain();

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-[#020202] border-r border-white/5">
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-mono">
            Recent Notes
          </h2>
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full',
              syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
              syncStatus === 'error' ? 'bg-red-400' :
              'bg-[#2cffc0]'
            )} />
            <span className="text-[7px] text-white/20 font-mono uppercase">
              {syncStatus === 'syncing' ? 'syncing' : syncStatus === 'error' ? 'offline' : 'local'}
            </span>
          </div>
        </div>
        <p className="text-[8px] text-white/15 font-mono mt-1">
          {nodes.length} entries · stored locally
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-6 py-8 text-center">
            <div className="text-[9px] text-white/20 font-mono uppercase tracking-widest">
              Loading...
            </div>
          </div>
        )}

        {!loading && nodes.length === 0 && (
          <div className="px-6 py-8 text-center">
            <div className="text-[9px] text-white/15 font-mono uppercase tracking-widest">
              No notes yet
            </div>
            <p className="text-[8px] text-white/10 mt-2">
              Start typing to create your first entry.
            </p>
          </div>
        )}

        <AnimatePresence>
          {nodes.map((node) => (
            <motion.button
              key={node.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={() => onSelect?.({ id: node.id, title: node.title })}
              className={cn(
                'w-full text-left px-6 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group',
                selectedId === node.id && 'bg-white/[0.03] border-l-2 border-l-[#2cffc0]/40'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-white/70 font-mono truncate group-hover:text-white/90 transition-colors">
                  {node.title || 'Untitled'}
                </div>
                {!node._synced && (
                  <span className="text-[7px] text-yellow-400/50 shrink-0 ml-2">●</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[8px] text-white/20 font-mono">
                  {formatTime(node.updated_at)}
                </span>
                <span className={cn(
                  'text-[7px] uppercase tracking-widest',
                  node.status === 'processed' ? 'text-[#2cffc0]/50' : 'text-white/20'
                )}>
                  {node.status}
                </span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
