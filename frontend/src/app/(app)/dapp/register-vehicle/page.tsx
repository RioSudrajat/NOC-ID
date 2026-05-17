"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, ClipboardList, ShieldCheck } from "lucide-react";
import { mergeRegisteredWorkshops } from "@/data/workshops";
import { useAdminStore } from "@/store/useAdminStore";
import { useUserStore } from "@/store/useUserStore";
import { useVehicleMintingStore } from "@/store/useVehicleMintingStore";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";
import type { VehicleMintRequest } from "@/types/audit";

const statusLabel: Record<VehicleMintRequest["status"], string> = {
  requested: "Sent to workshop",
  scheduled: "Scheduled",
  in_audit: "Audit in progress",
  audit_submitted: "Audit submitted",
  enterprise_review: "Enterprise review",
  minted_escrow: "NFT ready to claim",
  claimed: "Claimed",
  rejected: "Rejected",
};

const makeOptions = ["Toyota", "Honda", "BMW", "Harley-Davidson", "Mercedes-Benz", "Yamaha", "Suzuki", "Mitsubishi", "Other"];

const modelSuggestions: Record<string, string[]> = {
  Toyota: ["Supra", "Avanza", "Innova", "Fortuner", "Camry"],
  Honda: ["PCX 150", "Vario", "Civic", "CR-V", "Brio"],
  BMW: ["M4 G82", "330i", "X5", "M2"],
  "Harley-Davidson": ["Sportster S", "Fat Boy", "Street Bob"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLC"],
  Yamaha: ["NMAX", "Aerox", "R15"],
  Suzuki: ["Ertiga", "XL7", "Satria"],
  Mitsubishi: ["Pajero Sport", "Xpander", "Triton"],
};

export default function RegisterVehiclePage() {
  const hydrateAdmin = useAdminStore((state) => state.hydrate);
  const getWorkshopCredentials = useAdminStore((state) => state.getWorkshopCredentials);
  const registrations = useAdminStore((state) => state.pendingRegistrations);
  const currentUser = useUserStore((state) => state.currentUser);
  const claimVehicle = useUserStore((state) => state.claimVehicle);
  const hydrateRequests = useVehicleMintingStore((state) => state.hydrate);
  const submitRequest = useVehicleMintingStore((state) => state.submitRequest);
  const markClaimed = useVehicleMintingStore((state) => state.markClaimed);
  const requests = useVehicleMintingStore((state) => state.requests);
  const updateVehicle = useVehicleRegistryStore((state) => state.updateVehicle);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    vin: "",
    licensePlate: "",
    preferredDate: "",
    notes: "",
    workshopId: "",
  });

  useEffect(() => {
    hydrateAdmin();
    hydrateRequests();
  }, [hydrateAdmin, hydrateRequests]);

  const auditWorkshops = useMemo(
    () =>
      mergeRegisteredWorkshops(registrations).filter((workshop) =>
        getWorkshopCredentials(workshop.id).some(
          (credential) => credential.credential === "manufacturer_audit_partner",
        ),
      ),
    [getWorkshopCredentials, registrations],
  );

  useEffect(() => {
    if (!form.workshopId && auditWorkshops[0]) {
      queueMicrotask(() => {
        setForm((current) => ({ ...current, workshopId: auditWorkshops[0].id }));
      });
    }
  }, [auditWorkshops, form.workshopId]);

  const selectedWorkshop = auditWorkshops.find((workshop) => workshop.id === form.workshopId);
  const userRequests = requests.filter((request) => request.userId === (currentUser?.userId ?? "usr-demo-user"));

  function submit() {
    if (!selectedWorkshop) return;
    const entry = submitRequest({
      userId: currentUser?.userId ?? "usr-demo-user",
      userName: currentUser?.displayName ?? "Demo User",
      userContact: currentUser?.email ?? currentUser?.phone ?? "demo@nocid.id",
      workshopId: selectedWorkshop.id,
      workshopName: selectedWorkshop.name,
      make: form.make,
      model: form.model,
      year: Number(form.year),
      vin: form.vin,
      licensePlate: form.licensePlate,
      preferredDate: form.preferredDate,
      notes: form.notes,
    });
    setLastSubmittedId(entry.requestId);
  }

  function claim(request: VehicleMintRequest) {
    if (!request.mintedVehicleId) return;
    updateVehicle(request.mintedVehicleId, { mintStatus: "minted" });
    claimVehicle(request.mintedVehicleId);
    markClaimed(request.requestId);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Second vehicle registration</p>
        <h1 className="text-3xl font-bold mt-2">Daftarkan Kendaraan</h1>
      </div>

      {lastSubmittedId && (
        <div className="glass-card p-5 flex items-start gap-3 border border-teal-400/30">
          <CheckCircle2 className="h-5 w-5 text-teal-300" />
          <div>
            <p className="font-semibold">Request sent to {selectedWorkshop?.name}</p>
            <p className="text-sm text-slate-400">Request ID: {lastSubmittedId}. Bengkel sekarang bisa melihat request ini di Workshop &gt; Vehicle Audit.</p>
          </div>
        </div>
      )}

      <div className="glass-card p-6 grid gap-4 md:grid-cols-2">
        <Field label="Make / manufacturer" hint="Brand kendaraan, misalnya Honda, Toyota, BMW.">
          <select className="rounded-lg bg-slate-900 px-4 py-3 outline-none" value={makeOptions.includes(form.make) ? form.make : form.make ? "Other" : ""} onChange={(event) => setForm((current) => ({ ...current, make: event.target.value === "Other" ? "" : event.target.value, model: "" }))}>
            <option value="">Select make</option>
            {makeOptions.map((make) => <option key={make} value={make}>{make}</option>)}
          </select>
        </Field>
        <Field label="Selected or custom make" hint="Isi manual kalau brand tidak tersedia di dropdown.">
          <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Contoh: Mazda" value={form.make} onChange={(event) => setForm((current) => ({ ...current, make: event.target.value }))} />
        </Field>
        <Field label="Model / variant" hint="Nama model kendaraan.">
          <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" list="request-model-suggestions" placeholder="Contoh: PCX 150, Supra, M4 G82" value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} />
          <datalist id="request-model-suggestions">
            {(modelSuggestions[form.make] ?? []).map((model) => <option key={model} value={model} />)}
          </datalist>
        </Field>
        <Field label="Year" hint="Tahun produksi kendaraan, tidak diisi otomatis.">
          <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" min={1950} max={new Date().getFullYear()} placeholder="Contoh: 2018" type="number" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} />
        </Field>
        <Field label="VIN" hint="Nomor identifikasi kendaraan dari rangka/STNK.">
          <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Contoh: MH1KF1810HK150001" value={form.vin} onChange={(event) => setForm((current) => ({ ...current, vin: event.target.value.toUpperCase() }))} />
        </Field>
        <Field label="License plate" hint="Plat nomor kendaraan.">
          <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Contoh: B 1234 NOC" value={form.licensePlate} onChange={(event) => setForm((current) => ({ ...current, licensePlate: event.target.value.toUpperCase() }))} />
        </Field>
        <Field label="Preferred audit date" hint="Tanggal yang diinginkan untuk audit fisik.">
          <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" type="date" value={form.preferredDate} onChange={(event) => setForm((current) => ({ ...current, preferredDate: event.target.value }))} />
        </Field>
        <Field label="Audit workshop" hint="Hanya workshop dengan credential manufacturer audit partner.">
          <select className="rounded-lg bg-slate-900 px-4 py-3 outline-none" value={form.workshopId} onChange={(event) => setForm((current) => ({ ...current, workshopId: event.target.value }))}>
            {auditWorkshops.map((workshop) => (
              <option key={workshop.id} value={workshop.id}>{workshop.name} - {workshop.city}</option>
            ))}
          </select>
        </Field>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">Notes for workshop</span>
          <textarea className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Keluhan, kondisi kendaraan, atau info jadwal" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
        </label>
      </div>

      <div className="glass-card p-5 flex items-start gap-3">
        <CalendarCheck className="h-5 w-5 text-teal-300" />
        <p className="text-sm text-slate-300">
          Request ini masuk ke workshop yang punya credential manufacturer_audit_partner. Setelah audit disubmit, enterprise akan review dan mint NFT identity ke escrow user.
        </p>
      </div>

      <button onClick={submit} disabled={!form.make || !form.model || !form.year || !form.vin || !selectedWorkshop} className="glow-btn px-5 py-2 disabled:opacity-50">
        Submit Request
      </button>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-teal-300" /> Request Status</h2>
        <div className="grid gap-3">
          {userRequests.map((request) => (
            <div key={request.requestId} className="glass-card p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{request.make} {request.model} {request.year}</p>
                <p className="text-xs text-slate-400">{request.workshopName} - {request.vin}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{statusLabel[request.status]}</span>
                {request.status === "minted_escrow" && (
                  <button onClick={() => claim(request)} className="glow-btn px-3 py-1.5 text-xs flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Claim NFT
                  </button>
                )}
                {request.mintedVehicleId && <Link href="/dapp/identity" className="text-xs text-teal-300">View Identity</Link>}
              </div>
            </div>
          ))}
          {userRequests.length === 0 && <div className="glass-card p-5 text-sm text-slate-400">Belum ada request kendaraan lama.</div>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">{label}</span>
      {children}
      <span className="text-[11px] text-slate-500">{hint}</span>
    </label>
  );
}
