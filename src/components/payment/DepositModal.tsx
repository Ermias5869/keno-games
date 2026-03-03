"use client";

import { useState } from "react";
import { useInitializeDeposit } from "@/hooks/use-payment";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Deposit modal — enter amount and redirect to Chapa checkout.
 */
export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState<number>(100);
  const [error, setError] = useState("");
  const depositMutation = useInitializeDeposit();

  if (!isOpen) return null;

  const quickAmounts = [50, 100, 200, 500, 1000, 5000];

  const handleDeposit = async () => {
    setError("");

    if (amount < 10) {
      setError("Minimum deposit is 10 ETB");
      return;
    }

    try {
      const data = await depositMutation.mutateAsync({ amount });

      // Redirect to Chapa checkout page
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError((err as Error).message || "Failed to initialize payment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#0d1b2a] border border-[#1b3a4b] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-sm">
              💰
            </span>
            Deposit Funds
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1a2332] border border-[#2a3a4d] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quick amount buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {quickAmounts.map((qa) => (
            <button
              key={qa}
              onClick={() => setAmount(qa)}
              className={`py-2 rounded-lg text-sm font-medium transition-all border ${
                amount === qa
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-[#1a2332] text-gray-400 border-[#2a3a4d] hover:text-gray-300 hover:border-gray-500"
              }`}
            >
              {qa.toLocaleString()} ETB
            </button>
          ))}
        </div>

        {/* Custom amount input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Amount (ETB)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0) setAmount(val);
            }}
            placeholder="Enter amount"
            min={10}
            max={100000}
            className="w-full px-4 py-3 rounded-xl bg-[#1a2332] border border-[#2a3a4d] text-white text-lg font-bold
              placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
              transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <p className="text-xs text-gray-600 mt-1">
            Min: 10 ETB • Max: 100,000 ETB
          </p>
        </div>

        {/* Payment method info */}
        <div className="bg-[#1a2332]/50 rounded-xl p-3 border border-[#2a3a4d] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4CAF50]/20 flex items-center justify-center">
              <span className="text-lg font-bold text-[#4CAF50]">C</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Chapa</p>
              <p className="text-xs text-gray-500">
                Telebirr, CBE, Awash Bank & more
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Deposit button */}
        <button
          onClick={handleDeposit}
          disabled={depositMutation.isPending || amount < 10}
          className="w-full py-3.5 rounded-xl text-base font-bold bg-gradient-to-r from-emerald-500 to-emerald-600
            text-white hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/20
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {depositMutation.isPending
            ? "Processing..."
            : `Deposit ${amount.toLocaleString()} ETB`}
        </button>

        <p className="text-center text-xs text-gray-600 mt-3">
          You will be redirected to Chapa to complete payment
        </p>
      </div>
    </div>
  );
}
