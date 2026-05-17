"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, KeyRound, Mail, UserPlus } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";

type Plan = "free" | "pro";

export default function RegisterPage() {
  const router = useRouter();
  const registerWithPassword = useUserStore((state) => state.registerWithPassword);
  const currentUser = useUserStore((state) => state.currentUser);
  const syncVehicles = useVehicleRegistryStore((state) => state.syncFromBackend);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("free");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError("");
    if (username.trim().length < 3) {
      setError("Username minimal 3 karakter.");
      return;
    }
    if (!email.includes("@")) {
      setError("Masukkan email yang valid.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    setSubmitting(true);
    const ok = await registerWithPassword({ username: username.trim(), email: email.trim(), password });
    const userId = useUserStore.getState().currentUser?.userId ?? currentUser?.userId;
    if (ok && userId) {
      await syncVehicles(userId);
      router.push("/dapp");
      return;
    }
    setSubmitting(false);
    setError("Register gagal. Email/username mungkin sudah dipakai.");
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <section className="grid w-full gap-10 md:grid-cols-[1fr_440px] md:items-center">
          <div>
            <Link href="/" className="text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-900">Kembali ke beranda</Link>
            <h1 className="mt-8 max-w-2xl text-5xl font-bold leading-tight tracking-normal md:text-6xl">
              Buat Akun NOC ID
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600">
              Setelah akun dibuat, NOC ID otomatis membuat embedded wallet Solana devnet untuk menerima kendaraan cNFT.
            </p>

            <div className="mt-10 grid max-w-lg gap-4">
              {(["free", "pro"] as const).map((plan) => (
                <button
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative flex items-center justify-between rounded-xl border-2 bg-white p-4 transition-all ${
                    selectedPlan === plan ? "border-teal-500" : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-zinc-900">{plan === "free" ? "Oto Friend" : "Oto Friend Pro"}</p>
                    <p className="mt-1 text-xs text-zinc-500">{plan === "free" ? "Embedded wallet + 1 kendaraan" : "Kendaraan tak terbatas + NOC AI"}</p>
                  </div>
                  <div className={`grid h-6 w-6 place-items-center rounded-full border-2 ${selectedPlan === plan ? "border-teal-500 bg-teal-500" : "border-zinc-300"}`}>
                    {selectedPlan === plan && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <p className="text-sm text-zinc-600">Sudah punya akun?</p>
              <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
                Masuk di sini
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Daftar User</h2>
                <p className="text-sm text-zinc-500">Email, password, embedded wallet</p>
              </div>
            </div>

            <label className="block text-sm font-medium text-zinc-700">Username</label>
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="otofriend" className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-teal-400 focus:bg-white" />

            <label className="mt-5 block text-sm font-medium text-zinc-700">Email</label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="anda@email.com" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 outline-none transition focus:border-teal-400 focus:bg-white" />
            </div>

            <label className="mt-5 block text-sm font-medium text-zinc-700">Password</label>
            <div className="relative mt-2">
              <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 8 karakter" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 outline-none transition focus:border-teal-400 focus:bg-white" />
            </div>

            {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

            <button onClick={submit} disabled={submitting} className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60">
              {submitting ? "Membuat akun..." : "Buat Akun + Wallet Devnet"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
