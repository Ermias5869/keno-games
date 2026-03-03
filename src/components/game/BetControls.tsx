"use client";

import { useGameStore } from "@/stores/game.store";
import { useAuthStore } from "@/stores/auth.store";
import { usePayoutTable, usePlaceBet } from "@/hooks/use-game";
import { useState } from "react";

/**
 * Bet controls — amount input, multiplier display, possible win, and BET button.
 */
export default function BetControls() {
  const { selectedNumbers, betAmount, setBetAmount, currentRoundId, roundStatus } =
    useGameStore();
  const { user } = useAuthStore();
  const { data: payoutTable } = usePayoutTable();
  const placeBetMutation = usePlaceBet();
  const [betPlaced, setBetPlaced] = useState(false);

  // Find max multiplier for current selection count
  const getMultiplier = () => {
    if (!payoutTable || selectedNumbers.length === 0) return 0;
    const entry = payoutTable.find(
      (p: { selectedCount: number; matchCount: number; multiplier: string }) =>
        p.selectedCount === selectedNumbers.length &&
        p.matchCount === selectedNumbers.length
    );
    return entry ? parseFloat(entry.multiplier) : 0;
  };

  // Build multiplier row for header
  const getPayoutRow = () => {
    if (!payoutTable || selectedNumbers.length === 0) return [];
    return payoutTable
      .filter(
        (p: { selectedCount: number; matchCount: number; multiplier: string }) =>
          p.selectedCount === selectedNumbers.length
      )
      .map((p: { selectedCount: number; matchCount: number; multiplier: string }) => ({
        match: p.matchCount,
        multiplier: parseFloat(p.multiplier),
      }));
  };

  const multiplier = getMultiplier();
  const possibleWin = betAmount * multiplier;
  const payoutRow = getPayoutRow();
  const canBet =
    selectedNumbers.length > 0 &&
    betAmount > 0 &&
    currentRoundId &&
    roundStatus === "betting" &&
    !betPlaced &&
    !placeBetMutation.isPending;

  const handlePlaceBet = async () => {
    if (!canBet || !currentRoundId) return;

    try {
      await placeBetMutation.mutateAsync({
        selectedNumbers,
        betAmount,
        roundId: currentRoundId,
      });
      setBetPlaced(true);
    } catch (err) {
      console.error("Bet failed:", err);
    }
  };

  // Reset betPlaced when a new round starts
  if (betPlaced && roundStatus === "betting") {
    setBetPlaced(false);
  }

  return (
    <div className="space-y-4">
      {/* Payout row */}
      {payoutRow.length > 0 && (
        <div className="bg-[#0d1b2a]/80 rounded-xl p-3 border border-[#1b3a4b]">
          <div className="text-center text-xs text-emerald-400 mb-2 font-medium">
            Possible win{" "}
            <span className="text-amber-400 text-lg font-bold">
              {possibleWin.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Match</span>
            {payoutRow.slice(-6).map((p: { match: number; multiplier: number }) => (
              <span key={p.match} className="text-center min-w-[3rem]">
                {p.match}
              </span>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-200 mt-1">
            <span className="text-gray-400">Pays</span>
            {payoutRow.slice(-6).map((p: { match: number; multiplier: number }) => (
              <span
                key={p.match}
                className="text-center min-w-[3rem] text-emerald-300 font-medium"
              >
                x{p.multiplier}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Drawn numbers display */}
      {selectedNumbers.length > 0 && (
        <div className="bg-[#0d1b2a]/60 rounded-xl p-3 border border-[#1b3a4b]">
          <div className="flex flex-wrap gap-2 justify-center">
            {selectedNumbers.map((num) => (
              <span
                key={num}
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 
                  text-black font-bold text-sm flex items-center justify-center shadow-md"
              >
                {num}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bet amount controls */}
      <div className="flex items-center gap-2 bg-[#0d1b2a] rounded-xl p-2 border border-[#1b3a4b]">
        <button
          onClick={() => setBetAmount(Math.max(1, betAmount - 1))}
          className="w-10 h-10 rounded-lg bg-[#1a2332] text-gray-300 hover:bg-[#243447] 
            transition-colors text-xl font-bold flex items-center justify-center border border-[#2a3a4d]"
        >
          −
        </button>

        <input
          type="number"
          value={betAmount}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val >= 0) setBetAmount(val);
          }}
          className="flex-1 text-center bg-[#1a2332] border border-[#2a3a4d] rounded-lg 
            text-white text-lg font-bold py-2 focus:outline-none focus:border-emerald-500/50
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        <button
          onClick={() => setBetAmount(betAmount + 1)}
          className="w-10 h-10 rounded-lg bg-[#1a2332] text-gray-300 hover:bg-[#243447] 
            transition-colors text-xl font-bold flex items-center justify-center border border-[#2a3a4d]"
        >
          +
        </button>

        <button
          onClick={() => setBetAmount(betAmount * 2)}
          className="px-3 h-10 rounded-lg bg-[#1a2332] text-emerald-400 hover:bg-[#243447] 
            transition-colors text-sm font-bold border border-[#2a3a4d]"
        >
          X2
        </button>

        <button
          onClick={() => setBetAmount(user?.balance || 0)}
          className="px-3 h-10 rounded-lg bg-[#1a2332] text-amber-400 hover:bg-[#243447] 
            transition-colors text-sm font-bold border border-[#2a3a4d]"
        >
          MAX
        </button>
      </div>

      {/* BET button */}
      <button
        onClick={handlePlaceBet}
        disabled={!canBet}
        className={`
          w-full py-4 rounded-xl text-lg font-bold uppercase tracking-wider
          transition-all duration-300
          ${
            canBet
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }
        `}
      >
        {placeBetMutation.isPending
          ? "Placing bet..."
          : betPlaced
          ? "✓ Bet placed"
          : `BET ${betAmount.toFixed(2)}`}
      </button>

      {placeBetMutation.error && (
        <p className="text-red-400 text-sm text-center">
          {(placeBetMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
