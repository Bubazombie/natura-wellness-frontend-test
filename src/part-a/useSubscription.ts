import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubscription, skipNextShipment } from "../api/mockApi";
import { ApiError, type Subscription } from "../api/types";

export const SUBSCRIPTION_KEY = ["subscription"] as const;

/** Retry a failed load once if the server failed (5xx); a 4xx won't change by asking again. */
function retryLoad(failureCount: number, error: Error): boolean {
  const clientError = error instanceof ApiError && error.status < 500;
  return !clientError && failureCount < 1;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // No other client writes to the mock, so refetching on window focus would only add requests.
      queries: { retry: retryLoad, refetchOnWindowFocus: false },
      // Never retry a change: retrying a 409 would hide a real conflict from the customer.
      mutations: { retry: false },
    },
  });
}

export function useSubscriptionQuery() {
  return useQuery({ queryKey: SUBSCRIPTION_KEY, queryFn: getSubscription });
}

export function useSkipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscription: Subscription) => skipNextShipment({ subscriptionId: subscription.id, expectedUpdatedAt: subscription.updatedAt }),
    onSuccess: (updated) => {
      queryClient.setQueryData(SUBSCRIPTION_KEY, updated);
    },
  });
}
