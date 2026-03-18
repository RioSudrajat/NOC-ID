"use client";

import { motion } from "framer-motion";
import { Wrench, Star, Shield, CheckCircle2, MapPin, Phone, ExternalLink } from "lucide-react";

const workshops = [
  { name: "Bengkel Hendra Motor", location: "Jakarta Selatan", rating: 4.9, services: 1284, verified: true, oem: true, phone: "0812-XXXX-XXXX", specialization: "Toyota, Daihatsu" },
  { name: "Jaya Motor Service", location: "Jakarta Timur", rating: 4.8, services: 968, verified: true, oem: true, phone: "0813-XXXX-XXXX", specialization: "All Brands" },
  { name: "AutoCare Express", location: "Surabaya", rating: 4.7, services: 756, verified: true, oem: false, phone: "0821-XXXX-XXXX", specialization: "Honda, Suzuki" },
  { name: "Mitra Servis Bandung", location: "Bandung", rating: 4.6, services: 542, verified: true, oem: true, phone: "0856-XXXX-XXXX", specialization: "Toyota, Mitsubishi" },
  { name: "Bengkel Mandiri", location: "Medan", rating: 4.5, services: 421, verified: false, oem: false, phone: "0822-XXXX-XXXX", specialization: "General Service" },
  { name: "Prima Auto Workshop", location: "Semarang", rating: 4.4, services: 318, verified: true, oem: true, phone: "0811-XXXX-XXXX", specialization: "Toyota, Honda" },
];

export default function WorkshopDirectoryPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="flex items-center gap-3">
          <Wrench className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
          Partner Workshops
        </h1>
        <p>Verified workshop network across Indonesia</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
        {[
          { label: "Total Workshops", value: "86", color: "var(--solana-purple)" },
          { label: "Verified", value: "72", color: "var(--solana-green)" },
          { label: "OEM Certified", value: "48", color: "var(--solana-cyan)" },
          { label: "Avg Rating", value: "4.6★", color: "#FACC15" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-6 lg:p-8 text-center">
            <p className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Workshop cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {workshops.map((w, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card-static p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-semibold text-base mb-1">{w.name}</h3>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--solana-text-muted)" }}>
                  <MapPin className="w-3 h-3" /> {w.location}
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.25)" }}>
                <Star className="w-4 h-4" style={{ color: "#FACC15" }} fill="#FACC15" />
                <span className="text-base font-bold" style={{ color: "#FACC15" }}>{w.rating}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              {w.verified && (
                <span className="badge badge-green gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>
              )}
              {w.oem && (
                <span className="badge badge-purple gap-1"><Shield className="w-3 h-3" /> OEM</span>
              )}
              <span className="badge" style={{ background: "rgba(20,20,40,0.5)", color: "var(--solana-text-muted)", border: "1px solid rgba(153,69,255,0.1)" }}>{w.specialization}</span>
            </div>

            <div className="flex justify-between items-center pt-5 mt-auto" style={{ borderTop: "1px solid rgba(153,69,255,0.08)" }}>
              <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{w.services.toLocaleString()} total services</span>
              <div className="flex items-center gap-3">
                <a className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer" style={{ background: "rgba(153,69,255,0.1)", color: "var(--solana-purple)" }}>
                  <Phone className="w-4 h-4" /> Contact
                </a>
                <a className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer" style={{ background: "rgba(20,241,149,0.08)", color: "var(--solana-green)" }}>
                  <ExternalLink className="w-4 h-4" /> Profile
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
