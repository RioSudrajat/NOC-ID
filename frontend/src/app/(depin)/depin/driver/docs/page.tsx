"use client";

import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  Upload,
  Camera,
  AlertTriangle,
} from "lucide-react";

type DocStatus = "verified" | "pending" | "empty";

type Doc = {
  label: string;
  note: string;
  status: DocStatus;
  icon: React.ReactNode;
  action: string;
};

const docs: Doc[] = [
  {
    label: "KTP",
    note: "Diupload 5 hari lalu",
    status: "verified",
    icon: <FileText size={24} style={{ color: "#5EEAD4" }} />,
    action: "Lihat Dokumen",
  },
  {
    label: "SIM",
    note: "Uploaded 2 hari lalu",
    status: "pending",
    icon: <FileText size={24} style={{ color: "#F59E0B" }} />,
    action: "Lihat",
  },
  {
    label: "Selfie + KTP",
    note: "Foto kamu sambil pegang KTP",
    status: "empty",
    icon: <Camera size={24} style={{ color: "#888" }} />,
    action: "Upload",
  },
];

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === "verified") {
    return (
      <span className="badge badge-green text-xs inline-flex items-center gap-1">
        <CheckCircle2 size={12} /> Terverifikasi
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span
        className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full"
        style={{
          background: "rgba(245,158,11,0.15)",
          color: "#F59E0B",
          border: "1px solid rgba(245,158,11,0.4)",
        }}
      >
        <Clock size={12} /> Pending
      </span>
    );
  }
  return (
    <span
      className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full"
      style={{
        background: "rgba(156,163,175,0.15)",
        color: "#9CA3AF",
        border: "1px solid rgba(156,163,175,0.4)",
      }}
    >
      <Upload size={12} /> Belum Upload
    </span>
  );
}

export default function DriverDocsPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      <div className="max-w-[480px] mx-auto p-4">
        <Link
          href="/depin/driver"
          className="text-sm inline-flex items-center gap-1 mb-4"
          style={{ color: "#5EEAD4" }}
        >
          ← Kembali
        </Link>

        <h1 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] gradient-text mb-6 flex items-center gap-2">
          <FileText size={24} style={{ color: "#5EEAD4" }} />
          Dokumen KYC
        </h1>

        {/* Overall status banner */}
        <div
          className="glass-card p-4 mb-6 flex items-start gap-3"
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.4)",
          }}
        >
          <AlertTriangle size={22} style={{ color: "#F59E0B" }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-100">Status: Menunggu Verifikasi</p>
            <p className="text-xs text-amber-200/80 mt-1">
              1 dari 3 dokumen masih diproses.
            </p>
          </div>
        </div>

        {/* Document cards */}
        <div className="space-y-3 mb-6">
          {docs.map((d, i) => (
            <div key={i} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {d.icon}
                  <div>
                    <h3 className="text-base font-bold text-white">{d.label}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{d.note}</p>
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <button
                className={
                  d.status === "empty"
                    ? "glow-btn w-full text-sm py-2"
                    : "glow-btn-outline w-full text-sm py-2"
                }
              >
                {d.action}
              </button>
            </div>
          ))}
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center">
          Verifikasi biasanya memakan 1-2 hari kerja
        </p>
      </div>
    </div>
  );
}
