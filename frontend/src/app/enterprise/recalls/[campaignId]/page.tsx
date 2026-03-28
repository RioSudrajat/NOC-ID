"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, ArrowLeft, CheckCircle2, Clock, Car, Calendar, Send } from "lucide-react";
import Link from "next/link";

// Mock recall campaigns (shared with parent page)
const recallCampaigns = [
  { id: "RC-2026-001", title: "Avanza CVT Software Update", description: "A critical software bug in the CVT transmission control unit can cause unexpected gear shifts at high speed. All affected units require a firmware update.", status: "Active", completion: 68, affected: 15200, date: "2026-02-15", severity: "Critical", modelsAffected: ["Avanza 2024", "Avanza 2025", "Veloz 2024"] },
  { id: "RC-2025-088", title: "Innova Airbag Sensor Bracket", description: "Mounting bracket for the passenger airbag sensor may corrode over time, causing intermittent SRS warning lights. Bracket replacement required.", status: "Active", completion: 82, affected: 8400, date: "2025-11-10", severity: "Medium", modelsAffected: ["Innova 2024", "Innova 2025"] },
  { id: "RC-2025-042", title: "Fortuner Brake Booster Line", description: "Brake booster vacuum line shows premature degradation in certain batch production units. Line replacement under warranty.", status: "Closed", completion: 97, affected: 4200, date: "2025-06-22", severity: "High", modelsAffected: ["Fortuner 2024"] },
];

export default function RecallDetailPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params);
  const campaign = recallCampaigns.find(c => c.id === campaignId);

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <AlertOctagon className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-bold mb-2">Campaign Not Found</h2>
        <Link href="/enterprise/recalls" className="text-sm text-purple-400 hover:underline">Back to Recalls</Link>
      </div>
    );
  }

  const compliant = Math.round(campaign.affected * (campaign.completion / 100));
  const pending = campaign.affected - compliant;

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/enterprise/recalls" className="inline-flex items-center gap-2 text-sm mb-6 hover:text-purple-400 transition-colors" style={{ color: "var(--solana-text-muted)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Recalls
      </Link>

      {/* Header */}
      <div className="glass-card p-8 rounded-2xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="mono text-sm text-purple-400">{campaign.id}</span>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: campaign.status === "Active" ? "rgba(249,115,22,0.15)" : "rgba(34,197,94,0.15)", color: campaign.status === "Active" ? "#F97316" : "#22C55E", border: `1px solid ${campaign.status === "Active" ? "#F97316" : "#22C55E"}40` }}>
                {campaign.status}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: campaign.severity === "Critical" ? "rgba(239,68,68,0.15)" : campaign.severity === "High" ? "rgba(249,115,22,0.15)" : "rgba(250,204,21,0.15)", color: campaign.severity === "Critical" ? "#EF4444" : campaign.severity === "High" ? "#F97316" : "#FACC15" }}>
                {campaign.severity}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{campaign.title}</h1>
            <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{campaign.description}</p>
          </div>
          {campaign.status === "Active" && (
            <button className="glow-btn text-sm flex items-center gap-2 shrink-0" style={{ padding: "10px 20px" }}>
              <Send className="w-4 h-4" /> Send Reminder
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { icon: Car, label: "Affected Vehicles", value: campaign.affected.toLocaleString(), color: "var(--solana-purple)" },
          { icon: CheckCircle2, label: "Compliant", value: compliant.toLocaleString(), color: "#22C55E" },
          { icon: Clock, label: "Pending", value: pending.toLocaleString(), color: "#FACC15" },
          { icon: Calendar, label: "Issue Date", value: campaign.date, color: "var(--solana-cyan)" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 rounded-2xl">
            <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Completion Progress */}
      <div className="glass-card-static p-6 rounded-2xl border border-white/5 mb-8">
        <h3 className="text-base font-semibold mb-4">Completion Progress</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${campaign.completion}%` }} transition={{ duration: 1.5 }} className="h-full rounded-full" style={{ background: campaign.completion > 80 ? "var(--solana-green)" : campaign.completion > 50 ? "#FACC15" : "var(--solana-purple)" }} />
          </div>
          <span className="text-lg font-bold mono">{campaign.completion}%</span>
        </div>
      </div>

      {/* Affected Models */}
      <div className="glass-card-static p-6 rounded-2xl border border-white/5">
        <h3 className="text-base font-semibold mb-4">Affected Models</h3>
        <div className="flex flex-wrap gap-3">
          {campaign.modelsAffected.map(model => (
            <div key={model} className="px-4 py-3 rounded-xl bg-black/20 border border-white/5 flex items-center gap-2">
              <Car className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">{model}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
