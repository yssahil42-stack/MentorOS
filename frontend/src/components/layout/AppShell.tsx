import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { RoleSidebar } from './RoleSidebar';
import { TopBar } from './TopBar';
import { Breadcrumb } from '../ui/Breadcrumb';
import { CommandPalette } from './CommandPalette';
import { AIDrawer } from '../ai/AIDrawer';
import { AICaptureModal } from '../ai/AICaptureModal';
import { Spatial3DCanvas } from '../ui/Spatial3DCanvas';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_CONFIGS } from '../../config/roles';
import type { UserRole } from '../../types/user';
import { getWorkspaceRole } from '../../utils/roleUtils';

export default function AppShell() {
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mentoros_sidebar_expanded');
      if (saved !== null) return saved === 'true';
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const handleToggleSidebar = () => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mentoros_sidebar_expanded', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const { isMobileSidebarOpen, closeMobileSidebar } = useWorkspace();
  const { user } = useAuth();
  const location = useLocation();

  const roleConfig = user
    ? ROLE_CONFIGS[getWorkspaceRole(location.pathname, user.role as UserRole)]
    : null;
  const roleColor = roleConfig?.color ?? '#F59E0B';

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex relative overflow-x-hidden selection:bg-solar-500/20 selection:text-solar-500">
      {/* Ambient Aurora Glow Backdrop for workspace */}
      <div
        className="fixed top-0 right-0 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none opacity-20 dark:opacity-25 transition-all duration-700 -mr-28 -mt-28"
        style={{ backgroundColor: roleColor }}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 left-1/3 w-[450px] h-[450px] rounded-full blur-[160px] pointer-events-none opacity-10 dark:opacity-15 transition-all duration-700 -mb-28"
        style={{ backgroundColor: roleColor }}
        aria-hidden="true"
      />

      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <nav role="navigation" aria-label="Main Navigation">
        <RoleSidebar expanded={sidebarExpanded} onToggle={handleToggleSidebar} />
      </nav>

      {/* Main content area */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out-expo relative z-10"
        style={{ marginLeft: sidebarExpanded ? '256px' : '76px' }}
      >
        <header role="banner">
          <TopBar onMenuClick={handleToggleSidebar} />
        </header>

        {/* Workspace Breadcrumb Navigation */}
        <div className="px-4 md:px-6 lg:px-8 py-2 border-b border-border-subtle/50 bg-bg-surface/30 backdrop-blur-xs">
          <Breadcrumb roleConfig={roleConfig ?? undefined} />
        </div>

        <main
          id="main-content"
          role="main"
          className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto"
          tabIndex={-1}
        >
          {/* Skip-to-content target */}
          <Spatial3DCanvas defaultMode="2d" defaultPreset="standard">
            <Outlet />
          </Spatial3DCanvas>
        </main>
      </div>

      {/* Global AI Assistant Slide-in Drawer */}
      <aside role="complementary" aria-label="AI Assistant Drawer">
        <AIDrawer />
      </aside>

      {/* Global AI Capture Work Modal (Manual + AI Assistant) */}
      <AICaptureModal />

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette />
    </div>
  );
}
