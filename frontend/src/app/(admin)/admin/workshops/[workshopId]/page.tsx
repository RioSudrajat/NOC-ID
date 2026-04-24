"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Store, Star, MapPin, Phone, Clock, Shield, CheckCircle2, Wrench } from "lucide-react";
import { workshopsById } from "@/data/workshops";

export default function AdminWorkshopDetailPage({ params }: { params: Promise<{ workshopId: string }> }) {
  const { workshopId } = use(params);
  const workshop = workshopsById.get(workshopId) || null;

  if (!workshop) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Store className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-gray-400 mb-4">Workshop not found.</p>
        <Link href="/admin/workshops" className="text-sm underline" style={{ color: "#5EEAD4" }}>Back to Workshops</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/workshops" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: "#5EEAD4" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Workshops
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <Store className="w-7 h-7" style={{ color: "#5EEAD4" }} />
        <div>
          <h1 className="font-bold text-2xl">{workshop.name}</h1>
          <div className="flex gap-2 mt-1">
            {workshop.verified && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(134,239,172,0.15)", color: "#86EFAC" }}>
                <CheckCircle2 className="w-3 h-3 inline mr-1" /> Verified
              </span>
            )}
            {workshop.oem && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(94,234,212,0.1)", color: "#5EEAD4" }}>
                OEM Authorized
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl">
          <Star className="w-5 h-5 mb-2" style={{ color: "#FCD34D" }} />
          <p className="text-2xl font-bold">{workshop.rating.toFixed(1)}</p>
          <p className="text-xs text-gray-400">{workshop.totalReviews} reviews</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <Wrench className="w-5 h-5 mb-2" style={{ color: "#5EEAD4" }} />
          <p className="text-2xl font-bold">{workshop.totalServices}</p>
          <p className="text-xs text-gray-400">Total Services</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <MapPin className="w-5 h-5 mb-2" style={{ color: "#5EEAD4" }} />
          <p className="text-lg font-bold">{workshop.city}</p>
          <p className="text-xs text-gray-400">{workshop.location}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <Shield className="w-5 h-5 mb-2" style={{ color: "#5EEAD4" }} />
          <p className="text-lg font-bold">{workshop.specialization}</p>
          <p className="text-xs text-gray-400">Specialization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" style={{ color: "#5EEAD4" }} /> Location</h3>
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Address:</span> <span className="font-medium">{workshop.address}</span></div>
            <div><span className="text-gray-400">City:</span> <span className="font-medium">{workshop.city}</span></div>
            <div><span className="text-gray-400">Coordinates:</span> <span className="mono text-xs">{workshop.coordinates.lat}, {workshop.coordinates.lng}</span></div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: "#5EEAD4" }} /> Operating Hours</h3>
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Weekday:</span> <span className="font-medium">{workshop.operatingHours.weekday}</span></div>
            <div><span className="text-gray-400">Weekend:</span> <span className="font-medium">{workshop.operatingHours.weekend}</span></div>
            <div><span className="text-gray-400">Phone:</span> <span className="font-medium">{workshop.phone}</span></div>
          </div>
        </div>
      </div>

      {workshop.badges.length > 0 && (
        <div className="glass-card p-6 rounded-2xl mb-8">
          <h3 className="text-sm font-semibold mb-4">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {workshop.badges.map((b, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(94,234,212,0.1)", color: "#5EEAD4", border: "1px solid rgba(94,234,212,0.2)" }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {Object.keys(workshop.serviceBreakdown).length > 0 && (
        <div className="glass-card p-6 rounded-2xl mb-8">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Wrench className="w-4 h-4" style={{ color: "#5EEAD4" }} /> Service Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(workshop.serviceBreakdown).map(([type, count]) => (
              <div key={type} className="flex items-center gap-4">
                <span className="text-sm w-40">{type}</span>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(20,20,40,0.5)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(count / Math.max(workshop.totalServices, 1)) * 100}%`, background: "#5EEAD4" }} />
                </div>
                <span className="text-xs font-bold mono w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {workshop.reviews.length > 0 && (
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold mb-4">Recent Reviews</h3>
          <div className="space-y-4">
            {workshop.reviews.slice(0, 5).map((r, i) => (
              <div key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, j) => (
                      <Star key={j} className="w-3 h-3" fill={j < r.rating ? "#FCD34D" : "transparent"} style={{ color: j < r.rating ? "#FCD34D" : "#4B5563" }} />
                    ))}
                  </div>
                  {r.onChainVerified && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(134,239,172,0.15)", color: "#86EFAC" }}>On-chain</span>
                  )}
                </div>
                <p className="text-sm text-gray-300">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
