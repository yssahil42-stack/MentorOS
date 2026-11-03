import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { WorkspaceProvider, useWorkspace } from '../../../contexts/WorkspaceContext';
import { API_ERROR_EVENT } from '../../../services/api';

vi.mock('../../../services/aiService', () => ({
  checkAiHealth: vi.fn().mockResolvedValue({ online: true, model: 'test-model' }),
}));

describe('WorkspaceContext and useWorkspace', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('throws error when used outside WorkspaceProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useWorkspace())).toThrow(
      'useWorkspace must be used within <WorkspaceProvider>'
    );
    consoleError.mockRestore();
  });

  it('manages toasts lifecycle: add, auto-dismiss, and manual dismiss', async () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: ({ children }) => React.createElement(WorkspaceProvider, null, children),
    });

    expect(result.current.toasts).toEqual([]);

    await act(async () => {
      result.current.showToast('Test Toast Notification', 'success', 3000);
    });

    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].message).toBe('Test Toast Notification');
    expect(result.current.toasts[0].type).toBe('success');

    const toastId = result.current.toasts[0].id;

    // Advance timer past duration
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });

    expect(result.current.toasts).toEqual([]);

    // Test manual dismissal
    await act(async () => {
      result.current.showToast('Manual dismiss test', 'info', 10000);
    });
    expect(result.current.toasts.length).toBe(1);
    const manualId = result.current.toasts[0].id;

    await act(async () => {
      result.current.dismissToast(manualId);
    });
    expect(result.current.toasts).toEqual([]);

    // Test toast with action (e.g. Undo)
    const handleUndo = vi.fn();
    await act(async () => {
      result.current.showToast('Task completed', 'success', {
        action: { label: 'Undo', onClick: handleUndo },
      });
    });

    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].action?.label).toBe('Undo');
    result.current.toasts[0].action?.onClick();
    expect(handleUndo).toHaveBeenCalledTimes(1);
  });

  it('controls AI Drawer open/close state and prompt prefill', async () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: ({ children }) => React.createElement(WorkspaceProvider, null, children),
    });

    expect(result.current.isAIDrawerOpen).toBe(false);
    expect(result.current.aiDrawerPrompt).toBe('');

    await act(async () => {
      result.current.openAIDrawer('Plan my study roadmap');
    });

    expect(result.current.isAIDrawerOpen).toBe(true);
    expect(result.current.aiDrawerPrompt).toBe('Plan my study roadmap');

    await act(async () => {
      result.current.closeAIDrawer();
    });

    expect(result.current.isAIDrawerOpen).toBe(false);
    expect(result.current.aiDrawerPrompt).toBe('');
  });

  it('controls Command Palette and Mobile Sidebar states', async () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: ({ children }) => React.createElement(WorkspaceProvider, null, children),
    });

    expect(result.current.isCommandPaletteOpen).toBe(false);
    await act(async () => {
      result.current.openCommandPalette();
    });
    expect(result.current.isCommandPaletteOpen).toBe(true);
    await act(async () => {
      result.current.closeCommandPalette();
    });
    expect(result.current.isCommandPaletteOpen).toBe(false);

    expect(result.current.isMobileSidebarOpen).toBe(false);
    await act(async () => {
      result.current.openMobileSidebar();
    });
    expect(result.current.isMobileSidebarOpen).toBe(true);
    await act(async () => {
      result.current.closeMobileSidebar();
    });
    expect(result.current.isMobileSidebarOpen).toBe(false);
  });

  it('controls Profile Modal open and close states', async () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: ({ children }) => React.createElement(WorkspaceProvider, null, children),
    });

    expect(result.current.isProfileModalOpen).toBe(false);
    await act(async () => {
      result.current.openProfileModal();
    });
    expect(result.current.isProfileModalOpen).toBe(true);

    await act(async () => {
      result.current.closeProfileModal();
    });
    expect(result.current.isProfileModalOpen).toBe(false);
  });

  it('controls Capture Modal and switches to AI tab or manual modal', async () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: ({ children }) => React.createElement(WorkspaceProvider, null, children),
    });

    await act(async () => {
      result.current.openCaptureModal('manual');
    });
    expect(result.current.isCaptureModalOpen).toBe(true);
    expect(result.current.captureDefaultTab).toBe('manual');

    await act(async () => {
      result.current.closeCaptureModal();
    });
    expect(result.current.isCaptureModalOpen).toBe(false);

    // Switching to 'ai' tab opens AI drawer directly
    await act(async () => {
      result.current.openCaptureModal('ai', 'Pre-filled AI starter');
    });
    expect(result.current.isAIDrawerOpen).toBe(true);
    expect(result.current.aiDrawerPrompt).toBe('Pre-filled AI starter');
  });

  it('responds to global API_ERROR_EVENT and displays error toast', async () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: ({ children }) => React.createElement(WorkspaceProvider, null, children),
    });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(API_ERROR_EVENT, { detail: 'Network failure detected' })
      );
    });

    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].message).toBe('Network failure detected');
    expect(result.current.toasts[0].type).toBe('error');
  });
});
