"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useEnterpriseAuditStore } from "@/store/useEnterpriseStore";
import { useVehicleMintingStore } from "@/store/useVehicleMintingStore";
import type { AuditStatus } from "@/types/audit";

export default function EnterpriseAuditsPage() {
  const hydrate = useEnterpriseAuditStore((state) => state.hydrate);
  const hydrateRequests = useVehicleMintingStore((state) => state.hydrate);
  const audits = useEnterpriseAuditStore((state) => state.pendingAudits);
  const [status, setStatus] = useState<AuditStatus | "all">("all");

  useEffect(() => {
    hydrate();
    hydrateRequests();
  }, [hydrate, hydrateRequests]);

  const visible = status === "all" ? audits : audits.filter((audit) => audit.status === status);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Enterprise review</p>
        <h1 className="text-3xl font-bold mt-2">Vehicle Audits</h1>
      </div>
      <select className="rounded-lg bg-slate-900 px-4 py-3 outline-none" value={status} onChange={(event) => setStatus(event.target.value as AuditStatus | "all")}>
        <option value="all">All status</option>
        <option value="submitted">Submitted</option>
        <option value="under_review">Under review</option>
        <option value="minted">Minted</option>
        <option value="rejected">Rejected</option>
      </select>
      <div className="grid gap-3">
        {visible.map((audit) => (
          <Link key={audit.auditId} href={`/enterprise/audits/${audit.auditId}`} className="glass-card p-4 flex items-center justify-between hover:bg-white/5">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-teal-300" />
              <div>
                <p className="font-semibold">{audit.make} {audit.model}</p>
                <p className="text-xs text-slate-400">{audit.workshopId} · {audit.status}</p>
              </div>
            </div>
            <span className="text-xs text-teal-300">{audit.overallConditionScore}%</span>
          </Link>
        ))}
        {visible.length === 0 && <div className="glass-card p-6 text-sm text-slate-400">No matching audits.</div>}
      </div>
    </div>
  );
}
