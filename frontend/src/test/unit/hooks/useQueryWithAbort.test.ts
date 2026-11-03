import { describe, it, expect, vi } from 'vitest';
import * as rq from '@tanstack/react-query';
import { useQueryWithAbort } from '../../../hooks/useQueryWithAbort';

describe('useQueryWithAbort hook', () => {
  it('delegates to useQuery with forwarded queryKey, options, and signal-aware queryFn', async () => {
    const useQuerySpy = vi.spyOn(rq, 'useQuery').mockImplementation((options: any) => {
      return {
        data: 'mock-data',
        isLoading: false,
        isSuccess: true,
        options,
      } as any;
    });

    const mockFetcher = vi.fn().mockResolvedValue('result-data');
    const controller = new AbortController();

    const res = useQueryWithAbort(['users', 123], (signal) => mockFetcher(signal), {
      enabled: true,
    });

    expect(useQuerySpy).toHaveBeenCalledTimes(1);
    const passedOptions = useQuerySpy.mock.calls[0][0];

    expect(passedOptions.queryKey).toEqual(['users', 123]);
    expect(passedOptions.enabled).toBe(true);

    // Verify signal is forwarded to fetcher
    const queryFnResult = await passedOptions.queryFn({ signal: controller.signal });
    expect(mockFetcher).toHaveBeenCalledWith(controller.signal);
    expect(queryFnResult).toBe('result-data');

    expect(res.data).toBe('mock-data');

    useQuerySpy.mockRestore();
  });
});
