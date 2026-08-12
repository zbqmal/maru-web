import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

const shouldRetryQuery = (failureCount: number, error: unknown) => {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }

  return failureCount < 2;
};

const queryCache = new QueryCache({
  onError: (error) => {
    console.error("[Query Error]", getErrorMessage(error));
  },
});

const mutationCache = new MutationCache({
  onError: (error) => {
    console.error("[Mutation Error]", getErrorMessage(error));
  },
});

export const createQueryClient = () =>
  new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: {
        retry: false,
      },
    },
  });
