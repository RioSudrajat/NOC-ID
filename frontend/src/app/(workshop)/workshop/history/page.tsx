"use client";

import { useState, useEffect, useMemo } from "react";
import { FileText, Wrench, Droplets, Settings, Search } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { SharedServiceCard, ServiceEvent } from "@/components/ui/SharedServiceCard";
import { useBooking } from "@/context/BookingContext";
import { vehicleData } from "@/context/ActiveVehicleContext";

const initialHistory: ServiceEvent[] = [
  { id: "SRV-102", status: "ANCHORED", date: "2026-03-20", type: "Oil Change (Innova)", category: "Fluids", icon: Droplets, mechanic: "Pak Hendra", workshop: "Bengkel Hendra Motor", rating: 4.8, mileage: "45,000 km", parts: [
    { name: "Engine Oil 10W-40 (4L)", partNumber: "08880-83461", isOem: true, manufacturer: "Toyota Motor Corp", priceIDR: 350000 },
    { name: "Oil Filter", partNumber: "90915-YZZD4", isOem: true, manufacturer: "Denso Corp", priceIDR: 45000 },
  ], serviceCost: 50000, gasFee: 100, costIDR: 445100, costUSDC: 28, costNOC: 45, costStr: "Rp 445,100", txSig: "3fA9...mZ1p", healthBefore: 60, healthAfter: 98, notes: "Standard oil change. Checked fluids.", images: [] },
  { id: "SRV-101", status: "ANCHORED", date: "2026-03-18", type: "Tire Rotation (Xpander)", category: "Tires", icon: Settings, mechanic: "Pak Budi", workshop: "Bengkel Hendra Motor", rating: 4.8, mileage: "20,000 km", parts: [], serviceCost: 150000, gasFee: 100, costIDR: 150100, costUSDC: 9, costNOC: 15, costStr: "Rp 150,100", txSig: "9kL1...bN3r", healthBefore: 80, healthAfter: 85, notes: "Rotated tires, adjusted pressure.", images: [] },
];

export default function WorkshopGlobalHistory() {
  const { showToast } = useToast();
  const bookingCtx = useBooking();

  // Convert completed bookings to ServiceEvent format
  const completedAsEvents: ServiceEvent[] = useMemo(() => {
    return (bookingCtx?.completedBookings || []).map(cb => ({
      id: cb.id,
      status: "ANCHORED" as const,
      date: cb.date,
      type: `${cb.serviceType} (Booking)`,
      category: "Booking Service",
      icon: Wrench,
      mechanic: cb.workshopName,
      workshop: cb.workshopName,
      rating: cb.review?.rating || 0,
      mileage: vehicleData[cb.vehicleKey]?.odometer || "-",
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
  }, [bookingCtx?.completedBookings]);

  const [data, setData] = useState(initialHistory);

  useEffect(() => {
    const merged = [...initialHistory, ...completedAsEvents];
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setData(merged);
  }, [completedAsEvents]);

  const handleCancelInvoice = (id: string | number) => {
    setData((prev) =>
      prev.map(item => item.id === id ? { ...item, status: "CANCELLED" } : item)
    );
    showToast("info", "Invoice Cancelled", `The pending invoice for ${id} has been manually cancelled.`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <FileText className="w-7 h-7 text-teal-400" />
          Global Service Ledger
        </h1>
        <p className="text-sm mt-1 text-slate-400">Track all service invoices, payments, and blockchain anchoring statuses</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="glass-card-static px-6 py-4 rounded-xl flex flex-col shrink-0">
            <span className="text-xs text-slate-400 mb-1">Total Invoices</span>
            <span className="text-2xl font-bold">{data.length}</span>
          </div>
          <div className="glass-card-static px-6 py-4 rounded-xl flex flex-col border border-yellow-500/20 shrink-0">
            <span className="text-xs text-yellow-500/80 mb-1">Pending</span>
            <span className="text-2xl font-bold text-yellow-400">{data.filter(d => d.status === "PENDING_PAYMENT").length}</span>
          </div>
          <div className="glass-card-static px-6 py-4 rounded-xl flex flex-col border border-teal-500/20 shrink-0">
            <span className="text-xs text-teal-500/80 mb-1">Anchored</span>
            <span className="text-2xl font-bold text-teal-400">{data.filter(d => d.status === "ANCHORED").length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search invoices..." className="bg-transparent outline-none text-sm text-white w-full" />
        </div>
      </div>

      <div className="relative mt-8">
        <div className="absolute left-6 top-0 bottom-0 w-[2px] hidden md:block bg-gradient-to-b from-teal-500 to-teal-500/0" />

        <div className="flex flex-col gap-6">
          {data.map((event) => (
            <SharedServiceCard
              key={event.id}
              event={event}
              userRole="workshop"
              onCancelInvoice={handleCancelInvoice}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
