"use client";

import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, ScanLine, CheckCircle2 } from "lucide-react";
import type { PartRow } from "./types";

export interface PartsTableProps {
  parts: PartRow[];
  scanningIndex: number | null;
  onAddPart: () => void;
  onRemovePart: (i: number) => void;
  onUpdatePart: (i: number, field: keyof PartRow, value: any) => void;
  onOpenScanModal: () => void;
}

export default function PartsTable({
  parts, scanningIndex, onAddPart, onRemovePart, onUpdatePart, onOpenScanModal,
}: PartsTableProps) {
  return (
    <div className="glass-card-static p-8">
      <div className="flex justify-between items-center mb-6">
        <label className="text-base font-semibold">Parts Replaced</label>
        <div className="flex gap-2">
          <button onClick={onOpenScanModal} disabled={scanningIndex !== null} className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-semibold cursor-pointer disabled:opacity-50" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-cyan)", border: "1px solid rgba(94, 234, 212,0.3)" }}>
            {scanningIndex !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            {scanningIndex !== null ? "Scanning..." : "Scan Part"}
          </button>
          <button onClick={onAddPart} className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors cursor-pointer text-sm" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-purple)", border: "1px solid rgba(94, 234, 212,0.2)" }}>
            <Plus className="w-4 h-4" /> Add Part
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {parts.map((part, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl relative"
            style={{
              background: part.scanned ? "rgba(94, 234, 212,0.05)" : "rgba(20,20,40,0.3)",
              border: part.scanned ? "1px solid rgba(94, 234, 212,0.2)" : "1px solid rgba(94, 234, 212,0.1)",
            }}
          >
            {part.scanned && (
              <div className="absolute top-2 right-2">
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(94, 234, 212,0.15)", color: "var(--solana-cyan)" }}>
                  <CheckCircle2 className="w-3 h-3" /> Auto-filled via Scan
                </span>
              </div>
            )}
            {scanningIndex === i && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10" style={{ background: "rgba(14,14,26,0.8)", backdropFilter: "blur(4px)" }}>
                <div className="flex items-center gap-3 text-sm" style={{ color: "var(--solana-cyan)" }}>
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying part on-chain...
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: "var(--solana-text-muted)" }}>Part Name</label>
                <input type="text" className="input-field text-sm" placeholder="e.g. Brake Pad" value={part.name} onChange={e => onUpdatePart(i, "name", e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: "var(--solana-text-muted)" }}>OEM Part #</label>
                <input type="text" className="input-field text-sm mono" placeholder="e.g. 04465-BZ010" value={part.partNumber} onChange={e => onUpdatePart(i, "partNumber", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: "var(--solana-text-muted)" }}>Manufacturer</label>
                <input type="text" className="input-field text-sm" placeholder="e.g. Toyota Motor Corp" value={part.manufacturer} onChange={e => onUpdatePart(i, "manufacturer", e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: "var(--solana-text-muted)" }}>Price (Rp)</label>
                <input type="number" className="input-field text-sm mono" placeholder="e.g. 450000" value={part.priceIDR} onChange={e => onUpdatePart(i, "priceIDR", e.target.value ? Number(e.target.value) : "")} />
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-xs cursor-pointer shrink-0 px-3 py-3 rounded-xl" style={{ background: part.isOem ? "rgba(94, 234, 212,0.08)" : "rgba(20,20,40,0.3)", color: part.isOem ? "var(--solana-green)" : "var(--solana-text-muted)" }}>
                  <input type="checkbox" checked={part.isOem} onChange={e => onUpdatePart(i, "isOem", e.target.checked)} className="accent-teal-500" /> OEM
                </label>
                {parts.length > 1 && (
                  <button onClick={() => onRemovePart(i)} className="p-3 rounded-xl transition-colors cursor-pointer" style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5" }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
