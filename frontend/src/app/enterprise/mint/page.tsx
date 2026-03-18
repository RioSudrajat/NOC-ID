"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Plus, Trash2, Loader2, Car } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const vehicleModels = ["Avanza", "Rush", "Innova", "Fortuner", "Yaris", "Agya", "Calya", "Raize", "Veloz"];

export default function MintPage() {
  const { showToast } = useToast();
  const [minting, setMinting] = useState(false);
  const [vehicles, setVehicles] = useState([{ vin: "", model: "", year: "2025", color: "" }]);

  const addVehicle = () => setVehicles([...vehicles, { vin: "", model: "", year: "2025", color: "" }]);
  const removeVehicle = (i: number) => setVehicles(vehicles.filter((_, idx) => idx !== i));

  const handleMint = () => {
    const count = vehicles.length;
    setMinting(true);
    setTimeout(() => {
      setMinting(false);
      setVehicles([{ vin: "", model: "", year: "2025", color: "" }]);
      showToast("success", "Genesis Mint Complete!", `${count} vehicle(s) minted as cNFTs on Solana · ~$${(count * 0.005).toFixed(3)}`);
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="flex items-center gap-3">
          <Cpu className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          Genesis Minting Console
        </h1>
        <p>Mint Compressed NFT vehicle passports on Solana (~$0.005 per vehicle)</p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {vehicles.map((_, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-static p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Car className="w-4 h-4" style={{ color: "var(--solana-purple)" }} />
                Vehicle #{i + 1}
              </span>
              {vehicles.length > 1 && (
                <button onClick={() => removeVehicle(i)} className="p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--solana-text-muted)" }}>VIN (17 characters)</label>
                <input type="text" className="input-field mono" placeholder="MHKA1BA1JFK000001" maxLength={17} />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--solana-text-muted)" }}>Model</label>
                <select className="input-field" defaultValue="">
                  <option value="" disabled>Select model...</option>
                  {vehicleModels.map((m, j) => <option key={j} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--solana-text-muted)" }}>Year</label>
                <input type="number" className="input-field" defaultValue="2025" min="2020" max="2027" />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--solana-text-muted)" }}>Color</label>
                <input type="text" className="input-field" placeholder="e.g. Silver Metallic" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={addVehicle} className="glow-btn-outline flex-1 gap-2">
          <Plus className="w-5 h-5" /> Add Another Vehicle
        </button>
      </div>

      <div className="glass-card-static p-6 mb-6">
        <h3 className="text-sm font-semibold mb-4">Minting Summary</h3>
        <div className="flex justify-between items-center">
          <span style={{ color: "var(--solana-text-muted)" }}>Vehicles to mint:</span>
          <span className="text-xl font-bold">{vehicles.length}</span>
        </div>
        <div className="flex justify-between items-center mt-3">
          <span style={{ color: "var(--solana-text-muted)" }}>Estimated cost:</span>
          <span className="text-xl font-bold gradient-text">~${(vehicles.length * 0.005).toFixed(3)}</span>
        </div>
        <div className="flex justify-between items-center mt-3">
          <span style={{ color: "var(--solana-text-muted)" }}>Method:</span>
          <span className="text-sm badge badge-purple">Compressed NFT (Bubblegum)</span>
        </div>
      </div>

      <button onClick={handleMint} disabled={minting} className="glow-btn w-full text-base gap-3 disabled:opacity-50" style={{ padding: "16px 32px" }}>
        {minting ? <><Loader2 className="w-5 h-5 animate-spin" /> Minting to Solana Merkle Tree...</> : <><Cpu className="w-5 h-5" /> Mint {vehicles.length} Vehicle(s)</>}
      </button>
    </div>
  );
}
