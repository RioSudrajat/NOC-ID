"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useEnterpriseAuditStore } from "@/store/useEnterpriseStore";

export default function WorkshopAuditDetailPage() {
  const params = useParams<{ auditId: string }>();
  const hydrate = useEnterpriseAuditStore((state) => state.hydrate);
  const audit = useEnterpriseAuditStore((state) => state.pendingAudits.find((item) => item.auditId === params.auditId));

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!audit) return <div className="glass-card p-6">Audit not found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Audit detail</p>
        <h1 className="text-3xl font-bold mt-2">{audit.make} {audit.model}</h1>
      </div>
      <div className="glass-card p-6 grid gap-4 md:grid-cols-4">
        {["submitted", "under_review", "approved", "minted"].map((status) => (
          <div key={status} className={`rounded-lg border p-4 ${audit.status === status || audit.status === "minted" ? "border-teal-400/40 bg-teal-400/10" : "border-white/10 bg-white/5"}`}>
            <p className="text-sm font-semibold capitalize">{status.replace("_", " ")}</p>
          </div>
        ))}
      </div>
      <div className="glass-card p-6">
        <p className="font-semibold">VIN {audit.vin}</p>
        <p className="mt-2 text-sm text-slate-400">Overall condition: {audit.overallConditionScore}% · Status: {audit.status}</p>
        {audit.mintedVehicleId && <p className="mt-2 text-sm text-teal-300">Minted vehicle: {audit.mintedVehicleId}</p>}
      </div>
    </div>
  );
}

