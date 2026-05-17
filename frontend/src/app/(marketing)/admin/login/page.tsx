"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight, Wallet } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { getErrorMessage, isUserRejectedWalletError } from "@/lib/walletErrors";
import { verifyWalletLogin } from "@/lib/walletAuth";
import { useWalletConnection } from "@solana/react-hooks";

export default function AdminLoginPage() {
  const router = useRouter();
  const { connectors, connect, isReady, connecting } = useWalletConnection();
  const loginWithWallet = useUserStore((state) => state.loginWithWallet);
  const [error, setError] = useState("");

  const handleWalletSelect = async (connectorId: string) => {
    try {
      setError("");
      const session = await connect(connectorId);
      if (session?.account?.address) {
        const verified = await verifyWalletLogin(session, "admin");
        loginWithWallet(verified.address, "admin", verified);
        router.push("/admin");
      }
    } catch (err: unknown) {
      if (isUserRejectedWalletError(err)) {
        setError("Koneksi dibatalkan oleh pengguna.");
      } else {
        console.error("Wallet connection failed", err);
        setError(getErrorMessage(err) || "Gagal menghubungkan wallet");
      }
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">NOC ID Core</h1>
            <p className="text-zinc-400 text-sm">Administrative Access Terminal</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 text-center">
                Select Wallet
              </label>
              
              {!isReady ? (
                <div className="animate-pulse flex flex-col gap-3">
                  <div className="h-14 bg-zinc-800/50 rounded-xl w-full"></div>
                  <div className="h-14 bg-zinc-800/50 rounded-xl w-full"></div>
                </div>
              ) : connectors.length === 0 ? (
                <div className="text-center p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                  <Wallet className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">No Solana wallets found. Please install Phantom or Solflare.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {connectors.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => handleWalletSelect(connector.id)}
                      disabled={connecting}
                      className="w-full flex items-center justify-between bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/50 p-4 rounded-xl transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        {connector.icon && (
                          <img src={connector.icon} alt={connector.name} className="w-6 h-6 rounded-md" />
                        )}
                        <span className="font-bold">{connector.name}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-red-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center font-mono">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
