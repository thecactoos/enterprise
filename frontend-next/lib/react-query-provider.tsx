'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dane są świeże przez 5 minut
            staleTime: 5 * 60 * 1000,
            // Cache trzymany przez 10 minut
            gcTime: 10 * 60 * 1000,
            // Retry 3 razy z exponential backoff
            retry: (failureCount, error) => {
              if (error instanceof Error) {
                // Nie retry przy błędach autoryzacji
                if (error.message.includes('401')) return false;
              }
              return failureCount < 3;
            },
            // Refetch przy ponownym focus na okno
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Globalna obsługa błędów mutacji
            onError: (error) => {
              console.error('Mutation error:', error);
              // TODO: Toast notification
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}