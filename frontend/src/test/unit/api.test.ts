import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, extractSignal, createAbortController } from '../../services/api';

describe('API Service Timeouts and AbortController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractSignal', () => {
    it('returns undefined when no signal or context is provided', () => {
      expect(extractSignal(undefined)).toBeUndefined();
      expect(extractSignal(null)).toBeUndefined();
      expect(extractSignal({})).toBeUndefined();
    });

    it('extracts signal from an AbortSignal instance', () => {
      const controller = new AbortController();
      expect(extractSignal(controller.signal)).toBe(controller.signal);
    });

    it('extracts signal from a TanStack Query context object', () => {
      const controller = new AbortController();
      const context = {
        queryKey: ['tasks'],
        signal: controller.signal,
      };
      expect(extractSignal(context)).toBe(controller.signal);
    });
  });

  describe('createAbortController', () => {
    it('creates an AbortController instance', () => {
      const controller = createAbortController();
      expect(controller).toBeInstanceOf(AbortController);
      expect(controller.signal.aborted).toBe(false);
      controller.abort();
      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe('api helper interface', () => {
    it('exports get, getWithMeta, post, patch, and delete', () => {
      expect(typeof api.get).toBe('function');
      expect(typeof api.getWithMeta).toBe('function');
      expect(typeof api.post).toBe('function');
      expect(typeof api.patch).toBe('function');
      expect(typeof api.delete).toBe('function');
    });
  });
});
