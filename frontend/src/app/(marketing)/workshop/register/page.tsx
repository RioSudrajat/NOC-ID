"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Building2, FileCheck, MapPin, UserRound, Wallet, ShieldCheck, Check } from "lucide-react";
import { useAdminStore } from "@/store/useAdminStore";
import { useUserStore } from "@/store/useUserStore";
import { getErrorMessage, isUserRejectedWalletError } from "@/lib/walletErrors";
import { verifyWalletLogin } from "@/lib/walletAuth";
import { useWalletConnection } from "@solana/react-hooks";
import type { WorkshopRegistrationData } from "@/types/admin";
import type { UserRole } from "@/types/user";

const steps = [
  { id: 1, label: "Checkout", icon: Wallet },
  { id: 2, label: "Business", icon: Building2 },
  { id: 3, label: "Location", icon: MapPin },
  { id: 4, label: "Documents", icon: FileCheck },
] as const;

export default function WorkshopRegisterPage() {
  const router = useRouter();
  const submitRegistration = useAdminStore((state) => state.submitRegistration);
  const loginWithWallet = useUserStore((state) => state.loginWithWallet);
  const setWorkshopStatus = useUserStore((state) => state.setWorkshopStatus);
  const currentUser = useUserStore((state) => state.currentUser);
  const { connectors, connect, isReady, connecting } = useWalletConnection();
  
  const [step, setStep] = useState(1);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState<Partial<WorkshopRegistrationData>>({
    businessType: "cv",
    coordinates: { lat: -6.2, lng: 106.8 },
    operatingHours: { weekday: "08:00 - 17:00", weekend: "09:00 - 14:00" },
    picRole: "Owner",
    signerMode: "self",
  });

  function update(patch: Partial<WorkshopRegistrationData>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  // Step 1: Connect Wallet & Pay
  async function handleCheckout(connectorId: string) {
    try {
      setError("");
      const session = await connect(connectorId);
      if (session?.account?.address) {
        const verified = await verifyWalletLogin(session, "workshop_owner");
        // Simulate Web3 payment of 500k IDRX delay
        setTimeout(() => {
          setPaid(true);
          // Create session as workshop_owner using real wallet address
          loginWithWallet(verified.address, "workshop_owner", verified);
          setStep(2);
        }, 1500);
      }
    } catch (err: unknown) {
      if (isUserRejectedWalletError(err)) {
        setError("Pembayaran dibatalkan oleh pengguna.");
      } else {
        console.error("Payment/Connection failed:", err);
        setError(getErrorMessage(err) || "Gagal menghubungkan wallet");
      }
    }
  }

  function submit() {
    const workshopId = `ws-${Date.now()}`;
    submitRegistration({
      ...(form as WorkshopRegistrationData),
      workshopId,
      submittedByUserId: currentUser?.userId ?? "unknown",
      submittedByUserName: currentUser?.displayName ?? "unknown",
      submittedByContact: currentUser?.email ?? currentUser?.phone,
      status: "pending_kyc",
      submittedAt: new Date().toISOString(),
      savedAt: Date.now(),
    });
    setWorkshopStatus("pending_kyc", workshopId);
    router.push("/workshop/pending");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors">← Kembali ke beranda</Link>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-teal-400 font-semibold">Workshop Partner</p>
              <h1 className="text-3xl font-bold">Pendaftaran Bengkel</h1>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-4 gap-3">
          {steps.map((item) => {
            const Icon = item.icon;
            const active = step === item.id;
            const completed = step > item.id;
            return (
              <div key={item.id} className={`rounded-xl border p-4 transition-all ${
                active ? "border-teal-500 bg-teal-500/10" : 
                completed ? "border-teal-500/30 bg-teal-500/5 text-zinc-300" : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`h-5 w-5 ${active ? "text-teal-400" : completed ? "text-teal-500/50" : ""}`} />
                  {completed && <Check className="h-4 w-4 text-teal-400" />}
                </div>
                <p className="text-xs font-bold uppercase tracking-wider">{item.label}</p>
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
          {step === 1 && (
            <div className="max-w-md mx-auto text-center py-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Checkout & Connect</h2>
                <p className="text-zinc-400 text-sm">Biaya registrasi seumur hidup untuk akses penuh NOC ID Workshop Portal.</p>
              </div>
              
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-8 text-left">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800">
                  <span className="text-zinc-400">Lifetime License</span>
                  <span className="font-bold">Rp 500.000</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Pay via Web3 (USDC/IDRX)</span>
                  <span className="text-teal-400 font-mono">~$31.50 USDC</span>
                </div>
              </div>

              <div className="space-y-3">
                {!isReady ? (
                  <div className="animate-pulse h-14 bg-zinc-800/50 rounded-xl w-full"></div>
                ) : connectors.length === 0 ? (
                  <div className="text-center p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                    <p className="text-sm text-zinc-400">No wallets found. Please install a Solana wallet.</p>
                  </div>
                ) : (
                  connectors.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => handleCheckout(connector.id)}
                      disabled={connecting}
                      className="w-full flex items-center justify-between gap-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        {connector.icon ? (
                          <img src={connector.icon} alt={connector.name} className="w-5 h-5 rounded-md" />
                        ) : (
                          <Wallet className="w-5 h-5" />
                        )}
                        <span>{connecting ? "Memproses..." : `Pay with ${connector.name}`}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-70" />
                    </button>
                  ))
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-mono">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold border-b border-zinc-800 pb-4 mb-6">Informasi Bisnis</h2>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Nama Bengkel</label>
                  <input className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-teal-500 transition-colors" placeholder="Contoh: Hendra Motor" value={form.businessName ?? ""} onChange={(e) => update({ businessName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Bentuk Badan Usaha</label>
                  <select className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-teal-500 transition-colors" value={form.businessType} onChange={(e) => update({ businessType: e.target.value as WorkshopRegistrationData["businessType"] })}>
                    <option value="cv">CV</option>
                    <option value="pt">PT</option>
                    <option value="perorangan">Perorangan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">No. HP / WA Bengkel</label>
                  <input className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-teal-500 transition-colors" placeholder="0812..." value={form.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold border-b border-zinc-800 pb-4 mb-6">Lokasi Bengkel</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Alamat Lengkap</label>
                  <input className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-teal-500 transition-colors" placeholder="Jl. Raya..." value={form.address ?? ""} onChange={(e) => update({ address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Kota</label>
                    <input className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-teal-500 transition-colors" placeholder="Jakarta Selatan" value={form.city ?? ""} onChange={(e) => update({ city: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Provinsi</label>
                    <input className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-teal-500 transition-colors" placeholder="DKI Jakarta" value={form.province ?? ""} onChange={(e) => update({ province: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold border-b border-zinc-800 pb-4 mb-6">Dokumen & Verifikasi KYC</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Nama PIC (Penanggung Jawab)</label>
                    <input className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-teal-500 transition-colors" placeholder="Nama Lengkap sesuai KTP" value={form.picName ?? ""} onChange={(e) => update({ picName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">No. KTP PIC</label>
                    <input className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 outline-none focus:border-teal-500 transition-colors" placeholder="16 Digit NIK" value={form.picKtpNumber ?? ""} onChange={(e) => update({ picKtpNumber: e.target.value })} />
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-teal-400 mt-0.5" />
                    <div className="text-sm text-teal-100/70">
                      <p className="font-semibold text-teal-400 mb-1">Upload Dokumen Legal</p>
                      <p>NPWP Usaha, NIB, dan Surat Izin Usaha akan diminta pada tahapan KYC oleh tim Admin NOC ID setelah registrasi awal ini disubmit.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step > 1 && (
            <div className="mt-10 pt-6 border-t border-zinc-800 flex justify-between items-center">
              <button 
                onClick={() => setStep(step - 1)} 
                className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium"
              >
                Kembali
              </button>
              
              {step < 4 ? (
                <button 
                  onClick={() => setStep(step + 1)} 
                  className="bg-white text-zinc-950 hover:bg-zinc-200 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  Selanjutnya <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={submit} 
                  className="bg-teal-500 text-zinc-950 hover:bg-teal-400 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                >
                  Submit KYC <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-zinc-500">
            Sudah punya akun Workshop? <Link href="/workshop/login" className="text-teal-400 hover:underline">Masuk di sini</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
