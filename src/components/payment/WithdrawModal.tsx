"use client";

import { useState, useEffect } from "react";
import { useBanks, useRequestWithdraw } from "@/hooks/use-payment";
import { useAuthStore } from "@/stores/auth.store";
import { ChapaBank } from "@/modules/payment/types";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { user } = useAuthStore();
  const { data: banks, isLoading: banksLoading } = useBanks();
  const withdrawMutation = useRequestWithdraw();

  const [amount, setAmount] = useState<number>(0);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Set default bank when loaded
  useEffect(() => {
    if (banks && banks.length > 0 && !bankCode) {
      setBankCode(banks[0].code);
    }
  }, [banks, bankCode]);

  if (!isOpen) return null;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!user) {
      setError("You must be logged in to withdraw");
      return;
    }

    if (amount < 1) {
      setError("Minimum withdrawal is 1 ETB");
      return;
    }

    if (amount > Number(user.balance)) {
      setError("Insufficient balance");
      return;
    }

    if (!bankCode || !accountNumber || !accountName) {
      setError("Please fill in all bank details");
      return;
    }

    const selectedBank = banks?.find((b: ChapaBank) => b.code === bankCode);

    try {
      await withdrawMutation.mutateAsync({
        amount,
        bankName: selectedBank?.name || "Unknown Bank",
        accountNumber,
        accountName,
        bankCode,
      });
      setSuccess(true);
      // Reset form after successful request
      setAmount(0);
      setAccountNumber("");
      setAccountName("");
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to process withdrawal");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-[#0d1b2a] border border-[#1b3a4b] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-sm">
              💸
            </span>
            Withdraw Funds
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1a2332] border border-[#2a3a4d] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✓
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Request Successful</h3>
            <p className="text-gray-400 text-sm">
              Your withdrawal request has been received and is being processed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* Balance Info */}
            <div className="bg-[#1a2332]/50 rounded-xl p-3 border border-[#2a3a4d] flex justify-between items-center">
              <span className="text-xs text-gray-400">Available Balance</span>
              <span className="text-emerald-400 font-bold">
                {Number(user?.balance || 0).toLocaleString()} ETB
              </span>
            </div>

            {/* Bank Select */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Bank
              </label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                disabled={banksLoading}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1a2332] border border-[#2a3a4d] text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              >
                {banksLoading ? (
                  <option>Loading banks...</option>
                ) : (
                  banks?.map((bank: ChapaBank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#1a2332] border border-[#2a3a4d] text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Account Name (Full Name)
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter account holder name"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#1a2332] border border-[#2a3a4d] text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Amount (ETB)
              </label>
              <input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                placeholder="0.00"
                required
                min={1}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1a2332] border border-[#2a3a4d] text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={withdrawMutation.isPending || amount < 1}
              className="w-full py-3.5 rounded-xl text-base font-bold bg-gradient-to-r from-amber-500 to-amber-600
                text-white hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20
                disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {withdrawMutation.isPending ? "Processing..." : `Withdraw ${amount.toLocaleString()} ETB`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
