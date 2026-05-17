"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowRight, ShieldCheck, Factory } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { getErrorMessage, isUserRejectedWalletError } from "@/lib/walletErrors";
import { verifyWalletLogin } from "@/lib/walletAuth";
import { useWalletConnection } from "@solana/react-hooks";

export default function EnterpriseLoginPage() {
  const router = useRouter();
  const { connectors, connect, isReady, connecting } = useWalletConnection();
  const loginWithWallet = useUserStore((state) => state.loginWithWallet);
  const [error, setError] = useState("");

  const handleWalletSelect = async (connectorId: string) => {
    try {
      setError("");
      const session = await connect(connectorId);
      if (session?.account?.address) {
        const verified = await verifyWalletLogin(session, "enterprise_admin");
        loginWithWallet(verified.address, "enterprise_admin", verified);
        router.push("/enterprise");
      }
    } catch (err: unknown) {
      if (isUserRejectedWalletError(err)) {
        setError("Koneksi dibatalkan oleh pengguna.");
      } else {
        console.error("Wallet connection failed", err);
        setError(getErrorMessage(err) || "Gagal menghubungkan institusi");
      }
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 mb-6 border border-blue-500/20">
            <Factory className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold mb-3">Enterprise Portal</h1>
          <p className="text-zinc-400">Masuk sebagai Pabrikan (ATPM) menggunakan Web3 Wallet Institutional Anda.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle gradient effect */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

          <div className="space-y-4">
            {!isReady ? (
              <div className="animate-pulse flex flex-col gap-3">
                <div className="h-16 bg-zinc-800/50 rounded-xl w-full"></div>
                <div className="h-16 bg-zinc-800/50 rounded-xl w-full"></div>
              </div>
            ) : connectors.length === 0 ? (
              <div className="text-center p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                <Wallet className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No Solana wallets found. Please install Phantom or Solflare.</p>
              </div>
            ) : (
              connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleWalletSelect(connector.id)}
                  disabled={connecting}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-blue-500/50 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-zinc-900 p-2 rounded-lg group-hover:scale-110 transition-transform">
                      {connector.icon ? (
                        <img src={connector.icon} alt={connector.name} className="w-5 h-5 rounded-md" />
                      ) : (
                        <Wallet className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-zinc-100">{connector.name}</p>
                      <p className="text-xs text-zinc-400">Connect to continue</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-5 h-5 text-zinc-500 group-hover:text-blue-400 transition-colors`} />
                </button>
              ))
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center font-mono">
                {error}
              </div>
            )}

            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
              <p className="text-xs text-teal-200/70 leading-relaxed">
                Akses Enterprise dilindungi enkripsi end-to-end. Wallet Anda akan digunakan untuk proses minting NFT kendaraan baru dan penandatanganan dokumen OEM.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
            <p className="text-sm text-zinc-400">
              Belum terdaftar sebagai mitra ATPM?{" "}
              <Link href="/enterprise/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Hubungi Kami
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
