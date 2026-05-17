"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEnterpriseAuditStore } from "@/store/useEnterpriseStore";
import { useVehicleMintingStore } from "@/store/useVehicleMintingStore";

export default function EnterpriseAuditDetailPage() {
  const params = useParams<{ auditId: string }>();
  const router = useRouter();
  const hydrate = useEnterpriseAuditStore((state) => state.hydrate);
  const hydrateRequests = useVehicleMintingStore((state) => state.hydrate);
  const approveAudit = useEnterpriseAuditStore((state) => state.approveAudit);
  const rejectAudit = useEnterpriseAuditStore((state) => state.rejectAudit);
  const audit = useEnterpriseAuditStore((state) => state.pendingAudits.find((item) => item.auditId === params.auditId));
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    hydrate();
    hydrateRequests();
  }, [hydrate, hydrateRequests]);

  if (!audit) return <div className="glass-card p-6">Audit not found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Mint review</p>
        <h1 className="text-3xl font-bold mt-2">{audit.make} {audit.model}</h1>
      </div>
      <div className="glass-card p-6 grid gap-3 md:grid-cols-2">
        <p>VIN: {audit.vin}</p>
        <p>Plate: {audit.licensePlate}</p>
        <p>Owner docs: {audit.ownerNameOnDocs}</p>
        <p>Odometer: {audit.odometerKm.toLocaleString("id-ID")} km</p>
        <p>Condition: {audit.overallConditionScore}%</p>
        <p>Status: {audit.status}</p>
      </div>
      <div className="glass-card p-6">
        <p className="font-semibold mb-3">Component health</p>
        <div className="grid gap-2">
          {audit.componentHealth.map((item) => (
            <div key={item.componentId} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span>{item.componentName}</span>
              <span>{item.conditionScore}%</span>
            </div>
          ))}
        </div>
      </div>
      <textarea className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Reject notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      <div className="flex gap-3">
        <button
          onClick={() => setConfirmOpen(true)}
          className="glow-btn px-5 py-2"
        >
          Approve to Mint NFT Identity
        </button>
        <button
          onClick={() => {
            rejectAudit(audit.auditId, notes || "Audit evidence incomplete.");
            router.push("/enterprise/audits");
          }}
          className="rounded-lg bg-red-500/20 px-5 py-2 text-red-100"
        >
          Reject with Notes
        </button>
      </div>
      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="glass-card max-w-lg p-6">
            <h2 className="text-xl font-bold">Confirm NFT Mint</h2>
            <p className="mt-3 text-sm text-slate-300">
              Approving this audit will mint a vehicle identity into user escrow and notify the user to claim it.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmOpen(false)} className="rounded-lg bg-white/10 px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={() => {
                  approveAudit(audit.auditId);
                  setConfirmOpen(false);
                  router.push("/enterprise/audits");
                }}
                className="glow-btn px-4 py-2 text-sm"
              >
                Mint to Escrow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
