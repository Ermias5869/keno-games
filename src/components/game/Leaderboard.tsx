"use client";

import { useLeaderboard } from "@/hooks/use-game";

interface LeaderEntry {
  id: string;
  payout: string;
  betAmount: string;
  matches: number;
  selectedNumbers: number[];
  user: {
    phone: string;
  };
}

/**
 * Leaderboard — top wins display.
 */
export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="bg-[#0d1b2a]/60 rounded-xl p-4 border border-[#1b3a4b]">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-[#1a2332] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="bg-[#0d1b2a]/60 rounded-xl p-4 border border-[#1b3a4b] text-center">
        <p className="text-gray-500 text-sm">No wins yet</p>
      </div>
    );
  }

  // Mask phone number for privacy
  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.slice(0, 3) + "***" + phone.slice(-2);
  };

  return (
    <div className="bg-[#0d1b2a]/60 rounded-xl border border-[#1b3a4b] overflow-hidden">
      <div className="p-3 border-b border-[#1b3a4b]">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <span>🏆</span> Top Wins
        </h3>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {(leaderboard as LeaderEntry[]).map((entry, idx) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 px-3 py-2 border-b border-[#1b3a4b]/30 hover:bg-[#1a2332]/50"
          >
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                idx === 0
                  ? "bg-amber-500 text-black"
                  : idx === 1
                  ? "bg-gray-300 text-black"
                  : idx === 2
                  ? "bg-amber-700 text-white"
                  : "bg-[#1a2332] text-gray-500"
              }`}
            >
              {idx + 1}
            </span>
            <div className="flex-1">
              <span className="text-xs text-gray-400">
                {maskPhone(entry.user.phone)}
              </span>
            </div>
            <span className="text-emerald-400 font-bold text-sm">
              +{parseFloat(entry.payout).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
