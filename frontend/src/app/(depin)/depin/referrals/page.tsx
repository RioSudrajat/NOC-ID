"use client";

import { useState } from "react";
import { Copy, Share2, Users, CheckCircle2 } from "lucide-react";

const referred = [
  { wallet: "NMS3f2a...bc4", type: "Operator", joined: "12 Apr 2026", pts: 500 },
  { wallet: "NMS7def...gh5", type: "Investor", joined: "10 Apr 2026", pts: 500 },
  { wallet: "NMS9ijk...lm6", type: "Operator", joined: "5 Apr 2026", pts: 500 },
];

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const refLink = "https://nemesis.id/ref/NMS127xyz";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  };

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] gradient-text mb-2 flex items-center gap-3">
          <Users size={32} style={{ color: "#5EEAD4" }} />
          Referrals
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Ajak orang lain dan dapatkan 500 poin per referral.
        </p>

        {/* Link section */}
        <div className="glass-card p-6 mb-6">
          <label className="text-xs text-gray-400 uppercase mb-2 block">Link Referral Lo</label>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              readOnly
              value={refLink}
              className="input-field flex-1 font-mono text-sm"
            />
            <button
              onClick={handleCopy}
              className={copied ? "glow-btn inline-flex items-center gap-2" : "glow-btn-outline inline-flex items-center gap-2"}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={16} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-5">
            <p className="text-xs text-gray-400 uppercase">Total Referrals</p>
            <p className="text-2xl font-bold text-white mt-2">3</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-gray-400 uppercase">Points dari Referral</p>
            <p className="text-2xl font-bold mt-2" style={{ color: "#5EEAD4" }}>
              1.500 pts
            </p>
          </div>
        </div>

        {/* Referred wallets */}
        <h3 className="text-lg font-bold text-white mb-4">Referred Wallets</h3>
        <div
          className="rounded-2xl overflow-hidden mb-8"
          style={{
            background: "rgba(34,38,46,0.7)",
            border: "1px solid rgba(94,234,212,0.25)",
          }}
        >
          <table className="w-full data-table text-sm">
            <thead>
              <tr
                style={{
                  background: "rgba(94,234,212,0.08)",
                  color: "#5EEAD4",
                }}
              >
                <th className="text-left py-3 px-4">Wallet</th>
                <th className="text-left py-3 px-4">Tipe</th>
                <th className="text-left py-3 px-4">Bergabung</th>
                <th className="text-right py-3 px-4">Poin</th>
              </tr>
            </thead>
            <tbody>
              {referred.map((r, idx) => (
                <tr
                  key={idx}
                  className="border-t"
                  style={{ borderColor: "rgba(94,234,212,0.1)" }}
                >
                  <td className="py-3 px-4 font-mono text-white">{r.wallet}</td>
                  <td className="py-3 px-4">
                    <span className="badge text-xs">{r.type}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{r.joined}</td>
                  <td className="py-3 px-4 text-right font-bold" style={{ color: "#5EEAD4" }}>
                    +{r.pts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Share */}
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Share2 size={18} style={{ color: "#5EEAD4" }} />
          Bagikan Sekarang
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            className="rounded-xl p-4 cursor-pointer text-center font-bold flex items-center justify-center gap-2 transition hover:scale-105"
            style={{ background: "#0088cc", color: "white" }}
          >
            <Share2 size={18} /> Telegram
          </div>
          <div
            className="rounded-xl p-4 cursor-pointer text-center font-bold flex items-center justify-center gap-2 transition hover:scale-105"
            style={{ background: "#000", color: "white", border: "1px solid #333" }}
          >
            <Share2 size={18} /> Twitter / X
          </div>
          <div
            className="rounded-xl p-4 cursor-pointer text-center font-bold flex items-center justify-center gap-2 transition hover:scale-105"
            style={{ background: "#25D366", color: "white" }}
          >
            <Share2 size={18} /> WhatsApp
          </div>
        </div>
      </div>
    </div>
  );
}
