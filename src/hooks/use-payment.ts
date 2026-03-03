"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";

/** Hook to initialize a Chapa deposit */
export function useInitializeDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      const res = await apiClient.initializeDeposit(amount);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initialize deposit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/** Hook to verify a transaction */
export function useVerifyTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ txRef }: { txRef: string }) => {
      const res = await apiClient.verifyTransaction(txRef);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verification failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/** Hook to fetch transaction history */
export function useTransactionHistory() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await apiClient.getTransactions();
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      return data.transactions;
    },
    enabled: isAuthenticated,
  });
}
