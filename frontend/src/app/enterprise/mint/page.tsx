"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Cpu } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  ENTERPRISE_MODEL_LABELS,
  EnterpriseModelKey,
  PartCategory,
} from "../_shared";
import VehicleForm, { type VehicleEntry, type ManifestPart } from "@/components/enterprise/mint/VehicleForm";
import PartCatalogForm, { type PartCatalogEntry } from "@/components/enterprise/mint/PartCatalogForm";
import CsvImportModal from "@/components/enterprise/mint/CsvImportModal";
import MintSummary from "@/components/enterprise/mint/MintSummary";

// ─── Helpers ─────────────────────────────────────────────────────────────
const newPartRow = (): ManifestPart => ({
  id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  partNumber: "",
  category: "Exterior",
});

const emptyVehicle = (): VehicleEntry => ({
  vin: "", modelKey: "", year: "2025", color: "", manifest: [], manifestOpen: false,
});

const emptyPartCatalog = (): PartCatalogEntry => ({
  name: "", partNumber: "", category: "Brakes", models: [], batchQty: "", priceIDR: "",
});

// ─── Mock Data ───────────────────────────────────────────────────────────
const MOCK_VIN_PREFIX = "MHKA1BA1JFK";
const MOCK_COLORS = ["Silver Metallic", "Midnight Black", "Pearl White", "Nebula Blue", "Phantom Brown"];
const MOCK_MANIFEST_SAMPLES: Omit<ManifestPart, "id">[] = [
  { name: "Body Shell", partNumber: "61001-OEM", category: "Exterior" },
  { name: "Headlights (Pair)", partNumber: "81110-OEM", category: "Exterior" },
  { name: "Dashboard Assembly", partNumber: "55301-OEM", category: "Interior" },
  { name: "Engine Block", partNumber: "11001-OEM", category: "Engine" },
  { name: "Front Brake Pads", partNumber: "04465-OEM", category: "Brakes" },
];

function mockVehicles(n = 3): VehicleEntry[] {
  const keys = Object.keys(ENTERPRISE_MODEL_LABELS) as EnterpriseModelKey[];
  return Array.from({ length: n }).map((_, i) => ({
    vin: `${MOCK_VIN_PREFIX}${String(Math.floor(100000 + Math.random() * 899999))}`,
    modelKey: keys[i % keys.length],
    year: "2025",
    color: MOCK_COLORS[i % MOCK_COLORS.length],
    manifest: MOCK_MANIFEST_SAMPLES.map(p => ({ ...p, id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })),
    manifestOpen: true,
  }));
}

// ─── Component ───────────────────────────────────────────────────────────
export default function MintPage() {
  const { showToast } = useToast();
  const [minting, setMinting] = useState(false);
  const [activeTab, setActiveTab] = useState<"vehicle" | "parts">("vehicle");
  const [vehicles, setVehicles] = useState<VehicleEntry[]>([emptyVehicle()]);
  const [partEntries, setPartEntries] = useState<PartCatalogEntry[]>([emptyPartCatalog()]);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvUploaded, setCsvUploaded] = useState(false);

  // ─── Vehicle handlers ──────────────────────────────────────────────────
  const updateVehicle = (i: number, patch: Partial<VehicleEntry>) =>
    setVehicles(prev => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const addVehicle = () => setVehicles(v => [...v, emptyVehicle()]);
  const removeVehicle = (i: number) => setVehicles(v => v.filter((_, idx) => idx !== i));
  const addPartRow = (vIdx: number) =>
    updateVehicle(vIdx, { manifest: [...vehicles[vIdx].manifest, newPartRow()], manifestOpen: true });
  const updatePartRow = (vIdx: number, pIdx: number, patch: Partial<ManifestPart>) => {
    const manifest = vehicles[vIdx].manifest.map((p, i) => (i === pIdx ? { ...p, ...patch } : p));
    updateVehicle(vIdx, { manifest });
  };
  const removePartRow = (vIdx: number, pIdx: number) => {
    const manifest = vehicles[vIdx].manifest.filter((_, i) => i !== pIdx);
    updateVehicle(vIdx, { manifest });
  };

  // ─── Part catalog handlers ─────────────────────────────────────────────
  const updatePart = (i: number, patch: Partial<PartCatalogEntry>) =>
    setPartEntries(prev => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const togglePartModel = (i: number, key: EnterpriseModelKey) => {
    const current = partEntries[i].models;
    const models = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
    updatePart(i, { models });
  };

  // ─── Simulate ──────────────────────────────────────────────────────────
  const simulateVehicles = () => { setVehicles(mockVehicles(3)); showToast("success", "Mock Data Loaded", "3 kendaraan + manifest contoh sudah terisi."); };
  const simulatePartCatalog = () => { setPartEntries([{ name: "Front Brake Pad Set", partNumber: "04465-AZ-001", category: "Brakes", models: ["avanza", "bmw_m4"], batchQty: "500", priceIDR: "450000" }]); showToast("success", "Mock Data Loaded", "Contoh part catalog terisi otomatis."); };
  const simulateCsv = () => { setCsvOpen(true); setCsvUploaded(true); showToast("success", "Mock CSV Loaded", "File CSV mock sudah ter-parse."); };

  // ─── Mint ──────────────────────────────────────────────────────────────
  const totalCount = activeTab === "vehicle" ? (csvUploaded ? 1250 : vehicles.length) : partEntries.length;
  const handleMint = () => {
    setMinting(true);
    setTimeout(() => {
      setMinting(false);
      if (activeTab === "vehicle") { setVehicles([emptyVehicle()]); setCsvUploaded(false); setCsvOpen(false); }
      else { setPartEntries([emptyPartCatalog()]); }
      const msg = activeTab === "parts"
        ? `${totalCount} part catalog(s) minted as NFTs on Solana`
        : `${totalCount} vehicle(s) minted as cNFTs on Solana · ~$${(totalCount * 0.005).toFixed(3)}`;
      showToast("success", activeTab === "parts" ? "Part Catalog Minted!" : "Genesis Mint Complete!", msg);
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header mb-8">
        <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
          <Cpu className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          Mint Console
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>
          Mint Compressed NFT vehicle passports and OEM part catalogs on Solana
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b" style={{ borderColor: "rgba(94, 234, 212,0.2)" }}>
        <button onClick={() => setActiveTab("vehicle")} className="pb-3 px-4 text-sm font-semibold transition-colors border-b-2" style={{ borderColor: activeTab === "vehicle" ? "var(--solana-purple)" : "transparent", color: activeTab === "vehicle" ? "var(--solana-purple)" : "var(--solana-text-muted)" }}>
          Vehicle Genesis Mint
        </button>
        <button onClick={() => setActiveTab("parts")} className="pb-3 px-4 text-sm font-semibold transition-colors border-b-2" style={{ borderColor: activeTab === "parts" ? "var(--solana-cyan, #2DD4BF)" : "transparent", color: activeTab === "parts" ? "var(--solana-cyan, #2DD4BF)" : "var(--solana-text-muted)" }}>
          Part Catalog Mint
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "vehicle" ? (
          <VehicleForm
            vehicles={vehicles}
            csvUploaded={csvUploaded}
            onUpdateVehicle={updateVehicle}
            onAddVehicle={addVehicle}
            onRemoveVehicle={removeVehicle}
            onAddPartRow={addPartRow}
            onUpdatePartRow={updatePartRow}
            onRemovePartRow={removePartRow}
            onSimulateVehicles={simulateVehicles}
            onOpenCsvModal={() => setCsvOpen(true)}
            onRemoveCsv={() => setCsvUploaded(false)}
          />
        ) : (
          <PartCatalogForm
            partEntries={partEntries}
            onUpdatePart={updatePart}
            onTogglePartModel={togglePartModel}
            onAddPartEntry={() => setPartEntries([...partEntries, emptyPartCatalog()])}
            onRemovePartEntry={(i) => setPartEntries(partEntries.filter((_, idx) => idx !== i))}
            onSimulatePartCatalog={simulatePartCatalog}
          />
        )}
      </AnimatePresence>

      <MintSummary activeTab={activeTab} totalCount={totalCount} minting={minting} onMint={handleMint} />
      <CsvImportModal csvOpen={csvOpen} csvUploaded={csvUploaded} onClose={() => setCsvOpen(false)} onUpload={() => setCsvUploaded(true)} onSimulateCsv={simulateCsv} />
    </div>
  );
}
