"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useProfile } from "@/hooks/use-game";
import { useSocket } from "@/hooks/use-socket";
import Header from "@/components/layout/Header";
import KenoGrid from "@/components/game/KenoGrid";
import BetControls from "@/components/game/BetControls";
import CountdownTimer from "@/components/game/CountdownTimer";
import ResultReveal from "@/components/game/ResultReveal";
import GameSidePanel from "@/components/game/GameSidePanel";
import ChatPanel from "@/components/chat/ChatPanel";
import { useGameStore } from "@/stores/game.store";

export default function GamePage() {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuthStore();
  const { data: profile } = useProfile();
  const { selectedNumbers, clearSelection, roundStatus } = useGameStore();

  // Connect socket for real-time events
  useSocket();

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Sync profile data to auth store
  useEffect(() => {
    if (profile) {
      const accessToken = localStorage.getItem("accessToken") || "";
      const refreshToken = localStorage.getItem("refreshToken") || "";
      setAuth(
        {
          id: profile.id,
          phone: profile.phone,
          balance: Number(profile.balance),
          role: profile.role,
        },
        accessToken,
        refreshToken
      );
    }
  }, [profile, setAuth]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-2 py-3">
        <div className="grid grid-cols-12 gap-2">
          {/* Left sidebar — Game Side Panel (4 tabs) */}
          <div className="col-span-3">
            <GameSidePanel />
          </div>

          {/* Center — Game area */}
          <div className="col-span-6 space-y-2">
            {/* Timer + Selection info */}
            <div className="flex items-center justify-between">
              <CountdownTimer />
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Selected
                </p>
                <p className="text-2xl font-bold text-white">
                  {selectedNumbers.length}
                  <span className="text-gray-500 text-sm font-normal"> / 10</span>
                </p>
                {selectedNumbers.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors mt-1"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Result reveal (shows after draw) */}
            <ResultReveal />

            {/* Keno Grid */}
            <KenoGrid />

            {/* Bet Controls */}
            <BetControls />

            {/* Round status */}
            <div className="text-center">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  roundStatus === "betting"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : roundStatus === "drawing"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                    : roundStatus === "completed"
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    roundStatus === "betting"
                      ? "bg-emerald-400"
                      : roundStatus === "drawing"
                      ? "bg-amber-400"
                      : roundStatus === "completed"
                      ? "bg-blue-400"
                      : "bg-gray-400"
                  }`}
                />
                {roundStatus === "betting"
                  ? "Accepting bets"
                  : roundStatus === "drawing"
                  ? "Drawing numbers..."
                  : roundStatus === "completed"
                  ? "Round complete"
                  : "Waiting for round..."}
              </span>
            </div>
          </div>

          {/* Right sidebar — Live Chat */}
          <div className="col-span-3">
            <ChatPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1b3a4b] py-4 text-center text-xs text-gray-600">
        SyntaxKeno — Provably Fair • All draws are verifiable
      </footer>
    </div>
  );
}

