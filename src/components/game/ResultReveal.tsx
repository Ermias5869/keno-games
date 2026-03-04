"use client";

import { useGameStore } from "@/stores/game.store";
import { useEffect, useState } from "react";

/**
 * Result reveal animation — sequentially reveals drawn numbers with animation.
 */
export default function ResultReveal() {
  const { drawnNumbers, selectedNumbers, lastSelectedNumbers, roundStatus } = useGameStore();
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentHero, setCurrentHero] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Use lastSelectedNumbers when round is completed (selectedNumbers may be cleared)
  const displaySelected = roundStatus === "completed"
    ? (lastSelectedNumbers.length > 0 ? lastSelectedNumbers : selectedNumbers)
    : selectedNumbers;

  // Animate number reveal when round completes
  useEffect(() => {
    if (roundStatus === "completed" && drawnNumbers.length > 0) {
      setRevealedCount(0);
      setIsAnimating(true);
      
      let index = 0;
      const revealNext = () => {
        if (index < drawnNumbers.length) {
          const num = drawnNumbers[index];
          setCurrentHero(num);
          
          // Sound effect would go here if available
          
          // Wait for hero to show, then add to results list
          setTimeout(() => {
            setRevealedCount(prev => prev + 1);
            
            // Short delay before showing next hero
            setTimeout(() => {
              index++;
              if (index < drawnNumbers.length) {
                revealNext();
              } else {
                setCurrentHero(null);
                setIsAnimating(false);
              }
            }, 200);
          }, 500);
        }
      };

      revealNext();
    } else {
      setRevealedCount(0);
      setCurrentHero(null);
      setIsAnimating(false);
    }
  }, [roundStatus, drawnNumbers]);

  if (drawnNumbers.length === 0 && !isAnimating) return null;

  const revealedNumbers = drawnNumbers.slice(0, revealedCount);
  const matches = displaySelected.filter((n) => drawnNumbers.includes(n));

  return (
    <>
      {/* Hero Number Overlay */}
      {currentHero !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse" />
            
            {/* Main Circle */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-[#1a2332] to-[#0a1220] border-4 border-emerald-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-[drawAppear_0.5s_ease-out_forwards]">
              {/* Internal Scanline Effect */}
              <div className="absolute inset-0 rounded-full overflow-hidden opacity-20">
                <div className="w-full h-1 bg-emerald-400 absolute animate-[scanLine_2s_linear_infinite]" />
              </div>
              
              <span className="text-8xl md:text-9xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                {currentHero}
              </span>
              
              {/* Outer Rings */}
              <div className="absolute inset-[-10px] rounded-full border border-emerald-500/20 animate-spin-slow" />
              <div className="absolute inset-[-20px] rounded-full border border-emerald-500/10 animate-reverse-spin-slow" />
            </div>
            
            {/* Status Label */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-emerald-400 font-bold tracking-[0.2em] uppercase text-sm bg-[#0a1220]/80 px-4 py-1 rounded-full border border-emerald-500/30">
              Drawing Result
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0d1b2a]/80 rounded-xl p-4 border border-[#1b3a4b] relative overflow-hidden">
        {/* Subtle grid background for the reveal area */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#2a3a4d_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Drawn Numbers
          </h3>
          <span className="text-emerald-400 font-bold text-sm">
            {matches.length} / {drawnNumbers.length}{" "}
            <span className="text-gray-500 font-normal">matched</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center relative z-10 min-h-[40px]">
          {revealedNumbers.map((num, idx) => {
            const isMatch = displaySelected.includes(num);
            return (
              <span
                key={`${num}-${idx}`}
                className={`
                  w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center
                  transition-all duration-500 animate-[popIn_0.4s_ease-out]
                  ${
                    isMatch
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/40 scale-110 z-10"
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
                className="w-8 h-8 rounded-md bg-[#0a1220] border border-[#1b3a4b] flex items-center justify-center animate-pulse opacity-40"
              >
                <span className="text-gray-600 text-xs text-opacity-30">?</span>
              </span>
            )
          )}
        </div>
      </div>
    </>
  );
}
