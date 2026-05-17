"use client";

import { useEffect, useState } from "react";
import { LogOut, User, Wallet, KeyRound, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useWalletConnection } from "@solana/react-hooks";

type PortalVariant = "dapp" | "workshop" | "enterprise" | "admin";

const accentMap: Record<PortalVariant, { dot: string; border?: string }> = {
  dapp: { dot: "var(--solana-green)" },
  workshop: { dot: "var(--solana-purple)", border: "var(--solana-purple)" },
  enterprise: { dot: "var(--solana-purple)" },
  admin: { dot: "#5EEAD4", border: "rgba(94, 234, 212,0.5)" },
};

export function UserAccountButton({ variant = "dapp" }: { variant?: PortalVariant }) {
  const router = useRouter();
  const accent = accentMap[variant];
  const hydrate = useUserStore((state) => state.hydrate);
  const currentUser = useUserStore((state) => state.currentUser);
  const session = useUserStore((state) => state.session);
  const logout = useUserStore((state) => state.logout);
  const generateEmbeddedWallet = useUserStore((state) => state.generateEmbeddedWallet);
  const { connected, disconnect, wallet } = useWalletConnection();
  const [open, setOpen] = useState(false);

  // Helper to truncate wallet address
  const truncateAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isExternalWalletLive =
    currentUser?.walletState === "self_custody" &&
    connected &&
    wallet?.account?.address?.toString() === currentUser.selfCustodyAddress;

  if (!session || !currentUser) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="glow-btn-outline px-4 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors"
        style={accent.border ? { borderColor: accent.border } : undefined}
      >
        <Wallet className="w-4 h-4" />
        <span className="w-2 h-2 rounded-full" style={{ background: accent.dot }} />
        Login
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="glow-btn-outline px-4 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors"
        style={accent.border ? { borderColor: accent.border } : undefined}
      >
        <span className="w-7 h-7 rounded-full grid place-items-center bg-white/10">
          <User className="w-4 h-4" />
        </span>
        <span>{currentUser.displayName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-white/10 bg-slate-900 p-2 shadow-2xl">
            <div className="px-3 py-2 border-b border-white/10 mb-1">
              <p className="text-sm font-semibold">{currentUser.displayName}</p>
              <p className="text-xs text-slate-400">{currentUser.email ?? currentUser.phone ?? currentUser.role}</p>
              
              {/* Wallet Status Display */}
              {currentUser.walletState === "self_custody" && currentUser.selfCustodyAddress && (
                <div className={`mt-2 flex items-center gap-2 p-2 rounded-md border ${
                  isExternalWalletLive
                    ? "bg-teal-500/10 border-teal-500/20"
                    : "bg-yellow-500/10 border-yellow-500/20"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isExternalWalletLive ? "bg-teal-400 animate-pulse" : "bg-yellow-400"}`}></div>
                  <p className={`text-xs font-mono ${isExternalWalletLive ? "text-teal-400" : "text-yellow-300"}`}>
                    {truncateAddress(currentUser.selfCustodyAddress)}
                    {!isExternalWalletLive ? " (reconnect required)" : ""}
                  </p>
                </div>
              )}
              {currentUser.walletState === "embedded" && currentUser.embeddedWalletAddress && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-purple-500/10 border border-purple-500/20">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <p className="text-xs font-mono text-purple-400">
                    {truncateAddress(currentUser.embeddedWalletAddress)} (Embedded)
                  </p>
                </div>
              )}
            </div>
            <button className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-white/5 flex items-center gap-2">
              <User className="w-4 h-4" /> Profile
            </button>
            <button className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-white/5 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Vehicles
            </button>
            {currentUser.walletState === "embedded" && (
              <button
                onClick={() => {
                  if (!currentUser.embeddedWalletAddress) generateEmbeddedWallet();
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-white/5 flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Advanced: Export Wallet
              </button>
            )}
            <button className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-white/5 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Connect External Wallet
            </button>
            <button
              onClick={async () => {
                if (currentUser.walletState === "self_custody") {
                  try {
                    await disconnect();
                  } catch (err) {
                    console.error("Disconnect error", err);
                  }
                }
                // Force clear any cached wallet auto-connect state from Solana adapter
                try {
                  localStorage.removeItem("walletName");
                  localStorage.removeItem("solana:last-connector");
                } catch (e) {}
                logout();
                setOpen(false);
                router.push("/login");
              }}
              className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-white/5 flex items-center gap-2 text-red-300"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export const ConnectWalletButton = UserAccountButton;
