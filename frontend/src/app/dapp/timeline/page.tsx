"use client";

import { useState, useEffect, useMemo } from "react";
import { Filter, Search, Wrench, Droplets, ShieldCheck, Gauge, Settings } from "lucide-react";
import { SharedServiceCard, ServiceEvent } from "@/components/ui/SharedServiceCard";
import dynamic from "next/dynamic";

const PaymentModal = dynamic(
  () => import("@/components/ui/PaymentModal").then(m => ({ default: m.PaymentModal })),
  { ssr: false }
);
import { useToast } from "@/components/ui/Toast";
import { useActiveVehicle, vehicleData } from "@/context/ActiveVehicleContext";
import { useBooking } from "@/context/BookingContext";

const timelineData: Record<string, ServiceEvent[]> = {
  avanza: [
    { id: 2, status: "ANCHORED", date: "2026-02-10", type: "Oil Change", category: "Fluids", icon: Droplets, mechanic: "Pak Hendra", workshop: "Bengkel Hendra Motor", rating: 4.8, mileage: "34,521 km", parts: [
      { name: "Engine Oil 5W-30 (4L)", partNumber: "08880-83264", isOem: true, manufacturer: "Toyota Motor Corp", priceIDR: 380000 },
      { name: "Oil Filter", partNumber: "90915-YZZD4", isOem: true, manufacturer: "Denso Corp", priceIDR: 45000 },
    ], serviceCost: 50000, gasFee: 100, costIDR: 475100, costUSDC: 30, costNOC: 48, costStr: "Rp 475,100", txSig: "4xK9...mF7q", healthBefore: 45, healthAfter: 95, notes: "Filter changed. No leaks detected.", images: [] },
    { id: 3, status: "ANCHORED", date: "2026-01-15", type: "Brake Pad Replacement", category: "Brakes", icon: ShieldCheck, mechanic: "Workshop Maju Jaya", workshop: "PT Maju Jaya Auto", rating: 4.5, mileage: "31,200 km", parts: [
      { name: "Front Brake Pad Set", partNumber: "04465-BZ010", isOem: true, manufacturer: "Aisin Corp", priceIDR: 450000 },
      { name: "Brake Disc Rotor FL", partNumber: "43512-BZ130", isOem: true, manufacturer: "Toyota Motor Corp", priceIDR: 550000 },
    ], serviceCost: 150000, gasFee: 100, costIDR: 1150100, costUSDC: 72, costNOC: 115, costStr: "Rp 1,150,100", txSig: "7hR2...pK4s", healthBefore: 28, healthAfter: 100, notes: "Front pads replaced. Rotors look fine but should be checked next service.", images: [] },
  ],
  bmw_m4: [
    { id: 4, status: "ANCHORED", date: "2026-03-01", type: "Suspension Check", category: "Full Service", icon: Gauge, mechanic: "EuroHaus M Performance", workshop: "EuroHaus ID", rating: 4.9, mileage: "12,400 km", parts: [
      { name: "Alignment Calibration Kit", partNumber: "31-12-6-867-848", isOem: true, manufacturer: "BMW AG", priceIDR: 350000 },
    ], serviceCost: 500000, gasFee: 100, costIDR: 850100, costUSDC: 53, costNOC: 85, costStr: "Rp 850,100", txSig: "1B3c...A5f9", healthBefore: 88, healthAfter: 98, notes: "Suspension aligned to factory M specification.", images: [] },
    { id: 5, status: "ANCHORED", date: "2025-10-12", type: "Tire Replacement", category: "Full Service", icon: Wrench, mechanic: "Bintang Racing", workshop: "Bintang Racing", rating: 4.7, mileage: "9,800 km", parts: [
      { name: "Michelin Pilot Sport 4S (x4)", partNumber: "MPS4S-255/35R19", isOem: false, manufacturer: "Michelin", priceIDR: 16000000 },
    ], serviceCost: 500000, gasFee: 100, costIDR: 16500100, costUSDC: 1031, costNOC: 1650, costStr: "Rp 16,500,100", txSig: "9zX2...L0mN", healthBefore: 70, healthAfter: 99, notes: "All 4 tires changed. Balanced and aligned.", images: [] },
  ],
  beat: [
    { id: 6, status: "ANCHORED", date: "2026-01-05", type: "CVT & Roller Check", category: "Full Service", icon: Wrench, mechanic: "Ahass Motor", workshop: "PT Nusantara Sakti", rating: 4.5, mileage: "14,200 km", parts: [
      { name: "CVT Grease", partNumber: "08C30-K59-600ML", isOem: true, manufacturer: "Honda Motor Co", priceIDR: 35000 },
    ], serviceCost: 40000, gasFee: 100, costIDR: 75100, costUSDC: 5, costNOC: 8, costStr: "Rp 75,100", txSig: "P89q...21Wf", healthBefore: 85, healthAfter: 95, notes: "Roller and CVT cleaned, applied new grease.", images: [] },
  ],
  harley: [
    { id: 7, status: "ANCHORED", date: "2025-12-20", type: "Primary Chain Adj", category: "Full Service", icon: Wrench, mechanic: "Mabua Custom", workshop: "Mabua HD", rating: 5.0, mileage: "8,900 km", parts: [
      { name: "Primary Chaincase Fluid", partNumber: "62600025", isOem: true, manufacturer: "Harley-Davidson Inc", priceIDR: 280000 },
    ], serviceCost: 350000, gasFee: 100, costIDR: 630100, costUSDC: 39, costNOC: 63, costStr: "Rp 630,100", txSig: "X1oP...o99K", healthBefore: 90, healthAfter: 99, notes: "Tension adjusted to spec, new fluid applied.", images: [] },
  ]
};

export default function TimelinePage() {
  const ctx = useActiveVehicle();
  const bookingCtx = useBooking();
  const currentKey = ctx?.activeVehicle || "avanza";
  const currentVehicleData = ctx?.currentVehicleData || vehicleData.avanza;
  const currentEvents = timelineData[currentKey] || timelineData.avanza;

  const { showToast } = useToast();

  // Convert completed bookings to ServiceEvent format
  const completedAsEvents: ServiceEvent[] = useMemo(() => {
    return (bookingCtx?.completedBookings || [])
      .filter(cb => cb.vehicleKey === currentKey)
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
  }, [bookingCtx?.completedBookings, currentKey]);

  const [data, setData] = useState(currentEvents);

  useEffect(() => {
    // Merge static + completed booking events, sorted by date desc
    const merged = [...(timelineData[currentKey] || timelineData.avanza), ...completedAsEvents];
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setData(merged);
  }, [currentKey, completedAsEvents]);

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
