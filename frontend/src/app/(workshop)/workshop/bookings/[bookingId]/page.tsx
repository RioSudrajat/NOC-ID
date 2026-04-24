"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Car, Calendar, Star, FileText, ExternalLink } from "lucide-react";
import { useBookingStore } from "@/store/useBookingStore";
import type { BookingRequest } from "@/types/booking";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#FCD34D",
  ACCEPTED: "#86EFAC",
  REJECTED: "#FCA5A5",
  IN_SERVICE: "#5EEAD4",
  INVOICE_SENT: "#67E8F9",
  PAID: "#A78BFA",
  ANCHORING: "#C084FC",
  ANCHORED: "#86EFAC",
  COMPLETED: "#86EFAC",
};

function formatIDR(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function BookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const bookings = useBookingStore(s => s.bookings);
  const completedBookings = useBookingStore(s => s.completedBookings);

  const { active, completed } = useMemo(() => {
    const active = Object.values(bookings).find((b): b is BookingRequest => b?.id === bookingId) || null;
    const completed = completedBookings.find(c => c.bookingId === bookingId || c.id === bookingId) || null;
    return { active, completed };
  }, [bookings, completedBookings, bookingId]);

  if (!active && !completed) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <ClipboardList className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-gray-400 mb-4">Booking not found.</p>
        <Link href="/workshop/bookings" className="text-sm underline" style={{ color: "#5EEAD4" }}>Back to Bookings</Link>
      </div>
    );
  }

  const status = active?.status || "COMPLETED";
  const color = STATUS_COLORS[status] || "#5EEAD4";
  const workshopName = active?.workshop.name || completed?.workshopName || "-";
  const vehicleName = active?.form.complaint ? `${active.form.vehicleKey}` : completed?.vehicleName || "-";
  const vin = completed?.vin || "-";
  const complaint = active?.form.complaint || completed?.mechanicNotes || "-";
  const date = active?.form.date || completed?.date || "-";
  const invoice = active?.invoice;
  const review = active?.review || completed?.review;

  return (
    <div>
      <Link href="/workshop/bookings" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: "#5EEAD4" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <ClipboardList className="w-7 h-7" style={{ color: "#5EEAD4" }} />
        <div>
          <h1 className="font-bold text-2xl">Booking {bookingId}</h1>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium mt-1 inline-block" style={{ background: `${color}15`, color, border: `1px solid ${color}40` }}>
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Car className="w-4 h-4" style={{ color: "#5EEAD4" }} /> Vehicle & Workshop</h3>
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Workshop:</span> <span className="font-medium">{workshopName}</span></div>
            <div><span className="text-gray-400">Vehicle:</span> <span className="font-medium">{vehicleName}</span></div>
            <div><span className="text-gray-400">VIN:</span> <span className="mono text-xs">{vin}</span></div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" style={{ color: "#5EEAD4" }} /> Details</h3>
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Date:</span> <span className="font-medium">{date}</span></div>
            <div><span className="text-gray-400">Complaint:</span> <span className="font-medium">{complaint}</span></div>
            {active?.type && <div><span className="text-gray-400">Type:</span> <span className="font-medium capitalize">{active.type}</span></div>}
          </div>
        </div>
      </div>

      {(invoice || completed) && (
        <div className="glass-card p-6 rounded-2xl mb-8">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><FileText className="w-4 h-4" style={{ color: "#5EEAD4" }} /> Invoice</h3>
          {(invoice?.parts || completed?.parts)?.length ? (
            <table className="w-full text-sm mb-4">
              <thead><tr className="text-xs text-gray-400 border-b border-white/5"><th className="py-2 text-left">Part</th><th className="py-2 text-left">Part #</th><th className="py-2 text-right">Price</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {(invoice?.parts || completed?.parts || []).map((p, i) => (
                  <tr key={i}><td className="py-2">{p.name}</td><td className="py-2 mono text-xs text-gray-400">{p.partNumber}</td><td className="py-2 text-right">{formatIDR(p.price)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <div className="flex justify-between text-sm border-t border-white/10 pt-3">
            <span className="text-gray-400">Service Cost</span>
            <span className="font-medium">{formatIDR(invoice?.serviceCost || completed?.serviceCost || 0)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold mt-2">
            <span>Total</span>
            <span style={{ color: "#5EEAD4" }}>{formatIDR(invoice?.totalIDR || completed?.totalIDR || 0)}</span>
          </div>
        </div>
      )}

      {review && (
        <div className="glass-card p-6 rounded-2xl mb-8">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Star className="w-4 h-4" style={{ color: "#FCD34D" }} /> Review</h3>
          <div className="flex gap-1 mb-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="w-4 h-4" fill={i < review.rating ? "#FCD34D" : "transparent"} style={{ color: i < review.rating ? "#FCD34D" : "#4B5563" }} />
            ))}
          </div>
          <p className="text-sm text-gray-300">{review.comment}</p>
        </div>
      )}

      {(active?.anchorTxSig || completed?.txSig) && (
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><ExternalLink className="w-4 h-4" style={{ color: "#A78BFA" }} /> On-chain Anchor</h3>
          <p className="mono text-xs text-gray-400">{(active?.anchorTxSig || completed?.txSig || "").slice(0, 32)}...</p>
        </div>
      )}
    </div>
  );
}
