"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/game.store";

interface LiveBet {
  id: string;
  username: string;
  selectedNumbers: number[];
  betAmount: number;
  status: string;
  createdAt: string;
}

/**
 * GAME TAB — shows all active bets for the current round.
 * Updates in real-time when new bets are placed.
 */
export default function GameTab() {
  const { currentRoundId } = useGameStore();
  const [bets, setBets] = useState<LiveBet[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch current round bets
  useEffect(() => {
    const fetchBets = async () => {
      setLoading(true);
      try {
        const url = currentRoundId
          ? `/game/current-bets?roundId=${currentRoundId}`
          : "/game/current-bets";
        const res = await fetch(`/api${url}`);
        if (res.ok) {
          const data = await res.json();
          setBets(data.bets || []);
        }
      } catch (err) {
        console.error("Failed to fetch bets:", err);
      }
      setLoading(false);
    };

    fetchBets();
    // Re-fetch every 5 seconds as a fallback
    const interval = setInterval(fetchBets, 5000);
    return () => clearInterval(interval);
  }, [currentRoundId]);

  const statusStyles: Record<string, string> = {
    PENDING: "text-amber-400",
    WON: "text-emerald-400",
    LOST: "text-red-400",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Waiting",
    WON: "Won",
    LOST: "Lost",
  };

  if (loading && bets.length === 0) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse bg-[#1a2332] rounded-lg h-20" />
        ))}
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <span className="text-3xl mb-3">🎲</span>
        <p className="text-gray-500 text-sm text-center">
          No bets placed yet this round
        </p>
        <p className="text-gray-600 text-xs text-center mt-1">
          Be the first to place a bet!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats header */}
      <div className="px-3 py-2 border-b border-[#1b3a4b]/50 flex justify-between text-xs text-gray-500">
        <span>All {bets.length}</span>
      </div>

      {/* Bet list */}
      {bets.map((bet) => (
        <div
          key={bet.id}
          className="px-3 py-2.5 border-b border-[#1b3a4b]/30 hover:bg-[#1a2332]/30 transition-colors"
        >
          {/* Username */}
          <p className="text-[11px] text-gray-500 mb-1">{bet.username}</p>

          {/* Selected numbers */}
          <div className="flex flex-wrap gap-1 mb-1.5">
            {bet.selectedNumbers.map((num) => (
              <span
                key={num}
                className="w-7 h-7 rounded bg-[#1a2332] border border-[#2a3a4d] text-white text-[11px] font-medium flex items-center justify-center"
              >
                {num}
              </span>
            ))}
          </div>

          {/* Bet amount and status */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              Bet {bet.betAmount.toLocaleString()}
            </span>
            <span className={`text-xs font-medium ${statusStyles[bet.status] || "text-gray-400"}`}>
              {statusLabels[bet.status] || bet.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
