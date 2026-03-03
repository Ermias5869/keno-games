"use client";

import { useBetHistory } from "@/hooks/use-game";

interface BetEntry {
  id: string;
  selectedNumbers: number[];
  betAmount: string;
  matches: number;
  payout: string;
  createdAt: string;
  round: {
    id: string;
    drawnNumbers: number[];
    createdAt: string;
  };
}

/**
 * Bet history panel — scrollable list of past bets.
 */
export default function BetHistory() {
  const { data: bets, isLoading } = useBetHistory();

  if (isLoading) {
    return (
      <div className="bg-[#0d1b2a]/60 rounded-xl p-4 border border-[#1b3a4b]">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#1a2332] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!bets || bets.length === 0) {
    return (
      <div className="bg-[#0d1b2a]/60 rounded-xl p-6 border border-[#1b3a4b] text-center">
        <p className="text-gray-500 text-sm">No bets yet. Place your first bet!</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1b2a]/60 rounded-xl border border-[#1b3a4b] overflow-hidden">
      <div className="p-3 border-b border-[#1b3a4b]">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <span>📋</span> Bet History
        </h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#2a3a4d]">
        {(bets as BetEntry[]).map((bet) => {
          const isWin = parseFloat(bet.payout) > 0;
          return (
            <div
              key={bet.id}
              className="p-3 border-b border-[#1b3a4b]/50 hover:bg-[#1a2332]/50 transition-colors"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">
                  {new Date(bet.createdAt).toLocaleTimeString()}
                </span>
                <span
                  className={`text-sm font-bold ${
                    isWin ? "text-emerald-400" : "text-gray-500"
                  }`}
                >
                  {isWin ? `+${parseFloat(bet.payout).toFixed(2)}` : "0.00"}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400">
                  Bet {parseFloat(bet.betAmount).toFixed(2)}
                </span>
                <span className="text-xs text-gray-600">•</span>
                <span className={`text-xs ${isWin ? "text-emerald-400" : "text-gray-500"}`}>
                  {bet.matches} matches
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {bet.selectedNumbers.map((num) => {
                  const isMatch = bet.round.drawnNumbers.includes(num);
                  return (
                    <span
                      key={num}
                      className={`w-6 h-6 rounded text-[10px] font-medium flex items-center justify-center ${
                        isMatch
                          ? "bg-emerald-600/30 text-emerald-400 border border-emerald-600/50"
                          : "bg-[#1a2332] text-gray-500 border border-[#2a3a4d]"
                      }`}
                    >
                      {num}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
