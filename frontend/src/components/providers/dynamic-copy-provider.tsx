'use client';

/**
 * DynamicCopy system — lightweight CMS for dashboard text.
 *
 * Caching strategy:
 *   • ONE React Query call fetches GET /dynamic-copy for the entire session.
 *   • staleTime: 5 minutes → no refetch on window focus / component mount.
 *   • All useDynamicCopy() calls are synchronous Map.get() lookups — zero I/O.
 *   • Falls back gracefully to the provided `fallback` when the key is absent.
 */

import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type CopyMap = Map<string, string>;

const DynamicCopyContext = createContext<CopyMap>(new Map());

export function DynamicCopyProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery<Record<string, string>>({
    queryKey: ['dynamic-copy'],
    queryFn: () => api.get('/dynamic-copy').then((r) => r.data),
    // 5-minute stale window — at most one network call per session window
    staleTime: 5 * 60 * 1000,
    // Keep in React Query cache for 10 minutes after unmount
    gcTime: 10 * 60 * 1000,
    // Never refetch on window focus — copy changes rarely
    refetchOnWindowFocus: false,
    // Don't retry on error — fall through to fallback text gracefully
    retry: false,
  });

  const map: CopyMap = useMemo(
    () => (data ? new Map(Object.entries(data)) : new Map()),
    [data],
  );

  return (
    <DynamicCopyContext.Provider value={map}>
      {children}
    </DynamicCopyContext.Provider>
  );
}

/**
 * Returns the dynamic copy value for `key`, or `fallback` if not found.
 *
 * @example
 *   const title = useDynamicCopy('dashboard.title', 'Dashboard');
 */
export function useDynamicCopy(key: string, fallback: string): string {
  const map = useContext(DynamicCopyContext);
  return map.get(key) ?? fallback;
}
