"use client";

import { useGameStore } from "@/stores/game.store";

/**
 * Keno Grid — 8×10 grid of numbers 1-80.
 * Click to select/deselect (max 10 numbers).
 * Colors: selected (gold), matched (green), missed drawn (red), default (dark).
 */
export default function KenoGrid() {
  const {
    selectedNumbers,
    toggleNumber,
    drawnNumbers,
    roundStatus,
  } = useGameStore();

  const getNumberState = (num: number) => {
    const isSelected = selectedNumbers.includes(num);
    const isDrawn = drawnNumbers.includes(num);

    if (roundStatus === "completed" || roundStatus === "drawing") {
      if (isSelected && isDrawn) return "matched";
      if (isSelected && !isDrawn) return "missed";
      if (isDrawn) return "drawn";
    }

    if (isSelected) return "selected";
    return "default";
  };

  const stateStyles: Record<string, string> = {
    default:
      "bg-[#1a2332] text-gray-300 hover:bg-[#243447] hover:text-white border-[#2a3a4d] cursor-pointer",
    selected:
      "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold border-emerald-400 shadow-lg shadow-emerald-500/30 cursor-pointer scale-105",
    matched:
      "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold border-emerald-400 shadow-lg shadow-emerald-500/40 animate-pulse",
    missed:
      "bg-gradient-to-br from-red-600 to-red-700 text-white border-red-500 opacity-70",
    drawn:
      "bg-gradient-to-br from-emerald-700 to-emerald-800 text-emerald-200 border-emerald-600",
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
        {Array.from({ length: 80 }, (_, i) => i + 1).map((num) => {
          const state = getNumberState(num);
          const canClick =
            roundStatus === "betting" || roundStatus === "waiting";

          return (
            <button
              key={num}
              onClick={() => canClick && toggleNumber(num)}
              disabled={!canClick}
              className={`
                aspect-square rounded-lg border text-sm sm:text-base font-medium
                transition-all duration-200 flex items-center justify-center
                ${stateStyles[state]}
                ${!canClick && state === "default" ? "cursor-not-allowed opacity-60" : ""}
              `}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}
