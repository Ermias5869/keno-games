"use client";

import { useState } from "react";
import GameTab from "./tabs/GameTab";
import HistoryTab from "./tabs/HistoryTab";
import ResultsTab from "./tabs/ResultsTab";
import LeadersTab from "./tabs/LeadersTab";
import { useAuthStore } from "@/stores/auth.store";

type TabKey = "game" | "history" | "results" | "leaders";

const tabs: { key: TabKey; label: string; icon: string; authOnly?: boolean }[] = [
  { key: "game", label: "GAME", icon: "▶" },
  { key: "history", label: "HISTORY", icon: "⏱", authOnly: true },
  { key: "results", label: "RESULTS", icon: "✓" },
  { key: "leaders", label: "LEADERS", icon: "👑" },
];

/**
 * GameSidePanel — left side tabbed panel with 4 views:
 * GAME (live bets), HISTORY (user bets), RESULTS (past rounds), LEADERS (top winners)
 */
export default function GameSidePanel() {
  const [activeTab, setActiveTab] = useState<TabKey>("game");
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="bg-[#0d1b2a]/60 rounded-xl border border-[#1b3a4b] flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[#1b3a4b] bg-[#0a1628]/50">
        {tabs.map((tab) => {
          // Hide auth-only tabs when not logged in
          if (tab.authOnly && !isAuthenticated) return null;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === tab.key
                  ? "text-emerald-400 border-emerald-400 bg-emerald-500/5"
                  : "text-gray-500 border-transparent hover:text-gray-400 hover:bg-[#1a2332]/30"
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === "game" && <GameTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "results" && <ResultsTab />}
        {activeTab === "leaders" && <LeadersTab />}
      </div>
    </div>
  );
}
