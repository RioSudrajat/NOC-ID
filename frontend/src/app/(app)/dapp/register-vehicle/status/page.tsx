"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useVehicleMintingStore } from "@/store/useVehicleMintingStore";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";
import type { VehicleMintRequest } from "@/types/audit";

const statusLabel: Record<VehicleMintRequest["status"], string> = {
  requested: "Request sent",
  scheduled: "Scheduled",
  in_audit: "Audit in progress",
  audit_submitted: "Audit submitted",
  enterprise_review: "Enterprise review",
  minted_escrow: "NFT ready to claim",
  claimed: "Claimed",
  rejected: "Rejected",
};

function StatusIcon({ status }: { status: VehicleMintRequest["status"] }) {
  if (status === "claimed" || status === "minted_escrow") return <CheckCircle2 className="h-5 w-5 text-teal-300" />;
  if (status === "rejected") return <XCircle className="h-5 w-5 text-red-300" />;
  return <Clock className="h-5 w-5 text-yellow-300" />;
}

export default function RegisterVehicleStatusPage() {
  const currentUser = useUserStore((state) => state.currentUser);
  const claimVehicle = useUserStore((state) => state.claimVehicle);
  const hydrateRequests = useVehicleMintingStore((state) => state.hydrate);
  const requests = useVehicleMintingStore((state) => state.requests);
  const markClaimed = useVehicleMintingStore((state) => state.markClaimed);
  const updateVehicle = useVehicleRegistryStore((state) => state.updateVehicle);

  useEffect(() => {
    hydrateRequests();
  }, [hydrateRequests]);

  const userRequests = requests.filter((request) => request.userId === (currentUser?.userId ?? "usr-demo-user"));

  function claim(request: VehicleMintRequest) {
    if (!request.mintedVehicleId) return;
    updateVehicle(request.mintedVehicleId, { mintStatus: "minted" });
    claimVehicle(request.mintedVehicleId);
    markClaimed(request.requestId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Second vehicle registration</p>
          <h1 className="mt-2 text-3xl font-bold">Audit & NFT Claim Status</h1>
        </div>
        <Link href="/dapp/register-vehicle" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15">
          New Request
        </Link>
      </div>

      <div className="grid gap-3">
        {userRequests.map((request) => (
          <div key={request.requestId} className="glass-card p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-3">
                <StatusIcon status={request.status} />
                <div>
                  <p className="font-semibold">{request.make} {request.model} {request.year}</p>
                  <p className="text-xs text-slate-400">{request.requestId} · VIN {request.vin} · {request.workshopName}</p>
                  {request.rejectionReason && <p className="mt-2 text-xs text-red-200">{request.rejectionReason}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{statusLabel[request.status]}</span>
                {request.status === "minted_escrow" && (
                  <button onClick={() => claim(request)} className="glow-btn flex items-center gap-1 px-3 py-1.5 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5" /> Claim NFT
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {userRequests.length === 0 && (
          <div className="glass-card p-6 text-sm text-slate-400">
            Belum ada request kendaraan lama. Mulai dari halaman register vehicle.
          </div>
        )}
      </div>
    </div>
  );
}
