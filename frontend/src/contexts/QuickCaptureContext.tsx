import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useRef,
} from 'react';
import {
  saveCapture,
  getAllCaptures,
  getCapturesByStatus,
  updateCapture,
  deleteCapture,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  getAllSettings,
  setSetting,
  createCapture,
  type CapturedItem,
  type CaptureType,
  type CaptureSource,
  type CaptureStatus,
  type CaptureSettings,
  DEFAULT_SETTINGS,
} from '../lib/quickCaptureDB';
import { useWorkspace } from './WorkspaceContext';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface QuickCaptureState {
  captures: CapturedItem[];
  pendingCaptures: CapturedItem[];
  triagedCaptures: CapturedItem[];
  settings: CaptureSettings;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CAPTURES'; payload: CapturedItem[] }
  | { type: 'ADD_CAPTURE'; payload: CapturedItem }
  | { type: 'UPDATE_CAPTURE'; payload: CapturedItem }
  | { type: 'REMOVE_CAPTURE'; payload: string }
  | { type: 'SET_SETTINGS'; payload: CaptureSettings }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_LAST_SYNC'; payload: number };

function reducer(state: QuickCaptureState, action: Action): QuickCaptureState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CAPTURES': {
      const pending = action.payload.filter((c) => c.status === 'captured');
      const triaged = action.payload.filter((c) => c.status === 'triaged' || c.status === 'synced');
      return {
        ...state,
        captures: action.payload,
        pendingCaptures: pending,
        triagedCaptures: triaged,
      };
    }
    case 'ADD_CAPTURE': {
      const isPending = action.payload.status === 'captured';
      return {
        ...state,
        captures: [action.payload, ...state.captures],
        pendingCaptures: isPending
          ? [action.payload, ...state.pendingCaptures]
          : state.pendingCaptures,
        triagedCaptures: !isPending
          ? [action.payload, ...state.triagedCaptures]
          : state.triagedCaptures,
      };
    }
    case 'UPDATE_CAPTURE': {
      const captures = state.captures.map((c) => (c.id === action.payload.id ? action.payload : c));
      const pending = captures.filter((c) => c.status === 'captured');
      const triaged = captures.filter((c) => c.status === 'triaged' || c.status === 'synced');
      return { ...state, captures, pendingCaptures: pending, triagedCaptures: triaged };
    }
    case 'REMOVE_CAPTURE': {
      return {
        ...state,
        captures: state.captures.filter((c) => c.id !== action.payload),
        pendingCaptures: state.pendingCaptures.filter((c) => c.id !== action.payload),
        triagedCaptures: state.triagedCaptures.filter((c) => c.id !== action.payload),
      };
    }
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTime: action.payload };
    default:
      return state;
  }
}

const initialState: QuickCaptureState = {
  captures: [],
  pendingCaptures: [],
  triagedCaptures: [],
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  isSyncing: false,
  lastSyncTime: null,
};

interface QuickCaptureContextValue extends QuickCaptureState {
  // Capture actions
  capture: (input: {
    title: string;
    content: string;
    type?: CaptureType;
    tags?: string[];
    source?: CaptureSource;
  }) => Promise<CapturedItem>;
  updateCapture: (id: string, updates: Partial<CapturedItem>) => Promise<void>;
  deleteCapture: (id: string) => Promise<void>;
  triageCapture: (id: string, moduleId: string, projectId?: number) => Promise<void>;
  archiveCapture: (id: string) => Promise<void>;
  // Sync actions
  syncNow: () => Promise<void>;
  // Settings
  updateSetting: <K extends keyof CaptureSettings>(
    key: K,
    value: CaptureSettings[K]
  ) => Promise<void>;
  // Utils
  getCapture: (id: string) => CapturedItem | undefined;
  refresh: () => Promise<void>;
}

const QuickCaptureContext = createContext<QuickCaptureContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────────

export function QuickCaptureProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { showToast } = useWorkspace();
  const syncIntervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // ─── Load initial data ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [captures, settings] = await Promise.all([getAllCaptures(), getAllSettings()]);
      dispatch({ type: 'SET_CAPTURES', payload: captures });
      dispatch({ type: 'SET_SETTINGS', payload: { ...DEFAULT_SETTINGS, ...settings } });
    } catch (error) {
      console.error('Failed to load quick capture data:', error);
      showToast('Failed to load quick captures', 'error');
    } finally {
      if (isMountedRef.current) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [showToast]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  // ─── Auto-sync setup ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    if (state.settings.autoSync && !state.isLoading) {
      syncIntervalRef.current = window.setInterval(
        () => {
          syncNow();
        },
        state.settings.syncInterval * 60 * 1000
      );
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [state.settings.autoSync, state.settings.syncInterval, state.isLoading]);

  // ─── Capture Actions ──────────────────────────────────────────────────────────

  const capture = useCallback(
    async (input: {
      title: string;
      content: string;
      type?: CaptureType;
      tags?: string[];
      source?: CaptureSource;
    }) => {
      const item = createCapture(input);
      await saveCapture(item);
      await addToSyncQueue({
        captureId: item.id,
        action: 'create',
        payload: item,
        timestamp: Date.now(),
        retries: 0,
      });
      dispatch({ type: 'ADD_CAPTURE', payload: item });
      showToast(`Captured: ${item.title}`, 'success');
      return item;
    },
    [showToast]
  );

  const updateCaptureItem = useCallback(
    async (id: string, updates: Partial<CapturedItem>) => {
      const existing = state.captures.find((c) => c.id === id);
      if (!existing) return;

      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      await updateCapture(id, updates);
      await addToSyncQueue({
        captureId: id,
        action: 'update',
        payload: updated,
        timestamp: Date.now(),
        retries: 0,
      });
      dispatch({ type: 'UPDATE_CAPTURE', payload: updated });
    },
    [state.captures]
  );

  const deleteCaptureItem = useCallback(
    async (id: string) => {
      await deleteCapture(id);
      await addToSyncQueue({
        captureId: id,
        action: 'delete',
        payload: { id },
        timestamp: Date.now(),
        retries: 0,
      });
      dispatch({ type: 'REMOVE_CAPTURE', payload: id });
      showToast('Capture deleted', 'info');
    },
    [showToast]
  );

  const triageCapture = useCallback(
    async (id: string, moduleId: string, projectId?: number) => {
      await updateCaptureItem(id, {
        status: 'triaged',
        moduleId,
        projectId,
      });
      showToast('Item triaged — ready to organize', 'success');
    },
    [updateCaptureItem, showToast]
  );

  const archiveCapture = useCallback(
    async (id: string) => {
      await updateCaptureItem(id, { status: 'archived' });
      showToast('Item archived', 'info');
    },
    [updateCaptureItem, showToast]
  );

  // ─── Sync Logic ───────────────────────────────────────────────────────────────

  const syncNow = useCallback(async () => {
    if (state.isSyncing) return;

    dispatch({ type: 'SET_SYNCING', payload: true });

    try {
      const queue = await getSyncQueue();

      for (const item of queue) {
        try {
          // Here you would call the actual API endpoints
          // For now, we just mark as synced locally
          const capture = state.captures.find((c) => c.id === item.captureId);
          if (capture && item.action !== 'delete') {
            await updateCapture(item.captureId, { syncedAt: Date.now(), status: 'synced' });
          }
          await removeFromSyncQueue(item.id!);
        } catch (error) {
          await incrementSyncRetry(item.id!);
          console.error('Sync failed for item:', item, error);
        }
      }

      // Reload captures to get updated sync status
      const captures = await getAllCaptures();
      dispatch({ type: 'SET_CAPTURES', payload: captures });
      dispatch({ type: 'SET_LAST_SYNC', payload: Date.now() });
      showToast('Synced successfully', 'success');
    } catch (error) {
      console.error('Sync failed:', error);
      showToast('Sync failed', 'error');
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, [state.captures, state.isSyncing, showToast]);

  // ─── Settings ─────────────────────────────────────────────────────────────────

  const updateSetting = useCallback(
    async <K extends keyof CaptureSettings>(key: K, value: CaptureSettings[K]) => {
      await setSetting(key, value);
      dispatch({ type: 'SET_SETTINGS', payload: { ...state.settings, [key]: value } });
    },
    [state.settings]
  );

  // ─── Utils ────────────────────────────────────────────────────────────────────

  const getCapture = useCallback(
    (id: string) => state.captures.find((c) => c.id === id),
    [state.captures]
  );

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // ─── Context Value ────────────────────────────────────────────────────────────

  const value: QuickCaptureContextValue = {
    ...state,
    capture,
    updateCapture: updateCaptureItem,
    deleteCapture: deleteCaptureItem,
    triageCapture,
    archiveCapture,
    syncNow,
    updateSetting,
    getCapture,
    refresh,
  };

  return <QuickCaptureContext.Provider value={value}>{children}</QuickCaptureContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useQuickCapture(): QuickCaptureContextValue {
  const context = useContext(QuickCaptureContext);
  if (!context) {
    throw new Error('useQuickCapture must be used within <QuickCaptureProvider>');
  }
  return context;
}

// Need to import incrementSyncRetry
import { incrementSyncRetry } from '../lib/quickCaptureDB';
