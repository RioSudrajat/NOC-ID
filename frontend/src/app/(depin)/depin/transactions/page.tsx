"use client";

import { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";

const filters = [
  { id: "all", label: "Semua" },
  { id: "Social", label: "Social" },
  { id: "Operator", label: "Operator" },
  { id: "Investor", label: "Investor" },
  { id: "Referral", label: "Referral" },
];

type Row = {
  date: string;
  activity: string;
  category: string;
  points: number;
  status: "Confirmed" | "Pending";
};

const rows: Row[] = [
  { date: "24 Apr 2026 14:23", activity: "Quest: Follow Twitter", category: "Social", points: 100, status: "Confirmed" },
  { date: "24 Apr 2026 13:10", activity: "Quest: Join Telegram", category: "Social", points: 100, status: "Confirmed" },
  { date: "23 Apr 2026 09:42", activity: "Pool distribution", category: "Investor", points: 200, status: "Confirmed" },
  { date: "22 Apr 2026 16:00", activity: "Connect Wallet", category: "Social", points: 100, status: "Confirmed" },
  { date: "20 Apr 2026 11:15", activity: "Referral: oper...abc4", category: "Referral", points: 500, status: "Pending" },
  { date: "18 Apr 2026 10:00", activity: "Hold 30 hari bonus", category: "Social", points: 200, status: "Confirmed" },
  { date: "15 Apr 2026 14:20", activity: "Weekly top 500", category: "Social", points: 150, status: "Confirmed" },
  { date: "12 Apr 2026 08:45", activity: "Pool distribution", category: "Investor", points: 200, status: "Confirmed" },
  { date: "10 Apr 2026 16:30", activity: "Referral: NMS7...def5", category: "Referral", points: 500, status: "Confirmed" },
  { date: "5 Apr 2026 09:00", activity: "Join Discord", category: "Social", points: 100, status: "Confirmed" },
];

export default function TransactionsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered =
    activeFilter === "all"
      ? rows
      : rows.filter((r) => r.category === activeFilter);

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] gradient-text mb-2">
          Riwayat Poin
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Transparent — setiap poin ditambah dicatat on-chain
        </p>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={
                activeFilter === f.id
                  ? "glow-btn text-xs px-4 py-2"
                  : "glow-btn-outline text-xs px-4 py-2"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{
            background: "rgba(34,38,46,0.7)",
            border: "1px solid rgba(94,234,212,0.25)",
          }}
        >
          <table className="w-full data-table text-sm">
            <thead>
              <tr
                style={{
                  background: "rgba(94,234,212,0.08)",
                  color: "#5EEAD4",
                }}
              >
                <th className="text-left py-3 px-4">Tanggal</th>
                <th className="text-left py-3 px-4">Aktivitas</th>
                <th className="text-left py-3 px-4">Kategori</th>
                <th className="text-right py-3 px-4">Poin</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-t hover:bg-white/5 transition"
                  style={{ borderColor: "rgba(94,234,212,0.1)" }}
                >
                  <td className="py-3 px-4 text-gray-300">{row.date}</td>
                  <td className="py-3 px-4 text-white">{row.activity}</td>
                  <td className="py-3 px-4">
                    <span className="badge text-xs">{row.category}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold" style={{ color: "#5EEAD4" }}>
                    +{row.points}
                  </td>
                  <td className="py-3 px-4">
                    {row.status === "Confirmed" ? (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#5EEAD4" }}>
                        <CheckCircle2 size={14} /> Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#F59E0B" }}>
                        <Clock size={14} /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Page 1 of 3</span>
          <div className="flex gap-2">
            <button className="glow-btn-outline text-xs px-4 py-2" disabled>
              Prev
            </button>
            <button className="glow-btn-outline text-xs px-4 py-2">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
