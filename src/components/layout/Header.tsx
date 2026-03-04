"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DepositModal from "@/components/payment/DepositModal";
import WithdrawModal from "@/components/payment/WithdrawModal";

/**
 * Header component — balance display, deposit button, user info, and navigation.
 */
export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <header className="bg-[#0a1628]/90 backdrop-blur-xl border-b border-[#1b3a4b] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Syntax<span className="text-emerald-400">Keno</span>
              </h1>
              <p className="text-[10px] text-gray-500 -mt-1 tracking-widest uppercase">
                Provably Fair
              </p>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Balance + Deposit / Withdraw */}
                <div className="flex items-center gap-2">
                  <div className="bg-[#1a2332] rounded-xl px-3 py-2 border border-[#2a3a4d] flex items-center gap-2">
                    <span className="text-xs text-gray-400">Balance</span>
                    <span className="text-amber-400 font-bold text-base">
                      {Number(user.balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <button
                      onClick={() => setShowDeposit(true)}
                      className="ml-1 w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 
                        flex items-center justify-center text-lg font-bold hover:bg-emerald-500/30 transition-colors"
                      title="Deposit"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => setShowWithdraw(true)}
                    className="h-10 px-4 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-all uppercase tracking-wider"
                  >
                    Withdraw
                  </button>
                </div>

                {/* User menu */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 hidden sm:block">
                    {user.phone}
                  </span>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="text-xs px-2 py-1 rounded bg-amber-600/20 text-amber-400 border border-amber-600/30 hover:bg-amber-600/30 transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-600/10 text-red-400 border border-red-600/20 hover:bg-red-600/20 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white border border-[#2a3a4d] hover:border-gray-500 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <DepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
      <WithdrawModal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} />
    </>
  );
}
