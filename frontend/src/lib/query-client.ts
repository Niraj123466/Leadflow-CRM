import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";

/**
 * One QueryClient per browser session. Centralising retry/error policy here
 * keeps hooks declarative.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Never retry client errors (4xx) — they will not fix themselves.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: 0,
      },
    },
    queryCache: new QueryCache(),
    mutationCache: new MutationCache(),
  });
}
