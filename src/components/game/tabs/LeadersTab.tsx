"use client";

import { useQuery } from "@tanstack/react-query";

interface Leader {
  username: string;
  totalWinnings: number;
  totalBets: number;
  winRate: number;
}

/**
 * LEADERS TAB — top 10 users by total winnings.
 */
export default function LeadersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/game/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse bg-[#1a2332] rounded-lg h-14" />
        ))}
      </div>
    );
  }

  const leaders: Leader[] = data?.leaders || [];

  if (leaders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <span className="text-3xl mb-3">🏆</span>
        <p className="text-gray-500 text-sm text-center">
          No winners yet. Be the first!
        </p>
      </div>
    );
  }

  const rankColors = [
    "text-amber-400",   // 1st - gold
    "text-gray-300",    // 2nd - silver
    "text-amber-600",   // 3rd - bronze
  ];

  return (
    <div>
      <div className="px-3 py-2 border-b border-[#1b3a4b]/50">
        <span className="text-xs text-gray-500">Top {leaders.length} Winners</span>
      </div>

      {leaders.map((leader, index) => (
        <div
          key={index}
          className="px-3 py-3 border-b border-[#1b3a4b]/30 hover:bg-[#1a2332]/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            {/* Rank */}
            <span
              className={`text-lg font-bold min-w-[1.5rem] text-center ${
                rankColors[index] || "text-gray-500"
              }`}
            >
              {index + 1}
            </span>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {leader.username}
              </p>
              <div className="flex gap-3 text-[10px] text-gray-500">
                <span>{leader.totalBets} bets</span>
                <span>{leader.winRate}% win rate</span>
              </div>
            </div>

            {/* Total winnings */}
            <div className="text-right">
              <p className="text-emerald-400 font-bold text-sm">
                {leader.totalWinnings.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-[10px] text-gray-600">ETB</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
