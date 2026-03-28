"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, DollarSign, Coins, Layers, ShieldCheck, ToggleLeft, Save } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/components/ui/Toast";

export default function AdminConfigPage() {
  const admin = useAdmin();
  const { showToast } = useToast();
  const cfg = admin?.platformConfig;

  const [platformFeePercent, setPlatformFeePercent] = useState(cfg?.platformFeePercent ?? 2.5);
  const [gasSubsidyPercent, setGasSubsidyPercent] = useState(cfg?.gasSubsidyPercent ?? 50);
  const [minServiceFee, setMinServiceFee] = useState(cfg?.minServiceFee ?? 50000);
  const [maxServiceFee, setMaxServiceFee] = useState(cfg?.maxServiceFee ?? 50000000);
  const [nocTokenRate, setNocTokenRate] = useState(cfg?.nocTokenRate ?? 1500);
  const [usdcRate, setUsdcRate] = useState(cfg?.usdcRate ?? 16200);
  const [maxBatchMintSize, setMaxBatchMintSize] = useState(cfg?.maxBatchMintSize ?? 100);
  const [qrExpirySeconds, setQrExpirySeconds] = useState(cfg?.qrExpirySeconds ?? 300);
  const [features, setFeatures] = useState(cfg?.features ?? { aiInsights: true, digitalTwin: true, copilot: true, walletPayments: true });

  const handleSave = () => {
    admin?.updateConfig({
      platformFeePercent,
      gasSubsidyPercent,
      minServiceFee,
      maxServiceFee,
      nocTokenRate,
      usdcRate,
      maxBatchMintSize,
      qrExpirySeconds,
      features,
    });
    showToast("success", "Config Saved", "Platform configuration has been updated.");
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

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <Settings className="w-7 h-7" style={{ color: "#F97316" }} />
            System Configuration
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Platform-wide parameters, fees, and feature flags.</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg, #F97316, #EF4444)", color: "#fff" }}>
          <Save className="w-4 h-4" /> Save All Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Configuration */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" /> Fee Configuration
          </h3>
          <div className="flex flex-col gap-4">
            {numField("Platform Fee", platformFeePercent, setPlatformFeePercent, "%", 0, 20, 0.1)}
            {numField("Gas Subsidy", gasSubsidyPercent, setGasSubsidyPercent, "%", 0, 100, 5)}
            {numField("Min Service Fee", minServiceFee, setMinServiceFee, "IDR", 0)}
            {numField("Max Service Fee", maxServiceFee, setMaxServiceFee, "IDR", 0)}
          </div>
        </motion.div>

        {/* Token Parameters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" /> Token Parameters
          </h3>
          <div className="flex flex-col gap-4">
            {numField("$NOC Token Rate", nocTokenRate, setNocTokenRate, "IDR / NOC", 1)}
            {numField("USDC Rate", usdcRate, setUsdcRate, "IDR / USDC", 1)}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5">
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
              1 $NOC = Rp {nocTokenRate.toLocaleString("id-ID")} &middot; 1 USDC = Rp {usdcRate.toLocaleString("id-ID")}
            </p>
          </div>
        </motion.div>

        {/* Minting & Security */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" /> Minting & Security
          </h3>
          <div className="flex flex-col gap-4">
            {numField("Max Batch Mint Size", maxBatchMintSize, setMaxBatchMintSize, "vehicles", 1, 1000)}
            {numField("QR Code Expiry", qrExpirySeconds, setQrExpirySeconds, "seconds", 30, 3600, 30)}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5">
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
              QR expires in {Math.floor(qrExpirySeconds / 60)}m {qrExpirySeconds % 60}s &middot; Batch limit: {maxBatchMintSize} per tx
            </p>
          </div>
        </motion.div>

        {/* Feature Flags */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card-static p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-cyan-400" /> Feature Flags
          </h3>
          <div className="flex flex-col gap-3">
            {([
              { key: "aiInsights" as const, label: "AI Insights", desc: "AI-powered analytics and recommendations" },
              { key: "digitalTwin" as const, label: "3D Digital Twin", desc: "Interactive 3D vehicle model viewer" },
              { key: "copilot" as const, label: "Copilot Assistant", desc: "AI copilot sidebar across portals" },
              { key: "walletPayments" as const, label: "Wallet Payments", desc: "Direct SOL/USDC/NOC payments" },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => toggleFeature(f.key)}
                className="flex items-center justify-between p-3 rounded-xl border transition-all text-left w-full"
                style={{
                  background: features[f.key] ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                  borderColor: features[f.key] ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.05)",
                }}
              >
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-[11px]" style={{ color: "var(--solana-text-muted)" }}>{f.desc}</p>
                </div>
                <div
                  className="w-10 h-5 rounded-full relative transition-all flex-shrink-0"
                  style={{ background: features[f.key] ? "#22C55E" : "rgba(255,255,255,0.1)" }}
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

        {/* Current Config Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-static p-6 rounded-2xl border border-white/5 lg:col-span-2">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-400" /> Active Configuration Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Platform Fee", value: `${platformFeePercent}%` },
              { label: "Gas Subsidy", value: `${gasSubsidyPercent}%` },
              { label: "$NOC Rate", value: `Rp ${nocTokenRate.toLocaleString("id-ID")}` },
              { label: "USDC Rate", value: `Rp ${usdcRate.toLocaleString("id-ID")}` },
              { label: "Min Service", value: `Rp ${minServiceFee.toLocaleString("id-ID")}` },
              { label: "Max Service", value: `Rp ${maxServiceFee.toLocaleString("id-ID")}` },
              { label: "Batch Limit", value: `${maxBatchMintSize} vehicles` },
              { label: "QR Expiry", value: `${qrExpirySeconds}s` },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/5 text-center">
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
