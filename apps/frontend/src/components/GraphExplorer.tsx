import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useBrain } from '../lib/brain-context';

interface GraphExplorerProps {
  onSelectNode?: (nodeId: string) => void;
}

export function GraphExplorer({ onSelectNode }: GraphExplorerProps) {
  const { nodes, edges, loading } = useBrain();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nodePositions = useMemo(() => {
    const posMap = new Map<string, { x: number; y: number }>();
    const count = nodes.length;
    if (count === 0) return posMap;

    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(centerX, centerY) * 0.65;

    nodes.forEach((node, i) => {
      const angle = (i / count) * 2 * Math.PI;
      const x = count === 1 ? centerX : centerX + radius * Math.cos(angle);
      const y = count === 1 ? centerY : centerY + radius * Math.sin(angle);
      posMap.set(node.id, { x, y });
    });

    return posMap;
  }, [nodes]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const connectedEdgeIds = new Set(
    edges
      .filter((e) => e.source_node_id === selectedNodeId || e.target_node_id === selectedNodeId)
      .map((e) => e.id),
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050608] font-mono">
        <span className="text-[10px] text-white/30 uppercase tracking-widest animate-pulse">
          Constructing Knowledge Graph...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-[#050608] overflow-hidden flex font-mono">
      <div ref={containerRef} className="flex-1 relative overflow-auto flex items-center justify-center min-h-[500px]">
        {nodes.length === 0 ? (
          <div className="text-center">
            <p className="text-[10px] text-white/30 uppercase tracking-widest">No nodes recorded in graph</p>
            <p className="text-[8px] text-white/15 mt-1">Capture some notes to build your neural map.</p>
          </div>
        ) : (
          <svg className="absolute inset-0 w-full h-full min-w-[800px] min-h-[600px]">
            {edges.map((edge) => {
              const sourcePos = nodePositions.get(edge.source_node_id);
              const targetPos = nodePositions.get(edge.target_node_id);
              if (!sourcePos || !targetPos) return null;

              const isHighlighted = connectedEdgeIds.has(edge.id);

              return (
                <g key={edge.id}>
                  <line
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={isHighlighted ? '#2cffc0' : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray={edge.relationship_type === 'references' ? 'none' : '4 4'}
                  />
                  <text
                    x={(sourcePos.x + targetPos.x) / 2}
                    y={(sourcePos.y + targetPos.y) / 2 - 6}
                    fill={isHighlighted ? '#2cffc0' : 'rgba(255,255,255,0.3)'}
                    fontSize="8"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {edge.relationship_type}
                  </text>
                </g>
              );
            })}

            {nodes.map((node) => {
              const pos = nodePositions.get(node.id) || { x: 400, y: 300 };
              const isSelected = selectedNodeId === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer group"
                >
                  <circle
                    r={isSelected ? 24 : 18}
                    fill={isSelected ? '#2cffc020' : '#111318'}
                    stroke={isSelected ? '#2cffc0' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-all duration-200 group-hover:stroke-white/50"
                  />
                  <text
                    dy="32"
                    textAnchor="middle"
                    fill={isSelected ? '#2cffc0' : 'rgba(255,255,255,0.7)'}
                    fontSize="9"
                    className="tracking-tight select-none font-mono"
                  >
                    {node.title && node.title.length > 15
                      ? `${node.title.substring(0, 15)}...`
                      : node.title || 'Untitled'}
                  </text>
                  {!node._synced && (
                    <circle cx="12" cy="-12" r="3" fill="#eab308" className="opacity-60" />
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-80 bg-[#020202] border-l border-white/5 p-6 flex flex-col justify-between z-10"
          >
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <span className="text-[9px] uppercase tracking-[0.2em] text-white/30">Node Inspector</span>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-[10px] text-white/40 hover:text-white cursor-pointer"
                >
                  [✕]
                </button>
              </div>

              <h3 className="text-sm font-bold text-white mb-2">{selectedNode.title || 'Untitled Node'}</h3>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-[8px] px-2 py-0.5 bg-white/5 text-[#2cffc0] border border-[#2cffc0]/20 rounded">
                  {selectedNode.status}
                </span>
                <span className="text-[7px] text-white/30 font-mono">
                  {new Date(selectedNode.created_at).toLocaleDateString()}
                </span>
                {!selectedNode._synced && (
                  <span className="text-[7px] text-yellow-400/60">unsynced</span>
                )}
              </div>

              <div className="space-y-4 text-xs text-white/70">
                {selectedNode.content && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">Content</span>
                    <p className="text-[11px] leading-relaxed text-white/80 bg-white/[0.02] p-3 border border-white/5 max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {selectedNode.content}
                    </p>
                  </div>
                )}

                {selectedNode.tags && selectedNode.tags.length > 0 && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[8px] bg-white/5 px-2 py-0.5 text-white/60 border border-white/10 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <button
                onClick={() => onSelectNode?.(selectedNode.id)}
                className="w-full py-2 text-[10px] uppercase tracking-widest text-[#2cffc0] border border-[#2cffc0]/30 hover:bg-[#2cffc0]/10 transition-colors cursor-pointer"
              >
                Open in Editor
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
