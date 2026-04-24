"use client";

import { InteractiveDonutChart } from "@/components/ui/InteractiveDonutChart";
import { AlertTriangle, Calendar, Trophy } from "lucide-react";

const earnMethods = [
  { icon: "🏢", label: "Onboard armada sebagai operator", pts: "+1.000/unit/bulan" },
  { icon: "💰", label: "Invest di pool early", pts: "+500 per investasi" },
  { icon: "👥", label: "Referral operator baru", pts: "+500/referral" },
  { icon: "🐦", label: "Social tasks", pts: "+100-200 each" },
  { icon: "⭐", label: "Hold poin 30 hari", pts: "+200" },
];

const campaigns = [
  {
    title: "Early Operator Onboarding",
    reward: "500k pts",
    deadline: "15 Mei 2026",
    progress: 67,
  },
  {
    title: "Jakarta Fleet Expansion",
    reward: "200k pts",
    deadline: "30 Apr 2026",
    progress: 84,
  },
  {
    title: "Referral Ramadan Bonus",
    reward: "100k pts",
    deadline: "10 Mei 2026",
    progress: 45,
  },
];

const donutData = [
  { id: "social", label: "Social", value: 40, color: "#5EEAD4" },
  { id: "operator", label: "Operator", value: 35, color: "#8B5CF6" },
  { id: "investor", label: "Investor", value: 15, color: "#F59E0B" },
  { id: "referral", label: "Referral", value: 10, color: "#EC4899" },
];

export default function EarnPage() {
  const totalPoints = 2_847_392;
  const targetPoints = 10_000_000;
  const seasonPct = (totalPoints / targetPoints) * 100;

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] gradient-text mb-6">
          Earn Campaigns
        </h1>

        {/* Season header */}
        <div
          className="glass-card p-6 md:p-8 mb-8"
          style={{
            background:
              "linear-gradient(135deg, rgba(94,234,212,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(34,38,46,0.7) 100%)",
            border: "1px solid rgba(94,234,212,0.4)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={24} style={{ color: "#F59E0B" }} />
            <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-orbitron)]">
              Season 1 — 10 Juta Activity Points
            </h2>
          </div>
          <p className="text-sm text-gray-400 mb-4 flex items-center gap-1">
            <Calendar size={14} /> End date: 31 Desember 2026
          </p>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white font-bold">
              {totalPoints.toLocaleString("id-ID")}
            </span>
            <span className="text-gray-400">
              / {targetPoints.toLocaleString("id-ID")} ({seasonPct.toFixed(1)}%)
            </span>
          </div>
          <div
            className="w-full h-4 rounded-full overflow-hidden"
            style={{ background: "rgba(94,234,212,0.1)" }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${seasonPct}%`,
                background: "linear-gradient(90deg, #5EEAD4 0%, #8B5CF6 100%)",
                boxShadow: "0 0 12px rgba(94,234,212,0.5)",
              }}
            />
          </div>
        </div>

        {/* How to earn */}
        <h2 className="text-xl font-bold mb-4 font-[family-name:var(--font-orbitron)] text-white">
          Cara Dapat Poin
        </h2>
        <div className="glass-card p-5 mb-8">
          <div className="space-y-3">
            {earnMethods.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 pb-3 border-b last:border-b-0 last:pb-0"
                style={{ borderColor: "rgba(94,234,212,0.1)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-sm md:text-base text-white">{m.label}</span>
                </div>
                <span className="badge badge-green text-xs whitespace-nowrap">
                  {m.pts}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active campaigns */}
        <h2 className="text-xl font-bold mb-4 font-[family-name:var(--font-orbitron)] text-white">
          Active Campaigns
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {campaigns.map((c, i) => (
            <div key={i} className="glass-card p-5">
              <h3 className="text-lg font-bold text-white mb-2">{c.title}</h3>
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="badge badge-green text-xs">{c.reward}</span>
                <span className="text-xs text-gray-400">{c.deadline}</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-bold">{c.progress}%</span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(94,234,212,0.1)" }}
              >
                <div
                  className="h-full"
                  style={{
                    width: `${c.progress}%`,
                    background: "#5EEAD4",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Points breakdown */}
        <h2 className="text-xl font-bold mb-4 font-[family-name:var(--font-orbitron)] text-white">
          Points Distribution
        </h2>
        <div className="glass-card p-5 mb-8">
          <InteractiveDonutChart data={donutData} />
        </div>

        {/* Redemption notice */}
        <div
          className="rounded-2xl p-5 flex items-start gap-3"
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.4)",
          }}
        >
          <AlertTriangle size={22} style={{ color: "#F59E0B" }} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-100">
            Poin ini akan bisa ditukar <strong>$NMS</strong> saat IDO 2027. Jangan lupa hold poin lo!
          </p>
        </div>
      </div>
    </div>
  );
}
