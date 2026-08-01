const DB_NAME = 'second-brain';
const DB_VERSION = 1;

export interface BrainNode {
  id: string;
  title: string;
  content: string;
  content_type: string;
  status: string;
  tags: string[];
  summary: string;
  created_at: string;
  updated_at: string;
  _synced: boolean;
}

export interface BrainEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  created_at: string;
  _synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: 'node' | 'edge';
  action: 'create' | 'update' | 'delete';
  data: BrainNode | BrainEdge;
  attempts: number;
  created_at: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('nodes')) {
        const nodeStore = db.createObjectStore('nodes', { keyPath: 'id' });
        nodeStore.createIndex('updated_at', 'updated_at');
        nodeStore.createIndex('status', 'status');
      }
      if (!db.objectStoreNames.contains('edges')) {
        const edgeStore = db.createObjectStore('edges', { keyPath: 'id' });
        edgeStore.createIndex('source_node_id', 'source_node_id');
        edgeStore.createIndex('target_node_id', 'target_node_id');
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txPromise<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const s = tx.objectStore(store);
    const req = fn(s);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return txPromise(db, store, 'readonly', (s) => s.getAll());
}

function get<T>(db: IDBDatabase, store: string, key: string): Promise<T | undefined> {
  return txPromise(db, store, 'readonly', (s) => s.get(key));
}

function put<T>(db: IDBDatabase, store: string, value: T): Promise<T> {
  return txPromise(db, store, 'readwrite', (s) => s.put(value));
}

function del(db: IDBDatabase, store: string, key: string): Promise<void> {
  return txPromise(db, store, 'readwrite', (s) => s.delete(key));
}

class BrainStore {
  private db: Promise<IDBDatabase>;

  constructor() {
    this.db = openDB();
  }

  // --- Nodes ---
  async getNodes(): Promise<BrainNode[]> {
    const db = await this.db;
    const nodes = await getAll<BrainNode>(db, 'nodes');
    return nodes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  async getNode(id: string): Promise<BrainNode | undefined> {
    const db = await this.db;
    return get<BrainNode>(db, 'nodes', id);
  }

  async putNode(node: BrainNode): Promise<void> {
    const db = await this.db;
    await put(db, 'nodes', node);
    await this.enqueueSync({ id: `node-${node.id}`, type: 'node', action: node._synced ? 'update' : 'create', data: node, attempts: 0, created_at: new Date().toISOString() });
  }

  async deleteNode(id: string): Promise<void> {
    const db = await this.db;
    await del(db, 'nodes', id);
    await this.enqueueSync({ id: `del-node-${id}`, type: 'node', action: 'delete', data: { id } as any, attempts: 0, created_at: new Date().toISOString() });
  }

  // --- Edges ---
  async getEdges(): Promise<BrainEdge[]> {
    const db = await this.db;
    return getAll<BrainEdge>(db, 'edges');
  }

  async putEdge(edge: BrainEdge): Promise<void> {
    const db = await this.db;
    await put(db, 'edges', edge);
    await this.enqueueSync({ id: `edge-${edge.id}`, type: 'edge', action: edge._synced ? 'update' : 'create', data: edge, attempts: 0, created_at: new Date().toISOString() });
  }

  async deleteEdge(id: string): Promise<void> {
    const db = await this.db;
    await del(db, 'edges', id);
  }

  async getEdgesForNode(nodeId: string): Promise<BrainEdge[]> {
    const edges = await this.getEdges();
    return edges.filter((e) => e.source_node_id === nodeId || e.target_node_id === nodeId);
  }

  // --- Sync Queue ---
  private async enqueueSync(item: SyncQueueItem): Promise<void> {
    const db = await this.db;
    await put(db, 'sync_queue', item);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.db;
    return getAll<SyncQueueItem>(db, 'sync_queue');
  }

  async removeSyncItem(id: string): Promise<void> {
    const db = await this.db;
    await del(db, 'sync_queue', id);
  }

  async markSynced(type: 'node' | 'edge', id: string): Promise<void> {
    const db = await this.db;
    const store = type === 'node' ? 'nodes' : 'edges';
    const item = await get<BrainNode | BrainEdge>(db, store, id);
    if (item) {
      item._synced = true;
      await put(db, store, item);
    }
  }

  // --- Bulk sync from API ---
  async syncFromAPI(nodes: BrainNode[], edges: BrainEdge[]): Promise<void> {
    const db = await this.db;
    const tx = db.transaction(['nodes', 'edges'], 'readwrite');
    const nodeStore = tx.objectStore('nodes');
    const edgeStore = tx.objectStore('edges');

    for (const node of nodes) {
      const existing = await new Promise<BrainNode | undefined>((resolve) => {
        const req = nodeStore.get(node.id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(undefined);
      });
      if (!existing || new Date(node.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
        nodeStore.put({ ...node, _synced: true });
      }
    }

    for (const edge of edges) {
      edgeStore.put({ ...edge, _synced: true });
    }
  }

  async clear(): Promise<void> {
    const db = await this.db;
    const tx = db.transaction(['nodes', 'edges', 'sync_queue'], 'readwrite');
    tx.objectStore('nodes').clear();
    tx.objectStore('edges').clear();
    tx.objectStore('sync_queue').clear();
  }
}

export const brainStore = new BrainStore();
