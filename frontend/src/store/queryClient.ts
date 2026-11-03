import { QueryCache, QueryClient } from '@tanstack/react-query';
import { API_ERROR_EVENT } from '../services/api';

const recentErrorTimes = new Map<string, number>();

function notifyQueryError(error: unknown) {
  if (typeof window === 'undefined') return;
  const message = error instanceof Error
    ? error.message
    : 'Unable to load data. Please try again.';
  const now = Date.now();
  const lastReported = recentErrorTimes.get(message) ?? 0;
  if (now - lastReported < 5000) return;
  recentErrorTimes.set(message, now);
  if (recentErrorTimes.size > 20) {
    const oldestMessage = recentErrorTimes.keys().next().value;
    if (oldestMessage) recentErrorTimes.delete(oldestMessage);
  }
  window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail: message }));
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data === undefined) notifyQueryError(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,          // 2 min before refetch
      gcTime:    1000 * 60 * 10,          // 10 min in cache
      retry: (failureCount, error: unknown) => {
        // Don't retry on 401/403/404
        const status = (error as { status?: number })?.status;
        if (status && [401, 403, 404].includes(status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
});

// ─── Query Key Factories ─────────────────────────────────────────────────────
// Centralised so any component can invalidate the exact right keys.

export const queryKeys = {
  // Auth
  me: () => ['auth', 'me'] as const,

  // Dashboard
  dashboard: () => ['dashboard'] as const,

  // Tasks
  tasks:     (filters?: Record<string, unknown>) => ['tasks', filters] as const,
  task:      (id: number)                        => ['tasks', id]      as const,

  // Projects
  projects:  (filters?: Record<string, unknown>) => ['projects', filters]    as const,
  project:   (id: number)                        => ['projects', 'detail', id] as const,

  // Milestones
  milestones: (projectId?: number) => ['milestones', projectId] as const,

  // Calendar
  events:    (filters?: Record<string, unknown>) => ['calendar', 'events', filters] as const,

  // Notes
  notes:     (filters?: Record<string, unknown>) => ['notes', filters] as const,

  // AI
  aiProposal:  (id: number) => ['ai', 'proposals', id]   as const,
  aiStatus:    ()           => ['ai', 'status']           as const,
} as const;

/** Invalidate all workspace data (called after AI proposal approval) */
export function invalidateWorkspace(): Promise<void> {
  return queryClient.invalidateQueries({ predicate: (q) =>
    ['dashboard','tasks','projects','milestones','calendar','notes'].includes(String(q.queryKey[0]))
  });
}
