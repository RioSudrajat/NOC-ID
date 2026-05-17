"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ClipboardCheck, Plus, UserRound } from "lucide-react";
import { useAdminStore } from "@/store/useAdminStore";
import { useEnterpriseAuditStore } from "@/store/useEnterpriseStore";
import { useUserStore } from "@/store/useUserStore";
import { useVehicleMintingStore } from "@/store/useVehicleMintingStore";

const requestStatuses = new Set(["requested", "scheduled", "in_audit"]);

export default function WorkshopAuditPage() {
  const currentUser = useUserStore((state) => state.currentUser);
  const hydrateAdmin = useAdminStore((state) => state.hydrate);
  const hasPermission = useAdminStore((state) => state.hasPermission);
  const hydrateAudits = useEnterpriseAuditStore((state) => state.hydrate);
  const audits = useEnterpriseAuditStore((state) => state.pendingAudits);
  const hydrateRequests = useVehicleMintingStore((state) => state.hydrate);
  const requests = useVehicleMintingStore((state) => state.requests);
  const workshopId = currentUser?.workshopId ?? "ws-3";
  const canAudit = hasPermission(workshopId, "audit_vehicle");
  const workshopRequests = requests.filter((request) => request.workshopId === workshopId);
  const openRequests = workshopRequests.filter((request) => requestStatuses.has(request.status));

  useEffect(() => {
    hydrateAdmin();
    hydrateAudits();
    hydrateRequests();
  }, [hydrateAdmin, hydrateAudits, hydrateRequests]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Second vehicle minting</p>
          <h1 className="text-3xl font-bold mt-2">Vehicle Audit</h1>
          <p className="mt-2 text-sm text-slate-400">Workshop ID: {workshopId}</p>
        </div>
        {canAudit && (
          <Link href="/workshop/audit/new" className="glow-btn px-4 py-2 flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" /> Manual Audit
          </Link>
        )}
      </div>

      {!canAudit && (
        <div className="glass-card p-5">
          <p className="font-semibold">Manufacturer audit credential required.</p>
          <p className="text-sm mt-2" style={{ color: "var(--solana-text-muted)" }}>
            Enterprise partner harus grant manufacturer_audit_partner sebelum workshop bisa submit mint audit.
          </p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2"><UserRound className="h-5 w-5 text-teal-300" /> User Audit Requests</h2>
        <div className="grid gap-3">
          {openRequests.map((request) => (
            <div key={request.requestId} className="glass-card p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{request.make} {request.model} {request.year}</p>
                <p className="text-xs text-slate-400">{request.userName} - {request.userContact} - VIN {request.vin}</p>
                {request.notes && <p className="text-xs text-slate-500 mt-1">{request.notes}</p>}
              </div>
              <Link href={`/workshop/audit/new?requestId=${request.requestId}`} className="glow-btn px-4 py-2 text-sm text-center">
                Start Audit
              </Link>
            </div>
          ))}
          {openRequests.length === 0 && <div className="glass-card p-6 text-sm text-slate-400">Belum ada request user untuk workshop ini.</div>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-teal-300" /> Submitted Audits</h2>
        <div className="grid gap-3">
          {audits.filter((audit) => audit.workshopId === workshopId).map((audit) => (
            <Link key={audit.auditId} href={`/workshop/audit/${audit.auditId}`} className="glass-card p-4 flex items-center justify-between hover:bg-white/5">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5 text-teal-300" />
                <div>
                  <p className="font-semibold">{audit.make} {audit.model}</p>
                  <p className="text-xs text-slate-400">{audit.vin} - {audit.status}</p>
                </div>
              </div>
              <span className="text-xs uppercase text-teal-300">{audit.overallConditionScore}%</span>
            </Link>
          ))}
          {audits.filter((audit) => audit.workshopId === workshopId).length === 0 && <div className="glass-card p-6 text-sm text-slate-400">No audits submitted yet.</div>}
        </div>
      </section>
    </div>
  );
}

