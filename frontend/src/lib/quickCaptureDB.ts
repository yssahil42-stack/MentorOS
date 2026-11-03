import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * Quick Capture Database Schema
 * Stores captured items for offline-first triage
 */
interface QuickCaptureDBSchema extends DBSchema {
  captures: {
    key: string;
    value: CapturedItem;
    indexes: { 'by-timestamp': number; 'by-status': string; 'by-type': string };
  };
  syncQueue: {
    key: number;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': number };
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

export interface CapturedItem {
  id: string;
  title: string;
  content: string;
  type: CaptureType;
  tags: string[];
  source: CaptureSource;
  status: CaptureStatus;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
  moduleId?: string; // Which module this was routed to
  projectId?: number; // If routed to a specific project
}

export type CaptureType = 'task' | 'idea' | 'note' | 'deadline' | 'contact' | 'link';
export type CaptureSource = 'manual' | 'voice' | 'share' | 'shortcut' | 'widget';
export type CaptureStatus = 'captured' | 'triaged' | 'synced' | 'archived';

export interface SyncQueueItem {
  id?: number;
  captureId: string;
  action: 'create' | 'update' | 'delete';
  payload: unknown;
  timestamp: number;
  retries: number;
}

export interface CaptureSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  voiceLanguage: string;
  defaultModule: string;
  showFAB: boolean;
  shortcutEnabled: boolean;
}

const DB_NAME = 'mentoros-quick-capture';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<QuickCaptureDBSchema> | null = null;

export async function getDB(): Promise<IDBPDatabase<QuickCaptureDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<QuickCaptureDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db: IDBPDatabase<QuickCaptureDBSchema>) {
      // Captures store
      const captureStore = db.createObjectStore('captures', { keyPath: 'id' });
      captureStore.createIndex('by-timestamp', 'createdAt');
      captureStore.createIndex('by-status', 'status');
      captureStore.createIndex('by-type', 'type');

      // Sync queue store
      const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      syncStore.createIndex('by-timestamp', 'timestamp');

      // Settings store
      db.createObjectStore('settings', { keyPath: 'key' });
    },
  });

  return dbInstance;
}

// ─── Capture Operations ────────────────────────────────────────────────────────

export async function saveCapture(item: CapturedItem): Promise<void> {
  const db = await getDB();
  await db.put('captures', item);
}

export async function getCapture(id: string): Promise<CapturedItem | undefined> {
  const db = await getDB();
  return db.get('captures', id);
}

export async function getAllCaptures(): Promise<CapturedItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('captures', 'by-timestamp');
}

export async function getCapturesByStatus(status: CaptureStatus): Promise<CapturedItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('captures', 'by-status', status);
}

export async function getCapturesByType(type: CaptureType): Promise<CapturedItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('captures', 'by-type', type);
}

export async function deleteCapture(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('captures', id);
}

export async function updateCapture(id: string, updates: Partial<CapturedItem>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('captures', id);
  if (existing) {
    await db.put('captures', { ...existing, ...updates, updatedAt: Date.now() });
  }
}

// ─── Sync Queue Operations ─────────────────────────────────────────────────────

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
  const db = await getDB();
  return db.add('syncQueue', item as SyncQueueItem);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-timestamp');
}

export async function removeFromSyncQueue(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function incrementSyncRetry(id: number): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    await db.put('syncQueue', { ...item, retries: item.retries + 1 });
  }
}

// ─── Settings Operations ───────────────────────────────────────────────────────

export async function getSetting<K extends keyof CaptureSettings>(
  key: K
): Promise<CaptureSettings[K] | undefined> {
  const db = await getDB();
  const setting = await db.get('settings', key);
  return setting?.value as CaptureSettings[K] | undefined;
}

export async function setSetting<K extends keyof CaptureSettings>(
  key: K,
  value: CaptureSettings[K]
): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function getAllSettings(): Promise<CaptureSettings> {
  const db = await getDB();
  const settings = await db.getAll('settings');
  return (settings as unknown as Array<{ key: string; value: unknown }>).reduce<
    Record<string, unknown>
  >((acc, s) => ({ ...acc, [s.key]: s.value }), {}) as unknown as CaptureSettings;
}

// ─── Utility Functions ─────────────────────────────────────────────────────────

export function generateCaptureId(): string {
  return `cap_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function createCapture(input: {
  title: string;
  content: string;
  type?: CaptureType;
  tags?: string[];
  source?: CaptureSource;
}): CapturedItem {
  const now = Date.now();
  return {
    id: generateCaptureId(),
    title: input.title,
    content: input.content,
    type: input.type ?? 'note',
    tags: input.tags ?? [],
    source: input.source ?? 'manual',
    status: 'captured',
    createdAt: now,
    updatedAt: now,
  };
}

// Default settings
export const DEFAULT_SETTINGS: CaptureSettings = {
  autoSync: true,
  syncInterval: 5,
  voiceLanguage: 'en-US',
  defaultModule: 'student',
  showFAB: true,
  shortcutEnabled: true,
};
