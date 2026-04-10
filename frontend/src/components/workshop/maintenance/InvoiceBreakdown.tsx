"use client";

import { FileText, CheckCircle2, Shield } from "lucide-react";
import type { PartRow } from "./types";

export interface InvoiceBreakdownProps {
  parts: PartRow[];
  partsTotal: number;
  serviceCostNum: number;
  warrantyEnabled: boolean;
  onWarrantyChange: (enabled: boolean) => void;
  grandTotal: number;
  subtotal: number;
  internalGasFee: number;
}

export default function InvoiceBreakdown({
  parts, partsTotal, serviceCostNum, warrantyEnabled, onWarrantyChange, grandTotal, subtotal, internalGasFee,
}: InvoiceBreakdownProps) {
  const namedParts = parts.filter(p => p.name);

  return (
    <div className="glass-card-static p-8 border" style={{ borderColor: "rgba(94, 234, 212,0.3)", background: "rgba(94, 234, 212,0.03)" }}>
      <h3 className="text-base font-bold mb-5 flex items-center gap-2" style={{ color: "var(--solana-purple)" }}>
        <FileText className="w-5 h-5" /> Invoice Breakdown (Auto-Computed)
      </h3>
      <div className="space-y-3">
        {namedParts.map((p, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-slate-300 flex items-center gap-2">
              {p.isOem && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
              {p.name}
              {p.isOem && <span className="text-[10px] text-teal-400 font-medium">(OEM)</span>}
            </span>
            <span className={`mono ${warrantyEnabled ? "line-through text-slate-500" : "text-slate-300"}`}>Rp {(typeof p.priceIDR === "number" ? p.priceIDR : 0).toLocaleString("id-ID")}</span>
          </div>
        ))}
        {namedParts.length > 0 && (
          <div className="border-t pt-2 mt-2" style={{ borderColor: "rgba(94, 234, 212,0.15)" }}>
            <div className="flex justify-between items-center text-sm">
              <span style={{ color: "var(--solana-text-muted)" }}>Subtotal Parts</span>
              <span className={`mono ${warrantyEnabled ? "line-through text-slate-500" : "text-slate-300"}`}>Rp {partsTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center text-sm">
          <span style={{ color: "var(--solana-text-muted)" }}>Service Cost</span>
          <span className={`mono ${warrantyEnabled ? "line-through text-slate-500" : "text-slate-300"}`}>Rp {serviceCostNum.toLocaleString("id-ID")}</span>
        </div>

        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl mt-2" style={{ background: warrantyEnabled ? "rgba(250,204,21,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${warrantyEnabled ? "rgba(250,204,21,0.3)" : "rgba(255,255,255,0.05)"}` }}>
          <input type="checkbox" checked={warrantyEnabled} onChange={e => onWarrantyChange(e.target.checked)} className="mt-1 accent-yellow-500 w-4 h-4" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="w-4 h-4" style={{ color: "#FCD34D" }} /> Cover this service under OEM warranty
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--solana-text-muted)" }}>
              Parts &amp; service cost become free for the customer. Enterprise will reimburse the workshop after review.
            </p>
          </div>
        </label>

        <div className="mt-4 p-4 rounded-xl flex justify-between items-center" style={{ background: warrantyEnabled ? "rgba(34,197,94,0.1)" : "rgba(94, 234, 212,0.1)", border: `1px solid ${warrantyEnabled ? "rgba(34,197,94,0.3)" : "rgba(94, 234, 212,0.3)"}` }}>
          <span className="font-bold text-white text-base">{warrantyEnabled ? "TOTAL TO CUSTOMER" : "TOTAL INVOICE"}</span>
          <span className="text-2xl font-bold gradient-text">{warrantyEnabled ? "Rp 0 (Warranty)" : `Rp ${grandTotal.toLocaleString("id-ID")}`}</span>
        </div>
        {warrantyEnabled && (
          <p className="text-[11px] pt-1" style={{ color: "#FCD34D" }}>
            Workshop reimbursement requested: Rp {subtotal.toLocaleString("id-ID")} (pending enterprise approval).
          </p>
        )}
        <p className="text-[11px] italic pt-2" style={{ color: "var(--solana-text-muted)" }}>
          Internal: est. anchoring gas ~Rp {internalGasFee.toLocaleString("id-ID")} (absorbed by workshop, not billed to customer).
        </p>
      </div>
    </div>
  );
}
