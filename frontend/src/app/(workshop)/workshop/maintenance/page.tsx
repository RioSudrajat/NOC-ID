"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Loader2, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import type { WarrantyClaimDraft } from "@/context/BookingContext";
import { useToast } from "@/components/ui/Toast";
import { useActiveVehicle, vehicleData } from "@/context/ActiveVehicleContext";
import { useBooking, type InvoiceData, type InvoicePart } from "@/context/BookingContext";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { type PartRow, emptyPart, oemCatalog, serviceTypes } from "@/components/workshop/maintenance/types";
import PartsTable from "@/components/workshop/maintenance/PartsTable";
import InvoiceBreakdown from "@/components/workshop/maintenance/InvoiceBreakdown";
import ScanPartModal from "@/components/workshop/maintenance/ScanPartModal";

function MaintenanceContent() {
  const ctx = useActiveVehicle();
  const bookingCtx = useBooking();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vin = searchParams.get("vin");
  const fromBooking = searchParams.get("fromBooking") === "true";

  let currentVehicleData = ctx?.vehicle || vehicleData.avanza;
  if (vin) {
    const v = Object.values(vehicleData).find(v => v.vin === vin);
    if (v) currentVehicleData = v;
  }

  const booking = fromBooking
    ? (Object.values(bookingCtx?.bookings || {}).find(
        (b) => b && vehicleData[b.form.vehicleKey]?.vin === (vin ?? currentVehicleData.vin)
      ) || null)
    : null;

  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [parts, setParts] = useState<PartRow[]>([emptyPart()]);
  const [serviceType, setServiceType] = useState(serviceTypes[0]);
  const [serviceCost, setServiceCost] = useState<number | "">("");
  const [techNotes, setTechNotes] = useState(booking ? `Keluhan pelanggan: ${booking.form.complaint}` : "");
  const [scanningIndex, setScanningIndex] = useState<number | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanModalScanning, setScanModalScanning] = useState(false);
  const [warrantyEnabled, setWarrantyEnabled] = useState(false);

  const addPart = () => setParts([...parts, emptyPart()]);
  const removePart = (i: number) => setParts(parts.filter((_, idx) => idx !== i));
  const updatePart = (i: number, field: keyof PartRow, value: any) => {
    const newParts = [...parts];
    (newParts[i] as any)[field] = value;
    setParts(newParts);
  };

  const handleScanPart = () => {
    setScanModalScanning(true);
    let targetIdx = parts.findIndex(p => !p.name && !p.partNumber);
    if (targetIdx === -1) { setParts(prev => [...prev, emptyPart()]); targetIdx = parts.length; }
    setScanningIndex(targetIdx);

    const randomPart = oemCatalog[Math.floor(Math.random() * oemCatalog.length)];
    setTimeout(() => {
      setParts(prev => {
        const newParts = [...prev];
        const idx = targetIdx < newParts.length ? targetIdx : newParts.length - 1;
        newParts[idx] = { name: randomPart.name, partNumber: randomPart.partNumber, isOem: true, manufacturer: randomPart.manufacturer, priceIDR: randomPart.priceIDR, scanned: true };
        return newParts;
      });
      setScanningIndex(null); setScanModalOpen(false); setScanModalScanning(false);
      showToast("success", "Part Verified ✅", `${randomPart.name} — OEM Verified by ${randomPart.manufacturer}`);
    }, 2000);
  };

  const partsTotal = parts.reduce((sum, p) => sum + (typeof p.priceIDR === "number" ? p.priceIDR : 0), 0);
  const serviceCostNum = typeof serviceCost === "number" ? serviceCost : 0;
  const INTERNAL_GAS_FEE = 100;
  const subtotal = partsTotal + serviceCostNum;
  const grandTotal = warrantyEnabled ? 0 : subtotal;

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      if (fromBooking && bookingCtx && booking) {
        const invoiceParts: InvoicePart[] = parts.filter(p => p.name.trim()).map(p => ({
          name: p.name, partNumber: p.partNumber, manufacturer: p.manufacturer, price: typeof p.priceIDR === "number" ? p.priceIDR : 0, isOEM: p.isOem,
        }));
        const invoice: InvoiceData = { parts: invoiceParts, serviceCost: serviceCostNum, gasFee: INTERNAL_GAS_FEE, totalIDR: grandTotal, serviceType, mechanicNotes: techNotes };
        bookingCtx.sendInvoice(booking.form.vehicleKey, invoice);
        if (warrantyEnabled) {
          const draft: WarrantyClaimDraft = {
            category: "Other", description: `${serviceType} — claimed under OEM warranty. Parts: ${invoiceParts.map(p => p.name).join(", ") || "(none)"}. Notes: ${techNotes || "-"}`,
            estimatedAmountIDR: subtotal, evidencePhotos: [], submittedByWorkshopId: booking.workshop.id, submittedByWorkshopName: booking.workshop.name, submittedAt: new Date().toISOString(), aiPreScore: 75,
          };
          bookingCtx.attachWarrantyClaim(booking.form.vehicleKey, draft, currentVehicleData.vin, currentVehicleData.name);
          showToast("success", "Invoice + Klaim Garansi Terkirim", "Customer dibebaskan dari biaya. Klaim garansi menunggu review enterprise.");
        } else {
          showToast("success", "Invoice Terkirim!", "Invoice telah dikirim ke pelanggan. Menunggu pembayaran.");
        }
        router.push("/workshop/bookings");
      } else {
        setParts([emptyPart()]); setServiceCost(""); setTechNotes("");
        showToast("success", "Invoice Sent to Customer!", "Awaiting payment. Service data will anchor to Solana once settled.");
      }
    }, 3000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="page-header">
        {fromBooking && (
          <Link href="/workshop/bookings" className="flex items-center gap-2 text-xs mb-4 hover:opacity-80 transition-opacity" style={{ color: "var(--solana-purple)" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Bookings
          </Link>
        )}
        <h1 className="flex items-center gap-3">
          <FileText className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          {fromBooking ? "Buat Invoice Booking" : "Add Maintenance"}
        </h1>
        <p>Record service details for {currentVehicleData.name} · VIN: {currentVehicleData.vin}</p>
      </div>

      {fromBooking && booking && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mb-8 border-l-4" style={{ borderLeftColor: "var(--solana-cyan)" }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4" style={{ color: "var(--solana-cyan)" }} />
            <h3 className="font-semibold text-sm" style={{ color: "var(--solana-cyan)" }}>Invoice untuk Booking #{booking.id}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{ color: "var(--solana-text-muted)" }}>
            <p>Jadwal: {booking.form.date} · {booking.form.time}</p>
            <p>Kendaraan: {currentVehicleData.name}</p>
            <p className="sm:col-span-2">Keluhan: {booking.form.complaint}</p>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col gap-8">
        <div className="glass-card-static p-8">
          <label className="block text-base font-semibold mb-4">Service Type</label>
          <select className="input-field" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
            {serviceTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card-static p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 text-[10px] px-3 py-1 font-bold rounded-bl-xl border-b border-l flex gap-1 items-center" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", borderColor: "rgba(34,197,94,0.2)" }}>
              <CheckCircle2 className="w-3 h-3" /> IoT Oracle Synced
            </div>
            <label className="block text-base font-semibold mb-2 mt-2">Current Mileage</label>
            <p className="text-sm mb-4" style={{ color: "var(--solana-text-muted)" }}>Auto-fetched via vehicle telematics</p>
            <div className="text-2xl font-mono font-bold tracking-wider p-4 rounded-xl inline-block" style={{ background: "rgba(15,23,42,0.5)", color: "var(--solana-text)", border: "1px solid rgba(100,116,139,0.3)" }}>
              {currentVehicleData.odometer || "12,450"} <span className="text-sm text-slate-500">KM</span>
            </div>
          </div>
          <div className="glass-card-static p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 text-[10px] px-3 py-1 font-bold rounded-bl-xl border-b border-l flex gap-1 items-center" style={{ background: "rgba(94, 234, 212,0.1)", color: "#c084fc", borderColor: "rgba(94, 234, 212,0.2)" }}>
              <ShieldCheck className="w-3 h-3" /> Blockchain Timestamp
            </div>
            <label className="block text-base font-semibold mb-2 mt-2">Service Execution Date</label>
            <p className="text-sm mb-4" style={{ color: "var(--solana-text-muted)" }}>Locked to absolute time of transaction</p>
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.5)", border: "1px dashed rgba(94, 234, 212,0.4)" }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--solana-purple)" }} />
              <span className="text-sm font-mono font-semibold" style={{ color: "var(--solana-purple)" }}>Pending Network Execution...</span>
            </div>
          </div>
        </div>

        <PartsTable parts={parts} scanningIndex={scanningIndex} onAddPart={addPart} onRemovePart={removePart} onUpdatePart={updatePart} onOpenScanModal={() => { setScanModalOpen(true); setScanModalScanning(false); }} />

        <div className="glass-card-static p-8">
          <label className="block text-base font-semibold mb-4">OBD-II Diagnostic Codes (optional)</label>
          <input type="text" className="input-field mono" placeholder="e.g. P0301, P0420 (comma separated)" />
        </div>

        <div className="glass-card-static p-8">
          <label className="block text-base font-semibold mb-4 text-white">Service Cost (Rp)</label>
          <input type="number" className="input-field font-semibold text-white" placeholder="e.g. 150000" value={serviceCost} onChange={e => setServiceCost(e.target.value ? Number(e.target.value) : "")} />
          <p className="text-xs mt-2" style={{ color: "var(--solana-text-muted)" }}>Workshop service & labor charge (excluding parts)</p>
        </div>

        <div className="glass-card-static p-8">
          <label className="block text-base font-semibold mb-4">Technician Notes</label>
          <textarea className="input-field" rows={4} placeholder="Additional observations, recommendations..." value={techNotes} onChange={(e) => setTechNotes(e.target.value)} />
        </div>

        <InvoiceBreakdown parts={parts} partsTotal={partsTotal} serviceCostNum={serviceCostNum} warrantyEnabled={warrantyEnabled} onWarrantyChange={setWarrantyEnabled} grandTotal={grandTotal} subtotal={subtotal} internalGasFee={INTERNAL_GAS_FEE} />

        <div className="glass-card-static p-8">
          <label className="block text-base font-semibold mb-4">Photo Evidence</label>
          <div className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer" style={{ borderColor: "rgba(94, 234, 212,0.2)", background: "rgba(20,20,40,0.3)" }}>
            <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--solana-text-muted)" }} />
            <p className="text-base mb-2" style={{ color: "var(--solana-text-muted)" }}>Drop images here or click to upload</p>
            <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>JPEG, PNG, WebP · Max 5 files · 10MB each</p>
          </div>
        </div>

        <ScanPartModal open={scanModalOpen} scanning={scanModalScanning} onClose={() => { setScanModalOpen(false); setScanModalScanning(false); }} onScan={handleScanPart} />

        <button onClick={handleSubmit} disabled={submitting} className="glow-btn w-full text-base gap-3 disabled:opacity-50 cursor-pointer" style={{ padding: "16px 32px" }}>
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {fromBooking ? "Mengirim Invoice..." : "Signing & Submitting to Solana..."}</>
          ) : (
            <>{fromBooking ? "Kirim Invoice ke Pelanggan" : "Submit On-Chain"}</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Maintenance Form...</div>}>
      <MaintenanceContent />
    </Suspense>
  );
}
