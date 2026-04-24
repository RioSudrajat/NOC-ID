"use client";

import { motion } from "framer-motion";

interface ChartPoint {
  day?: string;
  name?: string;
  value?: number;
  revenue?: number;
}

interface WorkshopRevenueChartProps {
  data?: ChartPoint[];
  suffix?: string;
}

const defaultData: ChartPoint[] = [
  { day: "Mon", value: 120 },
  { day: "Tue", value: 450 },
  { day: "Wed", value: 300 },
  { day: "Thu", value: 600 },
  { day: "Fri", value: 250 },
  { day: "Sat", value: 800 },
  { day: "Sun", value: 150 },
];

export function WorkshopRevenueChart({ data = defaultData, suffix = "NOC" }: WorkshopRevenueChartProps) {
  const normalized = data.map(d => ({
    label: d.day ?? d.name ?? "",
    value: d.value ?? d.revenue ?? 0,
  }));

  const maxVal = Math.max(...normalized.map(d => d.value)) || 1;

  return (
    <div className="flex items-end gap-2 h-40 mt-8 pt-4 border-t w-full" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      {normalized.map((item, i) => {
        const heightPct = (item.value / maxVal) * 100;
        return (
          <div key={`${item.label}-${i}`} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${heightPct}%` }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 50 }}
              className="w-full rounded-t-sm transition-all"
              style={{ background: "linear-gradient(to top, rgba(94, 234, 212,0.2), rgba(94, 234, 212,1))" }}
            />
            <span className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>{item.label}</span>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs font-bold px-2 py-1 rounded z-20" style={{ background: "#111116", color: "var(--solana-green)", border: "1px solid rgba(94, 234, 212,0.3)" }}>
              {item.value} {suffix}
            </div>
          </div>
        );
      })}
    </div>
  );
}
