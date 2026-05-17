"use client";

import { useState, useEffect, useMemo } from "react";
import { Filter, Search, Wrench, Droplets, ShieldCheck, Gauge, Settings } from "lucide-react";
import { SharedServiceCard, ServiceEvent, type PartItem } from "@/components/ui/SharedServiceCard";
import dynamic from "next/dynamic";

const PaymentModal = dynamic(
  () => import("@/components/ui/PaymentModal").then(m => ({ default: m.PaymentModal })),
  { ssr: false }
);
import { useToast } from "@/components/ui/Toast";
import { useActiveVehicle, vehicleData } from "@/context/ActiveVehicleContext";
import { useBooking } from "@/context/BookingContext";
import { api } from "@/lib/api/client";

const timelineData: Record<string, ServiceEvent[]> = {
  bmw_m4: [
    { id: 4, status: "ANCHORED", date: "2026-03-01", type: "Suspension Check", category: "Full Service", icon: Gauge, mechanic: "EuroHaus M Performance", workshop: "EuroHaus ID", rating: 4.9, mileage: "12,400 km", parts: [
      { name: "Alignment Calibration Kit", partNumber: "31-12-6-867-848", isOem: true, manufacturer: "BMW AG", priceIDR: 350000 },
    ], serviceCost: 500000, gasFee: 100, costIDR: 850100, costUSDC: 53, costNOC: 85, costStr: "Rp 850,100", txSig: "1B3c...A5f9", healthBefore: 88, healthAfter: 98, notes: "Suspension aligned to factory M specification.", images: [] },
    { id: 5, status: "ANCHORED", date: "2025-10-12", type: "Tire Replacement", category: "Full Service", icon: Wrench, mechanic: "Bintang Racing", workshop: "Bintang Racing", rating: 4.7, mileage: "9,800 km", parts: [
      { name: "Michelin Pilot Sport 4S (x4)", partNumber: "MPS4S-255/35R19", isOem: false, manufacturer: "Michelin", priceIDR: 16000000 },
    ], serviceCost: 500000, gasFee: 100, costIDR: 16500100, costUSDC: 1031, costNOC: 1650, costStr: "Rp 16,500,100", txSig: "9zX2...L0mN", healthBefore: 70, healthAfter: 99, notes: "All 4 tires changed. Balanced and aligned.", images: [] },
  ],
  harley: [
    { id: 7, status: "ANCHORED", date: "2025-12-20", type: "Primary Chain Adj", category: "Full Service", icon: Wrench, mechanic: "Mabua Custom", workshop: "Mabua HD", rating: 5.0, mileage: "8,900 km", parts: [
      { name: "Primary Chaincase Fluid", partNumber: "62600025", isOem: true, manufacturer: "Harley-Davidson Inc", priceIDR: 280000 },
    ], serviceCost: 350000, gasFee: 100, costIDR: 630100, costUSDC: 39, costNOC: 63, costStr: "Rp 630,100", txSig: "X1oP...o99K", healthBefore: 90, healthAfter: 99, notes: "Tension adjusted to spec, new fluid applied.", images: [] },
  ]
};

function readText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapInvoiceParts(parts: unknown): PartItem[] {
  if (!Array.isArray(parts)) return [];
  return parts.map((raw, index) => {
    const part = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    return {
      name: readText(part.name ?? part.componentName, `Part ${index + 1}`),
      partNumber: readText(part.partNumber, "-"),
      isOem: Boolean(part.isOem ?? part.isOEM ?? true),
      manufacturer: readText(part.manufacturer, "NOC"),
      priceIDR: readNumber(part.priceIDR ?? part.priceIdr ?? part.price),
    };
  }).filter((part) => part.name !== "-" || part.priceIDR > 0);
}

export default function TimelinePage() {
  const ctx = useActiveVehicle();
  const bookingCtx = useBooking();
  const currentKey = ctx?.activeVehicle || "bmw_m4";
  const activeVehicleId = ctx?.activeVehicleId;
  const isDemoVehicle = ctx?.activeVehicleIdentity.isDemo ?? true;
  const currentVehicleData = ctx?.currentVehicleData || vehicleData.bmw_m4;
  const currentEvents = isDemoVehicle ? (timelineData[currentKey] || timelineData.bmw_m4) : [];

  const { showToast } = useToast();

  // Convert completed bookings to ServiceEvent format
  const completedAsEvents: ServiceEvent[] = useMemo(() => {
    return (bookingCtx?.completedBookings || [])
      .filter(cb => cb.vehicleKey === currentKey || cb.vehicleKey === activeVehicleId)
      .map(cb => ({
        id: cb.id,
        status: "ANCHORED" as const,
        date: cb.date,
        type: cb.serviceType,
        category: "Booking Service",
        icon: Wrench,
        mechanic: cb.workshopName,
        workshop: cb.workshopName,
        rating: cb.review?.rating || 0,
        mileage: vehicleData[cb.vehicleKey]?.mileage || "-",
        parts: cb.parts.map(p => ({
          name: p.name,
          partNumber: p.partNumber,
          isOem: p.isOEM,
          manufacturer: p.manufacturer,
          priceIDR: p.price,
        })),
        serviceCost: cb.serviceCost,
        gasFee: cb.gasFee,
        costIDR: cb.totalIDR,
        costUSDC: Math.round(cb.totalIDR / 16000 * 100) / 100,
        costNOC: Math.round(cb.totalIDR / 52),
        costStr: `Rp ${cb.totalIDR.toLocaleString("id-ID")}`,
        txSig: cb.txSig,
        healthBefore: 60,
        healthAfter: 95,
        notes: cb.mechanicNotes || "Servis via booking NOC ID.",
        images: [],
      }));
  }, [activeVehicleId, bookingCtx?.completedBookings, currentKey]);

  const [data, setData] = useState(currentEvents);

  useEffect(() => {
    let cancelled = false;
    async function loadTimeline() {
      const staticEvents = [...(isDemoVehicle ? (timelineData[currentKey] || timelineData.bmw_m4) : []), ...completedAsEvents];
      if (!activeVehicleId) {
        setData(staticEvents);
        return;
      }
      try {
        const response = await api.vehicleTimeline(activeVehicleId);
        const backendEvents = response.items
          .filter((entry) => entry.type === "service_log")
          .map((entry, index) => {
            const item = entry.item as Record<string, any>;
            const booking = item.booking as Record<string, any> | undefined;
            const invoice = booking?.invoice as Record<string, any> | undefined;
            const txSig = typeof item.txSignature === "string" ? item.txSignature : null;
            const parts = mapInvoiceParts(invoice?.parts);
            return {
              id: item.id ?? `backend-${index}`,
              status: "ANCHORED" as const,
              date: String(entry.at).slice(0, 10),
              type: invoice?.serviceType ?? "Service Log",
              category: "Devnet Anchored",
              icon: Wrench,
              mechanic: item.workshop?.name ?? "Verified Workshop",
              workshop: item.workshop?.name ?? "Verified Workshop",
              rating: 0,
              mileage: `${item.odometerKm ?? currentVehicleData.mileage} km`,
              parts,
              serviceCost: invoice?.serviceCost ?? 0,
              gasFee: invoice?.gasFee ?? 0,
              costIDR: invoice?.totalIdr ?? 0,
              costUSDC: invoice?.totalIdr ? Math.round(Number(invoice.totalIdr) / 16000 * 100) / 100 : 0,
              costNOC: invoice?.totalIdr ? Math.round(Number(invoice.totalIdr) / 52) : 0,
              costStr: invoice?.totalIdr ? `Rp ${Number(invoice.totalIdr).toLocaleString("id-ID")}` : "Rp 0",
              txSig,
              healthBefore: 70,
              healthAfter: currentVehicleData.health,
              notes: invoice?.mechanicNotes ?? "Service log anchored via backend devnet flow.",
              images: [],
            } satisfies ServiceEvent;
          });
        const merged = [...backendEvents, ...staticEvents];
        merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (!cancelled) setData(merged);
      } catch {
        const merged = staticEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (!cancelled) setData(merged);
      }
    }
    void loadTimeline();
    return () => { cancelled = true; };
  }, [activeVehicleId, currentKey, completedAsEvents, currentVehicleData.health, currentVehicleData.mileage, isDemoVehicle]);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | number | null>(null);

  const selectedEvent = data.find((e) => e.id === selectedEventId);

  const openPaymentModal = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEventId(id);
    setPaymentModalOpen(true);
  };

  const handlePaymentComplete = () => {
    if (selectedEventId) {
      setData((prevData) =>
        prevData.map((ev) =>
          ev.id === selectedEventId
            ? { ...ev, status: "ANCHORED", txSig: "8yP3...qL9z" }
            : ev
        )
      );
      showToast("success", "Payment Verified", "Service has been anchored to the blockchain.");
    }
  };

  const handleDispute = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Are you sure you want to reject this invoice? The workshop will be notified.")) {
       setData((prevData) => prevData.map(ev => ev.id === id ? { ...ev, status: "REJECTED"} : ev));
       showToast("info", "Invoice Rejected", "The workshop has been notified of your dispute.");
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Service Timeline</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-semibold px-2 py-1 rounded bg-white/5 border border-slate-700/50 text-slate-300">
              {currentVehicleData.name}
            </span>
            <span className="text-xs text-slate-500 font-mono border-l border-slate-700 pl-2">
              {currentVehicleData.vin}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(20,20,40,0.5)", border: "1px solid rgba(94, 234, 212,0.2)" }}>
            <Search className="w-4 h-4" style={{ color: "var(--solana-text-muted)" }} />
            <input type="text" placeholder="Search events..." className="bg-transparent outline-none text-sm" style={{ color: "var(--solana-text)" }} />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(94, 234, 212,0.1)", border: "1px solid rgba(94, 234, 212,0.2)", color: "var(--solana-text-muted)" }}>
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-[2px] hidden md:block" style={{ background: "linear-gradient(180deg, var(--solana-purple), var(--solana-green), transparent)" }} />

        <div className="flex flex-col gap-8">
          {data.map((event) => (
            <SharedServiceCard
              key={event.id}
              event={event}
              userRole="user"
              onPayNow={openPaymentModal}
              onDispute={handleDispute}
            />
          ))}
        </div>
      </div>

      {selectedEvent && paymentModalOpen && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          serviceDetails={{
            serviceName: selectedEvent.type,
            description: `${selectedEvent.workshop} - ${selectedEvent.mechanic}`,
            amountIDR: selectedEvent.costIDR,
            amountUSDC: selectedEvent.costUSDC,
            amountNOC: selectedEvent.costNOC,
          }}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
