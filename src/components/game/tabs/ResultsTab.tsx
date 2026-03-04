"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface RoundResult {
  id: string;
  drawnNumbers: number[];
  totalBets: number;
  totalPayout: number;
  createdAt: string;
}

/**
 * RESULTS TAB — last 100 completed rounds matching reference UI:
 * Shows Draw ID, timestamp, and all 20 drawn numbers split into 2 rows.
 */
export default function ResultsTab() {
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["game-results", order],
    queryFn: async () => {
      const res = await fetch(`/api/game/results?limit=100&order=${order}`);
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-[#1a2332] rounded-lg h-20" />
        ))}
      </div>
    );
  }

  const rounds: RoundResult[] = data?.rounds || [];

  if (rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <span className="text-3xl mb-3">📊</span>
        <p className="text-gray-500 text-sm text-center">No completed rounds yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header bar */}
      <div className="px-3 py-2 border-b border-[#1b3a4b]/50 flex justify-between items-center sticky top-0 bg-[#0d1b2a]/90 backdrop-blur-sm z-10">
        <div className="grid grid-cols-2 flex-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          <span>Draw ID</span>
          <span className="text-right">Combination</span>
        </div>
        <button
          onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
          className="ml-3 text-[11px] text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
        >
          Sort {order === "desc" ? "↓" : "↑"}
        </button>
      </div>

      {/* Round rows */}
      {rounds.map((round, index) => {
        const drawNum = order === "desc" ? index + 1 : rounds.length - index;
        const time = new Date(round.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        // Split 20 drawn numbers into two rows of 10
        const row1 = round.drawnNumbers.slice(0, 10);
        const row2 = round.drawnNumbers.slice(10, 20);

        return (
          <div
            key={round.id}
            className="px-3 py-2.5 border-b border-[#1b3a4b]/30 hover:bg-[#1a2332]/40 transition-colors"
          >
            <div className="flex gap-2">
              {/* Left: Draw ID + time */}
              <div className="flex flex-col items-center justify-center min-w-[52px]">
                <div className="flex items-center gap-1">
                  <span className="text-emerald-400 text-[11px]">✓</span>
                  <span className="text-white text-[12px] font-semibold">
                    {drawNum.toString().padStart(6, "0")}
                  </span>
                </div>
                <span className="text-gray-500 text-[10px] mt-0.5">{time}</span>
              </div>

              {/* Right: Number grid, 2 rows × 10 */}
              <div className="flex-1 space-y-1">
                <div className="flex gap-0.5 flex-wrap">
                  {row1.map((num) => (
                    <span
                      key={num}
                      className="w-[21px] h-[18px] rounded-[3px] bg-[#1a2332] border border-[#2a3a4d]
                        text-white text-[10px] font-medium flex items-center justify-center"
                    >
                      {num}
                    </span>
                  ))}
                </div>
                <div className="flex gap-0.5 flex-wrap">
                  {row2.map((num) => (
                    <span
                      key={num}
                      className="w-[21px] h-[18px] rounded-[3px] bg-[#1a2332] border border-[#2a3a4d]
                        text-white text-[10px] font-medium flex items-center justify-center"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
