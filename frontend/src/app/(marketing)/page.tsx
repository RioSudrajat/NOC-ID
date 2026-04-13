"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Menu,
  X,
  ShieldCheck,
  Wrench,
  Building2,
  Github,
  Twitter,
  FileText,
  ArrowLeftRight,
  TrendingUp,
  BellRing,
  Gift,
  Shield,
  Car,
  Store,
  Factory,
  Nfc,
  ClipboardList,
  PenLine,
  Lock,
  Search,
} from "lucide-react";

/* ——————————————— HeroVehicle (tilt parallax + 3D fallback) ——————————————— */
const HeroCanvas = dynamic(() => import("@/components/landing/HeroCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 animate-pulse bg-zinc-100 rounded-[28px]" />
  ),
});

function HeroVehicle() {
  const ref = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sx = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const sy = useSpring(mouseY, { stiffness: 150, damping: 20 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [10, -10]);
  const translateX = useTransform(sx, [-0.5, 0.5], [-8, 8]);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ perspective: 1400 }}
      className="relative w-full aspect-[5/4] select-none"
    >
      {/* soft radial glow backdrop */}
      <div className="absolute inset-0 rounded-[36px] bg-[radial-gradient(ellipse_at_center,rgba(94,234,212,0.22),transparent_65%)]" />

      {/* ground shadow */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-6 w-3/4 rounded-full bg-black/25 blur-2xl" />

      <motion.div
        style={{ rotateX, rotateY, x: translateX, transformStyle: "preserve-3d" }}
        className="relative h-full w-full"
      >
        {imgError ? (
          <div className="absolute inset-0 rounded-[28px] overflow-hidden">
            <Suspense
              fallback={<div className="h-full w-full bg-zinc-100 animate-pulse" />}
            >
              <HeroCanvas />
            </Suspense>
          </div>
        ) : (
          <Image
            src="/images/hero-vehicle.png"
            alt="Vehicle render"
            fill
            priority
            onError={() => setImgError(true)}
            className="object-contain drop-shadow-[0_40px_40px_rgba(15,23,42,0.22)]"
          />
        )}

        {/* Floating info chips — translateZ for a subtle 3D pop */}
        <motion.div
          style={{ transform: "translateZ(55px)" }}
          className="absolute top-6 left-6 rounded-full border border-zinc-200 bg-white/95 backdrop-blur px-3.5 py-1.5 text-[11px] font-mono text-zinc-600 shadow-sm"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 mr-2 align-middle" />
          VIN · MHKA1BA1JFK000001
        </motion.div>

        <motion.div
          style={{ transform: "translateZ(55px)" }}
          className="absolute bottom-6 right-6 rounded-2xl border border-zinc-200 bg-white/95 backdrop-blur px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
        >
          <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-medium">
            Health Score
          </p>
          <div className="flex items-end gap-1.5 mt-0.5">
            <span className="text-2xl font-semibold text-zinc-900 tabular-nums leading-none">
              94
            </span>
            <span className="text-[10px] text-zinc-400 mb-0.5">/100</span>
          </div>
          <div className="mt-2 h-1 w-24 rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full rounded-full bg-teal-500" style={{ width: "94%" }} />
          </div>
        </motion.div>

        <motion.div
          style={{ transform: "translateZ(40px)" }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white/95 backdrop-blur px-3 py-2 shadow-sm text-right"
        >
          <p className="text-[9px] uppercase tracking-wider text-zinc-400">Verified</p>
          <p className="text-sm font-semibold text-zinc-900">42 events</p>
        </motion.div>
      </motion.div>

      {/* hint text below */}
      <p className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-4 pt-3 text-[11px] text-zinc-400 whitespace-nowrap">
        Move your cursor to inspect →
      </p>
    </div>
  );
}

/* ——————————————— Pill Navbar ——————————————— */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#product", label: "Product" },
    { href: "#how", label: "How it works" },
    { href: "#numbers", label: "Numbers" },
    { href: "#partners", label: "Partners" },
  ];

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-4">
      <div
        className={`mx-auto flex items-center justify-between gap-4 rounded-full border border-zinc-200/80 bg-white/85 backdrop-blur-xl pl-5 pr-2 py-2 transition-all duration-300 ${
          scrolled ? "max-w-5xl shadow-[0_8px_30px_rgba(15,23,42,0.06)]" : "max-w-6xl shadow-sm"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/noc_logo.png" alt="NOC Logo" width={32} height={32} className="object-contain" />
          <span className="font-semibold text-zinc-900 tracking-tight">NOC ID</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors rounded-full"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right side: dApp dropdown + CTA */}
        <div className="flex items-center gap-2">
          <Link
            href="/dapp"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors rounded-full"
          >
            Sign in
          </Link>
          <Link
            href="/dapp"
            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            className="md:hidden p-2 text-zinc-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden mx-auto max-w-6xl mt-2 rounded-3xl border border-zinc-200 bg-white p-4 shadow-lg">
          <div className="flex flex-col">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 rounded-xl"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/dapp"
              className="mt-2 text-center bg-zinc-900 text-white text-sm font-medium px-5 py-3 rounded-full"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ——————————————— Page ——————————————— */
export default function LandingPage() {
  return (
    <main className="theme-light relative bg-[#FAFAFA] text-zinc-900 antialiased">
      <Navbar />

      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center px-6">
        <div className="mx-auto max-w-6xl w-full">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-medium tracking-[0.18em] uppercase text-teal-700 mb-6">
                Vehicle identity infrastructure
              </p>
              <h1 className="text-[42px] md:text-[64px] leading-[1.02] font-semibold tracking-[-0.025em] text-zinc-900">
                Every car has a story.
                <br />
                <span className="text-zinc-400">Make it </span>
                <span className="text-teal-600">verifiable.</span>
              </h1>
              <p className="mt-7 text-lg text-zinc-600 max-w-xl leading-relaxed">
                NOC ID gives every vehicle a tamper-proof digital passport — service history,
                ownership records, and component health, signed by the parties who actually
                touched the car. No more guesswork at the dealership.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dapp"
                  className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-base font-medium px-7 py-3.5 rounded-full transition-colors"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#product"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-zinc-900 text-base font-medium px-7 py-3.5 rounded-full border border-zinc-200 transition-colors"
                >
                  See how it works
                </a>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600" />
                  No wallet required to explore
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600" />
                  Works with any OEM
                </div>
              </div>
            </div>

            {/* Hero visual */}
            <div className="lg:col-span-5">
              <HeroVehicle />
            </div>
          </div>
        </div>
      </section>

      {/* ========== THE PROBLEM ========== */}
      <section className="px-6 py-20 md:py-24 border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-teal-700 mb-4">
              The problem
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] text-zinc-900 leading-[1.1]">
              The used car market runs on trust nobody can verify.
            </h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-10">
            {[
              {
                stat: "1 in 3",
                detail: "used vehicles in Southeast Asia have undisclosed accident history or rolled-back odometers.",
              },
              {
                stat: "$2,400",
                detail: "average loss per buyer due to hidden damage discovered after purchase.",
              },
              {
                stat: "73%",
                detail: "of independent workshops still record service history on paper or local spreadsheets.",
              },
            ].map((item, i) => (
              <div key={i} className="border-t border-zinc-200 pt-6">
                <p className="text-4xl md:text-5xl font-semibold text-zinc-900 tracking-tight tabular-nums">
                  {item.stat}
                </p>
                <p className="mt-4 text-zinc-600 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRODUCT (3 audiences) ========== */}
      <section id="product" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-teal-700 mb-4">
              Product
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] text-zinc-900 leading-[1.1]">
              One ledger.
              <br />
              Three workflows that already exist.
            </h2>
            <p className="mt-6 text-lg text-zinc-600 leading-relaxed">
              We don&apos;t replace the way drivers, workshops, and manufacturers work today —
              we connect them with a shared source of truth.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: ShieldCheck,
                tag: "For drivers",
                title: "Own your vehicle's record",
                points: [
                  "Tap-to-verify NFC card and dynamic QR",
                  "Full service history at your fingertips",
                  "Boost resale value with proof",
                ],
                href: "/dapp",
              },
              {
                icon: Wrench,
                tag: "For workshops",
                title: "Log work that actually counts",
                points: [
                  "Two-tap service entry from mobile",
                  "Build a verifiable reputation score",
                  "Earn rewards for honest work",
                ],
                href: "/workshop",
              },
              {
                icon: Building2,
                tag: "For manufacturers",
                title: "See your fleet, end-to-end",
                points: [
                  "Real-time recall and warranty data",
                  "Component-level failure analytics",
                  "Reduce warranty fraud by design",
                ],
                href: "/enterprise",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="group relative rounded-3xl border border-zinc-200 bg-white p-8 hover:border-zinc-300 hover:shadow-[0_8px_40px_rgba(15,23,42,0.06)] transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-6">
                  <card.icon className="w-5 h-5 text-teal-700" />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-2">
                  {card.tag}
                </p>
                <h3 className="text-xl font-semibold text-zinc-900 tracking-tight mb-5">
                  {card.title}
                </h3>
                <ul className="space-y-3 mb-8">
                  {card.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-zinc-600">
                      <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 group-hover:text-teal-700 transition-colors"
                >
                  Explore portal
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how" className="px-6 py-24 md:py-32 bg-white border-y border-zinc-200">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-teal-700 mb-4">
              How it works
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] text-zinc-900 leading-[1.1]">
              Three steps. No new habits.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {[
              {
                num: "01",
                title: "Mint a passport",
                desc: "Manufacturers and registries issue a unique on-chain identity for each vehicle at the assembly line — or retroactively for existing fleets.",
              },
              {
                num: "02",
                title: "Log every event",
                desc: "Workshops and authorized parties sign each service, repair, or transfer with a single tap. Records become permanent and verifiable in seconds.",
              },
              {
                num: "03",
                title: "Verify on demand",
                desc: "Buyers, insurers, and inspectors scan the NFC card or QR to see the entire history — no third-party reports, no hidden surprises.",
              },
            ].map((step) => (
              <div key={step.num}>
                <div className="text-sm font-mono text-teal-600 mb-3">{step.num}</div>
                <h3 className="text-xl font-semibold text-zinc-900 tracking-tight mb-3">
                  {step.title}
                </h3>
                <p className="text-zinc-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CONNECTED MOBILITY NETWORK ========== */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-medium tracking-[0.18em] uppercase text-teal-700 mb-4">
                Network
              </p>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] text-zinc-900 leading-[1.1]">
                One ID.
                <br />
                Every road in between.
              </h2>
              <p className="mt-6 text-lg text-zinc-600 leading-relaxed">
                NOC ID stitches together drivers, workshops, dealerships, insurers, and
                manufacturers into a single verifiable network — so every vehicle carries
                its trust wherever it goes.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Cross-border verification",
                  "Open API for partners",
                  "No data lock-in",
                ].map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-teal-600 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Network graph */}
            <div className="md:col-span-7">
              <div className="relative aspect-square max-w-[560px] mx-auto rounded-[32px] border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8 overflow-hidden">
                {/* dotted background */}
                <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:18px_18px] opacity-60" />

                {/* SVG connection lines */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  {[
                    "M50,50 Q35,20 20,15",
                    "M50,50 Q70,18 82,18",
                    "M50,50 Q88,42 92,62",
                    "M50,50 Q70,82 82,86",
                    "M50,50 Q30,82 18,82",
                  ].map((d, i) => (
                    <path
                      key={i}
                      d={d}
                      stroke="#5EEAD4"
                      strokeWidth="0.4"
                      strokeDasharray="0.8 1.2"
                      strokeLinecap="round"
                      opacity="0.55"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="20"
                        dur={`${6 + i}s`}
                        repeatCount="indefinite"
                      />
                    </path>
                  ))}
                </svg>

                {/* Center node — NOC ID */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="rounded-2xl bg-zinc-900 text-white px-5 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.18)] border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-300/20 border border-teal-300/30 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-teal-300" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 3v18M3 12h18" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-zinc-400 leading-none">Source of truth</p>
                        <p className="text-sm font-semibold leading-tight mt-0.5">NOC ID</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Surrounding nodes */}
                {[
                  { icon: Car,        label: "Drivers",       pos: "top-[8%] left-[10%]" },
                  { icon: Wrench,     label: "Workshops",     pos: "top-[8%] right-[10%]" },
                  { icon: Store,      label: "Dealerships",   pos: "top-1/2 right-[4%] -translate-y-1/2" },
                  { icon: Factory,    label: "OEMs",          pos: "bottom-[8%] right-[10%]" },
                  { icon: Shield,     label: "Insurers",      pos: "bottom-[8%] left-[10%]" },
                ].map((n) => (
                  <div key={n.label} className={`absolute ${n.pos} z-10`}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center">
                        <n.icon className="w-5 h-5 text-teal-700" />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-600 bg-white/80 backdrop-blur px-2 py-0.5 rounded-full border border-zinc-200">
                        {n.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== WHAT YOU GET AS NOC ID HOLDER ========== */}
      <section className="px-6 py-24 md:py-32 bg-white border-y border-zinc-200">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-teal-700 mb-4">
              Ownership
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] text-zinc-900 leading-[1.1]">
              Your car&apos;s identity works for you.
            </h2>
            <p className="mt-6 text-lg text-zinc-600 leading-relaxed">
              Holding a NOC ID isn&apos;t just record-keeping — it unlocks real, tangible
              rights every driver deserves.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: FileText,
                title: "Full service history",
                desc: "Lifetime access to every signed service event, with parts and workshop details on-chain.",
              },
              {
                icon: ArrowLeftRight,
                title: "Verifiable ownership transfer",
                desc: "Hand over your car in one tap — no months of paperwork or physical documents.",
              },
              {
                icon: TrendingUp,
                title: "Higher resale value",
                desc: "Vehicles with a NOC ID record sell for ~12% more, because buyers can verify everything.",
              },
              {
                icon: BellRing,
                title: "Recall & safety alerts",
                desc: "Direct notifications from OEMs the moment a recall affects your specific VIN.",
              },
              {
                icon: Shield,
                title: "Insurance advantages",
                desc: "Partner insurers offer premium discounts to vehicles with a clean NOC ID history.",
              },
              {
                icon: Gift,
                title: "Community rewards",
                desc: "Earn token rewards from workshops you visit and from participating in the ecosystem.",
              },
            ].map((b) => (
              <div
                key={b.title}
                className="group relative rounded-3xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-[0_8px_40px_rgba(15,23,42,0.06)] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-5">
                  <b.icon className="w-[18px] h-[18px] text-teal-700" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 tracking-tight mb-2">
                  {b.title}
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SERVICE EVENT FLOW ========== */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-teal-700 mb-4">
              Operations
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] text-zinc-900 leading-[1.1]">
              What happens when you bring your car in.
            </h2>
            <p className="mt-6 text-lg text-zinc-600 leading-relaxed">
              Every service event is a 6-step verifiable flow — taking seconds at the
              counter, producing a permanent record forever.
            </p>
          </div>

          {/* Desktop horizontal flow */}
          <div className="hidden md:block relative">
            {/* connecting line */}
            <div className="absolute top-6 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
            <div className="grid grid-cols-6 gap-4 relative">
              {[
                { num: "01", icon: Nfc, title: "Tap-in", desc: "Driver taps NFC card or scans QR at the workshop counter." },
                { num: "02", icon: ClipboardList, title: "Job card opens", desc: "Workshop pulls full history and health report from NOC ID." },
                { num: "03", icon: Wrench, title: "Work logged", desc: "Mechanic logs every part and labor hour from a mobile tool." },
                { num: "04", icon: PenLine, title: "Driver signs", desc: "Driver approves and signs on-chain straight from their phone." },
                { num: "05", icon: Lock, title: "Record sealed", desc: "Event is minted to the ledger — immutable and uneditable." },
                { num: "06", icon: Search, title: "Future-proof", desc: "Any buyer, insurer, or inspector can verify the record forever." },
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center text-center">
                  <div className="relative z-10 w-12 h-12 rounded-full bg-white border border-teal-200 shadow-sm flex items-center justify-center mb-5">
                    <s.icon className="w-5 h-5 text-teal-700" />
                  </div>
                  <p className="text-[10px] font-mono text-teal-600 mb-1.5">{s.num}</p>
                  <h3 className="text-sm font-semibold text-zinc-900 tracking-tight mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile vertical flow */}
          <div className="md:hidden flex flex-col gap-6 relative">
            <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-teal-300 to-transparent" />
            {[
              { num: "01", icon: Nfc, title: "Tap-in", desc: "Driver taps NFC card or scans QR at the workshop counter." },
              { num: "02", icon: ClipboardList, title: "Job card opens", desc: "Workshop pulls full history and health report from NOC ID." },
              { num: "03", icon: Wrench, title: "Work logged", desc: "Mechanic logs every part and labor hour from a mobile tool." },
              { num: "04", icon: PenLine, title: "Driver signs", desc: "Driver approves and signs on-chain straight from their phone." },
              { num: "05", icon: Lock, title: "Record sealed", desc: "Event is minted to the ledger — immutable and uneditable." },
              { num: "06", icon: Search, title: "Future-proof", desc: "Any buyer, insurer, or inspector can verify the record forever." },
            ].map((s) => (
              <div key={s.num} className="flex gap-4 relative">
                <div className="relative z-10 w-12 h-12 rounded-full bg-white border border-teal-200 shadow-sm flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-teal-700" />
                </div>
                <div className="pt-1">
                  <p className="text-[10px] font-mono text-teal-600 mb-1">{s.num}</p>
                  <h3 className="text-sm font-semibold text-zinc-900 tracking-tight mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NUMBERS ========== */}
      <section id="numbers" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-end mb-14">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] uppercase text-teal-700 mb-4">
                Numbers
              </p>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] text-zinc-900 leading-[1.1]">
                Built quietly. Used widely.
              </h2>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              We launched with three workshops in Bandung. Today, NOC ID is the backbone for
              vehicle identity across Indonesia&apos;s independent service network — and
              expanding across Southeast Asia.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 md:gap-x-10 border-t border-zinc-200 pt-12">
            {[
              { value: "12,847", label: "Vehicles registered" },
              { value: "152K+", label: "Service records on-chain" },
              { value: "2,341", label: "Verified workshops" },
              { value: "8", label: "OEM partners" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-4xl md:text-5xl font-semibold text-zinc-900 tracking-tight tabular-nums">
                  {s.value}
                </p>
                <p className="mt-2 text-sm text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PARTNERS ========== */}
      <section id="partners" className="px-6 py-20 bg-white border-y border-zinc-200">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-sm text-zinc-500 mb-10">
            Working with industry leaders across the region
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-8 gap-y-6 items-center">
            {["Toyota", "Honda", "Suzuki", "Daihatsu", "Yamaha", "Mitsubishi", "Hyundai", "Kawasaki"].map((p) => (
              <div
                key={p}
                className="text-center text-base font-semibold text-zinc-400 hover:text-zinc-700 transition-colors tracking-tight"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[32px] bg-zinc-900 text-white p-12 md:p-20 relative overflow-hidden">
            <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] [background-size:22px_22px]" />
            <div className="relative max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] leading-[1.05]">
                Stop guessing.
                <br />
                <span className="text-teal-300">Start verifying.</span>
              </h2>
              <p className="mt-6 text-zinc-300 text-lg leading-relaxed">
                Try the demo with no wallet, no signup. Or talk to us about onboarding your
                workshop, dealership, or fleet.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dapp"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-zinc-900 text-base font-medium px-7 py-3.5 rounded-full transition-colors"
                >
                  Try the demo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="mailto:hello@nocid.id"
                  className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 text-white text-base font-medium px-7 py-3.5 rounded-full border border-white/20 transition-colors"
                >
                  Talk to sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="px-6 pt-16 pb-10 border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-12 gap-10 mb-12">
            <div className="md:col-span-5">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-teal-300" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3v18M3 12h18" />
                  </svg>
                </div>
                <span className="font-semibold text-zinc-900 tracking-tight">NOC ID</span>
              </Link>
              <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
                Nusantara Otomotif Chain ID — the universal identity layer for every vehicle on the road.
              </p>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-zinc-500">
                <li><Link href="/dapp" className="hover:text-zinc-900 transition-colors">Driver app</Link></li>
                <li><Link href="/workshop" className="hover:text-zinc-900 transition-colors">Workshop</Link></li>
                <li><Link href="/enterprise" className="hover:text-zinc-900 transition-colors">Enterprise</Link></li>
                <li><Link href="/admin" className="hover:text-zinc-900 transition-colors">Admin</Link></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">API reference</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Whitepaper</a></li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-zinc-900 transition-colors">About</a></li>
                <li><a href="mailto:hello@nocid.id" className="hover:text-zinc-900 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-8 border-t border-zinc-200">
            <p className="text-xs text-zinc-400">
              © 2026 NOC ID. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-zinc-400 hover:text-zinc-700 transition-colors" aria-label="Twitter"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="text-zinc-400 hover:text-zinc-700 transition-colors" aria-label="GitHub"><Github className="w-4 h-4" /></a>
              <a href="#" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">Privacy</a>
              <a href="#" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
