"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import Header from "@/components/layout/Header";

interface User {
  id: string;
  phone: string;
  balance: string;
  role: string;
  createdAt: string;
  _count: { bets: number };
}

interface Stats {
  totalBets: number;
  totalWagered: number;
  totalPaidOut: number;
  profit: number;
  uniquePlayers: number;
}

interface Multiplier {
  id: string;
  selectedCount: number;
  matchCount: number;
  multiplier: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [multipliers, setMultipliers] = useState<Multiplier[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "stats" | "multipliers">("stats");
  const [loading, setLoading] = useState(true);
  const [editingMultiplier, setEditingMultiplier] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/");
      return;
    }
    loadData();
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes, multipliersRes] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getAdminStats(),
        apiClient.getMultipliers(),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      if (multipliersRes.ok) {
        const data = await multipliersRes.json();
        setMultipliers(data.multipliers);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
    setLoading(false);
  };

  const handleUpdateMultiplier = async (id: string) => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) return;

    try {
      const res = await apiClient.updateMultiplier(id, value);
      if (res.ok) {
        setMultipliers((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, multiplier: value.toString() } : m
          )
        );
        setEditingMultiplier(null);
      }
    } catch (err) {
      console.error("Failed to update multiplier:", err);
    }
  };

  const tabs = [
    { key: "stats" as const, label: "📊 Statistics" },
    { key: "users" as const, label: "👥 Users" },
    { key: "multipliers" as const, label: "🎯 Multipliers" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-[#1a2332] text-gray-400 border border-[#2a3a4d] hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Stats Tab */}
            {activeTab === "stats" && stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Bets" value={stats.totalBets.toLocaleString()} />
                <StatCard
                  label="Total Wagered"
                  value={stats.totalWagered.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                  prefix="$"
                />
                <StatCard
                  label="Total Paid Out"
                  value={stats.totalPaidOut.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                  prefix="$"
                />
                <StatCard
                  label="Profit"
                  value={stats.profit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                  prefix="$"
                  highlight={stats.profit > 0 ? "green" : "red"}
                />
                <StatCard label="Unique Players" value={stats.uniquePlayers.toLocaleString()} />
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="bg-[#0d1b2a]/60 rounded-xl border border-[#1b3a4b] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1b3a4b] text-gray-400 text-left">
                        <th className="p-3">Phone</th>
                        <th className="p-3">Balance</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Bets</th>
                        <th className="p-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-[#1b3a4b]/30 hover:bg-[#1a2332]/50"
                        >
                          <td className="p-3 text-white">{u.phone}</td>
                          <td className="p-3 text-amber-400">
                            {parseFloat(u.balance).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                u.role === "admin"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-gray-300">{u._count.bets}</td>
                          <td className="p-3 text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Multipliers Tab */}
            {activeTab === "multipliers" && (
              <div className="bg-[#0d1b2a]/60 rounded-xl border border-[#1b3a4b] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1b3a4b] text-gray-400 text-left">
                        <th className="p-3">Picks</th>
                        <th className="p-3">Matches</th>
                        <th className="p-3">Multiplier</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {multipliers.map((m) => (
                        <tr
                          key={m.id}
                          className="border-b border-[#1b3a4b]/30 hover:bg-[#1a2332]/50"
                        >
                          <td className="p-3 text-white">{m.selectedCount}</td>
                          <td className="p-3 text-white">{m.matchCount}</td>
                          <td className="p-3">
                            {editingMultiplier === m.id ? (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-24 px-2 py-1 rounded bg-[#1a2332] border border-emerald-500/50 text-white text-sm"
                                step="0.01"
                              />
                            ) : (
                              <span className="text-emerald-400 font-medium">
                                x{parseFloat(m.multiplier)}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {editingMultiplier === m.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateMultiplier(m.id)}
                                  className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingMultiplier(null)}
                                  className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingMultiplier(m.id);
                                  setEditValue(m.multiplier);
                                }}
                                className="px-2 py-1 rounded text-xs bg-[#1a2332] text-gray-400 hover:text-white border border-[#2a3a4d]"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  prefix = "",
  highlight,
}: {
  label: string;
  value: string;
  prefix?: string;
  highlight?: "green" | "red";
}) {
  return (
    <div className="bg-[#0d1b2a]/60 rounded-xl p-5 border border-[#1b3a4b]">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p
        className={`text-2xl font-bold ${
          highlight === "green"
            ? "text-emerald-400"
            : highlight === "red"
            ? "text-red-400"
            : "text-white"
        }`}
      >
        {prefix}
        {value}
      </p>
    </div>
  );
}
