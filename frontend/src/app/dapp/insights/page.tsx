"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Info, Eye, EyeOff } from "lucide-react";

const predictions = [
  {
    part: "CVT Belt", component_id: "Transmission.CVT_Belt", health: 42,
    failureProbability: 0.67, daysUntilFailure: 45, status: "Critical",
    shapFactors: [
      { feature: "Jarak sejak servis CVT terakhir", impact: 0.38, direction: "up" },
      { feature: "Total kilometer tempuh", impact: 0.22, direction: "up" },
      { feature: "Usia kendaraan (hari)", impact: 0.11, direction: "up" },
      { feature: "Reputasi bengkel rata-rata", impact: -0.05, direction: "down" },
      { feature: "Frekuensi servis", impact: -0.03, direction: "down" },
    ],
    recommendation: "Jadwalkan inspeksi CVT belt dalam 2 minggu. Pertimbangkan penggantian jika lebar belt < 21.0mm.",
  },
  {
    part: "Air Filter", component_id: "Engine.Air_Filter", health: 55,
    failureProbability: 0.45, daysUntilFailure: 60, status: "Warning",
    shapFactors: [
      { feature: "Hari sejak penggantian terakhir", impact: 0.30, direction: "up" },
      { feature: "Rasio berkendara perkotaan", impact: 0.20, direction: "up" },
      { feature: "Jarak sejak servis", impact: 0.15, direction: "up" },
      { feature: "Servis di dealer OEM", impact: -0.08, direction: "down" },
    ],
    recommendation: "Ganti elemen air filter (OEM #17801-BZ050) pada kunjungan servis berikutnya.",
  },
  {
    part: "Brake Fluid", component_id: "Fluids.Brake_Fluid", health: 68,
    failureProbability: 0.30, daysUntilFailure: 90, status: "Warning",
    shapFactors: [
      { feature: "Waktu sejak flush terakhir", impact: 0.25, direction: "up" },
      { feature: "Zona iklim (tropis)", impact: 0.12, direction: "up" },
      { feature: "Frekuensi pengereman", impact: 0.08, direction: "up" },
    ],
    recommendation: "Jadwalkan brake fluid flush (DOT 4) dalam 90 hari untuk performa pengereman optimal.",
  },
  {
    part: "Engine Oil", component_id: "Fluids.Engine_Oil", health: 95,
    failureProbability: 0.05, daysUntilFailure: 180, status: "Excellent",
    shapFactors: [
      { feature: "Baru saja ganti oli", impact: -0.35, direction: "down" },
      { feature: "Kualitas oli yang digunakan", impact: -0.12, direction: "down" },
    ],
    recommendation: "Baru diservis. Ganti oli berikutnya disarankan di ~40,000 km.",
  },
  {
    part: "Front Brake Pads", component_id: "Brakes.Brake_Pad_FL", health: 100,
    failureProbability: 0.02, daysUntilFailure: 365, status: "Excellent",
    shapFactors: [
      { feature: "Baru diganti", impact: -0.40, direction: "down" },
      { feature: "Part OEM terverifikasi", impact: -0.10, direction: "down" },
    ],
    recommendation: "Brake pad OEM baru dipasang. Tidak perlu tindakan.",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "Excellent": return "#22C55E";
    case "Good": return "#A3E635";
    case "Warning": return "#FACC15";
    case "Critical": return "#F97316";
    case "Danger": return "#EF4444";
    default: return "#94A3B8";
  }
}

function getRiskLabel(prob: number): { label: string; color: string } {
  if (prob >= 0.6) return { label: `Risiko Tinggi (${(prob * 100).toFixed(0)}%)`, color: "#EF4444" };
  if (prob >= 0.3) return { label: `Risiko Sedang (${(prob * 100).toFixed(0)}%)`, color: "#FACC15" };
  return { label: `Risiko Rendah (${(prob * 100).toFixed(0)}%)`, color: "#22C55E" };
}

function FactorsChart({ factors, showAdvanced }: { factors: { feature: string; impact: number; direction: string }[]; showAdvanced: boolean }) {
  const maxImpact = Math.max(...factors.map(f => Math.abs(f.impact)));
  return (
    <div className="flex flex-col gap-2.5">
      {factors.map((f, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs w-52 truncate" style={{ color: "var(--solana-text-muted)" }}>{f.feature}</span>
          <div className="flex-1 flex items-center">
            <div className="relative h-5 flex-1 rounded-md overflow-hidden" style={{ background: "rgba(20,20,40,0.5)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(Math.abs(f.impact) / maxImpact) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="h-full rounded-md"
                style={{ background: f.direction === "up" ? "rgba(249,115,22,0.6)" : "rgba(34,197,94,0.6)" }}
              />
            </div>
          </div>
          {showAdvanced && (
            <span className="text-xs mono w-14 text-right font-semibold" style={{ color: f.direction === "up" ? "#F97316" : "#22C55E" }}>
              {f.direction === "up" ? "+" : ""}{f.impact.toFixed(2)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const [advancedView, setAdvancedView] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="flex items-center gap-3">
              <Brain className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
              AI Predictive Insights
            </h1>
            <p>Prediksi kegagalan komponen kendaraan berdasarkan data servis dan AI</p>
          </div>
          <button
            onClick={() => setAdvancedView(!advancedView)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all shrink-0"
            style={{
              background: advancedView ? "rgba(153,69,255,0.15)" : "rgba(20,20,40,0.7)",
              border: `1px solid ${advancedView ? "var(--solana-purple)" : "rgba(153,69,255,0.2)"}`,
              color: advancedView ? "var(--solana-purple)" : "var(--solana-text-muted)",
            }}
          >
            {advancedView ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Advanced View
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="glass-card-static p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" style={{ color: "#F97316" }} />
          <span className="text-base font-semibold">1 Critical</span>
        </div>
        <div className="flex items-center gap-3">
          <Info className="w-6 h-6" style={{ color: "#FACC15" }} />
          <span className="text-base font-semibold">2 Warnings</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6" style={{ color: "#22C55E" }} />
          <span className="text-base font-semibold">2 Excellent</span>
        </div>
        <div className="flex-1" />
        {advancedView && (
          <span className="text-sm mono" style={{ color: "var(--solana-text-muted)" }}>Model v2.4.1 · Updated 2h ago</span>
        )}
      </div>

      {/* Prediction cards */}
      <div className="flex flex-col gap-8">
        {predictions.map((pred, i) => {
          const risk = getRiskLabel(pred.failureProbability);
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card-static overflow-hidden">
              <div className="h-1" style={{ background: getStatusColor(pred.status) }} />
              <div className="p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-2xl font-bold">{pred.part}</h3>
                      <span className="badge" style={{ background: `${getStatusColor(pred.status)}15`, color: getStatusColor(pred.status), border: `1px solid ${getStatusColor(pred.status)}40` }}>
                        {pred.status}
                      </span>
                    </div>
                    {advancedView && (
                      <p className="text-sm mono" style={{ color: "var(--solana-text-muted)" }}>{pred.component_id}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-8 sm:gap-10">
                    <div className="text-center">
                      <p className="text-3xl font-bold mono" style={{ color: getStatusColor(pred.status) }}>{pred.health}</p>
                      <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Health Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold mono" style={{ color: getStatusColor(pred.status) }}>{pred.daysUntilFailure}</p>
                      <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Hari Tersisa</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold" style={{ color: risk.color }}>{risk.label}</p>
                      {advancedView && (
                        <p className="text-xs mono mt-0.5" style={{ color: "var(--solana-text-muted)" }}>P={pred.failureProbability.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Factors chart */}
                <div className="mb-8">
                  <p className="text-base font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" style={{ color: "var(--solana-purple)" }} />
                    Faktor Penyebab (Key Factors)
                  </p>
                  <FactorsChart factors={pred.shapFactors} showAdvanced={advancedView} />
                </div>

                {/* Recommendation */}
                <div className="flex items-start gap-4 p-5 rounded-xl" style={{ background: "rgba(153,69,255,0.05)", border: "1px solid rgba(153,69,255,0.15)" }}>
                  <ChevronRight className="w-6 h-6 mt-0.5 shrink-0" style={{ color: "var(--solana-green)" }} />
                  <p className="text-base" style={{ color: "var(--solana-text-muted)" }}>{pred.recommendation}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
