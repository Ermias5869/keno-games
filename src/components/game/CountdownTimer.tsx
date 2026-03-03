"use client";

import { useGameStore } from "@/stores/game.store";

/**
 * Countdown timer — circular display showing seconds until round draw.
 */
export default function CountdownTimer() {
  const { countdown, roundStatus } = useGameStore();

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Calculate progress for the circle animation (60 second rounds)
  const totalDuration = 60;
  const progress = countdown / totalDuration;
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference * (1 - progress);

  const getStatusColor = () => {
    if (roundStatus === "drawing") return "text-red-400";
    if (countdown <= 10) return "text-red-400";
    if (countdown <= 20) return "text-amber-400";
    return "text-emerald-400";
  };

  const getStrokeColor = () => {
    if (roundStatus === "drawing") return "#ef4444";
    if (countdown <= 10) return "#ef4444";
    if (countdown <= 20) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#1a2332"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-mono font-bold ${getStatusColor()}`}>
            {roundStatus === "drawing" ? "🎲" : timeStr}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
            {roundStatus === "drawing"
              ? "Drawing"
              : roundStatus === "completed"
              ? "Results"
              : "Next draw"}
          </span>
        </div>
      </div>
    </div>
  );
}
