"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ShieldPlus } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api/client";
import { signAndSendSerializedTransaction } from "@/lib/phantomTransactions";
import { useAdminStore } from "@/store/useAdminStore";
import { useUserStore } from "@/store/useUserStore";
import type { WorkshopCredential } from "@/types/admin";

const grantable: WorkshopCredential[] = ["oem_certified", "manufacturer_audit_partner"];

export default function EnterpriseWorkshopCredentialsPage() {
  const params = useParams<{ workshopId: string }>();
  const { showToast } = useToast();
  const hydrate = useAdminStore((state) => state.hydrate);
  const credentials = useAdminStore((state) => state.getWorkshopCredentials(params.workshopId));
  const grantCredential = useAdminStore((state) => state.grantCredential);
  const revokeCredential = useAdminStore((state) => state.revokeCredential);
  const currentUser = useUserStore((state) => state.currentUser);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const handleGrant = async (credential: WorkshopCredential) => {
    try {
      if (!currentUser?.selfCustodyAddress) {
        showToast("error", "Wallet belum terhubung", "Login enterprise dengan Phantom dulu sebelum grant credential.");
        return;
      }
      const enterpriseId = currentUser.enterpriseId ?? "ent-astra";
      const draft = await api.createCredentialGrantDraft({
        workshopId: params.workshopId,
        credential,
        issuedBy: enterpriseId,
        enterpriseId,
        issuerWallet: currentUser.selfCustodyAddress,
      });
      const signed = await signAndSendSerializedTransaction(draft.transactionBase64);
      await api.confirmCredentialGrant({
        workshopId: params.workshopId,
        credential,
        issuedBy: enterpriseId,
        enterpriseId,
        issuerWallet: currentUser.selfCustodyAddress,
        signature: signed.signature,
        credentialRecordPda: draft.credentialRecordPda,
      });
      grantCredential(params.workshopId, credential, enterpriseId, enterpriseId);
      showToast("success", "Credential Granted", `${credential} granted on-chain. Fee ${(signed.feeSol ?? 0).toFixed(8)} SOL.`);
    } catch (error) {
      showToast("error", "Grant credential gagal", error instanceof Error ? error.message : "Credential grant transaction gagal.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Partner credential</p>
        <h1 className="text-3xl font-bold mt-2">Workshop {params.workshopId}</h1>
      </div>
      <div className="glass-card p-6">
        <p className="font-semibold mb-4">Active Credentials</p>
        <div className="flex flex-wrap gap-2">
          {credentials.map((item) => (
            <button key={item.credentialId} onClick={() => revokeCredential(item.credentialId, "Revoked by enterprise admin")} className="rounded-full bg-teal-400/10 px-3 py-1 text-sm text-teal-200">
              {item.credential}
            </button>
          ))}
          {credentials.length === 0 && <p className="text-sm text-slate-400">No active credentials.</p>}
        </div>
      </div>
      <div className="glass-card p-6">
        <p className="font-semibold mb-4">Grant Credential</p>
        <div className="grid gap-3 md:grid-cols-2">
          {grantable.map((credential) => (
            <button key={credential} onClick={() => handleGrant(credential)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left hover:border-teal-300">
              <ShieldPlus className="h-4 w-4 mb-2 text-teal-300" />
              {credential}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
