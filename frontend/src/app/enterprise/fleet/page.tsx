"use client";

import { motion } from "framer-motion";
import { Map, Car, Shield, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";

const regions = [
  { name: "Jakarta", vehicles: 1240, healthy: 1050, warning: 150, critical: 40, color: "var(--solana-purple)" },
  { name: "Surabaya", vehicles: 860, healthy: 720, warning: 110, critical: 30, color: "var(--solana-green)" },
  { name: "Bandung", vehicles: 620, healthy: 530, warning: 70, critical: 20, color: "var(--solana-cyan)" },
  { name: "Medan", vehicles: 380, healthy: 320, warning: 45, critical: 15, color: "#FACC15" },
  { name: "Semarang", vehicles: 290, healthy: 255, warning: 25, critical: 10, color: "#F97316" },
  { name: "Makassar", vehicles: 210, healthy: 185, warning: 20, critical: 5, color: "var(--solana-pink)" },
];

const vehicleList = [
  { vin: "MHKA1BA1JFK000001", model: "Avanza 2025", region: "Jakarta", health: 87, status: "Good" },
  { vin: "MHKA1BA1JFK000042", model: "Rush 2024", region: "Jakarta", health: 45, status: "Critical" },
  { vin: "MHKA1BA1JFK000108", model: "Innova 2025", region: "Surabaya", health: 92, status: "Excellent" },
  { vin: "MHKA1BA1JFK000215", model: "Fortuner 2024", region: "Bandung", health: 68, status: "Warning" },
  { vin: "MHKA1BA1JFK000330", model: "Yaris 2025", region: "Medan", health: 95, status: "Excellent" },
  { vin: "MHKA1BA1JFK000411", model: "Calya 2024", region: "Semarang", health: 55, status: "Warning" },
];

function getHealthColor(health: number) {
  if (health >= 90) return "#22C55E";
  if (health >= 70) return "#A3E635";
  if (health >= 50) return "#FACC15";
  if (health >= 30) return "#F97316";
  return "#EF4444";
}

export default function FleetPage() {
  const totalVehicles = regions.reduce((a, r) => a + r.vehicles, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="flex items-center gap-3">
          <Map className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          Fleet Map
        </h1>
        <p>Vehicle distribution across regions</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
        {[
          { icon: Car, label: "Total Vehicles", value: totalVehicles.toLocaleString(), color: "var(--solana-purple)" },
          { icon: CheckCircle2, label: "Healthy", value: "3,060", color: "#22C55E" },
          { icon: AlertTriangle, label: "Warnings", value: "420", color: "#FACC15" },
          { icon: Shield, label: "Critical", value: "120", color: "#EF4444" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 lg:p-8">
            <s.icon className="w-6 h-6 mb-3" style={{ color: s.color }} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Region breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        <div className="glass-card-static p-8">
          <h3 className="text-base font-semibold mb-6">Regional Distribution</h3>
          <div className="flex flex-col gap-6">
            {regions.map((r, i) => (
              <div key={i} className="flex items-center gap-4">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: r.color }} />
                <span className="text-sm w-24">{r.name}</span>
                <div className="flex-1 h-6 rounded-md overflow-hidden flex" style={{ background: "rgba(20,20,40,0.5)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(r.healthy / r.vehicles) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.08 }} className="h-full" style={{ background: "#22C55E", opacity: 0.6 }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(r.warning / r.vehicles) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.08 + 0.1 }} className="h-full" style={{ background: "#FACC15", opacity: 0.6 }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(r.critical / r.vehicles) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.08 + 0.2 }} className="h-full" style={{ background: "#EF4444", opacity: 0.6 }} />
                </div>
                <span className="text-sm font-semibold mono w-16 text-right">{r.vehicles.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map placeholder */}
        <div className="glass-card-static p-8 flex items-center justify-center" style={{ minHeight: 320 }}>
          <div className="text-center">
            <Map className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--solana-text-muted)", opacity: 0.2 }} />
            <p className="text-sm font-semibold" style={{ color: "var(--solana-text-muted)" }}>Interactive Fleet Map</p>
            <p className="text-xs" style={{ color: "var(--solana-text-muted)", opacity: 0.6 }}>Powered by Mapbox · Coming Soon</p>
          </div>
        </div>
      </div>

      {/* Vehicle list */}
      <h2 className="text-xl font-semibold mb-6">Recent Vehicles</h2>
      <div className="glass-card-static overflow-hidden">
        <table className="data-table">
          <thead><tr><th>VIN</th><th>Model</th><th>Region</th><th>Health</th><th>Status</th></tr></thead>
          <tbody>
            {vehicleList.map((v, i) => (
              <tr key={i}>
                <td><span className="mono text-xs">{v.vin}</span></td>
                <td>{v.model}</td>
                <td style={{ color: "var(--solana-text-muted)" }}>{v.region}</td>
                <td><span className="font-bold mono" style={{ color: getHealthColor(v.health) }}>{v.health}</span></td>
                <td><span className="badge" style={{ background: `${getHealthColor(v.health)}15`, color: getHealthColor(v.health), border: `1px solid ${getHealthColor(v.health)}40` }}>{v.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
