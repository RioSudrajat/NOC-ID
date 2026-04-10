"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Car, CheckCircle2, Shield, Sparkles,
  ChevronDown, ChevronUp, FileSpreadsheet,
} from "lucide-react";
import {
  ENTERPRISE_MODEL_LABELS,
  EnterpriseModelKey,
  PART_CATEGORIES,
  PartCategory,
  CATEGORY_COLORS,
} from "@/app/enterprise/_shared";

// ─── Types ───────────────────────────────────────────────────────────────
export interface ManifestPart {
  id: string;
  name: string;
  partNumber: string;
  category: PartCategory;
}

export interface VehicleEntry {
  vin: string;
  modelKey: EnterpriseModelKey | "";
  year: string;
  color: string;
  manifest: ManifestPart[];
  manifestOpen: boolean;
}

export interface VehicleFormProps {
  vehicles: VehicleEntry[];
  csvUploaded: boolean;
  onUpdateVehicle: (i: number, patch: Partial<VehicleEntry>) => void;
  onAddVehicle: () => void;
  onRemoveVehicle: (i: number) => void;
  onAddPartRow: (vIdx: number) => void;
  onUpdatePartRow: (vIdx: number, pIdx: number, patch: Partial<ManifestPart>) => void;
  onRemovePartRow: (vIdx: number, pIdx: number) => void;
  onSimulateVehicles: () => void;
  onOpenCsvModal: () => void;
  onRemoveCsv: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────
export default function VehicleForm({
  vehicles,
  csvUploaded,
  onUpdateVehicle,
  onAddVehicle,
  onRemoveVehicle,
  onAddPartRow,
  onUpdatePartRow,
  onRemovePartRow,
  onSimulateVehicles,
  onOpenCsvModal,
  onRemoveCsv,
}: VehicleFormProps) {
  const modelKeys = Object.keys(ENTERPRISE_MODEL_LABELS) as EnterpriseModelKey[];

  return (
    <motion.div
      key="vehicle"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-4 mb-6"
    >
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
          Tambahkan kendaraan satu per satu, atau import batch CSV dari sistem ERP.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onSimulateVehicles}
            className="glow-btn-outline gap-2 text-xs px-3 py-1.5"
            style={{ borderColor: "rgba(250,204,21,0.4)", color: "#FCD34D" }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Simulate Mock Data
          </button>
          <button
            onClick={onOpenCsvModal}
            className="glow-btn-outline gap-2 text-xs px-3 py-1.5"
            style={{ borderColor: "rgba(94, 234, 212,0.4)", color: "var(--solana-cyan, #2DD4BF)" }}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Import CSV
          </button>
        </div>
      </div>

      {csvUploaded && (
        <div className="glass-card-static rounded-2xl p-5 border" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-teal-500/20">
              <CheckCircle2 className="w-5 h-5 text-teal-500" />
            </div>
            <div className="flex-1">
              <p className="font-bold">astra_production_batch_08.csv</p>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
                Parsed 1,250 valid entries. 0 errors found.
              </p>
            </div>
            <button
              onClick={onRemoveCsv}
              className="text-xs text-red-400 hover:text-red-300 transition-colors p-2"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {vehicles.map((v, i) => (
        <div key={i} className="glass-card-static p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Car className="w-4 h-4" style={{ color: "var(--solana-purple)" }} />
              Vehicle #{i + 1}
            </span>
            {vehicles.length > 1 && (
              <button
                onClick={() => onRemoveVehicle(i)}
                className="p-2 rounded-lg transition-colors hover:bg-red-500/20"
                style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5" }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>
                VIN (17 chars)
              </label>
              <input
                type="text"
                className="input-field mono uppercase"
                placeholder="MHKA1BA1JFK000001"
                maxLength={17}
                value={v.vin}
                onChange={e => onUpdateVehicle(i, { vin: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>
                Model
              </label>
              <select
                className="input-field"
                value={v.modelKey}
                onChange={e => onUpdateVehicle(i, { modelKey: e.target.value as EnterpriseModelKey })}
              >
                <option value="" disabled>Select model...</option>
                {modelKeys.map(k => (
                  <option key={k} value={k}>{ENTERPRISE_MODEL_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>
                Year
              </label>
              <input
                type="number"
                className="input-field"
                min="2020"
                max="2027"
                value={v.year}
                onChange={e => onUpdateVehicle(i, { year: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>
                Color
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Silver Metallic"
                value={v.color}
                onChange={e => onUpdateVehicle(i, { color: e.target.value })}
              />
            </div>
          </div>

          {/* OEM Manifest */}
          <div className="mt-5 border-t pt-4" style={{ borderColor: "rgba(94, 234, 212,0.15)" }}>
            <button
              type="button"
              onClick={() => onUpdateVehicle(i, { manifestOpen: !v.manifestOpen })}
              className="flex items-center justify-between w-full text-left group"
            >
              <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--solana-purple)" }}>
                <Shield className="w-4 h-4" />
                OEM Parts Manifest
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(94, 234, 212,0.15)", color: "var(--solana-purple)" }}>
                  {v.manifest.length} part{v.manifest.length === 1 ? "" : "s"}
                </span>
              </span>
              {v.manifestOpen
                ? <ChevronUp className="w-4 h-4" style={{ color: "var(--solana-text-muted)" }} />
                : <ChevronDown className="w-4 h-4" style={{ color: "var(--solana-text-muted)" }} />}
            </button>

            <AnimatePresence>
              {v.manifestOpen && (
                <motion.div
                  key={`manifest-${i}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs mt-3 mb-3" style={{ color: "var(--solana-text-muted)" }}>
                    Daftarkan part OEM original untuk unit ini. Isi nama, nomor part, dan kategori.
                  </p>

                  {v.manifest.length === 0 && (
                    <div className="text-center py-6 rounded-xl border border-dashed" style={{ borderColor: "rgba(94, 234, 212,0.2)" }}>
                      <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
                        Belum ada part ditambahkan
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                    {v.manifest.map((p, pIdx) => (
                      <div
                        key={p.id}
                        className="grid grid-cols-12 gap-2 items-center rounded-xl p-2"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <input
                          type="text"
                          className="input-field col-span-4 text-xs"
                          placeholder="Part name"
                          value={p.name}
                          onChange={e => onUpdatePartRow(i, pIdx, { name: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input-field col-span-3 text-xs mono"
                          placeholder="Part No."
                          value={p.partNumber}
                          onChange={e => onUpdatePartRow(i, pIdx, { partNumber: e.target.value })}
                        />
                        <select
                          className="input-field col-span-4 text-xs"
                          value={p.category}
                          style={{ color: CATEGORY_COLORS[p.category] }}
                          onChange={e => onUpdatePartRow(i, pIdx, { category: e.target.value as PartCategory })}
                        >
                          {PART_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => onRemovePartRow(i, pIdx)}
                          className="col-span-1 p-2 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5" }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onAddPartRow(i)}
                    className="glow-btn-outline w-full mt-3 gap-2 text-xs py-2 border-dashed"
                    style={{ border: "1.5px dashed rgba(94, 234, 212,0.35)" }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Part
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ))}

      <button
        onClick={onAddVehicle}
        className="glow-btn-outline gap-2 border-dashed py-4"
        style={{ border: "2px dashed rgba(94, 234, 212,0.3)" }}
      >
        <Plus className="w-5 h-5" /> Add Another Vehicle
      </button>
    </motion.div>
  );
}
