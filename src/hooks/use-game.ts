"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";

/** Hook to get current user profile */
export function useProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await apiClient.getProfile();
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      return data.user;
    },
    enabled: isAuthenticated,
    refetchInterval: 10_000, // Refresh balance every 10s
  });
}

/** Hook to get bet history */
export function useBetHistory() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["betHistory"],
    queryFn: async () => {
      const res = await apiClient.getBetHistory();
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      return data.bets;
    },
    enabled: isAuthenticated,
  });
}

/** Hook to get payout table */
export function usePayoutTable() {
  return useQuery({
    queryKey: ["payoutTable"],
    queryFn: async () => {
      const res = await apiClient.getPayoutTable();
      if (!res.ok) throw new Error("Failed to fetch payout table");
      const data = await res.json();
      return data.payoutTable;
    },
    staleTime: 60_000, // Cache for 1 minute
  });
}

/** Hook to get leaderboard */
export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await apiClient.getLeaderboard();
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      return data.leaderboard;
    },
    refetchInterval: 30_000,
  });
}

/** Hook to place a bet */
export function usePlaceBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectedNumbers,
      betAmount,
      roundId,
    }: {
      selectedNumbers: number[];
      betAmount: number;
      roundId: string;
    }) => {
      const res = await apiClient.placeBet(
        selectedNumbers,
        betAmount,
        roundId
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to place bet");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate profile to refresh balance
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["betHistory"] });
    },
  });
}
