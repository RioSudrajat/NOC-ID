"use client";

import { Wallet } from "lucide-react";

type PortalVariant = "dapp" | "workshop" | "enterprise" | "admin";

const accentMap: Record<PortalVariant, { dot: string; border?: string }> = {
  dapp: { dot: "var(--solana-green)" },
  workshop: { dot: "var(--solana-purple)", border: "var(--solana-purple)" },
  enterprise: { dot: "var(--solana-purple)" },
  admin: { dot: "#F97316", border: "rgba(249,115,22,0.5)" },
};

export function ConnectWalletButton({ variant = "dapp" }: { variant?: PortalVariant }) {
  const accent = accentMap[variant];

  return (
    <button
      className="glow-btn-outline px-4 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors"
      style={accent.border ? { borderColor: accent.border } : undefined}
    >
      <Wallet className="w-4 h-4" />
      <span className="w-2 h-2 rounded-full" style={{ background: accent.dot }} />
      Connect Wallet
    </button>
  );
}
