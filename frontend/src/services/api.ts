/**
 * Central Axios-based API client.
 * - Automatically attaches JWT Authorization header
 * - Throws ApiError with status code on non-2xx responses
 * - Intercepts 401 to clear session (token expired)
 */
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const API_ERROR_EVENT = 'mentor:api-error';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api/v1' : 'http://127.0.0.1:8000/api/v1');

export function createClient(): AxiosInstance {
  // Default timeout: 8000ms for GET, 30000ms for POST/PATCH/DELETE
  const client = axios.create({ baseURL: BASE_URL, timeout: 30_000 });

  // ─── Request: inject JWT & Dynamic Timeouts ─────────────────
  client.interceptors.request.use((config) => {
    const endpoint = (config.url ?? '').split('?')[0];
    const method = (config.method ?? 'get').toLowerCase();

    // Default: 8000ms for GET, 30000ms for POST/PATCH/DELETE (90000ms for /ai/propose)
    if (endpoint === '/ai/propose') {
      config.timeout = 90_000;
    } else if (!config.timeout || config.timeout === 8_000 || config.timeout === 30_000 || config.timeout === 15_000) {
      config.timeout = 30_000;
    }

    const token = localStorage.getItem('mentor_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const activeRole =
      typeof window === 'undefined'
        ? null
        : window.location.pathname
            .match(/^\/app\/(student|freelancer|developer|job-seeker)(?:\/|$)/)?.[1]
            ?.replace(/-/g, '_');
    const workspaceEndpoint =
      /^\/(?:tasks|projects|milestones|calendar\/events|notes|ai\/proposals)(?:\/|$)|^\/dashboard\/summary$/.test(
        endpoint
      );

    if (activeRole && workspaceEndpoint && config.method?.toLowerCase() === 'get') {
      const params = config.params as Record<string, unknown> | undefined;
      config.params = { ...params, role: params?.role ?? activeRole };
    }

    if (
      activeRole &&
      /^\/(?:tasks|projects|milestones|calendar\/events|notes)(?:\/|$)/.test(endpoint) &&
      config.method?.toLowerCase() === 'post' &&
      config.data &&
      typeof config.data === 'object' &&
      !Array.isArray(config.data)
    ) {
      config.data = { ...config.data, role: config.data.role ?? activeRole };
    }

    return config;
  });

  // ─── Response: normalise errors ──────────────────────────────
  client.interceptors.response.use(
    (res) => res,
    (err) => {
      // Re-throw canceled requests directly so cancellation on unmount is silent
      if (axios.isCancel(err) || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
        return Promise.reject(err);
      }
      const status = err.response?.status ?? 0;
      const detail = err.response?.data?.detail;
      const endpoint = (err.config?.url ?? '').split('?')[0];
      const isAuthAttempt = /^\/auth\/(?:login|register)$/.test(endpoint);
      const message =
        status === 0
          ? err.code === 'ECONNABORTED'
            ? 'The request timed out. Please try again.'
            : 'Unable to reach the server. Check your connection and try again.'
          : status === 401
            ? endpoint === '/auth/login'
              ? 'Invalid email or password.'
              : endpoint === '/auth/register'
                ? 'Unable to create an account with the supplied details.'
                : 'Your session has expired. Please sign in again.'
            : status === 403
              ? 'You do not have permission to perform this action.'
              : status === 404
                ? typeof detail === 'string'
                  ? detail
                  : 'The requested resource was not found.'
                : status === 400
                  ? typeof detail === 'string'
                    ? detail
                    : 'The request could not be completed.'
                  : status === 422
                    ? 'Please check your input and try again.'
                    : status === 429
                      ? 'Too many requests. Please wait a moment and try again.'
                      : status >= 500
                        ? 'The server could not complete your request. Please try again later.'
                        : 'The request could not be completed.';

      // Clear expired session without hard reload
      if (status === 401 && !isAuthAttempt) {
        localStorage.removeItem('mentor_token');
        localStorage.removeItem('mentor_user');
        localStorage.removeItem('mentor_workspace_role');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('mentor:unauthorized'));
        }
      }

      return Promise.reject(new ApiError(status, message));
    }
  );

  return client;
}

export const client = createClient();

// ─── Typed request helpers ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T;
  total: number;
}

export function extractSignal(
  signalOrContext?: AbortSignal | { signal?: AbortSignal } | unknown
): AbortSignal | undefined {
  if (!signalOrContext) return undefined;
  if (signalOrContext instanceof AbortSignal) return signalOrContext;
  if (
    typeof signalOrContext === 'object' &&
    'signal' in signalOrContext &&
    (signalOrContext as { signal: unknown }).signal instanceof AbortSignal
  ) {
    return (signalOrContext as { signal: AbortSignal }).signal;
  }
  return undefined;
}

export function createAbortController(): AbortController {
  return new AbortController();
}

function resolveConfig(config?: AxiosRequestConfig | AbortSignal): AxiosRequestConfig {
  if (!config) return {};
  if (
    config instanceof AbortSignal ||
    (typeof config === 'object' && 'aborted' in config && 'addEventListener' in config)
  ) {
    return { signal: config as AbortSignal };
  }
  return config as AxiosRequestConfig;
}

export async function get<T>(url: string, config?: AxiosRequestConfig | AbortSignal): Promise<T> {
  const resolved = resolveConfig(config);
  const res = await client.get<T>(url, resolved);
  return res.data;
}

export async function getWithMeta<T>(
  url: string,
  config?: AxiosRequestConfig | AbortSignal
): Promise<PaginatedResponse<T>> {
  const resolved = resolveConfig(config);
  const res = await client.get<T>(url, resolved);
  const headerTotal = res.headers['x-total-count'];
  const total =
    headerTotal !== undefined
      ? parseInt(String(headerTotal), 10)
      : Array.isArray(res.data)
        ? res.data.length
        : 0;
  return { data: res.data, total: isNaN(total) ? 0 : total };
}

export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await client.post<T>(url, data, config);
  return res.data;
}

export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await client.patch<T>(url, data, config);
  return res.data;
}

export async function del<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.delete<T>(url, config);
  return res.data;
}

export const api = { get, getWithMeta, post, patch, delete: del };
export default api;
