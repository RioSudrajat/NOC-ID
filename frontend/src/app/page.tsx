"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  Car,
  Brain,
  Wrench,
  Users,
  ChevronRight,
  Zap,
  Lock,
  BarChart3,
  Cpu,
  Globe,
  ArrowRight,
  Github,
  Twitter,
  Menu,
  X,
  TrendingUp,
  Database,
  Fingerprint,
} from "lucide-react";
import { motion, useInView } from "framer-motion";

/* ——————————————— Animated Counter ——————————————— */
function AnimatedCounter({ target, suffix = "", label }: { target: number; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref} className="mono font-bold text-4xl md:text-5xl gradient-text">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

/* ——————————————— Navbar ——————————————— */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3" : "py-5"
      }`}
      style={{
        background: (scrolled || mobileOpen) ? "rgba(14,14,26,0.85)" : "transparent",
        backdropFilter: (scrolled || mobileOpen) ? "blur(20px)" : "none",
        borderBottom: (scrolled || mobileOpen) ? "1px solid rgba(153,69,255,0.1)" : "none",
      }}
    >
      <div className="container flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ background: "var(--solana-gradient)" }}
          >
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl">
            <span className="gradient-text">NOC</span>{" "}
            <span style={{ color: "var(--solana-text)" }}>ID</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { href: "#features", label: "Features" },
            { href: "#how-it-works", label: "How It Works" },
            { href: "#stats", label: "Stats" },
            { href: "/dapp", label: "DApp", isLink: true },
            { href: "/workshop", label: "Workshop", isLink: true },
            { href: "/enterprise", label: "Enterprise", isLink: true },
            { href: "/admin", label: "Admin", isLink: true },
          ].map((item) =>
            item.isLink ? (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm hover:text-white transition-colors relative group"
                style={{ color: "var(--solana-text-muted)" }}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-purple-500 to-green-400 transition-all duration-300 group-hover:w-full" />
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="text-sm hover:text-white transition-colors relative group"
                style={{ color: "var(--solana-text-muted)" }}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-purple-500 to-green-400 transition-all duration-300 group-hover:w-full" />
              </a>
            )
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/dapp" className="glow-btn text-sm" style={{ padding: "10px 24px" }}>
            Launch DApp
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-0 right-0 p-6"
          style={{ background: "rgba(14,14,26,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(153,69,255,0.1)" }}
        >
          <div className="flex flex-col gap-4">
            <a href="#features" className="text-sm" style={{ color: "var(--solana-text-muted)" }} onClick={() => setMobileOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-sm" style={{ color: "var(--solana-text-muted)" }} onClick={() => setMobileOpen(false)}>How It Works</a>
            <a href="#stats" className="text-sm" style={{ color: "var(--solana-text-muted)" }} onClick={() => setMobileOpen(false)}>Stats</a>
            <Link href="/dapp" className="text-sm" style={{ color: "var(--solana-text-muted)" }}>DApp</Link>
            <Link href="/workshop" className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Workshop</Link>
            <Link href="/enterprise" className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Enterprise</Link>
            <Link href="/admin" className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Admin</Link>
            <Link href="/dapp" className="glow-btn text-sm text-center mt-2">Launch DApp</Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

/* ——————————————— Feature Cards ——————————————— */
const features = [
  {
    icon: Shield,
    title: "Immutable Records",
    desc: "Every service event is anchored on Solana — tamper-proof and verifiable by anyone.",
    color: "#9945FF",
    bgColor: "rgba(153, 69, 255, 0.12)",
    glowColor: "rgba(153, 69, 255, 0.15)",
  },
  {
    icon: Car,
    title: "3D Digital Twin",
    desc: "Interactive 3D vehicle model with component-level health scoring and real-time updates.",
    color: "#14F195",
    bgColor: "rgba(20, 241, 149, 0.12)",
    glowColor: "rgba(20, 241, 149, 0.15)",
  },
  {
    icon: Brain,
    title: "AI Predictions",
    desc: "XAI engine forecasts part failures with SHAP-explained insights — before they happen.",
    color: "#00D1FF",
    bgColor: "rgba(0, 209, 255, 0.12)",
    glowColor: "rgba(0, 209, 255, 0.15)",
  },
  {
    icon: Lock,
    title: "NFC + QR Verify",
    desc: "Dual-mode smart identity with anti-clone NFC cards and time-sensitive dynamic QR codes.",
    color: "#F959FF",
    bgColor: "rgba(249, 89, 255, 0.12)",
    glowColor: "rgba(249, 89, 255, 0.15)",
  },
  {
    icon: Wrench,
    title: "Proof of Maintenance",
    desc: "Mechanics earn $NOC tokens for every verified service logged on-chain.",
    color: "#FACC15",
    bgColor: "rgba(250, 204, 21, 0.12)",
    glowColor: "rgba(250, 204, 21, 0.15)",
  },
  {
    icon: BarChart3,
    title: "Enterprise Analytics",
    desc: "OEM dashboards with fleet health, warranty compliance, and macro trend analysis.",
    color: "#38BDF8",
    bgColor: "rgba(56, 189, 248, 0.12)",
    glowColor: "rgba(56, 189, 248, 0.15)",
  },
];

/* ——————————————— How It Works ——————————————— */
const steps = [
  {
    step: "01",
    title: "Mint",
    desc: "OEMs mint a Compressed NFT passport for each vehicle at near-zero cost on Solana.",
    icon: Cpu,
    borderColor: "rgba(153, 69, 255, 0.3)",
  },
  {
    step: "02",
    title: "Track",
    desc: "Every service, part replacement, and diagnostic is logged immutably on-chain by verified workshops.",
    icon: Wrench,
    borderColor: "rgba(0, 209, 255, 0.3)",
  },
  {
    step: "03",
    title: "Predict",
    desc: "Our XAI engine analyzes the full vehicle history to forecast failures and recommend preventive action.",
    icon: Brain,
    borderColor: "rgba(20, 241, 149, 0.3)",
  },
];

/* ——————————————— Stats ——————————————— */
const stats = [
  { icon: Car, target: 12847, suffix: "", label: "Vehicles Registered" },
  { icon: Database, target: 87432, suffix: "", label: "Maintenance Events" },
  { icon: Fingerprint, target: 2341, suffix: "", label: "Verified Workshops" },
  { icon: TrendingUp, target: 5200000, suffix: "", label: "Tokens Distributed", displaySuffix: " $NOC" },
];

/* ——————————————— Partners ——————————————— */
const partners = ["Toyota", "Honda", "Suzuki", "Daihatsu", "Yamaha", "Kawasaki", "Mitsubishi", "Hyundai"];

/* ——————————————— Page ——————————————— */
export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <Navbar />

      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center justify-center p-6" style={{ paddingTop: 120 }}>
        {/* Grid pattern */}
        <div className="hero-grid" />

        {/* Orbit rings */}
        <div className="orbit-ring" style={{ width: 800, height: 800, top: "50%", left: "50%", marginTop: -400, marginLeft: -400, opacity: 0.3 }} />
        <div className="orbit-ring-2" style={{ width: 550, height: 550, top: "50%", left: "50%", marginTop: -275, marginLeft: -275, opacity: 0.5 }} />

        {/* Orbs */}
        <div className="orb orb-purple animate-float" style={{ width: 600, height: 600, top: -150, right: -150, mixBlendMode: 'screen' }} />
        <div className="orb orb-green animate-float" style={{ width: 500, height: 500, bottom: -100, left: -100, animationDelay: "3s", mixBlendMode: 'screen' }} />
        <div className="orb orb-cyan animate-float" style={{ width: 400, height: 400, top: "40%", left: "50%", animationDelay: "1s", mixBlendMode: 'screen' }} />

        <div className="container text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div
              className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full"
              style={{
                background: "rgba(153,69,255,0.08)",
                border: "1px solid rgba(153,69,255,0.2)",
                boxShadow: "0 0 20px rgba(153,69,255,0.08)",
              }}
            >
              <Zap className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--solana-text-muted)" }}>Powered by Solana Blockchain</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
            className="text-5xl md:text-7xl lg:text-[88px] font-black leading-[1.05] tracking-tighter uppercase mb-8"
            style={{ textShadow: '0 0 40px rgba(255,255,255,0.1)' }}
          >
            The <span className="gradient-text drop-shadow-[0_0_25px_rgba(139,92,246,0.5)]">Trustless</span>
            <br />
            Vehicle <span className="gradient-text-2 drop-shadow-[0_0_25px_rgba(20,241,149,0.5)]">Identity</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="text-lg md:text-xl max-w-2xl mx-auto text-center mb-12"
            style={{ color: "var(--solana-text-muted)" }}
          >
            Immutable digital passports for every vehicle. On-chain service history,
            AI-powered predictions, and interactive 3D Digital Twins — all on Solana.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-5 justify-center"
          >
            <Link href="/dapp" className="glow-btn text-lg flex items-center justify-center gap-3" style={{ padding: "16px 44px" }}>
              Launch DApp <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/dapp/viewer" className="glow-btn-outline text-lg flex items-center justify-center gap-3" style={{ padding: "16px 44px" }}>
              View 3D Demo <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Hero glow line */}
          <div className="mt-20 h-[1px] w-full relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[1px] bg-gradient-to-r from-transparent via-green-400 to-transparent blur-sm" />
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="section">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why <span className="gradient-text">NOC ID</span>?
            </h2>
            <p style={{ color: "var(--solana-text-muted)" }} className="max-w-xl mx-auto text-center">
              A complete platform that eliminates vehicle fraud and brings transparency to automotive maintenance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card p-8 group cursor-pointer relative overflow-hidden"
                style={{
                  ["--card-glow" as string]: f.glowColor,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = f.color + "50";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${f.glowColor}, inset 0 0 20px ${f.glowColor}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-white/20 transition-all duration-500" />
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 group-hover:shadow-[0_0_20px_var(--solana-card-border)]"
                  style={{ background: f.bgColor, border: `1px solid ${f.glowColor}` }}
                >
                  <f.icon className="w-7 h-7 transition-colors duration-300" style={{ color: f.color }} />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-wide">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--solana-text-muted)" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="section" style={{ background: "linear-gradient(180deg, transparent, rgba(153,69,255,0.03), transparent)" }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p style={{ color: "var(--solana-text-muted)" }} className="max-w-xl mx-auto text-center">
              Three steps to creating a trustless vehicle identity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.2, duration: 0.6, type: "spring", stiffness: 50 }}
                className="relative group"
              >
                {/* Step badge */}
                <div className="flex justify-center mb-4">
                  <div
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors duration-300 group-hover:bg-white/5 group-hover:text-white"
                    style={{
                      background: "rgba(153,69,255,0.08)",
                      border: `1px solid ${s.borderColor}`,
                      color: "var(--solana-text-muted)",
                    }}
                  >
                    Step {s.step}
                  </div>
                </div>

                <div
                  className="glass-card p-10 text-center relative overflow-hidden h-full flex flex-col items-center justify-center transition-all duration-300 group-hover:-translate-y-2"
                  style={{ borderColor: s.borderColor, boxShadow: `0 0 0 ${s.borderColor}` }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 40px ${s.borderColor.replace('0.3', '0.15')}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 transparent`;
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center relative transition-transform duration-500 group-hover:scale-110" style={{ background: "rgba(153,69,255,0.1)" }}>
                    <s.icon className="w-10 h-10 drop-shadow-[0_0_8px_rgba(20,241,149,0.8)]" style={{ color: "var(--solana-green)" }} />
                    <div className="absolute inset-0 rounded-full animate-pulse-glow" style={{ background: "var(--solana-gradient)", opacity: 0.15 }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 gradient-text group-hover:drop-shadow-[0_0_15px_rgba(153,69,255,0.4)] transition-all duration-300">{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--solana-text-muted)" }}>{s.desc}</p>
                </div>

                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block step-connector group-hover:opacity-50 transition-opacity duration-300" style={{ transform: "translateY(-50%)" }} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== LIVE STATS ========== */}
      <section id="stats" className="section">
        <div className="container">
          <div className="glass-card gradient-border-animated p-10 md:p-16 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 opacity-10" style={{ background: "var(--solana-gradient)", mixBlendMode: "overlay" }} />
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-0 md:divide-x md:divide-[rgba(153,69,255,0.2)] text-center">
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                  className="flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1" style={{ background: "rgba(153,69,255,0.1)" }}>
                    <s.icon className="w-6 h-6" style={{ color: "var(--solana-green)" }} />
                  </div>
                  {s.displaySuffix ? (
                    <span className="mono font-bold text-3xl md:text-4xl gradient-text">
                      5.2M<span className="text-2xl md:text-3xl"> $NOC</span>
                    </span>
                  ) : (
                    <AnimatedCounter target={s.target} suffix={s.suffix} label={s.label} />
                  )}
                  <p className="text-sm font-semibold" style={{ color: "var(--solana-text-muted)" }}>{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== PARTNERS (Marquee) ========== */}
      <section className="section" style={{ paddingTop: 20, paddingBottom: 40 }}>
        <div className="container text-center mb-8">
          <p className="text-sm uppercase tracking-widest" style={{ color: "var(--solana-text-muted)" }}>
            Trusted by Leading Automotive Brands
          </p>
        </div>
        <div className="overflow-hidden relative">
          {/* Edge fade */}
          <div className="absolute left-0 top-0 bottom-0 w-32 z-10" style={{ background: "linear-gradient(90deg, var(--solana-dark), transparent)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-32 z-10" style={{ background: "linear-gradient(270deg, var(--solana-dark), transparent)" }} />

          <div className="marquee-track">
            {[...partners, ...partners].map((p, i) => (
              <span
                key={i}
                className="text-3xl font-bold mx-12 md:mx-16 inline-block whitespace-nowrap transition-colors duration-300 hover:text-white cursor-pointer hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] uppercase tracking-wider"
                style={{ color: "rgba(136,136,170,0.25)" }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="glass-card gradient-border-animated p-14 md:p-20 text-center relative overflow-hidden">
            <div className="orb orb-purple" style={{ width: 400, height: 400, top: -150, right: -150, filter: "blur(120px)" }} />
            <div className="orb orb-green" style={{ width: 350, height: 350, bottom: -120, left: -120, filter: "blur(120px)" }} />
            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-5xl lg:text-5xl font-black mb-6 uppercase tracking-tight"
              >
                Ready to <span className="gradient-text drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]">Secure</span> Your Vehicle?
              </motion.h2>
              <p className="mb-8 text-lg max-w-2xl mx-auto text-center" style={{ color: "var(--solana-text-muted)" }}>
                Join the future of transparent automotive ownership. Connect your wallet and explore your vehicle&apos;s digital passport.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center mb-4">
                <Link href="/dapp" className="glow-btn text-lg flex items-center justify-center gap-3" style={{ padding: "16px 44px" }}>
                  Launch DApp <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/dapp/viewer" className="glow-btn-outline text-lg flex items-center justify-center gap-3" style={{ padding: "16px 44px" }}>
                  View 3D Demo
                </Link>
              </div>
              <p className="text-xs" style={{ color: "rgba(148,163,184,0.6)" }}>
                No wallet required to explore the demo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t" style={{ borderColor: "rgba(153,69,255,0.1)", padding: "80px 0 40px" }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1 pr-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--solana-gradient)" }}>
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold text-2xl"><span className="gradient-text">NOC</span> ID</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--solana-text-muted)" }}>
                Nusantara Otomotif Chain ID — the universal, trustless identity layer for every vehicle on the road.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-5 text-xs uppercase tracking-widest" style={{ color: "var(--solana-text-muted)" }}>Product</h4>
              <div className="flex flex-col gap-3">
                {[
                  { href: "/dapp", label: "Vehicle DApp" },
                  { href: "/workshop", label: "Workshop Portal" },
                  { href: "/enterprise", label: "Enterprise Dashboard" },
                  { href: "/admin", label: "Admin Portal" },
                  { href: "/dapp/viewer", label: "3D Digital Twin Demo" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm hover:text-white transition-colors relative group inline-block w-fit"
                    style={{ color: "var(--solana-text-muted)" }}
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gradient-to-r from-purple-500 to-green-400 transition-all duration-300 group-hover:w-full" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-5 text-xs uppercase tracking-widest" style={{ color: "var(--solana-text-muted)" }}>Resources</h4>
              <div className="flex flex-col gap-3">
                {["Documentation", "API Reference", "Whitepaper", "Brand Kit"].map((label) => (
                  <a
                    key={label}
                    href="#"
                    className="text-sm hover:text-white transition-colors relative group inline-block w-fit"
                    style={{ color: "var(--solana-text-muted)" }}
                  >
                    {label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-gradient-to-r from-purple-500 to-green-400 transition-all duration-300 group-hover:w-full" />
                  </a>
                ))}
              </div>
            </div>

            {/* Community */}
            <div>
              <h4 className="font-semibold mb-5 text-xs uppercase tracking-widest" style={{ color: "var(--solana-text-muted)" }}>Community</h4>
              <div className="flex gap-3">
                {[
                  { icon: Twitter, hoverColor: "#1DA1F2" },
                  { icon: Github, hoverColor: "#fff" },
                  { icon: Globe, hoverColor: "#14F195" },
                  { icon: Users, hoverColor: "#9945FF" },
                ].map((social, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 group"
                    style={{ background: "rgba(153,69,255,0.1)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = social.hoverColor + "20";
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${social.hoverColor}30`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(153,69,255,0.1)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "";
                    }}
                  >
                    <social.icon
                      className="w-5 h-5 transition-colors duration-300"
                      style={{ color: "var(--solana-text-muted)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as SVGElement).style.color = social.hoverColor;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as SVGElement).style.color = "var(--solana-text-muted)";
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[1px] mb-6" style={{ background: "rgba(153,69,255,0.1)" }} />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
              © 2026 NOC ID. All rights reserved. Built on Solana.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Privacy Policy</a>
              <a href="#" className="text-xs hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
