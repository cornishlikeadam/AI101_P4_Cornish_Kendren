/* IndexedDB persistence. The workspace is one JSON record; uploaded images and files are separate blobs so
   large files never go through localStorage or the undo history. */
import type { Milestone, Workspace } from '../types';

const DB_NAME = 'waldos-savannah-lab';
const DB_VERSION = 1;
let dbp: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
      if (!db.objectStoreNames.contains('milestones')) db.createObjectStore('milestones', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
  return open().then((db) => new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const r = fn(s);
    t.oncomplete = () => resolve(r ? (r.result as T) : (undefined as T));
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const loadWorkspace = () => tx<Workspace | undefined>('kv', 'readonly', (s) => s.get('workspace'));
export const saveWorkspace = (ws: Workspace) => tx('kv', 'readwrite', (s) => { s.put(ws, 'workspace'); });
export const clearAll = async () => {
  await tx('kv', 'readwrite', (s) => { s.clear(); });
  await tx('blobs', 'readwrite', (s) => { s.clear(); });
  await tx('milestones', 'readwrite', (s) => { s.clear(); });
};

export interface StoredBlob { id: string; name: string; type: string; size: number; at: string; blob: Blob }
export const putBlob = (b: StoredBlob) => tx('blobs', 'readwrite', (s) => { s.put(b, b.id); });
export const getBlob = (id: string) => tx<StoredBlob | undefined>('blobs', 'readonly', (s) => s.get(id));
export const deleteBlob = (id: string) => tx('blobs', 'readwrite', (s) => { s.delete(id); });
export const allBlobs = () => tx<StoredBlob[]>('blobs', 'readonly', (s) => s.getAll());

export const listMilestones = () => tx<Milestone[]>('milestones', 'readonly', (s) => s.getAll());
export const putMilestone = (m: Milestone) => tx('milestones', 'readwrite', (s) => { s.put(m); });
export const deleteMilestone = (id: string) => tx('milestones', 'readwrite', (s) => { s.delete(id); });

/** Ask the browser not to evict the lab's storage under pressure. Returns whether it agreed. */
export async function requestPersistence(): Promise<boolean | null> {
  try { return navigator.storage?.persist ? await navigator.storage.persist() : null; } catch { return null; }
}
