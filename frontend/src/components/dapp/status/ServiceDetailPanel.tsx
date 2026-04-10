"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, Car, MessageSquare, FileText, Lock, LockOpen } from "lucide-react";
import { isDataAccessActive, type BookingStatus, type SessionType } from "@/context/BookingContext";

interface BookingData {
  status: BookingStatus;
  type: SessionType;
  workshop: { name: string; address: string };
  form: { date: string; time: string; complaint: string; shareHistory: boolean; shareDigitalTwin: boolean; vehicleKey: string };
}

export interface ServiceDetailPanelProps {
  booking: BookingData;
  vehicleName: string;
  vehicleVin: string;
}

export default function ServiceDetailPanel({ booking, vehicleName, vehicleVin }: ServiceDetailPanelProps) {
  const isRejected = booking.status === "REJECTED";
  const dataActive = isDataAccessActive(booking as any) || (booking.type === "walkin" && booking.status !== "COMPLETED" && booking.status !== "PAID");

  return (
    <div className="lg:col-span-2 space-y-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
        <h3 className="font-semibold text-sm mb-4">Detail Servis</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--solana-purple)" }} />
            <div>
              <p className="text-xs font-medium">{booking.workshop.name}</p>
              <p className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>{booking.workshop.address}</p>
            </div>
          </div>
          {booking.type === "booking" && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 shrink-0" style={{ color: "var(--solana-purple)" }} />
              <p className="text-xs">{booking.form.date} · {booking.form.time}</p>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Car className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--solana-purple)" }} />
            <div>
              <p className="text-xs font-medium">{vehicleName}</p>
              <p className="text-[10px] mono" style={{ color: "var(--solana-text-muted)" }}>{vehicleVin}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--solana-purple)" }} />
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{booking.form.complaint}</p>
          </div>
          {booking.type === "booking" && (
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--solana-purple)" }} />
              <div className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
                Data dibagikan: {booking.form.shareHistory ? "Riwayat " : ""}{booking.form.shareDigitalTwin ? "3D Twin " : ""}{!booking.form.shareHistory && !booking.form.shareDigitalTwin ? "Tidak ada" : ""}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {dataActive ? (
          <div className="glass-card p-4 border-l-4" style={{ borderLeftColor: "var(--solana-green)" }}>
            <div className="flex items-center gap-2 mb-1">
              <LockOpen className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--solana-green)" }}>Akses Data Aktif</h3>
            </div>
            <p className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>
              Bengkel dapat melihat data kendaraan. Dicabut otomatis setelah servis selesai.
            </p>
          </div>
        ) : (
          <div className="glass-card p-4 border-l-4" style={{ borderLeftColor: isRejected ? "#FCA5A5" : "rgba(94, 234, 212,0.3)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4" style={{ color: isRejected ? "#FCA5A5" : "var(--solana-text-muted)" }} />
              <h3 className="text-sm font-semibold" style={{ color: isRejected ? "#FCA5A5" : "var(--solana-text-muted)" }}>
                {isRejected ? "Akses Ditolak" : "Akses Dicabut"}
              </h3>
            </div>
            <p className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>
              {isRejected ? "Data tidak pernah dibagikan ke bengkel." : "Data kendaraan tidak lagi dapat diakses bengkel."}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
