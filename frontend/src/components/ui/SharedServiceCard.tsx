"use client";

import { useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CheckCircle, CheckCircle2, XCircle, AlertCircle, Camera, ExternalLink, X, CreditCard, FileText } from "lucide-react";
import { PaymentModal } from "./PaymentModal";

export interface PartItem {
  name: string;
  partNumber: string;
  isOem: boolean;
  manufacturer: string;
  priceIDR: number;
}

export interface ServiceEvent {
  id: string | number;
  status: "PENDING_PAYMENT" | "ANCHORED" | "REJECTED" | "CANCELLED";
  date: string;
  type: string;
  category: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  mechanic: string;
  workshop: string;
  rating: number;
  mileage: string;
  parts: PartItem[];
  serviceCost: number;
  gasFee: number;
  costIDR: number;
  costUSDC: number;
  costNOC: number;
  costStr: string;
  txSig: string | null;
  healthBefore: number;
  healthAfter: number;
  notes: string;
  images: string[];
}

interface SharedServiceCardProps {
  event: ServiceEvent;
  userRole: "user" | "workshop";
  onPayNow?: (id: string | number, e: React.MouseEvent) => void;
  onDispute?: (id: string | number, e: React.MouseEvent) => void;
  onCancelInvoice?: (id: string | number, e: React.MouseEvent) => void;
}

function getHealthColor(health: number) {
  if (health >= 90) return "#86EFAC";
  if (health >= 70) return "#5EEAD4";
  if (health >= 50) return "#FCD34D";
  if (health >= 30) return "#5EEAD4";
  return "#FCA5A5";
}

export function SharedServiceCard({ event, userRole, onPayNow, onDispute, onCancelInvoice }: SharedServiceCardProps) {
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const StatusIcon = event.icon;

  const isPending = event.status === "PENDING_PAYMENT";
  const isAnchored = event.status === "ANCHORED";
  const isRejected = event.status === "REJECTED" || event.status === "CANCELLED";

  const getBorderColor = () => {
    if (isPending) return "#FCD34D";
    if (isRejected) return "#FCA5A5";
    return "var(--solana-purple)";
  };

  const statusBadge = (
    <span className={`badge ${
      isPending ? 'bg-yellow-500/20 text-yellow-400' :
      isRejected ? 'bg-red-500/20 text-red-500' :
      'badge-purple'
    }`}>
      {event.category}
    </span>
  );

  return (
    <>
      <div className="relative flex gap-6 lg:gap-8 cursor-pointer group" onClick={() => setDetailModalOpen(true)}>
        {/* Timeline dot */}
        <div className="hidden md:flex items-start pt-8">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center z-10 shrink-0" 
            style={{ 
              background: "var(--solana-dark-2)", 
              border: `2px solid ${getBorderColor()}` 
            }}
          >
            <StatusIcon className="w-5 h-5" style={{ color: isPending ? "#FCD34D" : isRejected ? "#FCA5A5" : "var(--solana-green)" }} />
          </div>
        </div>

        {/* Card */}
        <div className={`glass-card p-8 flex-1 transition-transform hover:scale-[1.01] ${
          isPending ? 'border-yellow-500/30 bg-yellow-500/5' : 
          isRejected ? 'border-red-500/30 bg-red-500/5 opacity-70' : ''
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-xl font-bold">{event.type}</h3>
                {statusBadge}
              </div>
              <p className="text-base" style={{ color: "var(--solana-text-muted)" }}>
                {event.workshop} · {event.mechanic} (★ {event.rating})
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="mono text-base font-semibold mb-1">{event.date}</p>
              <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>{event.mileage}</p>
            </div>
          </div>

          {/* Health change */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Health:</span>
            <span className="mono font-bold" style={{ color: getHealthColor(event.healthBefore) }}>{event.healthBefore}</span>
            <span style={{ color: "var(--solana-text-muted)" }}>→</span>
            <span className="mono font-bold" style={{ color: getHealthColor(event.healthAfter) }}>{event.healthAfter}</span>
            <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(94, 234, 212,0.1)" }}>
              <div className="h-1 rounded-full transition-all" style={{ width: `${event.healthAfter}%`, background: getHealthColor(event.healthAfter) }} />
            </div>
          </div>

          {/* Parts + Action / TX */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
                <div>
              {event.parts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.parts.slice(0, 2).map((p, j) => (
                    <span key={j} className="text-xs px-2 py-1 rounded-md flex items-center gap-1" style={{ background: "rgba(20,20,40,0.5)", color: "var(--solana-text-muted)" }}>
                      {p.isOem && <CheckCircle2 className="w-3 h-3 text-teal-400" />}
                      {p.name}
                    </span>
                  ))}
                  {event.parts.length > 2 && (
                    <span className="text-xs px-2 py-1 rounded-md text-slate-400">+{event.parts.length - 2} more...</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-sm font-semibold whitespace-nowrap" style={{ color: isPending ? "#FCD34D" : isRejected ? "#FCA5A5" : "var(--solana-green)" }}>
                {event.costStr}
              </span>
              
              {isPending ? (
                <div className="flex gap-2">
                  {userRole === "user" && onDispute && onPayNow && (
                    <>
                      <button 
                        onClick={(e) => onDispute(event.id, e)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 font-medium text-sm hover:bg-red-500/20 transition-colors"
                      >
                        <X className="w-4 h-4" /> Tolak
                      </button>
                      <button 
                        onClick={(e) => onPayNow(event.id, e)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-teal-500 text-white font-medium text-sm shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform"
                      >
                        <CreditCard className="w-4 h-4" /> Pay Now
                      </button>
                    </>
                  )}
                  {userRole === "workshop" && onCancelInvoice && (
                    <button 
                      onClick={(e) => onCancelInvoice(event.id, e)}
                      className="px-3 py-1.5 rounded-lg border border-red-600 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Batalin Tagihan
                    </button>
                  )}
                </div>
              ) : isAnchored ? (
                <a href={`https://explorer.solana.com/tx/${event.txSig}?cluster=devnet`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs mono hover:brightness-150 transition-colors bg-teal-500/10 px-3 py-2 rounded-lg" style={{ color: "var(--solana-purple)" }}>
                  <CheckCircle2 className="w-3 h-3 text-teal-400" />
                  tx: {event.txSig}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                  <XCircle className="w-3 h-3"/> {event.status === "REJECTED" ? "Rejected" : "Cancelled"}
                </span>
              )}
            </div>
          </div>
          
          {isPending && userRole === "user" && (
             <div className="mt-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
               <p className="text-xs text-slate-300">
                 <strong className="text-yellow-400">Payment Required:</strong> Service is pending. Complete the payment to anchor your maintenance record to Solana.
               </p>
             </div>
          )}
        </div>
      </div>

      {/* Render Service Detail Modal */}
      <AnimatePresence>
        {detailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] p-8 z-10">
              <button onClick={() => setDetailModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-slate-800"><FileText className="w-6 h-6 text-teal-400" /></div>
                  <h2 className="text-2xl font-bold text-white">Service Details</h2>
                </div>
                <p className="text-sm text-slate-400">{event.type} • {event.date}</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Workshop</p>
                    <p className="font-medium text-white">{event.workshop}</p>
                    <p className="text-xs text-slate-500 mt-1">Mech: {event.mechanic}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    {isAnchored ? (
                      <p className="font-semibold text-teal-400 flex flex-wrap items-center gap-1.5"><CheckCircle className="w-4 h-4"/> Anchored to Solana</p>
                    ) : isPending ? (
                      <p className="font-semibold text-yellow-400 flex flex-wrap items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Pending Payment</p>
                    ) : (
                      <p className="font-semibold text-red-500 flex flex-wrap items-center gap-1.5"><XCircle className="w-4 h-4"/> {event.status}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 border-b border-slate-700/50 pb-2">Technician Notes</h3>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                    <p className="text-sm text-slate-300 leading-relaxed italic">&quot;{event.notes}&quot;</p>
                  </div>
                </div>

                {event.images && event.images.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 border-b border-slate-700/50 pb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Photo Evidence
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {event.images.map((img, idx) => (
                        <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-slate-700 relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="Service evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                                  {event.parts && event.parts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 border-b border-slate-700/50 pb-2">Parts & Materials</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-500 uppercase">
                            <th className="text-left pb-2">Part</th>
                            <th className="text-left pb-2">OEM</th>
                            <th className="text-left pb-2">Manufacturer</th>
                            <th className="text-right pb-2">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {event.parts.map((p, idx) => (
                            <tr key={idx} className="border-t border-slate-800">
                              <td className="py-2 text-slate-300">
                                <span className="font-medium">{p.name}</span>
                                <span className="block text-[10px] mono text-slate-500">{p.partNumber}</span>
                              </td>
                              <td className="py-2">
                                {p.isOem ? (
                                  <span className="flex items-center gap-1 text-teal-400 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> OEM</span>
                                ) : (
                                  <span className="text-xs text-teal-400">Aftermarket</span>
                                )}
                              </td>
                              <td className="py-2 text-xs">
                                {p.isOem ? (
                                  <a href={`https://explorer.solana.com/address/NocPart_${p.partNumber}_mock`} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline flex items-center gap-1">{p.manufacturer} <ExternalLink className="w-3 h-3" /></a>
                                ) : (
                                  <span className="text-slate-400">{p.manufacturer}</span>
                                )}
                              </td>
                              <td className="py-2 text-right mono text-slate-300">Rp {p.priceIDR.toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-700/50">
                  {event.parts.length > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-400">Subtotal Parts</span>
                      <span className="text-sm mono text-slate-300">Rp {event.parts.reduce((sum, p) => sum + p.priceIDR, 0).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Service Cost</span>
                    <span className="text-sm mono text-slate-300">Rp {(event.serviceCost || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-slate-400">Network Gas Fee</span>
                    <span className="text-sm mono text-slate-300">Rp {(event.gasFee || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <span className="font-semibold text-white">Total Invoice</span>
                    <span className="text-xl font-bold text-white">{event.costStr}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
