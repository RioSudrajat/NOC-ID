"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Search, CheckCircle2, ShieldCheck, ChevronLeft, Building2, Loader2, Activity, Calendar } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Workshop, useBooking } from "@/context/BookingContext";
import { useActiveVehicle, vehicleData } from "@/context/ActiveVehicleContext";
import { mergeRegisteredWorkshops } from "@/data/workshops";
import { useAdminStore } from "@/store/useAdminStore";

const MapLibreMap = dynamic(() => import("@/components/ui/MapLibreMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full rounded-2xl" style={{ background: "var(--solana-dark-2)" }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--solana-purple)" }} />
    </div>
  ),
});

const cities = ["Semua", "Jakarta", "Surabaya", "Tangerang", "Bandung", "Semarang"];
const filters = ["Terverifikasi", "Official Partner", "Brand Specialist"];

export default function BookServicePage() {
  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState("Semua");
  const [activeFilter, setActiveFilter] = useState("Terverifikasi");
  const hydrateAdmin = useAdminStore((state) => state.hydrate);
  const registrations = useAdminStore((state) => state.pendingRegistrations);
  const getWorkshopCredentials = useAdminStore((state) => state.getWorkshopCredentials);

  useEffect(() => {
    hydrateAdmin();
  }, [hydrateAdmin]);

  // Show the "Status Servis" button only when the currently active vehicle
  // has an ongoing booking session. Each vehicle has its own slot, so
  // switching the active vehicle in the sidebar updates this badge.
  const activeVehicleCtx = useActiveVehicle();
  const hasActiveVehicle = activeVehicleCtx?.hasActiveVehicle ?? false;
  const activeVehicle = activeVehicleCtx?.activeVehicleId || activeVehicleCtx?.activeVehicle || "bmw_m4";
  const activeVehicleMake = activeVehicleCtx?.activeVehicleIdentity.make ?? vehicleData[activeVehicle]?.make ?? "";
  const bookingCtx = useBooking();
  const currentBooking = bookingCtx?.bookings[activeVehicle] || null;
  const hasActiveBooking = !!currentBooking && !["COMPLETED", "REJECTED"].includes(currentBooking.status);

  const workshops = useMemo(() => mergeRegisteredWorkshops(registrations), [registrations]);
  const filtered = workshops.filter((ws) => {
    const matchSearch = ws.name.toLowerCase().includes(search.toLowerCase()) || ws.specialization.toLowerCase().includes(search.toLowerCase());
    const matchCity = activeCity === "Semua" || ws.city === activeCity;
    const credentials = getWorkshopCredentials(ws.id);
    const isOemCertified = ws.oem || credentials.some((credential) => credential.credential === "oem_certified");
    const isBrandSpecialist = activeVehicleMake
      ? ws.specialization.toLowerCase().includes(activeVehicleMake.toLowerCase())
      : false;
    const matchFilter =
      (activeFilter === "Terverifikasi" && ws.verified) ||
      (activeFilter === "Official Partner" && isOemCertified) ||
      (activeFilter === "Brand Specialist" && isBrandSpecialist);
    return ws.verified && matchSearch && matchCity && matchFilter;
  });

  if (!hasActiveVehicle) {
    return (
      <div className="glass-card p-8 text-center">
        <Calendar className="mx-auto mb-4 h-10 w-10 text-teal-300" />
        <h1 className="text-2xl font-bold">Belum bisa booking service</h1>
        <p className="mt-2 text-sm text-slate-400">Tambahkan kendaraan digital dulu lewat dealer/enterprise minting atau register vehicle untuk audit manufacturer.</p>
        <Link href="/dapp/register-vehicle" className="glow-btn mt-6 inline-flex px-5 py-2.5 text-sm">Register Vehicle</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dapp" className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: "var(--solana-text-muted)" }}>
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Cari Bengkel</h1>
            <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Temukan bengkel terverifikasi di jaringan NOC ID</p>
          </div>
        </div>
        {/* Status Servis button — replaces the old sidebar "Status Servis" tab */}
        <Link
          href="/dapp/book/status"
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0"
          style={{
            background: hasActiveBooking ? "rgba(94, 234, 212,0.12)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${hasActiveBooking ? "rgba(94, 234, 212,0.35)" : "rgba(94, 234, 212,0.15)"}`,
            color: hasActiveBooking ? "var(--solana-green)" : "var(--solana-text-muted)",
          }}
        >
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Status Servis</span>
          {hasActiveBooking && (
            <>
              <span className="hidden md:inline text-[10px] opacity-75">· {activeVehicleCtx?.currentVehicleData.name ?? vehicleData[activeVehicle]?.name}</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--solana-green)" }} />
            </>
          )}
        </Link>
      </div>

      {/* Real Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl overflow-hidden"
        style={{ height: "400px" }}
      >
        <MapLibreMap workshops={filtered} />
      </motion.div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--solana-text-muted)" }} />
          <input
            type="text"
            placeholder="Cari bengkel atau spesialisasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 text-sm outline-none transition-colors"
            style={{ border: "1px solid rgba(94, 234, 212,0.15)", color: "var(--solana-text)" }}
          />
        </div>
        <select
          value={activeCity}
          onChange={(e) => setActiveCity(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white/5 text-sm outline-none cursor-pointer"
          style={{ border: "1px solid rgba(94, 234, 212,0.15)", color: "var(--solana-text)" }}
        >
          {cities.map((c) => (
            <option key={c} value={c} style={{ background: "var(--solana-dark-2)" }}>{c}</option>
          ))}
        </select>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{
              background: activeFilter === f ? "rgba(94, 234, 212,0.15)" : "rgba(255,255,255,0.03)",
              color: activeFilter === f ? "var(--solana-purple)" : "var(--solana-text-muted)",
              border: `1px solid ${activeFilter === f ? "rgba(94, 234, 212,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Workshop cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((ws, i) => (
          <WorkshopCard key={ws.id} workshop={ws} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12" style={{ color: "var(--solana-text-muted)" }}>
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tidak ada bengkel ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkshopCard({ workshop: ws, index }: { workshop: Workshop; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-6 flex flex-col justify-between group hover:bg-white/[0.03] transition-colors"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-sm">{ws.name}</h3>
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#FCD34D" }}>
            <Star className="w-3.5 h-3.5 fill-current" />
            {ws.rating}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: "var(--solana-text-muted)" }}>
          <MapPin className="w-3.5 h-3.5" />
          {ws.address}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {ws.badges.map((badge) => (
            <span
              key={badge}
              className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                background: badge === "Pending KYC" ? "rgba(250,204,21,0.1)" : "rgba(94, 234, 212,0.1)",
                color: badge === "Pending KYC" ? "#FCD34D" : "var(--solana-green)",
                border: `1px solid ${badge === "Pending KYC" ? "rgba(250,204,21,0.2)" : "rgba(94, 234, 212,0.2)"}`,
              }}
            >
              {badge === "Pending KYC" ? null : <CheckCircle2 className="w-2.5 h-2.5" />}
              {badge === "OEM Certified" ? <ShieldCheck className="w-2.5 h-2.5" /> : null}
              {badge}
            </span>
          ))}
        </div>

        <p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Spesialisasi</p>
        <p className="text-xs font-medium mb-3">{ws.specialization}</p>

        <div className="flex gap-4 text-[10px]" style={{ color: "var(--solana-text-muted)" }}>
          <span>{ws.totalServices.toLocaleString()} servis</span>
          <span>{ws.totalReviews} review</span>
        </div>
      </div>

      <Link
        href={`/dapp/book/${ws.id}`}
        className="glow-btn w-full text-xs py-2.5 text-center mt-5 block cursor-pointer"
      >
        Lihat Profil
      </Link>
    </motion.div>
  );
}
