import type { TimerAudioConfig } from '../types';

const DB_NAME = 'tn_assembly_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'timer_audio_configs';

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'event_id' });
        }
      };
      request.onsuccess = (e: any) => {
        resolve(e.target.result);
      };
      request.onerror = (e) => {
        console.warn('[audioStorage] IndexedDB open error:', e);
        resolve(null);
      };
    } catch (err) {
      console.warn('[audioStorage] IndexedDB exception:', err);
      resolve(null);
    }
  });
}

/**
 * Stores full timer audio configuration (including high-resolution base64 data)
 * safely in IndexedDB without being constrained by localStorage 5MB quota.
 */
export async function saveAudioConfigToIDB(eventId: string, config: TimerAudioConfig): Promise<void> {
  if (!eventId) return;
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ event_id: eventId, ...config });
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => {
        console.warn('[audioStorage] Error saving to IDB:', e);
        resolve();
      };
    } catch (err) {
      console.warn('[audioStorage] Transaction exception:', err);
      resolve();
    }
  });
}

/**
 * Retrieves the full timer audio configuration for a specific event from IndexedDB.
 */
export async function getAudioConfigFromIDB(eventId: string): Promise<TimerAudioConfig | null> {
  if (!eventId) return null;
  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(eventId);
      req.onsuccess = (e: any) => {
        const res = e.target.result;
        if (res) {
          const { event_id: _eventId, ...config } = res;
          resolve(config as TimerAudioConfig);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Deletes audio configuration from IndexedDB for a given event.
 */
export async function deleteAudioConfigFromIDB(eventId: string): Promise<void> {
  if (!eventId) return;
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(eventId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
