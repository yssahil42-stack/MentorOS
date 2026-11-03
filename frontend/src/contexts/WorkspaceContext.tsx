import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_ERROR_EVENT } from '../services/api';

// ─── Toast Types ─────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// ─── Context Shape ───────────────────────────────────────────────────────────

interface WorkspaceContextValue {
  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
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
  openCaptureModal: (tab?: 'manual' | 'ai') => void;
  closeCaptureModal: () => void;

  // AI status
  aiOnline: boolean;
  setAiOnline: (online: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [isAIDrawerOpen, setIsAIDrawerOpen]     = useState(false);
  const [aiDrawerPrompt, setAiDrawerPrompt]     = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen]   = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen]     = useState(false);
  const [captureDefaultTab, setCaptureDefaultTab]       = useState<'manual' | 'ai'>('ai');
  const [aiOnline, setAiOnline]   = useState(false);

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
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ─── Toast ──────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  useEffect(() => {
    const handleApiError = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      if (message) showToast(message, 'error');
    };
    window.addEventListener(API_ERROR_EVENT, handleApiError);
    return () => window.removeEventListener(API_ERROR_EVENT, handleApiError);
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── AI Drawer ──────────────────────────────────────────────
  const openAIDrawer  = useCallback((prompt = '') => { setAiDrawerPrompt(prompt); setIsAIDrawerOpen(true);  }, []);
  const closeAIDrawer = useCallback(()            => { setIsAIDrawerOpen(false); setAiDrawerPrompt('');     }, []);

  // ─── Capture Modal ──────────────────────────────────────────
  const openCaptureModal  = useCallback((tab: 'manual' | 'ai' = 'manual') => {
    if (tab === 'ai') {
      setIsAIDrawerOpen(true);
      return;
    }
    setCaptureDefaultTab('manual');
    setIsCaptureModalOpen(true);
  }, []);
  const closeCaptureModal = useCallback(() => {
    setIsCaptureModalOpen(false);
  }, []);

  // ─── Command Palette ─────────────────────────────────────────
  const openCommandPalette  = useCallback(() => setIsCommandPaletteOpen(true),  []);
  const closeCommandPalette = useCallback(() => setIsCommandPaletteOpen(false), []);

  // ─── Mobile Sidebar ──────────────────────────────────────────
  const openMobileSidebar  = useCallback(() => setIsMobileSidebarOpen(true),  []);
  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);

  return (
    <WorkspaceContext.Provider value={{
      toasts, showToast, dismissToast,
      isAIDrawerOpen, aiDrawerPrompt, openAIDrawer, closeAIDrawer,
      isCaptureModalOpen, captureDefaultTab, openCaptureModal, closeCaptureModal,
      isCommandPaletteOpen, openCommandPalette, closeCommandPalette,
      isMobileSidebarOpen, openMobileSidebar, closeMobileSidebar,
      aiOnline, setAiOnline,
    }}>
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
