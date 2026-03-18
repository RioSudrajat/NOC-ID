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
} from "lucide-react";
import { motion, useInView } from "framer-motion";

/* ——————————————— Animated Counter ——————————————— */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
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
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--solana-gradient)" }}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl">
            <span className="gradient-text">NOC</span>{" "}
            <span style={{ color: "var(--solana-text)" }}>ID</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Features</a>
          <a href="#how-it-works" className="text-sm hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>How It Works</a>
          <a href="#stats" className="text-sm hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Stats</a>
          <Link href="/dapp" className="text-sm hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>DApp</Link>
          <Link href="/workshop" className="text-sm hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Workshop</Link>
          <Link href="/enterprise" className="text-sm hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Enterprise</Link>
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
            <Link href="/dapp" className="glow-btn text-sm text-center mt-2">Launch DApp</Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

/* ——————————————— Feature Cards ——————————————— */
const features = [
  { icon: Shield, title: "Immutable Records", desc: "Every service event is anchored on Solana — tamper-proof and verifiable by anyone." },
  { icon: Car, title: "3D Digital Twin", desc: "Interactive 3D vehicle model with component-level health scoring and real-time updates." },
  { icon: Brain, title: "AI Predictions", desc: "XAI engine forecasts part failures with SHAP-explained insights — before they happen." },
  { icon: Lock, title: "NFC + QR Verify", desc: "Dual-mode smart identity with anti-clone NFC cards and time-sensitive dynamic QR codes." },
  { icon: Wrench, title: "Proof of Maintenance", desc: "Mechanics earn $NOC tokens for every verified service logged on-chain." },
  { icon: BarChart3, title: "Enterprise Analytics", desc: "OEM dashboards with fleet health, warranty compliance, and macro trend analysis." },
];

/* ——————————————— How It Works ——————————————— */
const steps = [
  { step: "01", title: "Mint", desc: "OEMs mint a Compressed NFT passport for each vehicle at near-zero cost on Solana.", icon: Cpu },
  { step: "02", title: "Track", desc: "Every service, part replacement, and diagnostic is logged immutably on-chain by verified workshops.", icon: Wrench },
  { step: "03", title: "Predict", desc: "Our XAI engine analyzes the full vehicle history to forecast failures and recommend preventive action.", icon: Brain },
];

/* ——————————————— Partners ——————————————— */
const partners = ["Toyota", "Honda", "Suzuki", "Daihatsu", "Yamaha", "Kawasaki", "Mitsubishi", "Hyundai"];

/* ——————————————— Page ——————————————— */
export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <Navbar />

      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center justify-center p-6" style={{ paddingTop: 140 }}>
        {/* Orbs */}
        <div className="orb orb-purple animate-float" style={{ width: 600, height: 600, top: -100, right: -150 }} />
        <div className="orb orb-green animate-float" style={{ width: 500, height: 500, bottom: -100, left: -100, animationDelay: "3s" }} />
        <div className="orb orb-cyan animate-float" style={{ width: 400, height: 400, top: "40%", left: "50%", animationDelay: "1s" }} />

        <div className="container text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full" style={{ background: "rgba(153,69,255,0.1)", border: "1px solid rgba(153,69,255,0.2)" }}>
              <Zap className="w-4 h-4" style={{ color: "var(--solana-green)" }} />
              <span className="text-sm" style={{ color: "var(--solana-text-muted)" }}>Powered by Solana Blockchain</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-6xl md:text-8xl lg:text-[100px] font-black leading-[1.05] tracking-tight mb-8"
          >
            The <span className="gradient-text">Trustless</span>
            <br />
            Vehicle <span className="gradient-text-2">Identity</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="text-lg md:text-xl max-w-2xl mx-auto text-center mb-10"
            style={{ color: "var(--solana-text-muted)" }}
          >
            Immutable digital passports for every vehicle. On-chain service history,
            AI-powered predictions, and interactive 3D Digital Twins — all on Solana.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <Link href="/dapp" className="glow-btn text-lg flex items-center justify-center gap-3" style={{ padding: "18px 48px" }}>
              Launch DApp <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/dapp/viewer" className="glow-btn-outline text-lg flex items-center justify-center gap-3" style={{ padding: "18px 48px" }}>
              View 3D Demo <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Hero glow line */}
          <div className="mt-20 h-[1px] w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(153,69,255,0.5), rgba(20,241,149,0.5), transparent)" }} />
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-10 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "rgba(153,69,255,0.12)" }}>
                  <f.icon className="w-8 h-8" style={{ color: "var(--solana-purple)" }} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-base leading-relaxed" style={{ color: "var(--solana-text-muted)" }}>{f.desc}</p>
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="glass-card p-10 text-center relative overflow-hidden h-full flex flex-col items-center justify-center">
                  {/* Step Number */}
                  <div className="absolute top-6 right-6 text-7xl font-black" style={{ color: "rgba(153,69,255,0.08)" }}>
                    {s.step}
                  </div>
                  <div className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center relative" style={{ background: "rgba(153,69,255,0.1)" }}>
                    <s.icon className="w-12 h-12" style={{ color: "var(--solana-green)" }} />
                    <div className="absolute inset-0 rounded-full animate-pulse-glow" style={{ background: "var(--solana-gradient)", opacity: 0.1 }} />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 gradient-text">{s.title}</h3>
                  <p className="text-base leading-relaxed" style={{ color: "var(--solana-text-muted)" }}>{s.desc}</p>
                </div>
                {/* Connector arrow */}
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-10 h-10" style={{ color: "var(--solana-purple)" }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== LIVE STATS ========== */}
      <section id="stats" className="section">
        <div className="container">
          <div className="glass-card p-12 md:p-20 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 opacity-5" style={{ background: "var(--solana-gradient)" }} />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-0 md:divide-x md:divide-[rgba(153,69,255,0.2)] text-center">
              <div className="flex flex-col items-center justify-center">
                <AnimatedCounter target={12847} />
                <p className="mt-4 text-base font-semibold" style={{ color: "var(--solana-text-muted)" }}>Vehicles Registered</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <AnimatedCounter target={87432} />
                <p className="mt-4 text-base font-semibold" style={{ color: "var(--solana-text-muted)" }}>Maintenance Events</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <AnimatedCounter target={2341} />
                <p className="mt-4 text-base font-semibold" style={{ color: "var(--solana-text-muted)" }}>Verified Workshops</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <AnimatedCounter target={5200000} suffix=" $NOC" />
                <p className="mt-4 text-base font-semibold" style={{ color: "var(--solana-text-muted)" }}>Tokens Distributed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PARTNERS ========== */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container text-center">
          <p className="text-sm uppercase tracking-widest mb-8" style={{ color: "var(--solana-text-muted)" }}>
            Trusted by Leading Automotive Brands
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {partners.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-2xl font-bold"
                style={{ color: "rgba(136,136,170,0.3)" }}
              >
                {p}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="section">
        <div className="container">
          <div className="glass-card p-16 md:p-24 text-center relative overflow-hidden">
            <div className="orb orb-purple" style={{ width: 400, height: 400, top: -150, right: -150, filter: "blur(120px)" }} />
            <div className="orb orb-green" style={{ width: 350, height: 350, bottom: -120, left: -120, filter: "blur(120px)" }} />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Ready to <span className="gradient-text">Secure</span> Your Vehicle?
              </h2>
              <p className="mb-10 text-lg max-w-2xl mx-auto text-center" style={{ color: "var(--solana-text-muted)" }}>
                Join the future of transparent automotive ownership. Connect your wallet and explore your vehicle&apos;s digital passport.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/dapp" className="glow-btn text-lg flex items-center justify-center gap-3" style={{ padding: "18px 48px" }}>
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/dapp/viewer" className="glow-btn-outline text-lg flex items-center justify-center gap-3" style={{ padding: "18px 48px" }}>
                  Explore 3D Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t" style={{ borderColor: "rgba(153,69,255,0.1)", padding: "100px 0 40px" }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
            {/* Brand */}
            <div className="md:col-span-1 pr-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--solana-gradient)" }}>
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold text-2xl"><span className="gradient-text">NOC</span> ID</span>
              </div>
              <p className="text-base leading-relaxed" style={{ color: "var(--solana-text-muted)" }}>
                Nusantara Otomotif Chain ID — the universal, trustless identity layer for every vehicle on the road.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-6 text-sm uppercase tracking-widest" style={{ color: "var(--solana-text-muted)" }}>Product</h4>
              <div className="flex flex-col gap-4">
                <Link href="/dapp" className="text-base hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Vehicle DApp</Link>
                <Link href="/workshop" className="text-base hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Workshop Portal</Link>
                <Link href="/enterprise" className="text-base hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Enterprise Dashboard</Link>
                <Link href="/dapp/viewer" className="text-base hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>3D Digital Twin Demo</Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-6 text-sm uppercase tracking-widest" style={{ color: "var(--solana-text-muted)" }}>Resources</h4>
              <div className="flex flex-col gap-4">
                <a href="#" className="text-base hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Documentation</a>
                <a href="#" className="text-base hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>API Reference</a>
                <a href="#" className="text-base hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Whitepaper</a>
                <a href="#" className="text-base hover:text-white transition-colors" style={{ color: "var(--solana-text-muted)" }}>Brand Kit</a>
              </div>
            </div>

            {/* Community */}
            <div>
              <h4 className="font-semibold mb-6 text-sm uppercase tracking-widest" style={{ color: "var(--solana-text-muted)" }}>Community</h4>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 hover:bg-white/10" style={{ background: "rgba(153,69,255,0.1)" }}>
                  <Twitter className="w-6 h-6" style={{ color: "var(--solana-text-muted)" }} />
                </a>
                <a href="#" className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 hover:bg-white/10" style={{ background: "rgba(153,69,255,0.1)" }}>
                  <Github className="w-6 h-6" style={{ color: "var(--solana-text-muted)" }} />
                </a>
                <a href="#" className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 hover:bg-white/10" style={{ background: "rgba(153,69,255,0.1)" }}>
                  <Globe className="w-6 h-6" style={{ color: "var(--solana-text-muted)" }} />
                </a>
                <a href="#" className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1 hover:bg-white/10" style={{ background: "rgba(153,69,255,0.1)" }}>
                  <Users className="w-6 h-6" style={{ color: "var(--solana-text-muted)" }} />
                </a>
              </div>
            </div>
          </div>

          <div className="h-[1px] mb-8" style={{ background: "rgba(153,69,255,0.1)" }} />
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
