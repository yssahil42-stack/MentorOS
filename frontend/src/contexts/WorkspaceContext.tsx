import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_ERROR_EVENT } from '../services/api';
import { checkAiHealth } from '../services/aiService';

// ─── Toast Types ─────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

// ─── Context Shape ───────────────────────────────────────────────────────────

interface WorkspaceContextValue {
  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, optionsOrDuration?: number | ToastOptions) => void;
  dismissToast: (id: string) => void;

  // AI Drawer
  isAIDrawerOpen: boolean;
  aiDrawerPrompt: string;
  openAIDrawer: (prompt?: string) => void;
  closeAIDrawer: () => void;

  // Command Palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Sidebar (mobile)
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;

  // Capture Modal (Capture Phase with AI Assistant)
  isCaptureModalOpen: boolean;
  captureDefaultTab: 'manual' | 'ai';
  openCaptureModal: (tab?: 'manual' | 'ai', promptStarter?: string) => void;
  closeCaptureModal: () => void;

  // Profile Modal
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;

  // AI status
  aiOnline: boolean;
  setAiOnline: (online: boolean) => void;
  aiStatus: 'online' | 'slow' | 'offline';
  aiLatency: number | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [aiDrawerPrompt, setAiDrawerPrompt] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [captureDefaultTab, setCaptureDefaultTab] = useState<'manual' | 'ai'>('ai');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [aiOnline, setAiOnline] = useState(true);
  const [aiStatus, setAiStatus] = useState<'online' | 'slow' | 'offline'>('online');
  const [aiLatency, setAiLatency] = useState<number | null>(null);

  // ─── Periodic AI Health / Status Monitor ─────────────────────
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      const startTime = performance.now();
      try {
        const res = await checkAiHealth();
        const duration = Math.round(performance.now() - startTime);
        if (!isMounted) return;
        setAiLatency(duration);
        if (res.online) {
          setAiOnline(true);
          setAiStatus(duration > 1500 ? 'slow' : 'online');
        } else {
          setAiOnline(false);
          setAiStatus('offline');
        }
      } catch {
        if (!isMounted) return;
        setAiOnline(false);
        setAiStatus('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ─── Global keyboard shortcuts ──────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'i')) {
        e.preventDefault();
        setIsAIDrawerOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsAIDrawerOpen(false);
        setIsMobileSidebarOpen(false);
        setIsCaptureModalOpen(false);
        setIsProfileModalOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ─── Toast ──────────────────────────────────────────────────
  const showToast = useCallback(
    (message: string, type: ToastType = 'info', optionsOrDuration?: number | ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration =
        typeof optionsOrDuration === 'number'
          ? optionsOrDuration
          : (optionsOrDuration?.duration ?? 4000);
      const action = typeof optionsOrDuration === 'object' ? optionsOrDuration?.action : undefined;

      setToasts((prev) => [...prev, { id, message, type, action }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    },
    []
  );

  useEffect(() => {
    const handleApiError = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      if (message) showToast(message, 'error');
    };
    const handleCustomToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; type?: ToastType }>).detail;
      if (detail?.message) showToast(detail.message, detail.type || 'info');
    };
    window.addEventListener(API_ERROR_EVENT, handleApiError);
    window.addEventListener('mentor:toast', handleCustomToast);
    return () => {
      window.removeEventListener(API_ERROR_EVENT, handleApiError);
      window.removeEventListener('mentor:toast', handleCustomToast);
    };
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── AI Drawer ──────────────────────────────────────────────
  const openAIDrawer = useCallback((prompt = '') => {
    setAiDrawerPrompt(prompt);
    setIsAIDrawerOpen(true);
  }, []);
  const closeAIDrawer = useCallback(() => {
    setIsAIDrawerOpen(false);
    setAiDrawerPrompt('');
  }, []);

  // ─── Capture Modal ──────────────────────────────────────────
  const openCaptureModal = useCallback(
    (tab: 'manual' | 'ai' = 'manual', promptStarter?: string) => {
      if (tab === 'ai') {
        if (promptStarter) {
          setAiDrawerPrompt(promptStarter);
        }
        setIsAIDrawerOpen(true);
        return;
      }
      setCaptureDefaultTab('manual');
      setIsCaptureModalOpen(true);
    },
    []
  );
  const closeCaptureModal = useCallback(() => {
    setIsCaptureModalOpen(false);
  }, []);

  // ─── Profile Modal ──────────────────────────────────────────
  const openProfileModal = useCallback(() => setIsProfileModalOpen(true), []);
  const closeProfileModal = useCallback(() => setIsProfileModalOpen(false), []);

  // ─── Command Palette ─────────────────────────────────────────
  const openCommandPalette = useCallback(() => setIsCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setIsCommandPaletteOpen(false), []);

  // ─── Mobile Sidebar ──────────────────────────────────────────
  const openMobileSidebar = useCallback(() => setIsMobileSidebarOpen(true), []);
  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);

  return (
    <WorkspaceContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        isAIDrawerOpen,
        aiDrawerPrompt,
        openAIDrawer,
        closeAIDrawer,
        isCaptureModalOpen,
        captureDefaultTab,
        openCaptureModal,
        closeCaptureModal,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
        isCommandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        isMobileSidebarOpen,
        openMobileSidebar,
        closeMobileSidebar,
        aiOnline,
        setAiOnline,
        aiStatus,
        aiLatency,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within <WorkspaceProvider>');
  return ctx;
}
