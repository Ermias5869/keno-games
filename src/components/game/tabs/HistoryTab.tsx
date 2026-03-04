"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";

interface BetHistory {
  id: string;
  roundId: string;
  selectedNumbers: number[];
  betAmount: number;
  matches: number;
  payout: number;
  status: string;
  drawnNumbers: number[];
  createdAt: string;
}

/**
 * HISTORY TAB — authenticated user's bet history with pagination.
 */
export default function HistoryTab() {
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["my-history", page],
    queryFn: async () => {
      const res = await apiClient.getMyHistory(page);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <span className="text-3xl mb-3">🔒</span>
        <p className="text-gray-500 text-sm text-center">
          Login to see your bet history
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-[#1a2332] rounded-lg h-16" />
        ))}
      </div>
    );
  }

  const bets: BetHistory[] = data?.bets || [];
  const totalPages = data?.totalPages || 1;

  if (bets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <span className="text-3xl mb-3">📋</span>
        <p className="text-gray-500 text-sm text-center">
          No bets yet. Place your first bet!
        </p>
      </div>
    );
  }

  return (
    <div>
      {bets.map((bet) => (
        <div
          key={bet.id}
          className="px-3 py-2.5 border-b border-[#1b3a4b]/30 hover:bg-[#1a2332]/30 transition-colors"
        >
          {/* Round ID + Date */}
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-600 font-mono">
              {bet.roundId.slice(-8)}
            </span>
            <span className="text-[10px] text-gray-600">
              {new Date(bet.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Numbers */}
          <div className="flex flex-wrap gap-1 mb-1.5">
            {bet.selectedNumbers.map((num) => {
              const isMatch = bet.drawnNumbers?.includes(num);
              return (
                <span
                  key={num}
                  className={`w-7 h-7 rounded text-[11px] font-medium flex items-center justify-center ${
                    isMatch
                      ? "bg-emerald-500/30 border border-emerald-500/50 text-emerald-300"
                      : "bg-[#1a2332] border border-[#2a3a4d] text-gray-400"
                  }`}
                >
                  {num}
                </span>
              );
            })}
          </div>

          {/* Stats row */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">
              Bet {bet.betAmount.toLocaleString()}
            </span>
            <span className="text-gray-500">
              {bet.matches} match{bet.matches !== 1 ? "es" : ""}
            </span>
            <span
              className={`font-medium ${
                bet.status === "WON"
                  ? "text-emerald-400"
                  : bet.status === "LOST"
                  ? "text-red-400"
                  : "text-amber-400"
              }`}
            >
              {bet.status === "WON"
                ? `+${bet.payout.toLocaleString()}`
                : bet.status === "LOST"
                ? "Lost"
                : "Pending"}
            </span>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-3 border-t border-[#1b3a4b]">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 rounded text-xs bg-[#1a2332] text-gray-400 border border-[#2a3a4d] disabled:opacity-30"
          >
            ←
          </button>
          <span className="text-xs text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 rounded text-xs bg-[#1a2332] text-gray-400 border border-[#2a3a4d] disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
