import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

/**
 * Custom TanStack Query wrapper hook that forwards the query AbortSignal
 * to the query function for automated request cancellation on component unmount.
 */
export function useQueryWithAbort<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: (signal?: AbortSignal) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  return useQuery({
    ...options,
    queryKey,
    queryFn: async ({ signal }) => queryFn(signal),
    // Auto-cancel on unmount via TanStack Query v5
  });
}
