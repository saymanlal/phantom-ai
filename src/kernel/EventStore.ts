'use client';
import type { PhantomEvent, EventType } from '@/types';
import { generateId } from '@/lib/utils';

const STORE_NAME = 'phantom_events';
const DB_NAME = 'phantom_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('IndexedDB not available')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('phantom_events')) {
        db.createObjectStore('phantom_events', { keyPath: 'eventId' });
      }
      if (!db.objectStoreNames.contains('phantom_missions')) {
        db.createObjectStore('phantom_missions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('phantom_tasks')) {
        db.createObjectStore('phantom_tasks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('phantom_projects')) {
        db.createObjectStore('phantom_projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('phantom_artifacts')) {
        db.createObjectStore('phantom_artifacts', { keyPath: 'hash' });
      }
      if (!db.objectStoreNames.contains('phantom_memory')) {
        db.createObjectStore('phantom_memory', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('phantom_knowledge_entities')) {
        db.createObjectStore('phantom_knowledge_entities', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('phantom_knowledge_relations')) {
        db.createObjectStore('phantom_knowledge_relations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('phantom_notifications')) {
        db.createObjectStore('phantom_notifications', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('phantom_audit')) {
        db.createObjectStore('phantom_audit', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('phantom_automations')) {
        db.createObjectStore('phantom_automations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('phantom_permissions')) {
        db.createObjectStore('phantom_permissions', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAll<T>(store: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(store: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export class EventStore {
  async append(event: Omit<PhantomEvent, 'eventId' | 'processed'>): Promise<PhantomEvent> {
    const full: PhantomEvent = { ...event, eventId: generateId(), processed: false };
    await idbPut(STORE_NAME, full);
    return full;
  }

  async emit(type: EventType, payload: Record<string, unknown>, opts?: {
    missionId?: string;
    taskId?: string;
    projectId?: string;
    resultHash?: string;
  }): Promise<PhantomEvent> {
    return this.append({
      timestamp: new Date().toISOString(),
      type,
      payload,
      ...opts,
    });
  }

  async getAll(): Promise<PhantomEvent[]> {
    return idbGetAll<PhantomEvent>(STORE_NAME);
  }

  async getByMission(missionId: string): Promise<PhantomEvent[]> {
    const all = await this.getAll();
    return all.filter(e => e.missionId === missionId);
  }

  async markProcessed(eventId: string): Promise<void> {
    const event = await idbGet<PhantomEvent>(STORE_NAME, eventId);
    if (event) {
      await idbPut(STORE_NAME, { ...event, processed: true });
    }
  }
}

// Singleton stores
export const eventStore = typeof window !== 'undefined' ? new EventStore() : null;
export { openDB, idbGet, idbPut, idbGetAll, idbDelete };
