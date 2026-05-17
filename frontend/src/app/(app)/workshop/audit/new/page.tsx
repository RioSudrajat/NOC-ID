"use client";

import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Gauge, ImagePlus, ListChecks, ScanLine, UserCheck } from "lucide-react";
import { useEnterpriseAuditStore } from "@/store/useEnterpriseStore";
import { useUserStore } from "@/store/useUserStore";
import { useVehicleMintingStore } from "@/store/useVehicleMintingStore";
import {
  AUDIT_COMPONENT_TEMPLATES,
  type ComponentHealthEntry,
  type VehicleAuditReport,
} from "@/types/audit";
import type { VehicleCategory } from "@/types/vehicle";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const stepMeta = [
  { id: 1, label: "Vehicle ID", icon: ScanLine },
  { id: 2, label: "Docs", icon: FileText },
  { id: 3, label: "Odometer", icon: Gauge },
  { id: 4, label: "Components", icon: ListChecks },
  { id: 5, label: "Evidence", icon: ImagePlus },
  { id: 6, label: "Review", icon: UserCheck },
] as const;

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

function createComponentEntries(category: VehicleCategory): ComponentHealthEntry[] {
  return AUDIT_COMPONENT_TEMPLATES[category].map((item) => ({
    componentId: item.componentId,
    componentName: item.componentName,
    conditionScore: 85,
    notes: "",
  }));
}

export default function NewAuditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const currentUser = useUserStore((state) => state.currentUser);
  const submitAuditReport = useEnterpriseAuditStore((state) => state.submitAuditReport);
  const hydrateRequests = useVehicleMintingStore((state) => state.hydrate);
  const requests = useVehicleMintingStore((state) => state.requests);
  const updateRequest = useVehicleMintingStore((state) => state.updateRequest);
  const attachAudit = useVehicleMintingStore((state) => state.attachAudit);
  const request = requests.find((item) => item.requestId === requestId);
  const initializedRequestId = useRef<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<VehicleCategory>("car");
  const [componentHealth, setComponentHealth] = useState<ComponentHealthEntry[]>(createComponentEntries("car"));
  const [form, setForm] = useState({
    vin: "",
    frameNumber: "",
    engineNumber: "",
    licensePlate: "",
    make: "",
    model: "",
    year: "",
    color: "",
    ownerNameOnDocs: "",
    odometerKm: 0,
    bpkbFileRef: "",
    stnkFileRef: "",
    odometerPhotoRef: "",
    diagnosticReportRef: "",
    photoRefs: "",
    mechanicNotes: "",
  });

  useEffect(() => {
    hydrateRequests();
  }, [hydrateRequests]);

  useEffect(() => {
    if (!request) return;
    if (initializedRequestId.current !== request.requestId) {
      initializedRequestId.current = request.requestId;
      queueMicrotask(() => {
        setForm((current) => ({
          ...current,
          vin: request.vin,
          licensePlate: request.licensePlate ?? current.licensePlate,
          make: request.make,
          model: request.model,
          year: String(request.year || ""),
        }));
      });
    }
    if (request.status === "requested" || request.status === "scheduled") {
      updateRequest(request.requestId, { status: "in_audit" });
    }
  }, [request, updateRequest]);

  const score = useMemo(
    () => Math.round(componentHealth.reduce((sum, item) => sum + item.conditionScore, 0) / componentHealth.length),
    [componentHealth],
  );

  function changeCategory(nextCategory: VehicleCategory) {
    setCategory(nextCategory);
    setComponentHealth(createComponentEntries(nextCategory));
  }

  function submit() {
    const report: VehicleAuditReport = {
      auditId: `AUD-${Date.now()}`,
      requestId: request?.requestId,
      workshopId: currentUser?.workshopId ?? request?.workshopId ?? "ws-3",
      mechanicId: currentUser?.userId ?? "mech-demo",
      submittedForUserId: request?.userId ?? "usr-demo-user",
      ...form,
      year: Number(form.year),
      category,
      photoRefs: form.photoRefs.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 10),
      componentHealth,
      overallConditionScore: score,
      auditedAt: new Date().toISOString(),
      status: "submitted",
    };
    submitAuditReport(report);
    if (request) {
      attachAudit(request.requestId, report);
    }
    router.push(`/workshop/audit/${report.auditId}`);
  }

  const photoFields = form.photoRefs.split(",").map((item) => item.trim());
  while (photoFields.length < 10) photoFields.push("");

  function updatePhotoRef(index: number, value: string) {
    const next = [...photoFields];
    next[index] = value;
    setForm((current) => ({
      ...current,
      photoRefs: next.map((item) => item.trim()).filter(Boolean).join(", "),
    }));
  }

  function setFileRef(field: "bpkbFileRef" | "stnkFileRef" | "odometerPhotoRef" | "diagnosticReportRef", event: ChangeEvent<HTMLInputElement>) {
    const fileName = event.target.files?.[0]?.name ?? "";
    if (!fileName) return;
    setForm((current) => ({ ...current, [field]: fileName }));
  }

  function setPhotoFileRef(index: number, event: ChangeEvent<HTMLInputElement>) {
    const fileName = event.target.files?.[0]?.name ?? "";
    if (fileName) updatePhotoRef(index, fileName);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Audit form</p>
        <h1 className="text-3xl font-bold mt-2">Start New Audit</h1>
        {request && <p className="mt-2 text-sm text-slate-400">Linked request: {request.requestId} from {request.userName}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {stepMeta.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setStep(item.id)}
              className={`rounded-lg border p-3 text-left ${step === item.id ? "border-teal-400 bg-teal-400/10" : "border-white/10 bg-white/5"}`}
            >
              <Icon className="h-4 w-4 mb-2" />
              <p className="text-xs font-semibold">{item.label}</p>
            </button>
          );
        })}
      </div>

      <div className="glass-card p-6">
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="VIN" hint="Nomor identifikasi kendaraan dari rangka/STNK.">
              <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Contoh: MH1KF1810HK150001" value={form.vin} onChange={(event) => setForm((current) => ({ ...current, vin: event.target.value.toUpperCase() }))} />
            </Field>
            <Field label="Frame number" hint="Nomor rangka fisik kendaraan.">
              <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Nomor rangka" value={form.frameNumber} onChange={(event) => setForm((current) => ({ ...current, frameNumber: event.target.value.toUpperCase() }))} />
            </Field>
            <Field label="Engine number" hint="Nomor mesin dari kendaraan.">
              <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Nomor mesin" value={form.engineNumber} onChange={(event) => setForm((current) => ({ ...current, engineNumber: event.target.value.toUpperCase() }))} />
            </Field>
            <Field label="License plate" hint="Plat nomor aktif.">
              <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Contoh: B 1234 NOC" value={form.licensePlate} onChange={(event) => setForm((current) => ({ ...current, licensePlate: event.target.value.toUpperCase() }))} />
            </Field>
            <Field label="Make / manufacturer" hint="Pilih brand kendaraan, misalnya Honda, Toyota, BMW.">
              <select className="rounded-lg bg-slate-900 px-4 py-3 outline-none" value={makeOptions.includes(form.make) ? form.make : form.make ? "Other" : ""} onChange={(event) => setForm((current) => ({ ...current, make: event.target.value === "Other" ? "" : event.target.value, model: "" }))}>
                <option value="">Select make</option>
                {makeOptions.map((make) => <option key={make} value={make}>{make}</option>)}
              </select>
            </Field>
            <Field label="Selected or custom make" hint="Pakai ini kalau brand tidak ada di dropdown.">
              <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Contoh: Mazda" value={form.make} onChange={(event) => setForm((current) => ({ ...current, make: event.target.value }))} />
            </Field>
            <Field label="Model / variant" hint="Nama model kendaraan.">
              <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" list="audit-model-suggestions" placeholder="Contoh: PCX 150, Supra, M4 G82" value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} />
              <datalist id="audit-model-suggestions">
                {(modelSuggestions[form.make] ?? []).map((model) => <option key={model} value={model} />)}
              </datalist>
            </Field>
            <Field label="Year" hint="Tahun produksi kendaraan.">
              <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" min={1950} max={new Date().getFullYear()} placeholder="Contoh: 2018" type="number" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} />
            </Field>
            <Field label="Color" hint="Warna dominan kendaraan.">
              <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Contoh: Pearl White" value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} />
            </Field>
            <select className="rounded-lg bg-slate-900 px-4 py-3 outline-none" value={category} onChange={(event) => changeCategory(event.target.value as VehicleCategory)}>
              <option value="car">Car</option>
              <option value="motorcycle_matic">Motorcycle Matic</option>
              <option value="motorcycle_big">Motorcycle Big</option>
            </select>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Owner name on documents" hint="Nama pemilik sesuai BPKB/STNK.">
              <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Nama pemilik" value={form.ownerNameOnDocs} onChange={(event) => setForm((current) => ({ ...current, ownerNameOnDocs: event.target.value }))} />
            </Field>
            <FileField label="BPKB document" value={form.bpkbFileRef} accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setFileRef("bpkbFileRef", event)} />
            <FileField label="STNK document" value={form.stnkFileRef} accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setFileRef("stnkFileRef", event)} />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Odometer km" hint="Angka kilometer pada cluster kendaraan.">
              <input className="rounded-lg bg-white/10 px-4 py-3 outline-none" min={0} type="number" placeholder="Contoh: 48250" value={form.odometerKm || ""} onChange={(event) => setForm((current) => ({ ...current, odometerKm: Number(event.target.value) }))} />
            </Field>
            <FileField label="Odometer photo" value={form.odometerPhotoRef} accept="image/*" onChange={(event) => setFileRef("odometerPhotoRef", event)} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="font-semibold">Component Health - overall {score}%</p>
            <div className="grid gap-3 md:grid-cols-2">
              {componentHealth.map((item) => (
                <div key={item.componentId} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{item.componentName}</p>
                    <span className="text-sm text-teal-300">{item.conditionScore}</span>
                  </div>
                  <input
                    className="mt-3 w-full"
                    type="range"
                    min={0}
                    max={100}
                    value={item.conditionScore}
                    onChange={(event) => setComponentHealth((current) => current.map((entry) => entry.componentId === item.componentId ? { ...entry, conditionScore: Number(event.target.value) } : entry))}
                  />
                  <input
                    className="mt-3 w-full rounded-lg bg-black/20 px-3 py-2 text-xs outline-none"
                    placeholder="Component notes"
                    value={item.notes ?? ""}
                    onChange={(event) => setComponentHealth((current) => current.map((entry) => entry.componentId === item.componentId ? { ...entry, notes: event.target.value } : entry))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {photoFields.slice(0, 10).map((value, index) => (
                <FileField
                  key={index}
                  value={value}
                  label={`Evidence photo ${index + 1}`}
                  accept="image/*"
                  onChange={(event) => setPhotoFileRef(index, event)}
                />
              ))}
            </div>
            <FileField label="Diagnostic report" value={form.diagnosticReportRef} accept=".pdf,.csv,.txt,.jpg,.jpeg,.png" onChange={(event) => setFileRef("diagnosticReportRef", event)} />
            <textarea className="rounded-lg bg-white/10 px-4 py-3 outline-none" placeholder="Catatan mekanik, temuan inspeksi, dan rekomendasi" value={form.mechanicNotes} onChange={(event) => setForm((current) => ({ ...current, mechanicNotes: event.target.value }))} />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-white/5 p-4"><p className="text-xs text-slate-400">Vehicle</p><p className="font-semibold">{form.make} {form.model} {form.year}</p></div>
              <div className="rounded-lg bg-white/5 p-4"><p className="text-xs text-slate-400">VIN</p><p className="font-semibold">{form.vin || "-"}</p></div>
              <div className="rounded-lg bg-white/5 p-4"><p className="text-xs text-slate-400">Score</p><p className="font-semibold text-teal-300">{score}%</p></div>
            </div>
            <p className="text-sm text-slate-400">Submit akan mengirim audit lengkap ke Enterprise Audits dan mengubah request user menjadi Enterprise Review.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStep((current) => Math.max(1, current - 1) as Step)} className="rounded-lg bg-white/10 px-4 py-2">Back</button>
        {step < 6 ? (
          <button onClick={() => setStep((current) => Math.min(6, current + 1) as Step)} className="glow-btn px-5 py-2">Next</button>
        ) : (
          <button onClick={submit} className="glow-btn px-5 py-2">Submit Audit to Enterprise</button>
        )}
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

function FileField({ label, value, accept, onChange }: { label: string; value: string; accept: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">{label}</span>
      <input type="file" accept={accept} onChange={onChange} className="text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-teal-400/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-200 hover:file:bg-teal-400/25" />
      <span className="min-h-5 text-xs text-slate-400">{value ? `Selected: ${value}` : "No file selected"}</span>
    </label>
  );
}
