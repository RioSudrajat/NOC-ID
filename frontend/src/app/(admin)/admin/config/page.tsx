"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, DollarSign, Wrench, Layers, ShieldCheck, ToggleLeft, Save } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/components/ui/Toast";

export default function AdminConfigPage() {
  const admin = useAdmin();
  const { showToast } = useToast();
  const cfg = admin?.platformConfig;

  const [platformFeePercent, setPlatformFeePercent] = useState(cfg?.platformFeePercent ?? 4);
  const [fleetManagerFeePercent, setFleetManagerFeePercent] = useState(cfg?.fleetManagerFeePercent ?? 3);
  const [maintenanceFundPercent, setMaintenanceFundPercent] = useState(cfg?.maintenanceFundPercent ?? 3);
  const [flatFeeDailyIDR, setFlatFeeDailyIDR] = useState(cfg?.flatFeeDailyIDR ?? 50000);
  const [maxBatchMintSize, setMaxBatchMintSize] = useState(cfg?.maxBatchMintSize ?? 10000);
  const [thresholdsText, setThresholdsText] = useState((cfg?.maintenanceThresholdsKm ?? [2500, 5000, 7500, 10000]).join(", "));
  const [features, setFeatures] = useState(
    cfg?.features ?? { aiInsights: true, copilot: true, walletPayments: true, depinCampaigns: true }
  );

  const handleSave = () => {
    const parsed = thresholdsText
      .split(",")
      .map(s => Number(s.trim()))
      .filter(n => Number.isFinite(n) && n > 0);
    admin?.updateConfig({
      platformFeePercent,
      fleetManagerFeePercent,
      maintenanceFundPercent,
      flatFeeDailyIDR,
      maxBatchMintSize,
      maintenanceThresholdsKm: parsed,
      features,
    });
    showToast("success", "Config Saved", "Nemesis Protocol configuration updated.");
  };

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const numField = (label: string, value: number, setter: (v: number) => void, suffix?: string, min?: number, max?: number, step?: number) => (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--solana-text-muted)" }}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="input-field text-sm w-full"
          value={value}
          min={min}
          max={max}
          step={step ?? 1}
          onChange={e => setter(Number(e.target.value))}
        />
        {suffix && <span className="text-xs text-gray-500 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );

  const totalRevenueShare = platformFeePercent + fleetManagerFeePercent + maintenanceFundPercent;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <Settings className="w-7 h-7" style={{ color: "#5EEAD4" }} />
            System Configuration
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Protocol-wide parameters, fee splits, and feature flags.</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg, #5EEAD4, #14B8A6)", color: "#0A0F1A" }}>
          <Save className="w-4 h-4" /> Save All Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Configuration */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-teal-400" /> Revenue Split
          </h3>
          <div className="flex flex-col gap-4">
            {numField("Protocol Treasury Fee", platformFeePercent, setPlatformFeePercent, "%", 0, 20, 0.1)}
            {numField("Fleet Manager Fee", fleetManagerFeePercent, setFleetManagerFeePercent, "%", 0, 20, 0.1)}
            {numField("Maintenance Fund", maintenanceFundPercent, setMaintenanceFundPercent, "%", 0, 20, 0.1)}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5">
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
              Total protocol share: <strong className="text-teal-400">{totalRevenueShare.toFixed(1)}%</strong> &middot; Remainder ({(100 - totalRevenueShare).toFixed(1)}%) to investor pools
            </p>
          </div>
        </motion.div>

        {/* Flat Fee */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-400" /> Flat Fee (Rent Mode)
          </h3>
          <div className="flex flex-col gap-4">
            {numField("Default Daily Flat Fee", flatFeeDailyIDR, setFlatFeeDailyIDR, "IDR / hari", 0, 500000, 1000)}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5">
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
              Estimasi bulanan (30 hari): <strong>Rp {(flatFeeDailyIDR * 30).toLocaleString("id-ID")}</strong> / unit
            </p>
          </div>
        </motion.div>

        {/* Minting & Maintenance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" /> Minting & Maintenance
          </h3>
          <div className="flex flex-col gap-4">
            {numField("Max Batch Mint Size", maxBatchMintSize, setMaxBatchMintSize, "vehicles", 1, 100000)}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--solana-text-muted)" }}>Maintenance Thresholds (km)</label>
              <input
                type="text"
                className="input-field text-sm w-full"
                value={thresholdsText}
                onChange={e => setThresholdsText(e.target.value)}
                placeholder="2500, 5000, 7500, 10000"
              />
              <p className="text-[11px] mt-1 text-slate-500">Comma-separated. Auto-trigger service at each threshold.</p>
            </div>
          </div>
        </motion.div>

        {/* Feature Flags */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-teal-400" /> Feature Flags
          </h3>
          <div className="flex flex-col gap-3">
            {([
              { key: "aiInsights" as const, label: "AI Fleet Insights", desc: "Predictive maintenance & fleet health analysis" },
              { key: "copilot" as const, label: "Copilot Assistant", desc: "AI copilot sidebar across portals" },
              { key: "walletPayments" as const, label: "Wallet Payments (IDRX)", desc: "Direct IDRX payments in portals" },
              { key: "depinCampaigns" as const, label: "DePIN Campaigns", desc: "Activity point campaigns & quests" },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => toggleFeature(f.key)}
                className="flex items-center justify-between p-3 rounded-xl border transition-all text-left w-full"
                style={{
                  background: features[f.key] ? "rgba(94,234,212,0.08)" : "rgba(255,255,255,0.02)",
                  borderColor: features[f.key] ? "rgba(94,234,212,0.3)" : "rgba(255,255,255,0.05)",
                }}
              >
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-[11px]" style={{ color: "var(--solana-text-muted)" }}>{f.desc}</p>
                </div>
                <div
                  className="w-10 h-5 rounded-full relative transition-all flex-shrink-0"
                  style={{ background: features[f.key] ? "#5EEAD4" : "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: features[f.key] ? "22px" : "2px" }}
                  />
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-static p-6 rounded-2xl border border-white/5 lg:col-span-2">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" /> Active Configuration Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Protocol Treasury", value: `${platformFeePercent}%` },
              { label: "Fleet Manager", value: `${fleetManagerFeePercent}%` },
              { label: "Maintenance Fund", value: `${maintenanceFundPercent}%` },
              { label: "Daily Flat Fee", value: `Rp ${flatFeeDailyIDR.toLocaleString("id-ID")}` },
              { label: "Batch Mint Limit", value: `${maxBatchMintSize}` },
              { label: "Service Thresholds", value: `${thresholdsText.split(",").length} tier` },
              { label: "AI Insights", value: features.aiInsights ? "ON" : "OFF" },
              { label: "DePIN Campaigns", value: features.depinCampaigns ? "ON" : "OFF" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/5 text-center">
                <p className="text-lg font-bold flex items-center gap-1 justify-center">
                  {item.label === "Maintenance Fund" && <Wrench className="w-3 h-3 text-teal-400" />}
                  {item.value}
                </p>
                <p className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
