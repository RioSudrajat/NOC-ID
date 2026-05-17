"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Factory, Mail, Building2, UserRound, Briefcase } from "lucide-react";

export default function EnterpriseRegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    picName: "",
    email: "",
    jobTitle: "",
    fleetSize: "100-500",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 py-12">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Link href="/" className="text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors">← Kembali ke beranda</Link>
          <div className="mt-8 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
              <Factory className="w-6 h-6" />
            </div>
            <p className="text-sm text-blue-400 font-semibold uppercase tracking-wider">Enterprise Solutions</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6 leading-tight">
            Skalakan Manajemen Aset Kendaraan Anda
          </h1>
          <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
            Bergabunglah dengan ekosistem NOC ID sebagai Mitra Pabrikan (ATPM) atau Pengelola Armada. Terbitkan NFT kendaraan baru, kelola kredensial bengkel resmi, dan nikmati akses API node prioritas.
          </p>
          
          <div className="space-y-4">
            {[
              "Penerbitan NFT Kendaraan Baru secara Massal",
              "Manajemen Kredensial Jaringan Bengkel Resmi",
              "Dashboard Analitik Terintegrasi Web3",
              "Dukungan Integrasi API & Account Manager Khusus"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

          {submitted ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <ArrowRight className="w-8 h-8 rotate-45" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Permintaan Terkirim</h2>
              <p className="text-zinc-400 mb-8">
                Tim Enterprise NOC ID akan segera menghubungi Anda melalui email untuk mendiskusikan kebutuhan bisnis Anda.
              </p>
              <Link href="/" className="inline-flex items-center justify-center gap-2 bg-white text-zinc-950 font-bold px-6 py-3 rounded-xl hover:bg-zinc-200 transition-colors">
                Kembali ke Beranda
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-2xl font-bold mb-6">Hubungi Tim Sales</h2>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Nama Perusahaan
                </label>
                <input 
                  required
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-blue-500 transition-colors" 
                  placeholder="PT Astra Internasional Tbk"
                  value={form.companyName}
                  onChange={e => setForm({...form, companyName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                    <UserRound className="w-4 h-4" /> Nama PIC
                  </label>
                  <input 
                    required
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-blue-500 transition-colors" 
                    placeholder="Budi Susanto"
                    value={form.picName}
                    onChange={e => setForm({...form, picName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Jabatan
                  </label>
                  <input 
                    required
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-blue-500 transition-colors" 
                    placeholder="Direktur Operasional"
                    value={form.jobTitle}
                    onChange={e => setForm({...form, jobTitle: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Bisnis
                </label>
                <input 
                  required
                  type="email"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-blue-500 transition-colors" 
                  placeholder="budi@astra.co.id"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Estimasi Kendaraan / Armada</label>
                <select 
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                  value={form.fleetSize}
                  onChange={e => setForm({...form, fleetSize: e.target.value})}
                >
                  <option value="1-50">1 - 50</option>
                  <option value="50-100">50 - 100</option>
                  <option value="100-500">100 - 500</option>
                  <option value="500+">500+</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                Kirim Permintaan <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
