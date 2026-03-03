"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useGameStore } from "@/stores/game.store";
import { useAuthStore } from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

/**
 * Socket.io hook for real-time game events.
 * Connects on mount, handles reconnection, and dispatches events to Zustand store.
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  const {
    setCurrentRoundId,
    setRoundStatus,
    setCountdown,
    setDrawnNumbers,
    resetForNewRound,
  } = useGameStore();

  const { updateBalance } = useAuthStore();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("🔌 Socket connected");
    });

    // New round started — reset UI and accept bets
    socket.on("round:new", (data: { roundId: string; hash: string }) => {
      resetForNewRound();
      setCurrentRoundId(data.roundId);
      setRoundStatus("betting");
    });

    // Countdown tick
    socket.on("round:countdown", (data: { seconds: number }) => {
      setCountdown(data.seconds);
    });

    // Betting closed
    socket.on("round:bettingClosed", () => {
      setRoundStatus("drawing");
    });

    // Round result
    socket.on(
      "round:result",
      (data: {
        roundId: string;
        drawnNumbers: number[];
        serverSeed: string;
        hash: string;
      }) => {
        setDrawnNumbers(data.drawnNumbers);
        setRoundStatus("completed");

        // Refresh profile (balance) and bet history
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["betHistory"] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      }
    );

    // Balance update
    socket.on("balance:update", (data: { balance: number }) => {
      updateBalance(data.balance);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    socketRef.current = socket;
  }, [
    setCurrentRoundId,
    setRoundStatus,
    setCountdown,
    setDrawnNumbers,
    resetForNewRound,
    updateBalance,
    queryClient,
  ]);

  useEffect(() => {
    connect();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect]);

  return socketRef;
}
