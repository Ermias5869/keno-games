"use client";

import { create } from "zustand";

interface GameState {
  // Number selection
  selectedNumbers: number[];
  toggleNumber: (num: number) => void;
  clearSelection: () => void;

  // Bet amount
  betAmount: number;
  setBetAmount: (amount: number) => void;

  // Round state
  currentRoundId: string | null;
  setCurrentRoundId: (id: string | null) => void;
  roundStatus: "betting" | "drawing" | "completed" | "waiting";
  setRoundStatus: (status: "betting" | "drawing" | "completed" | "waiting") => void;

  // Countdown
  countdown: number;
  setCountdown: (seconds: number) => void;

  // Draw results
  drawnNumbers: number[];
  setDrawnNumbers: (numbers: number[]) => void;

  // Last bet result
  lastBetResult: {
    matches: number;
    payout: number;
    selectedNumbers: number[];
  } | null;
  setLastBetResult: (result: {
    matches: number;
    payout: number;
    selectedNumbers: number[];
  } | null) => void;

  // Reset for new round
  resetForNewRound: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  selectedNumbers: [],
  toggleNumber: (num) => {
    const current = get().selectedNumbers;
    if (current.includes(num)) {
      set({ selectedNumbers: current.filter((n) => n !== num) });
    } else if (current.length < 10) {
      set({ selectedNumbers: [...current, num].sort((a, b) => a - b) });
    }
  },
  clearSelection: () => set({ selectedNumbers: [] }),

  betAmount: 5,
  setBetAmount: (amount) => set({ betAmount: amount }),

  currentRoundId: null,
  setCurrentRoundId: (id) => set({ currentRoundId: id }),

  roundStatus: "waiting",
  setRoundStatus: (status) => set({ roundStatus: status }),

  countdown: 0,
  setCountdown: (seconds) => set({ countdown: seconds }),

  drawnNumbers: [],
  setDrawnNumbers: (numbers) => set({ drawnNumbers: numbers }),

  lastBetResult: null,
  setLastBetResult: (result) => set({ lastBetResult: result }),

  resetForNewRound: () =>
    set({
      drawnNumbers: [],
      lastBetResult: null,
      roundStatus: "betting",
    }),
}));
