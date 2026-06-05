"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Info, Eye, EyeOff } from "lucide-react";
import { useActiveVehicle, vehicleData } from "@/context/ActiveVehicleContext";

interface PredictionItem {
  part: string;
  component_id: string;
  health: number;
  failureProbability: number;
  daysUntilFailure: number;
  status: string;
  shapFactors: { feature: string; impact: number; direction: string }[];
  recommendation: string;
}

const predictionsData: Record<string, PredictionItem[]> = {
  bmw_m4: [
    {
      part: "Brake Pads (Rear)", component_id: "Brakes.Brake_Pad_RL", health: 60,
      failureProbability: 0.45, daysUntilFailure: 30, status: "Warning",
      shapFactors: [
        { feature: "Track day usage ratio", impact: 0.45, direction: "up" },
        { feature: "Harsh braking frequency", impact: 0.15, direction: "up" }
      ],
      recommendation: "Book an M Certified mechanic to replace rear brake pads very soon.",
    }
  ],
  harley: [
    {
      part: "Battery", component_id: "Electrical.Battery", health: 50,
      failureProbability: 0.40, daysUntilFailure: 60, status: "Warning",
      shapFactors: [
        { feature: "Garaged for prolonged duration", impact: 0.45, direction: "up" },
        { feature: "Voltage drop cold start", impact: 0.20, direction: "up" }
      ],
      recommendation: "Keep bike on a trickle charger or prepare to replace battery soon.",
    }
  ]
};

function getStatusColor(status: string) {
  switch (status) {
    case "Excellent": return "#86EFAC";
    case "Good": return "#5EEAD4";
    case "Warning": return "#FCD34D";
    case "Critical": return "#5EEAD4";
    case "Danger": return "#FCA5A5";
    default: return "#94A3B8";
  }
}

function getRiskLabel(prob: number): { label: string; color: string } {
  if (prob >= 0.6) return { label: `Risiko Tinggi (${(prob * 100).toFixed(0)}%)`, color: "#FCA5A5" };
  if (prob >= 0.3) return { label: `Risiko Sedang (${(prob * 100).toFixed(0)}%)`, color: "#FCD34D" };
  return { label: `Risiko Rendah (${(prob * 100).toFixed(0)}%)`, color: "#86EFAC" };
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
                style={{ background: f.direction === "up" ? "rgba(94, 234, 212,0.6)" : "rgba(34,197,94,0.6)" }}
              />
            </div>
          </div>
          {showAdvanced && (
            <span className="text-xs mono w-14 text-right font-semibold" style={{ color: f.direction === "up" ? "#5EEAD4" : "#86EFAC" }}>
              {f.direction === "up" ? "+" : ""}{f.impact.toFixed(2)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const ctx = useActiveVehicle();
  const hasActiveVehicle = ctx?.hasActiveVehicle ?? false;
  const currentKey = ctx?.activeVehicle || "bmw_m4";
  const currentVehicleData = ctx?.currentVehicleData || vehicleData.bmw_m4;

  const currentPredictions = predictionsData[currentKey] || predictionsData.bmw_m4;

  const [advancedView, setAdvancedView] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  if (!hasActiveVehicle) {
    return (
      <div className="glass-card p-8 text-center">
        <Brain className="mx-auto mb-4 h-10 w-10 text-teal-300" />
        <h1 className="text-2xl font-bold">Belum ada AI insight</h1>
        <p className="mt-2 text-sm text-slate-400">AI insight akan aktif setelah akun ini punya kendaraan digital hasil mint program baru.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-teal-400" />
              AI Predictive Insights
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-semibold px-2 py-1 rounded bg-white/5 border border-slate-700/50 text-slate-300">
                {currentVehicleData.name}
              </span>
              <span className="text-xs text-slate-500 font-mono border-l border-slate-700 pl-2">
                {currentVehicleData.vin}
              </span>
            </div>
          </div>
          <button
            onClick={() => setAdvancedView(!advancedView)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all shrink-0"
            style={{
              background: advancedView ? "rgba(94, 234, 212,0.15)" : "rgba(20,20,40,0.7)",
              border: `1px solid ${advancedView ? "var(--solana-purple)" : "rgba(94, 234, 212,0.2)"}`,
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
          <AlertTriangle className="w-6 h-6" style={{ color: "#5EEAD4" }} />
          <span className="text-base font-semibold">1 Critical</span>
        </div>
        <div className="flex items-center gap-3">
          <Info className="w-6 h-6" style={{ color: "#FCD34D" }} />
          <span className="text-base font-semibold">2 Warnings</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6" style={{ color: "#86EFAC" }} />
          <span className="text-base font-semibold">2 Excellent</span>
        </div>
        <div className="flex-1" />
        {advancedView && (
          <span className="text-sm mono" style={{ color: "var(--solana-text-muted)" }}>Model v2.4.1 · Updated 2h ago</span>
        )}
      </div>

      {/* Insights List */}
      <div className="flex flex-col gap-4">
        {currentPredictions.map((pred, i) => {
          const risk = getRiskLabel(pred.failureProbability);
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card-static overflow-hidden hover:bg-white/5 transition-colors cursor-pointer group">
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
                <div className="flex items-start gap-4 p-5 rounded-xl" style={{ background: "rgba(94, 234, 212,0.05)", border: "1px solid rgba(94, 234, 212,0.15)" }}>
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
