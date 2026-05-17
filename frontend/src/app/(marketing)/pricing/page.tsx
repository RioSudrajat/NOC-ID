"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-zinc-900 pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-zinc-900">
            Satu Ekosistem, Beragam Pilihan Plan
          </h1>
          <p className="text-zinc-600 text-lg">
            Mulai kelola aset kendaraanmu, atau kembangkan bisnismu di jaringan NOC ID dengan Web3 & AI.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* User Plan */}
          <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm relative flex flex-col">
            <div className="mb-6">
              <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-2">Oto Friend</p>
              <h2 className="text-3xl font-bold mb-2">Gratis</h2>
              <p className="text-zinc-500 text-sm">Untuk pemilik kendaraan individu</p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {[
                "1 Aset Kendaraan (NFT)",
                "Catatan Servis Terdesentralisasi",
                "Integrasi Wallet (Embedded)",
                "NOC AI Copilot (Basic)",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-700">
                  <Check className="w-5 h-5 text-teal-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <Link
              href="/register"
              className="w-full py-3 px-4 rounded-xl font-medium text-center transition-colors bg-zinc-900 text-white hover:bg-zinc-800"
            >
              Daftar Sekarang
            </Link>
          </div>

          {/* Workshop Plan */}
          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-lg relative flex flex-col text-white">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-teal-400 to-emerald-400 text-zinc-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Most Popular
            </div>
            <div className="mb-6">
              <p className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-2">Workshop Partner</p>
              <h2 className="text-3xl font-bold mb-2">Rp 500rb <span className="text-lg font-normal text-zinc-400">/ lifetime</span></h2>
              <p className="text-zinc-400 text-sm">Untuk bengkel spesialis & resmi</p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Dashboard Manajemen Bengkel",
                "Penerbitan Catatan Servis (On-Chain)",
                "Bisa apply OEM Credential",
                "NOC AI Copilot (Pro)",
                "Support Prioritas",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <Link
              href="/workshop/register"
              className="w-full py-3 px-4 rounded-xl font-medium text-center transition-colors bg-white text-zinc-900 hover:bg-zinc-100"
            >
              Mulai Bisnismu
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm relative flex flex-col">
            <div className="mb-6">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Enterprise</p>
              <h2 className="text-3xl font-bold mb-2">Custom</h2>
              <p className="text-zinc-500 text-sm">Untuk pabrikan (ATPM) & korporat</p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Manajemen Fleet Skala Besar",
                "Penerbitan NFT Kendaraan Baru",
                "Manajemen Credential Bengkel Mitra",
                "API Akses Langsung (Node)",
                "Dedicated Account Manager",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-700">
                  <Check className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <Link
              href="/enterprise/register"
              className="w-full py-3 px-4 rounded-xl font-medium text-center transition-colors border-2 border-zinc-200 text-zinc-900 hover:border-zinc-900"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
