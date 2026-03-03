"use client";

import { useTransactionHistory } from "@/hooks/use-payment";

interface Transaction {
  id: string;
  txRef: string;
  amount: string;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
}

/**
 * Transaction history panel — shows recent deposits and withdrawals.
 */
export default function TransactionHistory() {
  const { data: transactions, isLoading } = useTransactionHistory();

  if (isLoading) {
    return (
      <div className="bg-[#0d1b2a]/60 rounded-xl p-4 border border-[#1b3a4b]">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-[#1a2332] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-[#0d1b2a]/60 rounded-xl p-6 border border-[#1b3a4b] text-center">
        <p className="text-gray-500 text-sm">No transactions yet</p>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    SUCCESS: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const statusIcons: Record<string, string> = {
    PENDING: "⏳",
    SUCCESS: "✅",
    FAILED: "❌",
  };

  return (
    <div className="bg-[#0d1b2a]/60 rounded-xl border border-[#1b3a4b] overflow-hidden">
      <div className="p-3 border-b border-[#1b3a4b]">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <span>💳</span> Transaction History
        </h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
        {(transactions as Transaction[]).map((tx) => (
          <div
            key={tx.id}
            className="p-3 border-b border-[#1b3a4b]/30 hover:bg-[#1a2332]/50 transition-colors"
          >
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    statusStyles[tx.status] || statusStyles.PENDING
                  }`}
                >
                  {statusIcons[tx.status]} {tx.status}
                </span>
                <span className="text-xs text-gray-500 uppercase">
                  {tx.type}
                </span>
              </div>
              <span
                className={`text-sm font-bold ${
                  tx.type === "DEPOSIT"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {tx.type === "DEPOSIT" ? "+" : "-"}
                {parseFloat(tx.amount).toLocaleString()} {tx.currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-600 font-mono truncate max-w-[200px]">
                {tx.txRef}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(tx.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
