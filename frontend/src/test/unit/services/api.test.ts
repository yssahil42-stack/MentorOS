import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, client, ApiError } from '../../../services/api';

describe('API Service Error Mapping', () => {
  const originalAdapter = client.defaults.adapter;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    client.defaults.adapter = originalAdapter;
  });

  it('maps timeout error (ECONNABORTED) to user-friendly message', async () => {
    client.defaults.adapter = async () => {
      const err = new Error('timeout of 8000ms exceeded');
      (err as any).code = 'ECONNABORTED';
      throw err;
    };

    await expect(api.get('/tasks')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'The request timed out. Please try again.',
    });
  });

  it('maps generic network failure with status 0', async () => {
    client.defaults.adapter = async () => {
      const err = new Error('Network Error');
      (err as any).code = 'ERR_NETWORK';
      throw err;
    };

    await expect(api.get('/projects')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'Unable to reach the server. Check your connection and try again.',
    });
  });

  it('maps 401 on /auth/login to Invalid email or password', async () => {
    client.defaults.adapter = async (config) => {
      const err = new Error('Request failed with status code 401');
      (err as any).response = { status: 401, data: { detail: 'Unauthorized' } };
      (err as any).config = config;
      throw err;
    };

    await expect(api.post('/auth/login', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Invalid email or password.',
    });
  });

  it('maps 401 on /auth/register to registration failure message', async () => {
    client.defaults.adapter = async (config) => {
      const err = new Error('Request failed with status code 401');
      (err as any).response = { status: 401, data: { detail: 'User exists' } };
      (err as any).config = config;
      throw err;
    };

    await expect(api.post('/auth/register', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Unable to create an account with the supplied details.',
    });
  });

  it('maps 401 on protected endpoint, purges storage, and dispatches unauthorized event', async () => {
    localStorage.setItem('mentor_token', 'expired-token');
    localStorage.setItem('mentor_user', 'user-data');
    localStorage.setItem('mentor_workspace_role', 'student');

    const unauthorizedSpy = vi.fn();
    window.addEventListener('mentor:unauthorized', unauthorizedSpy);

    client.defaults.adapter = async (config) => {
      const err = new Error('Request failed with status code 401');
      (err as any).response = { status: 401, data: {} };
      (err as any).config = config;
      throw err;
    };

    await expect(api.get('/dashboard/summary')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Your session has expired. Please sign in again.',
    });

    expect(localStorage.getItem('mentor_token')).toBeNull();
    expect(localStorage.getItem('mentor_user')).toBeNull();
    expect(localStorage.getItem('mentor_workspace_role')).toBeNull();
    expect(unauthorizedSpy).toHaveBeenCalledTimes(1);

    window.removeEventListener('mentor:unauthorized', unauthorizedSpy);
  });

  it('maps 403 forbidden error', async () => {
    client.defaults.adapter = async (config) => {
      const err = new Error('Request failed with status code 403');
      (err as any).response = { status: 403, data: {} };
      (err as any).config = config;
      throw err;
    };

    await expect(api.get('/admin/settings')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      message: 'You do not have permission to perform this action.',
    });
  });

  it('maps 404 with custom backend detail', async () => {
    client.defaults.adapter = async (config) => {
      const err = new Error('Request failed with status code 404');
      (err as any).response = { status: 404, data: { detail: 'Project not found' } };
      (err as any).config = config;
      throw err;
    };

    await expect(api.get('/projects/999')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Project not found',
    });
  });

  it('maps 422 validation error', async () => {
    client.defaults.adapter = async (config) => {
      const err = new Error('Request failed with status code 422');
      (err as any).response = { status: 422, data: {} };
      (err as any).config = config;
      throw err;
    };

    await expect(api.post('/tasks', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'Please check your input and try again.',
    });
  });

  it('maps 429 rate limit error', async () => {
    client.defaults.adapter = async (config) => {
      const err = new Error('Request failed with status code 429');
      (err as any).response = { status: 429, data: {} };
      (err as any).config = config;
      throw err;
    };

    await expect(api.post('/ai/propose', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 429,
      message: 'Too many requests. Please wait a moment and try again.',
    });
  });

  it('maps 500 server error', async () => {
    client.defaults.adapter = async (config) => {
      const err = new Error('Request failed with status code 500');
      (err as any).response = { status: 500, data: {} };
      (err as any).config = config;
      throw err;
    };

    await expect(api.get('/tasks')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'The server could not complete your request. Please try again later.',
    });
  });

  it('re-throws canceled requests directly without wrapping into ApiError', async () => {
    const cancelErr = new Error('canceled');
    (cancelErr as any).name = 'CanceledError';
    (cancelErr as any).code = 'ERR_CANCELED';

    client.defaults.adapter = async () => {
      throw cancelErr;
    };

    await expect(api.get('/tasks')).rejects.toBe(cancelErr);
  });
});
