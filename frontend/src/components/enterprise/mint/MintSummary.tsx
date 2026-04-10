"use client";

import { Cpu, Loader2 } from "lucide-react";

export interface MintSummaryProps {
  activeTab: "vehicle" | "parts";
  totalCount: number;
  minting: boolean;
  onMint: () => void;
}

export default function MintSummary({ activeTab, totalCount, minting, onMint }: MintSummaryProps) {
  return (
    <>
      <div className="glass-card-static p-6 mb-6 rounded-2xl">
        <h3 className="text-sm font-semibold mb-4">Minting Summary</h3>
        <div className="flex justify-between items-center">
          <span style={{ color: "var(--solana-text-muted)" }}>
            Total {activeTab === "parts" ? "Parts" : "Vehicles"}:
          </span>
          <span className="text-xl font-bold">{totalCount}</span>
        </div>
        <div className="flex justify-between items-center mt-3">
          <span style={{ color: "var(--solana-text-muted)" }}>Estimated Compute Cost:</span>
          <span className="text-xl font-bold gradient-text">~${(totalCount * 0.005).toFixed(3)}</span>
        </div>
        <div className="flex justify-between items-center mt-3">
          <span style={{ color: "var(--solana-text-muted)" }}>Technology:</span>
          <span
            className="text-xs px-2 py-1 rounded-md font-medium"
            style={{ background: "rgba(94, 234, 212,0.15)", color: "var(--solana-purple)", border: "1px solid rgba(94, 234, 212,0.3)" }}
          >
            cNFT (Bubblegum)
          </span>
        </div>
      </div>

      <button
        onClick={onMint}
        disabled={minting}
        className="glow-btn w-full text-base font-bold gap-3 rounded-2xl disabled:opacity-50 transition-all hover:scale-[1.02] cursor-pointer"
        style={{ padding: "16px 32px" }}
      >
        {minting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {activeTab === "parts" ? "Minting Part NFTs on Solana..." : "Anchoring to Solana Merkle Tree..."}
          </>
        ) : (
          <>
            <Cpu className="w-5 h-5" />
            {activeTab === "parts" ? "Mint Part Catalog" : "Execute Mint Protocol"}
          </>
        )}
      </button>
    </>
  );
}
