"use client";

import Link from "next/link";
import { Clock, FileText, ShieldCheck } from "lucide-react";
import { useAdminStore } from "@/store/useAdminStore";
import { useUserStore } from "@/store/useUserStore";

export default function WorkshopPendingPage() {
  const registrations = useAdminStore((state) => state.pendingRegistrations);
  const currentUser = useUserStore((state) => state.currentUser);
  const latest =
    registrations.find((item) => item.submittedByUserId === currentUser?.userId) ??
    registrations.find((item) => item.workshopId === currentUser?.workshopId) ??
    registrations[0];
  const status = currentUser?.workshopStatus ?? latest?.status ?? "pending_kyc";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Workshop verification</p>
        <h1 className="text-3xl font-bold mt-2">{status === "rejected" ? "Registration Rejected" : "Under Review"}</h1>
      </div>
      <div className="glass-card p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: FileText, label: "Submitted", done: true },
            { icon: Clock, label: "Under Review", done: status !== "rejected" },
            { icon: ShieldCheck, label: "Decision", done: status === "approved" || status === "rejected" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`rounded-lg border p-4 ${item.done ? "border-teal-400/40 bg-teal-400/10" : "border-white/10 bg-white/5"}`}>
                <Icon className="h-5 w-5 mb-3" />
                <p className="font-semibold">{item.label}</p>
              </div>
            );
          })}
        </div>
        {status === "rejected" && (
          <div className="mt-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-100">
            {latest?.rejectionReason ?? "Dokumen perlu direvisi."}
          </div>
        )}
        {status !== "approved" ? (
          <Link href="/workshop/register" className="mt-6 inline-flex rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15">
            Revisi & Resubmit
          </Link>
        ) : (
          <Link href="/workshop" className="mt-6 inline-flex rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15">
            Masuk Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
