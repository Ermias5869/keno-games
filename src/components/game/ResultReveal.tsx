"use client";

import { useGameStore } from "@/stores/game.store";
import { useEffect, useState } from "react";

/**
 * Result reveal animation — sequentially reveals drawn numbers with animation.
 */
export default function ResultReveal() {
  const { drawnNumbers, selectedNumbers, roundStatus } = useGameStore();
  const [revealedCount, setRevealedCount] = useState(0);

  // Animate number reveal when round completes
  useEffect(() => {
    if (roundStatus === "completed" && drawnNumbers.length > 0) {
      setRevealedCount(0);
      const interval = setInterval(() => {
        setRevealedCount((prev) => {
          if (prev >= drawnNumbers.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 150); // Reveal one number every 150ms

      return () => clearInterval(interval);
    } else {
      setRevealedCount(0);
    }
  }, [roundStatus, drawnNumbers]);

  if (drawnNumbers.length === 0) return null;

  const revealedNumbers = drawnNumbers.slice(0, revealedCount);
  const matches = selectedNumbers.filter((n) => drawnNumbers.includes(n));

  return (
    <div className="bg-[#0d1b2a]/80 rounded-xl p-4 border border-[#1b3a4b]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Drawn Numbers
        </h3>
        <span className="text-emerald-400 font-bold text-sm">
          {matches.length} / {drawnNumbers.length}{" "}
          <span className="text-gray-500 font-normal">matched</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        {revealedNumbers.map((num, idx) => {
          const isMatch = selectedNumbers.includes(num);
          return (
            <span
              key={`${num}-${idx}`}
              className={`
                w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center
                transition-all duration-300 animate-[popIn_0.3s_ease-out]
                ${
                  isMatch
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/40"
                    : "bg-[#1a2332] text-gray-400 border border-[#2a3a4d]"
                }
              `}
            >
              {num}
            </span>
          );
        })}
        {/* Placeholder for unrevealed */}
        {Array.from({ length: drawnNumbers.length - revealedCount }).map(
          (_, i) => (
            <span
              key={`placeholder-${i}`}
              className="w-8 h-8 rounded-md bg-[#0a1220] border border-[#1b3a4b] flex items-center justify-center animate-pulse"
            >
              <span className="text-gray-600 text-xs">?</span>
            </span>
          )
        )}
      </div>
    </div>
  );
}
