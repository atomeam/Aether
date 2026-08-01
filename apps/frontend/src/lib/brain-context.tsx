import React, { createContext, useContext, useEffect, useCallback, useRef, useState } from 'react';
import { brainStore, BrainNode, BrainEdge, SyncQueueItem } from './brain-store';

interface BrainContextValue {
  nodes: BrainNode[];
  edges: BrainEdge[];
  loading: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  createNode: (title: string, content: string) => Promise<BrainNode>;
  updateNode: (id: string, patch: Partial<BrainNode>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  createEdge: (sourceId: string, targetId: string, type: string) => Promise<BrainEdge>;
  refresh: () => Promise<void>;
}

const BrainContext = createContext<BrainContextValue | null>(null);

export function useBrain() {
  const ctx = useContext(BrainContext);
  if (!ctx) throw new Error('useBrain must be used within BrainProvider');
  return ctx;
}

export function BrainProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<BrainNode[]>([]);
  const [edges, setEdges] = useState<BrainEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const syncTimer = useRef<ReturnType<typeof setInterval>>();

  const loadLocal = useCallback(async () => {
    const [localNodes, localEdges] = await Promise.all([brainStore.getNodes(), brainStore.getEdges()]);
    setNodes(localNodes);
    setEdges(localEdges);
    setLoading(false);
  }, []);

  const syncFromAPI = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const [nodesRes, edgesRes] = await Promise.all([
        fetch('/api/v1/brain/nodes'),
        fetch('/api/v1/brain/edges').catch(() => ({ ok: false, json: () => ({ edges: [] }) })),
      ]);

      if (nodesRes.ok) {
        const { nodes: apiNodes } = await nodesRes.json();
        if (apiNodes) await brainStore.syncFromAPI(apiNodes, []);
      }
      if (edgesRes.ok) {
        const { edges: apiEdges } = await edgesRes.json();
        if (apiEdges) await brainStore.syncFromAPI([], apiEdges);
      }

      // Push unsynced local items to API
      const queue = await brainStore.getSyncQueue();
      for (const item of queue) {
        try {
          if (item.action === 'create' && item.type === 'node') {
            const res = await fetch('/api/v1/brain/nodes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: (item.data as BrainNode).title,
                content: (item.data as BrainNode).content,
                content_type: (item.data as BrainNode).content_type,
                status: (item.data as BrainNode).status,
              }),
            });
            if (res.ok) {
              await brainStore.markSynced('node', item.data.id);
              await brainStore.removeSyncItem(item.id);
            }
          }
        } catch {
          // Will retry next cycle
        }
      }

      setSyncStatus('idle');
      await loadLocal();
    } catch {
      setSyncStatus('error');
    }
  }, [loadLocal]);

  // Initial load + periodic sync
  useEffect(() => {
    loadLocal();
    syncFromAPI();
    syncTimer.current = setInterval(syncFromAPI, 30000);
    return () => clearInterval(syncTimer.current);
  }, [loadLocal, syncFromAPI]);

  const createNode = useCallback(async (title: string, content: string): Promise<BrainNode> => {
    const now = new Date().toISOString();
    const node: BrainNode = {
      id: crypto.randomUUID(),
      title,
      content,
      content_type: 'markdown',
      status: 'draft',
      tags: [],
      summary: '',
      created_at: now,
      updated_at: now,
      _synced: false,
    };
    await brainStore.putNode(node);
    await loadLocal();
    return node;
  }, [loadLocal]);

  const updateNode = useCallback(async (id: string, patch: Partial<BrainNode>) => {
    const existing = await brainStore.getNode(id);
    if (!existing) return;
    const updated = { ...existing, ...patch, updated_at: new Date().toISOString(), _synced: false };
    await brainStore.putNode(updated);
    await loadLocal();
  }, [loadLocal]);

  const deleteNode = useCallback(async (id: string) => {
    await brainStore.deleteNode(id);
    await loadLocal();
  }, [loadLocal]);

  const createEdge = useCallback(async (sourceId: string, targetId: string, type: string): Promise<BrainEdge> => {
    const edge: BrainEdge = {
      id: crypto.randomUUID(),
      source_node_id: sourceId,
      target_node_id: targetId,
      relationship_type: type,
      created_at: new Date().toISOString(),
      _synced: false,
    };
    await brainStore.putEdge(edge);
    await loadLocal();
    return edge;
  }, [loadLocal]);

  const value: BrainContextValue = {
    nodes,
    edges,
    loading,
    syncStatus,
    createNode,
    updateNode,
    deleteNode,
    createEdge,
    refresh: syncFromAPI,
  };

  return <BrainContext.Provider value={value}>{children}</BrainContext.Provider>;
}
