"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Factory, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";

export default function LoginPage() {
  const router = useRouter();
  const loginWithPassword = useUserStore((state) => state.loginWithPassword);
  const syncVehicles = useVehicleRegistryStore((state) => state.syncFromBackend);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError("");
    if (!email.includes("@") || !password) {
      setError("Masukkan email dan password.");
      return;
    }
    setSubmitting(true);
    const ok = await loginWithPassword({ email: email.trim(), password });
    const userId = useUserStore.getState().currentUser?.userId;
    if (ok && userId) {
      await syncVehicles(userId);
      router.push("/dapp");
      return;
    }
    setSubmitting(false);
    setError("Email atau password salah.");
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <section className="grid w-full gap-10 md:grid-cols-[1fr_440px] md:items-center">
          <div>
            <Link href="/" className="text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-900">Kembali ke beranda</Link>
            <h1 className="mt-8 max-w-2xl text-5xl font-bold leading-tight tracking-normal md:text-6xl">
              NOC ID Portal
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600">
              Masuk sebagai user dengan email/password. Enterprise dan workshop tetap memakai wallet login di portal masing-masing.
            </p>

            <div className="mt-8">
              <p className="text-sm text-zinc-600">Belum punya akun NOC ID?</p>
              <Link href="/register" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
                Buat akun user dan embedded wallet
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Masuk User</h2>
                <p className="text-sm text-zinc-500">Email + password</p>
              </div>
            </div>

            <label className="block text-sm font-medium text-zinc-700">Email</label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="anda@email.com" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 outline-none transition focus:border-teal-400 focus:bg-white" />
            </div>

            <label className="mt-5 block text-sm font-medium text-zinc-700">Password</label>
            <div className="relative mt-2">
              <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password akun NOC ID" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 outline-none transition focus:border-teal-400 focus:bg-white" />
            </div>

            {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

            <button onClick={submit} disabled={submitting} className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60">
              {submitting ? "Masuk..." : "Masuk ke DApp"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <section className="mt-8 grid grid-cols-2 gap-4">
              <Link href="/workshop/login" className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition-all hover:border-teal-500 hover:bg-teal-50">
                <Building2 className="mb-2 h-5 w-5 text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-900">Workshop</h3>
                <p className="mt-1 text-xs text-zinc-500">Wallet login</p>
              </Link>
              <Link href="/enterprise/login" className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50">
                <Factory className="mb-2 h-5 w-5 text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-900">Enterprise</h3>
                <p className="mt-1 text-xs text-zinc-500">Wallet login</p>
              </Link>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
