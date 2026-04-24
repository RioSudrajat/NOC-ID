"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  ArrowRight,
  Zap,
  MapPin,
  TrendingUp,
  Users,
  Shield,
  Activity,
  Coins,
  CheckCircle,
  Twitter,
  Send,
  ChevronRight,
} from "lucide-react";

/* ——————————————— Navbar ——————————————— */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/depin", label: "DePIN" },
    { href: "/fi", label: "FI" },
    { href: "/rwa", label: "RWA" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(26,29,35,0.95)"
          : "rgba(26,29,35,0.7)",
        backdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid rgba(94,234,212,0.12)" : "none",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/noc_logo.png"
            alt="Nemesis Protocol Logo"
            width={36}
            height={36}
            className="object-contain"
          />
          <span
            className="font-semibold text-base tracking-wide text-white"
            style={{ fontFamily: "var(--font-orbitron, monospace)" }}
          >
            Nemesis Protocol
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/fi" className="glow-btn text-sm px-5 py-2 rounded-lg">
            Invest
          </Link>
          <Link
            href="/rwa/operator"
            className="glow-btn-outline text-sm px-5 py-2 rounded-lg"
          >
            Operators
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden px-6 pb-6 pt-2"
          style={{
            background: "rgba(26,29,35,0.98)",
            borderBottom: "1px solid rgba(94,234,212,0.12)",
          }}
        >
          <div className="flex flex-col gap-1 mb-4">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/fi"
              className="glow-btn text-sm px-5 py-2.5 rounded-lg text-center"
            >
              Invest
            </Link>
            <Link
              href="/rwa/operator"
              className="glow-btn-outline text-sm px-5 py-2.5 rounded-lg text-center"
            >
              Operators
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ——————————————— Animated Counter ——————————————— */
function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  duration = 2000,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    const el = document.getElementById(`counter-${target}-${suffix}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix, started]);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [started, target, duration]);

  const formatted =
    target >= 1000
      ? count.toLocaleString("id-ID")
      : count.toString();

  return (
    <span id={`counter-${target}-${suffix}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* ——————————————— Page ——————————————— */
export default function LandingPage() {
  return (
    <main
      className="relative antialiased text-white overflow-x-hidden"
      style={{ background: "var(--solana-dark)" }}
    >
      <Navbar />

      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center pt-16 px-6 overflow-hidden">
        {/* Animated orb backgrounds */}
        <div
          className="orb-purple absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(94,234,212,0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="orb-green absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(94,234,212,0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />

        <div className="mx-auto max-w-5xl w-full text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-8"
            style={{
              background: "rgba(94,234,212,0.1)",
              border: "1px solid rgba(94,234,212,0.3)",
              color: "#5EEAD4",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#5EEAD4" }}
            />
            Live on Solana Mainnet
          </div>

          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{ fontFamily: "var(--font-orbitron, monospace)" }}
          >
            <span className="gradient-text">Protokol Infrastruktur</span>
            <br />
            <span className="text-white">EV Indonesia</span>
          </h1>

          <p
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ fontFamily: "var(--font-exo2, sans-serif)" }}
          >
            Setiap kendaraan listrik produktif menghasilkan yield nyata.
            Terverifikasi on-chain. Didistribusi otomatis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/fi"
              className="glow-btn inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold"
            >
              Mulai Invest (IDRX)
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/rwa"
              className="glow-btn-outline inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold"
            >
              Tokenisasi Armada
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== LIVE NETWORK STATS ========== */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div
            className="rounded-2xl p-8 md:p-12"
            style={{
              background: "var(--solana-card)",
              border: "1px solid rgba(94,234,212,0.25)",
            }}
          >
            <div className="text-center mb-10">
              <p
                className="text-xs uppercase tracking-widest mb-2"
                style={{ color: "#5EEAD4" }}
              >
                Live Network Stats
              </p>
              <h2
                className="text-2xl md:text-3xl font-bold"
                style={{ fontFamily: "var(--font-orbitron, monospace)" }}
              >
                Real-Time Protocol Metrics
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                {
                  label: "Total Fleet",
                  target: 847,
                  suffix: " unit",
                  icon: Activity,
                },
                {
                  label: "Km Hari Ini",
                  target: 42391,
                  suffix: " km",
                  icon: MapPin,
                },
                {
                  label: "Total Yield Distributed",
                  target: 12,
                  prefix: "Rp ",
                  suffix: ".4M",
                  icon: Coins,
                },
                {
                  label: "Active Investors",
                  target: 342,
                  suffix: "",
                  icon: Users,
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{
                      background: "rgba(94,234,212,0.1)",
                      border: "1px solid rgba(94,234,212,0.2)",
                    }}
                  >
                    <stat.icon className="w-5 h-5" style={{ color: "#5EEAD4" }} />
                  </div>
                  <p
                    className="text-3xl md:text-4xl font-bold mb-1"
                    style={{
                      fontFamily: "var(--font-orbitron, monospace)",
                      color: "#5EEAD4",
                    }}
                  >
                    <AnimatedCounter
                      target={stat.target}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== 3 PROOF LAYERS ========== */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: "#5EEAD4" }}
            >
              Triple Proof Architecture
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "var(--font-orbitron, monospace)" }}
            >
              Three Layers of Trust
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                badge: "RWA",
                title: "Proof of Asset",
                subtitle: "Nemesis RWA",
                desc: "Setiap unit EV ditokenisasi sebagai aset nyata — kepemilikan, nilai, dan kondisi kendaraan terverifikasi on-chain secara permanen.",
                href: "/rwa",
                cta: "Explore RWA",
              },
              {
                icon: Activity,
                badge: "DePIN",
                title: "Proof of Activity",
                subtitle: "Nemesis DePIN",
                desc: "GPS tracker on-chain membuktikan setiap kilometer yang ditempuh armada EV, menjamin data aktivitas yang tidak bisa dimanipulasi.",
                href: "/depin",
                cta: "Explore DePIN",
              },
              {
                icon: TrendingUp,
                badge: "FI",
                title: "Proof of Revenue",
                subtitle: "Nemesis FI",
                desc: "Pendapatan riil dari operasional armada langsung dikristalisasi menjadi yield IDRX yang didistribusikan otomatis setiap Senin.",
                href: "/fi",
                cta: "Explore FI",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="glass-card group p-6 rounded-2xl flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-300"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(94,234,212,0.1)",
                      border: "1px solid rgba(94,234,212,0.25)",
                    }}
                  >
                    <card.icon className="w-5 h-5" style={{ color: "#5EEAD4" }} />
                  </div>
                  <span className="badge badge-green text-xs">{card.badge}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">{card.title}</p>
                  <h3
                    className="text-xl font-bold text-white mb-2"
                    style={{ fontFamily: "var(--font-orbitron, monospace)" }}
                  >
                    {card.subtitle}
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{card.desc}</p>
                </div>
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium mt-auto"
                  style={{ color: "#5EEAD4" }}
                >
                  {card.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: "#5EEAD4" }}
            >
              Cara Kerja
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "var(--font-orbitron, monospace)" }}
            >
              3 Langkah Mudah
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line on desktop */}
            <div
              className="hidden md:block absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(94,234,212,0.4), transparent)",
              }}
            />

            {[
              {
                step: "01",
                title: "Daftarkan & Tokenisasi Aset EV",
                desc: "Operator mendaftarkan armada EV dan setiap unit ditokenisasi sebagai NFT aset on-chain Solana dengan data lengkap kepemilikan.",
              },
              {
                step: "02",
                title: "GPS Verifikasi Aktivitas On-chain",
                desc: "Perangkat IoT GPS di setiap EV mengirim hash aktivitas ke blockchain setiap menit — bukti operasional yang tidak bisa dipalsukan.",
              },
              {
                step: "03",
                title: "Yield Otomatis ke Investor Setiap Senin",
                desc: "Smart contract mengkalkulasi pendapatan, memotong biaya operasional, dan mendistribusikan yield IDRX langsung ke wallet investor.",
              },
            ].map((s, i) => (
              <div key={s.step} className="flex flex-col items-center text-center gap-4 relative">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center relative z-10"
                  style={{
                    background: "var(--solana-card)",
                    border: "1px solid rgba(94,234,212,0.25)",
                  }}
                >
                  <span
                    className="text-3xl font-black"
                    style={{
                      fontFamily: "var(--font-orbitron, monospace)",
                      color: "#5EEAD4",
                    }}
                  >
                    {s.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SUB-PRODUCT SHOWCASE ========== */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: "#5EEAD4" }}
            >
              Sub-Products
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "var(--font-orbitron, monospace)" }}
            >
              Ekosistem Terintegrasi
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Nemesis DePIN",
                tag: "Infrastructure",
                tagColor: "rgba(94,234,212,0.15)",
                desc: "Jaringan oracle IoT GPS terdesentralisasi yang memverifikasi aktivitas armada EV secara real-time. Setiap titik data GPS di-hash ke Solana.",
                href: "/depin",
                gradient: "linear-gradient(135deg, rgba(94,234,212,0.15) 0%, transparent 60%)",
              },
              {
                name: "Nemesis FI",
                tag: "Yield Protocol",
                tagColor: "rgba(94,234,212,0.15)",
                desc: "Protokol yield berbasis pendapatan riil armada. Investor deposit IDRX, earn yield mingguan terverifikasi dari operasional EV nyata.",
                href: "/fi",
                gradient: "linear-gradient(135deg, rgba(94,234,212,0.12) 0%, transparent 60%)",
              },
              {
                name: "Nemesis RWA",
                tag: "Tokenization",
                tagColor: "rgba(94,234,212,0.15)",
                desc: "Platform tokenisasi kendaraan listrik. Operator mengonversi armada fisik menjadi aset digital yang dapat diinvestasikan secara fraksional.",
                href: "/rwa",
                gradient: "linear-gradient(135deg, rgba(94,234,212,0.10) 0%, transparent 60%)",
              },
            ].map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className="group block rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: product.gradient,
                  border: "1px solid rgba(94,234,212,0.25)",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: product.tagColor,
                      color: "#5EEAD4",
                      border: "1px solid rgba(94,234,212,0.3)",
                    }}
                  >
                    {product.tag}
                  </span>
                  <ArrowRight
                    className="w-4 h-4 text-gray-500 group-hover:text-teal-400 transition-colors"
                  />
                </div>
                <h3
                  className="text-xl font-bold text-white mb-3"
                  style={{ fontFamily: "var(--font-orbitron, monospace)" }}
                >
                  {product.name}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">{product.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHY SOLANA ========== */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: "#5EEAD4" }}
            >
              Powered By
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "var(--font-orbitron, monospace)" }}
            >
              Mengapa Solana?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Zap,
                title: "Sub-Cent Fees",
                desc: "Biaya transaksi di bawah $0.001 — ribuan GPS hash per hari tidak membebani ekonomi protokol.",
              },
              {
                icon: Activity,
                title: "65K TPS",
                desc: "Throughput 65.000 TPS memastikan setiap hash GPS armada terproses dalam milidetik.",
              },
              {
                icon: Coins,
                title: "IDRX Native",
                desc: "IDRX stablecoin Rupiah berjalan native di Solana — yield dan investasi langsung dalam IDR.",
              },
              {
                icon: Shield,
                title: "OJK Alignment",
                desc: "Arsitektur protokol dirancang selaras dengan kerangka regulasi OJK untuk aset digital Indonesia.",
              },
            ].map((point) => (
              <div
                key={point.title}
                className="glass-card p-5 rounded-xl"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    background: "rgba(94,234,212,0.1)",
                    border: "1px solid rgba(94,234,212,0.2)",
                  }}
                >
                  <point.icon className="w-4 h-4" style={{ color: "#5EEAD4" }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{point.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ROADMAP ========== */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: "#5EEAD4" }}
            >
              Timeline
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "var(--font-orbitron, monospace)" }}
            >
              Roadmap
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-6 top-4 bottom-4 w-px md:left-1/2"
              style={{ background: "rgba(94,234,212,0.2)" }}
            />

            <div className="flex flex-col gap-10">
              {[
                {
                  phase: "Phase 1",
                  period: "Q2 2026",
                  title: "DePIN + FI MVP",
                  desc: "Launch Nemesis DePIN oracle network dan Nemesis FI yield protocol. Onboarding 50 unit EV pertama dan 100 investor awal.",
                  status: "active",
                  align: "left",
                },
                {
                  phase: "Phase 2",
                  period: "Q4 2026",
                  title: "EV Charging Module",
                  desc: "Integrasi modul stasiun pengisian EV ke dalam DePIN network. Revenue dari charging sessions masuk ke pool yield FI.",
                  status: "upcoming",
                  align: "right",
                },
                {
                  phase: "Phase 3",
                  period: "2027",
                  title: "$NMS IDO + Solar Module",
                  desc: "Token Generation Event $NMS governance token. Ekspansi ke panel surya sebagai sumber energi terbarukan untuk armada EV.",
                  status: "future",
                  align: "left",
                },
              ].map((item, i) => (
                <div
                  key={item.phase}
                  className={`relative flex gap-6 items-start ${
                    item.align === "right" ? "md:flex-row-reverse" : "md:flex-row"
                  } md:gap-0`}
                >
                  {/* Dot */}
                  <div
                    className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2"
                    style={{
                      background:
                        item.status === "active"
                          ? "rgba(94,234,212,0.2)"
                          : "rgba(26,29,35,1)",
                      border:
                        item.status === "active"
                          ? "2px solid #5EEAD4"
                          : "2px solid rgba(94,234,212,0.3)",
                    }}
                  >
                    <CheckCircle
                      className="w-5 h-5"
                      style={{
                        color:
                          item.status === "active"
                            ? "#5EEAD4"
                            : "rgba(94,234,212,0.4)",
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div
                    className={`glass-card rounded-xl p-5 flex-1 md:w-[calc(50%-3rem)] md:flex-none ${
                      item.align === "right"
                        ? "md:ml-auto md:mr-12"
                        : "md:mr-auto md:ml-12"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#5EEAD4" }}
                      >
                        {item.phase}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            item.status === "active"
                              ? "rgba(94,234,212,0.15)"
                              : "rgba(255,255,255,0.05)",
                          color:
                            item.status === "active" ? "#5EEAD4" : "#9CA3AF",
                          border:
                            item.status === "active"
                              ? "1px solid rgba(94,234,212,0.3)"
                              : "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {item.period}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA BANNER ========== */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div
            className="rounded-2xl p-10 md:p-14 text-center relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(94,234,212,0.12) 0%, rgba(26,29,35,0.8) 100%)",
              border: "1px solid rgba(94,234,212,0.3)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(94,234,212,0.06) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10">
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ fontFamily: "var(--font-orbitron, monospace)" }}
              >
                Bergabung dengan{" "}
                <span className="gradient-text">Nemesis Protocol</span>
              </h2>
              <p className="text-gray-300 mb-8 max-w-xl mx-auto leading-relaxed">
                Jadilah bagian dari revolusi infrastruktur EV Indonesia. Invest,
                tokenisasi armada, atau bergabung sebagai operator.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/fi"
                  className="glow-btn inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold"
                >
                  Mulai Invest
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/rwa/operator"
                  className="glow-btn-outline inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold"
                >
                  Daftar Operator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer
        className="px-6 pt-12 pb-8 mt-4"
        style={{
          borderTop: "1px solid rgba(94,234,212,0.12)",
          background: "var(--solana-dark-2)",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <Image
                  src="/noc_logo.png"
                  alt="Nemesis Protocol"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span
                  className="font-semibold text-sm text-white"
                  style={{ fontFamily: "var(--font-orbitron, monospace)" }}
                >
                  Nemesis Protocol
                </span>
              </Link>
              <p className="text-xs text-gray-400 leading-relaxed">
                DePIN / RWA / FI Protocol untuk armada EV Indonesia di atas Solana.
              </p>
              <div className="flex gap-3 mt-4">
                <a
                  href="#"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-400 transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  aria-label="Twitter"
                >
                  <Twitter className="w-3.5 h-3.5" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-400 transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  aria-label="Telegram"
                >
                  <Send className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Protocol */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
                Protocol
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "DePIN", href: "/depin" },
                  { label: "FI (Yield)", href: "/fi" },
                  { label: "RWA", href: "/rwa" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-gray-400 hover:text-teal-400 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Portals */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
                Portals
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Workshop", href: "/workshop" },
                  { label: "Admin", href: "/admin" },
                  { label: "Operator RWA", href: "/rwa/operator" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-gray-400 hover:text-teal-400 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
                Info
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Whitepaper", href: "#" },
                  { label: "Docs", href: "#" },
                  { label: "Privacy", href: "#" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-gray-400 hover:text-teal-400 transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs text-gray-500">
              © 2026 Nemesis Protocol. All rights reserved.
            </p>
            <p className="text-xs text-gray-600">
              Built on Solana · IDRX Native · OJK Aligned
            </p>
          </div>
        </div>
      </footer>

      {/* Float animation keyframes */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
      `}</style>
    </main>
  );
}
