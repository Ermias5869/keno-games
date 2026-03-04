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

/** Hook to fetch supported banks */
export function useBanks() {
  return useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const res = await apiClient.getBanks();
      if (!res.ok) throw new Error("Failed to fetch banks");
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/** Hook to request a withdrawal */
export function useRequestWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      amount: number;
      bankName: string;
      accountNumber: string;
      accountName: string;
      bankCode: string;
    }) => {
      const res = await apiClient.requestWithdraw(data);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Withdrawal request failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
