import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { CaptureEditor } from './CaptureEditor';
import { NodeList } from './NodeList';
import { GraphExplorer } from './GraphExplorer';
import { BrainProvider, useBrain } from '../lib/brain-context';
import { cn } from '../lib/utils';

function BrainPage() {
  const { syncStatus } = useBrain();
  const [selectedNode, setSelectedNode] = useState<{ id: string; title: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'capture' | 'graph'>('capture');

  const handleSelectNode = useCallback((node: { id: string; title: string }) => {
    setSelectedNode(node);
    setActiveTab('capture');
  }, []);

  return (
    <div className="flex h-screen bg-[#050608] text-[#e0e0e0] font-sans overflow-hidden">
      <NodeList
        onSelect={handleSelectNode}
        selectedId={selectedNode?.id}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-2 border-b border-white/5 bg-[#020202]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('capture')}
              className={cn(
                'text-[10px] uppercase tracking-widest font-mono pb-1 border-b-2 transition-colors cursor-pointer',
                activeTab === 'capture'
                  ? 'border-[#2cffc0] text-[#2cffc0]'
                  : 'border-transparent text-white/40 hover:text-white/70',
              )}
            >
              Capture Editor
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={cn(
                'text-[10px] uppercase tracking-widest font-mono pb-1 border-b-2 transition-colors cursor-pointer',
                activeTab === 'graph'
                  ? 'border-[#2cffc0] text-[#2cffc0]'
                  : 'border-transparent text-white/40 hover:text-white/70',
              )}
            >
              Knowledge Graph
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full',
              syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
              syncStatus === 'error' ? 'bg-red-400' :
              'bg-[#2cffc0]'
            )} />
            <span className="text-[8px] text-white/20 font-mono">
              {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Offline mode' : 'Local-first active'}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 relative">
          {activeTab === 'capture' ? (
            <motion.div
              key={selectedNode?.id ?? 'new'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              <CaptureEditor
                initialContent={''}
                initialTitle={selectedNode?.title || ''}
                editNodeId={selectedNode?.id}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <GraphExplorer
                onSelectNode={(id) => {
                  setSelectedNode({ id, title: '' });
                  setActiveTab('capture');
                }}
              />
            </motion.div>
          )}
        </div>

        <div className="px-6 py-2 border-t border-white/5 flex items-center justify-between bg-[#020202]">
          <div className="flex items-center gap-4 text-[8px] text-white/20 font-mono uppercase tracking-widest">
            <span>a-to-mind Second Brain</span>
            <span className="text-white/10">|</span>
            <span>Local-first · Edge-synced</span>
          </div>
          <div className="text-[8px] text-white/10 font-mono">
            {activeTab === 'capture' ? 'Ctrl+S to save · Esc to clear' : 'Click nodes to inspect'}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SecondBrainPage() {
  return (
    <BrainProvider>
      <BrainPage />
    </BrainProvider>
  );
}
