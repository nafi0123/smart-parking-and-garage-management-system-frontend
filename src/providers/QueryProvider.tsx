'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Mark immediately stale so any mount fetches the latest data
            refetchOnWindowFocus: true, // Auto-update when user focuses back on the tab
          },
        },
        mutationCache: new MutationCache({
          onSuccess: () => {
            // Automatically invalidate all tracked queries upon any successful mutation in the app
            queryClient.invalidateQueries();
          },
        }),
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
