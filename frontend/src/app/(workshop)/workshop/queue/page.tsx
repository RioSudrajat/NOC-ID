"use client";

import { useMemo } from "react";
import { Users, Car, Clock, Shield, Wrench, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { vehicleData } from "@/context/ActiveVehicleContext";
import { useBooking } from "@/context/BookingContext";

export default function WorkshopQueue() {
  const bookingCtx = useBooking();

  // Build one queue entry per active booking (ACCEPTED or IN_SERVICE) so that
  // concurrent sessions for different vehicles all appear side-by-side instead
  // of overwriting each other.
  const activeQueue = useMemo(() => {
    const list = bookingCtx?.activeBookings || [];
    return list
      .filter((b) => ["ACCEPTED", "IN_SERVICE"].includes(b.status))
      .map((b) => {
        const vd = vehicleData[b.form.vehicleKey];
        return {
          id: b.id,
          vin: vd?.vin || b.id,
          model: vd?.name || b.form.vehicleKey,
          year: 2025,
          owner: "Pelanggan NOC",
          arrivalTime: b.form.time,
          status: b.status === "IN_SERVICE" ? ("IN_PROGRESS" as const) : ("WAITING" as const),
          priority: "NORMAL" as "NORMAL" | "HIGH",
          mechanic: b.workshop.name,
          isBooking: true,
        };
      });
  }, [bookingCtx?.activeBookings]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="page-header mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Users className="w-7 h-7 text-teal-400" />
          Active Service Queue
        </h1>
        <p className="text-sm mt-1 text-slate-400">Manage vehicles currently in the workshop that need servicing.</p>
      </div>

      {activeQueue.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-slate-500" />
          </div>
          <p className="text-lg font-semibold text-slate-300 mb-1">Antrian Kosong</p>
          <p className="text-sm text-slate-500 mb-6">Belum ada kendaraan yang sedang diservis saat ini.</p>
          <Link href="/workshop/scan" className="glow-btn flex items-center gap-2 text-sm px-5 py-2.5">
            <Car className="w-4 h-4" /> Scan Kendaraan Baru
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeQueue.map((item, i) => (
           <motion.div 
             key={item.id}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className={`glass-card p-6 border ${item.status === 'IN_PROGRESS' ? 'border-blue-500/30' : item.status === 'WAITING' ? 'border-yellow-500/30' : 'border-slate-700/50'}`}
           >
             <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-3">
                 <div className={`p-3 rounded-xl ${item.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : item.status === 'WAITING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800 text-slate-400'}`}>
                   <Car className="w-6 h-6" />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-white">{item.model} <span className="text-slate-500 font-normal">({item.year})</span></h2>
                   <p className="font-mono text-sm text-slate-400 flex items-center gap-1.5"><Shield className="w-3 h-3"/> {item.vin}</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-xs text-slate-500 mb-1 flex items-center justify-end gap-1"><Clock className="w-3 h-3"/> Arrival</p>
                 <p className="font-semibold text-white">{item.arrivalTime}</p>
               </div>
             </div>

             <div className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${item.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : item.status === 'WAITING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/50 text-slate-300'}`}>
                  {item.status === 'WAITING' ? 'MENUNGGU SERVIS' : item.status.replace("_", " ")}
                </span>
                {item.priority === 'HIGH' && (
                  <span className="text-xs px-2.5 py-1 rounded-md font-semibold bg-red-500/20 text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3"/> Urgent
                  </span>
                )}
                <span className="text-xs text-slate-400 ml-auto">
                  Owner: <strong className="text-slate-300">{item.owner}</strong>
                </span>
             </div>

             <div className="flex gap-3 mt-auto">
               <Link href={`/workshop/vehicle/${item.vin}`} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                 Patient History
               </Link>
               <Link href={`/workshop/maintenance?vin=${item.vin}&fromBooking=true`} className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-medium hover:from-teal-500 hover:to-blue-500 shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2">
                 <Wrench className="w-4 h-4" /> Log Servis
               </Link>
             </div>
           </motion.div>
        ))}
        
        {/* Scan New Card */}
        <Link href="/workshop/scan" className="glass-card-static p-6 border border-dashed border-slate-600 hover:border-teal-500/50 hover:bg-teal-500/5 flex flex-col items-center justify-center text-center transition-all min-h-[220px] group cursor-pointer">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-400 group-hover:bg-teal-500/20 group-hover:text-teal-400 transition-colors">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Scan Another Vehicle</h3>
          <p className="text-sm text-slate-400">Add a new patient to the workshop queue</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Proceed to Scanner <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
