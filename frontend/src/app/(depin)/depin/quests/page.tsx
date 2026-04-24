"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const quests = [
  { id: "q1", title: "Follow Twitter @NemesisProtocol", desc: "Ikuti akun resmi kami", reward: 100, icon: "🐦" },
  { id: "q2", title: "Join Telegram Nemesis", desc: "Gabung komunitas Telegram", reward: 100, icon: "📱" },
  { id: "q3", title: "Join Discord", desc: "Gabung server Discord kami", reward: 100, icon: "💬" },
  { id: "q4", title: "Connect Wallet", desc: "Hubungkan wallet Solana", reward: 100, icon: "👛" },
  { id: "q5", title: "Refer 1 Operator Baru", desc: "Ajak fleet operator bergabung", reward: 500, icon: "🤝" },
  { id: "q6", title: "Participate in Pool Batch #1", desc: "Invest minimal 30.000 IDRX", reward: 1000, icon: "💰" },
  { id: "q7", title: "Hold ≥1.000 poin selama 30 hari", desc: "Jaga saldo poin kamu", reward: 200, icon: "🏆" },
];

export default function QuestsPage() {
  const [completedIds, setCompletedIds] = useState<string[]>(["q4", "q1", "q2"]);

  const handleStart = (id: string) => {
    setCompletedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const completedCount = completedIds.length;
  const total = quests.length;
  const pct = (completedCount / total) * 100;

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] gradient-text mb-2">
          Quests — Kumpulkan Poin
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Selesaikan quest dan dapatkan poin yang akan bisa ditukar $NMS saat IDO 2027
        </p>

        {/* Progress */}
        <div className="glass-card p-5 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">
              Progress: <span className="text-white font-bold">{completedCount}/{total}</span> quests
            </span>
            <span className="text-sm font-bold" style={{ color: "#5EEAD4" }}>
              {pct.toFixed(1)}%
            </span>
          </div>
          <div
            className="w-full h-3 rounded-full overflow-hidden"
            style={{ background: "rgba(94,234,212,0.1)" }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #5EEAD4 0%, #8B5CF6 100%)",
                boxShadow: "0 0 10px rgba(94,234,212,0.5)",
              }}
            />
          </div>
        </div>

        {/* Quest grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quests.map((q) => {
            const done = completedIds.includes(q.id);
            return (
              <div
                key={q.id}
                className="glass-card p-5 relative flex flex-col"
                style={{
                  border: done
                    ? "1px solid rgba(94,234,212,0.6)"
                    : "1px solid rgba(94,234,212,0.25)",
                  background: done
                    ? "linear-gradient(135deg, rgba(94,234,212,0.1) 0%, rgba(34,38,46,0.7) 100%)"
                    : "rgba(34,38,46,0.7)",
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-4xl">{q.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{q.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{q.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3">
                  <span className="badge badge-green text-sm">+{q.reward} pts</span>
                  {done ? (
                    <button
                      disabled
                      className="px-4 py-2 text-sm rounded-lg flex items-center gap-1"
                      style={{
                        background: "rgba(100,100,100,0.3)",
                        color: "#888",
                        cursor: "not-allowed",
                      }}
                    >
                      <CheckCircle2 size={14} style={{ color: "#5EEAD4" }} />
                      Selesai
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStart(q.id)}
                      className="glow-btn-outline text-sm px-4 py-2"
                    >
                      Mulai
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
