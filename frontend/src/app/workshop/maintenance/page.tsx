"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const serviceTypes = ["Oil Change", "Brake Pad Replacement", "Full Inspection", "CVT Fluid Replacement", "Tire Rotation", "Air Filter Replacement", "Coolant Flush", "Battery Replacement", "Spark Plug Replacement", "Timing Belt Replacement"];

export default function MaintenancePage() {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [parts, setParts] = useState([{ name: "", partNumber: "", isOem: true }]);

  const addPart = () => setParts([...parts, { name: "", partNumber: "", isOem: true }]);
  const removePart = (i: number) => setParts(parts.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setParts([{ name: "", partNumber: "", isOem: true }]);
      showToast("success", "Submitted On-Chain!", "Maintenance record anchored to Solana · +25 $NOC earned 🎉");
    }, 3000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="page-header">
        <h1 className="flex items-center gap-3">
          <FileText className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          Log Maintenance
        </h1>
        <p>Record service details for Toyota Avanza 2025 · VIN: MHKA1BA1JFK000001</p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="glass-card-static p-8">
          <label className="block text-base font-semibold mb-4">Service Type</label>
          <select className="input-field" defaultValue="">
            <option value="" disabled>Select service type...</option>
            {serviceTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card-static p-8">
            <label className="block text-base font-semibold mb-4">Current Mileage (km)</label>
            <input type="number" className="input-field" placeholder="e.g. 35000" />
          </div>
          <div className="glass-card-static p-8">
            <label className="block text-base font-semibold mb-4">Service Date</label>
            <input type="date" className="input-field" />
          </div>
        </div>

        <div className="glass-card-static p-8">
          <div className="flex justify-between items-center mb-6">
            <label className="text-base font-semibold">Parts Replaced</label>
            <button onClick={addPart} className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors" style={{ background: "rgba(153,69,255,0.1)", color: "var(--solana-purple)", border: "1px solid rgba(153,69,255,0.2)" }}>
              <Plus className="w-4 h-4" /> Add Part
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {parts.map((_, i) => (
              <div key={i} className="flex gap-3 items-end flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-[140px]">
                  <input type="text" className="input-field" placeholder="Part name" />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <input type="text" className="input-field mono" placeholder="OEM Part #" />
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer shrink-0 px-3 py-3 rounded-xl" style={{ background: "rgba(20,241,149,0.08)", color: "var(--solana-green)" }}>
                  <input type="checkbox" defaultChecked className="accent-green-500" /> OEM
                </label>
                {parts.length > 1 && (
                  <button onClick={() => removePart(i)} className="p-3 rounded-xl transition-colors" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card-static p-8">
          <label className="block text-base font-semibold mb-4">OBD-II Diagnostic Codes (optional)</label>
          <input type="text" className="input-field mono" placeholder="e.g. P0301, P0420 (comma separated)" />
        </div>

        <div className="glass-card-static p-8">
          <label className="block text-base font-semibold mb-4">Technician Notes</label>
          <textarea className="input-field" rows={4} placeholder="Additional observations, recommendations..." />
        </div>

        <div className="glass-card-static p-8">
          <label className="block text-base font-semibold mb-4">Photo Evidence</label>
          <div className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer" style={{ borderColor: "rgba(153,69,255,0.2)", background: "rgba(20,20,40,0.3)" }}>
            <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--solana-text-muted)" }} />
            <p className="text-base mb-2" style={{ color: "var(--solana-text-muted)" }}>Drop images here or click to upload</p>
            <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>JPEG, PNG, WebP · Max 5 files · 10MB each</p>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting} className="glow-btn w-full text-base gap-3 disabled:opacity-50" style={{ padding: "16px 32px" }}>
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing & Submitting to Solana...</> : <>Submit On-Chain</>}
        </button>
      </div>
    </div>
  );
}
