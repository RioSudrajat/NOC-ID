"use client";

import { motion } from "framer-motion";
import { Plus, Trash2, Package, Shield, Sparkles } from "lucide-react";
import {
  ENTERPRISE_NAME,
  ENTERPRISE_MODEL_LABELS,
  EnterpriseModelKey,
  PART_CATEGORIES,
  PartCategory,
  CATEGORY_COLORS,
} from "@/app/enterprise/_shared";

export interface PartCatalogEntry {
  name: string;
  partNumber: string;
  category: PartCategory;
  models: EnterpriseModelKey[];
  batchQty: string;
  priceIDR: string;
}

export interface PartCatalogFormProps {
  partEntries: PartCatalogEntry[];
  onUpdatePart: (i: number, patch: Partial<PartCatalogEntry>) => void;
  onTogglePartModel: (i: number, key: EnterpriseModelKey) => void;
  onAddPartEntry: () => void;
  onRemovePartEntry: (i: number) => void;
  onSimulatePartCatalog: () => void;
}

export default function PartCatalogForm({
  partEntries,
  onUpdatePart,
  onTogglePartModel,
  onAddPartEntry,
  onRemovePartEntry,
  onSimulatePartCatalog,
}: PartCatalogFormProps) {
  const modelKeys = Object.keys(ENTERPRISE_MODEL_LABELS) as EnterpriseModelKey[];

  return (
    <motion.div
      key="parts"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-4 mb-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
          Manufacturer otomatis ter-set ke enterprise yang sedang login.
        </p>
        <button
          onClick={onSimulatePartCatalog}
          className="glow-btn-outline gap-2 text-xs px-3 py-1.5"
          style={{ borderColor: "rgba(250,204,21,0.4)", color: "#FCD34D" }}
        >
          <Sparkles className="w-3.5 h-3.5" /> Simulate Mock Data
        </button>
      </div>

      {partEntries.map((entry, i) => (
        <div
          key={i}
          className="glass-card-static p-6 rounded-2xl"
          style={{ borderLeft: "3px solid var(--solana-cyan, #2DD4BF)" }}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Package className="w-4 h-4" style={{ color: "var(--solana-cyan, #2DD4BF)" }} />
              Part Catalog #{i + 1}
            </span>
            {partEntries.length > 1 && (
              <button
                onClick={() => onRemovePartEntry(i)}
                className="p-2 rounded-lg hover:bg-red-500/20"
                style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5" }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>
                Part Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Front Brake Pad Set"
                value={entry.name}
                onChange={e => onUpdatePart(i, { name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>
                Part Number / SKU
              </label>
              <input
                type="text"
                className="input-field mono"
                placeholder="e.g. 04465-BZ010"
                value={entry.partNumber}
                onChange={e => onUpdatePart(i, { partNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>
                Manufacturer
              </label>
              <div
                className="input-field flex items-center gap-2 cursor-not-allowed"
                style={{ opacity: 0.85, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                <Shield className="w-3.5 h-3.5" style={{ color: "#86EFAC" }} />
                <span className="text-sm font-semibold">{ENTERPRISE_NAME}</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#86EFAC" }}>
                  AUTO
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>
                Category
              </label>
              <select
                className="input-field"
                value={entry.category}
                style={{ color: CATEGORY_COLORS[entry.category] }}
                onChange={e => onUpdatePart(i, { category: e.target.value as PartCategory })}
              >
                {PART_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>
                Compatible Models
              </label>
              <div className="flex flex-wrap gap-2">
                {modelKeys.map(k => {
                  const active = entry.models.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => onTogglePartModel(i, k)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: active ? "rgba(94, 234, 212,0.18)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? "rgba(94, 234, 212,0.5)" : "rgba(255,255,255,0.08)"}`,
                        color: active ? "var(--solana-cyan, #2DD4BF)" : "var(--solana-text-muted)",
                      }}
                    >
                      {active && "✓ "}{ENTERPRISE_MODEL_LABELS[k]}
                    </button>
                  );
                })}
              </div>
              {entry.models.length === 0 && (
                <p className="text-[11px] mt-2" style={{ color: "var(--solana-text-muted)" }}>
                  Pilih satu atau lebih model yang kompatibel dengan part ini.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>
                Batch Quantity
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 500"
                value={entry.batchQty}
                onChange={e => onUpdatePart(i, { batchQty: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>
                Unit Price MSRP (Rp)
              </label>
              <input
                type="number"
                className="input-field mono"
                placeholder="e.g. 450000"
                value={entry.priceIDR}
                onChange={e => onUpdatePart(i, { priceIDR: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={onAddPartEntry}
        className="glow-btn-outline gap-2 border-dashed py-4"
        style={{ border: "2px dashed rgba(94, 234, 212,0.3)", color: "var(--solana-cyan, #2DD4BF)" }}
      >
        <Plus className="w-5 h-5" /> Add Another Part Catalog
      </button>
    </motion.div>
  );
}
