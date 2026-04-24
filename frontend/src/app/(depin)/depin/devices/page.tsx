"use client";

import { useState } from "react";
import { Cpu, Plus } from "lucide-react";

const registered = [
  { unit: "#NMS-0001", device: "GPS-PHN-001", type: "Smartphone", status: "Active", registered: "15 Jan 2026" },
  { unit: "#NMS-0042", device: "GPS-PHN-042", type: "Smartphone", status: "Active", registered: "20 Jan 2026" },
];

export default function DevicesPage() {
  const [deviceId, setDeviceId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [deviceType, setDeviceType] = useState("Smartphone");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // mock submit
    alert(`Device terdaftar:\n${deviceId} → ${unitId} (${deviceType})`);
    setDeviceId("");
    setUnitId("");
  };

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] gradient-text mb-2 flex items-center gap-3">
          <Cpu size={32} style={{ color: "#5EEAD4" }} />
          GPS Device Registration
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Daftarkan IMEI atau Device ID kendaraan ke jaringan Nemesis DePIN
        </p>

        {/* Info banner */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.4)",
          }}
        >
          <p className="text-sm text-blue-100">
            <strong>Info:</strong> Daftarkan IMEI atau Device ID kendaraan ke jaringan Nemesis DePIN. MVP: gunakan IMEI smartphone sebagai GPS tracker.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Daftarkan Device Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-400 uppercase mb-2 block">Device ID</label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="IMEI: 35xxxx..."
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase mb-2 block">Vehicle Unit ID</label>
              <input
                type="text"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                placeholder="#NMS-0042"
                className="input-field w-full"
                required
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="text-xs text-gray-400 uppercase mb-2 block">Device Type</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="input-field w-full md:w-1/2"
            >
              <option value="Smartphone">Smartphone</option>
              <option value="Hardware GPS">Hardware GPS</option>
            </select>
          </div>
          <button type="submit" className="glow-btn inline-flex items-center gap-2">
            <Plus size={16} />
            Daftarkan Device
          </button>
        </form>

        {/* Registered devices */}
        <h3 className="text-lg font-bold text-white mb-4">Registered Devices</h3>
        <div
          className="rounded-2xl overflow-hidden"
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
                <th className="text-left py-3 px-4">Unit ID</th>
                <th className="text-left py-3 px-4">Device ID</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Registered</th>
              </tr>
            </thead>
            <tbody>
              {registered.map((r, idx) => (
                <tr
                  key={idx}
                  className="border-t"
                  style={{ borderColor: "rgba(94,234,212,0.1)" }}
                >
                  <td className="py-3 px-4 font-mono text-white">{r.unit}</td>
                  <td className="py-3 px-4 font-mono text-gray-300">{r.device}</td>
                  <td className="py-3 px-4 text-gray-300">{r.type}</td>
                  <td className="py-3 px-4">
                    <span className="badge badge-green text-xs">{r.status}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{r.registered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
