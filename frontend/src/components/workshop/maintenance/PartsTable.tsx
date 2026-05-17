"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, ScanLine, CheckCircle2, Search, X } from "lucide-react";
import type { PartRow } from "./types";
import type { ServiceAction, VehicleServiceComponent } from "@/data/vehicleServiceComponents";

export interface PartsTableProps {
  parts: PartRow[];
  scanningIndex: number | null;
  onAddPart: () => void;
  onRemovePart: (i: number) => void;
  onUpdatePart: (i: number, field: keyof PartRow, value: PartRow[keyof PartRow]) => void;
  onOpenScanModal: () => void;
  componentOptions: VehicleServiceComponent[];
}

export default function PartsTable({
  parts, scanningIndex, onAddPart, onRemovePart, onUpdatePart, onOpenScanModal, componentOptions,
}: PartsTableProps) {
  const [pickerRow, setPickerRow] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const filteredComponents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return componentOptions;
    return componentOptions.filter((component) =>
      `${component.zone} ${component.name} ${component.id} ${component.oemPartNumber ?? ""}`.toLowerCase().includes(normalized),
    );
  }, [componentOptions, query]);

  const applyComponent = (rowIndex: number, component: VehicleServiceComponent) => {
    onUpdatePart(rowIndex, "componentId", component.id);
    onUpdatePart(rowIndex, "componentName", component.name);
    onUpdatePart(rowIndex, "componentZone", component.zone);
    onUpdatePart(rowIndex, "serviceAction", component.recommendedAction ?? "service");
    onUpdatePart(rowIndex, "name", component.name);
    onUpdatePart(rowIndex, "partNumber", component.oemPartNumber ?? "");
    onUpdatePart(rowIndex, "manufacturer", component.manufacturer);
    onUpdatePart(rowIndex, "priceIDR", 0);
    onUpdatePart(rowIndex, "isOem", true);
    onUpdatePart(rowIndex, "oemLocked", true);
    setPickerRow(null);
    setQuery("");
  };

  const updateAction = (rowIndex: number, action: ServiceAction) => {
    onUpdatePart(rowIndex, "serviceAction", action);
  };

  return (
    <div className="glass-card-static p-8">
      <div className="flex justify-between items-center mb-6">
        <label className="text-base font-semibold">Serviced Components</label>
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
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: "var(--solana-text-muted)" }}>Vehicle Component</label>
                <button type="button" onClick={() => setPickerRow(i)} className="input-field text-left text-sm">
                  {part.componentId ? `${part.componentZone} - ${part.componentName}` : "Select component from this vehicle"}
                </button>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: "var(--solana-text-muted)" }}>Service Action</label>
                <select className="input-field text-sm" value={part.serviceAction} onChange={e => updateAction(i, e.target.value as ServiceAction)}>
                  <option value="inspect">Inspect only</option>
                  <option value="service">Service / clean / adjust</option>
                  <option value="repair">Repair existing component</option>
                  <option value="replace">Replace component</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: "var(--solana-text-muted)" }}>Replacement Part Name</label>
                <input type="text" className="input-field text-sm" placeholder="e.g. Drive Belt / CVT cleaning" value={part.name} onChange={e => onUpdatePart(i, "name", e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: "var(--solana-text-muted)" }}>OEM Part #</label>
                <input type="text" readOnly className="input-field text-sm mono opacity-70" placeholder="Auto from selected component" value={part.partNumber} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: "var(--solana-text-muted)" }}>Manufacturer</label>
                <input type="text" readOnly className="input-field text-sm opacity-70" placeholder="Auto from selected component" value={part.manufacturer} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: "var(--solana-text-muted)" }}>Price (Rp)</label>
                <input type="number" className="input-field text-sm mono" placeholder="e.g. 450000" value={part.priceIDR} onChange={e => onUpdatePart(i, "priceIDR", e.target.value ? Number(e.target.value) : "")} />
              </div>
              <div className="flex items-end gap-3">
                {part.oemLocked ? (
                  <div className="shrink-0 rounded-xl px-3 py-3 text-xs" style={{ background: part.isOem ? "rgba(94, 234, 212,0.08)" : "rgba(20,20,40,0.3)", color: part.isOem ? "var(--solana-green)" : "var(--solana-text-muted)" }}>
                    {part.isOem ? "OEM Verified" : "Non-OEM"}
                  </div>
                ) : (
                  <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-3 text-xs" style={{ background: part.isOem ? "rgba(94, 234, 212,0.08)" : "rgba(20,20,40,0.3)", color: part.isOem ? "var(--solana-green)" : "var(--solana-text-muted)" }}>
                    <input type="checkbox" checked={part.isOem} onChange={(event) => onUpdatePart(i, "isOem", event.target.checked)} className="accent-teal-500" />
                    OEM
                  </label>
                )}
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
      {pickerRow !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="glass-card-static flex max-h-[82dvh] w-full max-w-2xl flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">Select Vehicle Component</h3>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{componentOptions.length} components available for this vehicle/filter</p>
              </div>
              <button type="button" onClick={() => setPickerRow(null)} className="rounded-xl p-2 transition-colors hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-white/10 p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--solana-text-muted)" }} />
                <input
                  autoFocus
                  className="input-field pl-10"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search component, zone, part code..."
                />
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto p-3">
              {filteredComponents.map((component) => (
                <button
                  key={component.id}
                  type="button"
                  onClick={() => applyComponent(pickerRow, component)}
                  className="mb-2 w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-teal-300/35 hover:bg-teal-300/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{component.name}</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--solana-text-muted)" }}>{component.id}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-teal-300/25 px-2.5 py-1 text-[10px] font-bold text-teal-200">{component.zone}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3" style={{ color: "var(--solana-text-muted)" }}>
                    <span>OEM: {component.oemPartNumber ?? "-"}</span>
                    <span>{component.manufacturer}</span>
                    <span>Rp {component.estimatedPriceIDR.toLocaleString("id-ID")}</span>
                  </div>
                </button>
              ))}
              {filteredComponents.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: "var(--solana-text-muted)" }}>No matching component.</div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
