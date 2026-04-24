"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Car, Calendar, Shield, Wrench, Eye, Share2 } from "lucide-react";
import { useBookingStore } from "@/store/useBookingStore";
import { vehicleData, type VehicleKey } from "@/context/ActiveVehicleContext";
import { getHealthColor, getHealthStatus } from "@/lib/health";
import type { BookingRequest } from "@/types/booking";

export default function QueueDetailPage({ params }: { params: Promise<{ queueId: string }> }) {
  const { queueId } = use(params);
  const bookings = useBookingStore(s => s.bookings);

  const item = useMemo(() => {
    return Object.values(bookings).find(
      (b): b is BookingRequest => !!b && b.id === queueId && (b.status === "ACCEPTED" || b.status === "IN_SERVICE")
    ) || null;
  }, [bookings, queueId]);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <ClipboardList className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-gray-400 mb-4">Queue item not found.</p>
        <Link href="/workshop/queue" className="text-sm underline" style={{ color: "#5EEAD4" }}>Back to Queue</Link>
      </div>
    );
  }

  const vKey = item.form.vehicleKey as VehicleKey;
  const vehicle = vehicleData[vKey];
  const isInService = item.status === "IN_SERVICE";

  return (
    <div>
      <Link href="/workshop/queue" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: "#5EEAD4" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <ClipboardList className="w-7 h-7" style={{ color: "#5EEAD4" }} />
        <div>
          <h1 className="font-bold text-2xl">Queue: {item.id}</h1>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium mt-1 inline-block"
            style={{
              background: isInService ? "rgba(94,234,212,0.15)" : "rgba(134,239,172,0.15)",
              color: isInService ? "#5EEAD4" : "#86EFAC",
              border: `1px solid ${isInService ? "rgba(94,234,212,0.4)" : "rgba(134,239,172,0.4)"}`,
            }}
          >
            {isInService ? "In Service" : "Waiting"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Car className="w-4 h-4" style={{ color: "#5EEAD4" }} /> Vehicle</h3>
          {vehicle ? (
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-400">Model:</span> <span className="font-medium">{vehicle.name}</span></div>
              <div><span className="text-gray-400">VIN:</span> <span className="mono text-xs">{vehicle.vin}</span></div>
              <div><span className="text-gray-400">Mileage:</span> <span className="font-medium">{vehicle.odometer}</span></div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Health:</span>
                <span className="font-bold mono px-2 py-0.5 rounded-md text-sm" style={{ color: getHealthColor(vehicle.health), background: `${getHealthColor(vehicle.health)}15` }}>
                  {vehicle.health} — {getHealthStatus(vehicle.health)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Vehicle data unavailable.</p>
          )}
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" style={{ color: "#5EEAD4" }} /> Booking Details</h3>
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Workshop:</span> <span className="font-medium">{item.workshop.name}</span></div>
            <div><span className="text-gray-400">Date:</span> <span className="font-medium">{item.form.date}</span></div>
            <div><span className="text-gray-400">Time:</span> <span className="font-medium">{item.form.time}</span></div>
            <div><span className="text-gray-400">Type:</span> <span className="font-medium capitalize">{item.type}</span></div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl mb-8">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Wrench className="w-4 h-4" style={{ color: "#5EEAD4" }} /> Customer Complaint</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{item.form.complaint || "No complaint specified."}</p>
      </div>

      <div className="glass-card p-6 rounded-2xl mb-8">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Shield className="w-4 h-4" style={{ color: "#5EEAD4" }} /> Data Access Permissions</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4" style={{ color: item.form.shareHistory ? "#86EFAC" : "#6B7280" }} />
            <span className={item.form.shareHistory ? "text-green-300" : "text-gray-500"}>Service History: {item.form.shareHistory ? "Shared" : "Not shared"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Share2 className="w-4 h-4" style={{ color: item.form.shareDigitalTwin ? "#86EFAC" : "#6B7280" }} />
            <span className={item.form.shareDigitalTwin ? "text-green-300" : "text-gray-500"}>Digital Twin: {item.form.shareDigitalTwin ? "Shared" : "Not shared"}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {!isInService && (
          <button className="px-6 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(94,234,212,0.15)", color: "#5EEAD4", border: "1px solid rgba(94,234,212,0.3)" }}>
            Start Service
          </button>
        )}
        {isInService && (
          <button className="px-6 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(94,234,212,0.15)", color: "#5EEAD4", border: "1px solid rgba(94,234,212,0.3)" }}>
            Send Invoice
          </button>
        )}
      </div>
    </div>
  );
}
