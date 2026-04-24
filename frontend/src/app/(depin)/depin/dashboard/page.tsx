"use client";

import Link from "next/link";
import { ConnectWalletButton } from "@/components/ui/ConnectWalletButton";
import { WorkshopRevenueChart } from "@/components/ui/WorkshopRevenueChart";
import {
  Trophy,
  Star,
  Zap,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const weeklyPoints = [
  { name: "W1", revenue: 280 },
  { name: "W2", revenue: 340 },
  { name: "W3", revenue: 520 },
  { name: "W4", revenue: 680 },
  { name: "W5", revenue: 520 },
];

const recentActivity = [
  { icon: "⭐", label: "Quest completed: Follow Twitter", pts: 100, time: "2 jam lalu" },
  { icon: "💰", label: "Pool distribution", pts: 200, time: "1 hari lalu" },
  { icon: "🤝", label: "Referral bonus", pts: 500, time: "3 hari lalu" },
  { icon: "🏆", label: "Weekly top 500", pts: 150, time: "5 hari lalu" },
  { icon: "📱", label: "Join Telegram", pts: 100, time: "6 hari lalu" },
];

const leaderboard = [
  { rank: 1, wallet: "NMS1ab...9f2x", points: 12480, tier: "Diamond" },
  { rank: 2, wallet: "NMS4cd...e7k1", points: 10230, tier: "Diamond" },
  { rank: 3, wallet: "NMS7ef...h3m2", points: 9120, tier: "Gold" },
  { rank: 4, wallet: "NMSab2...kq8p", points: 7845, tier: "Gold" },
  { rank: 5, wallet: "NMSdf8...rs2w", points: 6210, tier: "Gold" },
  { rank: 6, wallet: "NMSpq4...vv3k", points: 5480, tier: "Silver" },
  { rank: 7, wallet: "NMSzx9...n12m", points: 4920, tier: "Silver" },
  { rank: 8, wallet: "NMSaa1...bbcc", points: 3890, tier: "Silver" },
  { rank: 9, wallet: "NMSoo2...mkkk", points: 3210, tier: "Silver" },
  { rank: 10, wallet: "NMSxx9...e1f9", points: 2940, tier: "Silver" },
];

export default function PersonalDashboardPage() {
  const isConnected = true;

  if (!isConnected) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
      >
        <div className="glass-card p-10 max-w-md w-full text-center">
          <Zap size={48} style={{ color: "#5EEAD4" }} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-orbitron)]">
            Dashboard Personal
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Hubungkan wallet untuk melihat dashboard.
          </p>
          <ConnectWalletButton />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "var(--solana-dark)", color: "#E4E6EB" }}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] gradient-text mb-2">
          Dashboard
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Overview poin, rank, dan aktivitas kamu
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5">
            <p className="text-xs text-gray-400 uppercase">All Points</p>
            <p className="text-2xl font-bold text-white mt-2">2.847.392</p>
          </div>
          <div className="glass-card p-5" style={{ borderColor: "rgba(94,234,212,0.5)" }}>
            <p className="text-xs text-gray-400 uppercase">My Points</p>
            <p className="text-2xl font-bold mt-2" style={{ color: "#5EEAD4" }}>
              2.340
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-gray-400 uppercase">Rank</p>
            <p className="text-2xl font-bold text-white mt-2">#127</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-gray-400 uppercase">Tier</p>
            <p className="text-2xl font-bold text-white mt-2 flex items-center gap-1">
              Silver <Star size={18} style={{ color: "#C0C0C0" }} fill="#C0C0C0" />
            </p>
          </div>
        </div>

        {/* Points chart */}
        <div className="glass-card p-5 mb-8">
          <h3 className="text-lg font-bold text-white mb-1">Weekly Points</h3>
          <p className="text-sm text-gray-400 mb-4">5 minggu terakhir</p>
          <WorkshopRevenueChart data={weeklyPoints} />
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((a, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{
                    background: "rgba(94,234,212,0.05)",
                    border: "1px solid rgba(94,234,212,0.1)",
                  }}
                >
                  <span className="text-2xl">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.time}</p>
                  </div>
                  <span className="badge badge-green text-xs">+{a.pts} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Trophy size={20} style={{ color: "#F59E0B" }} />
              Leaderboard
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full data-table text-sm">
                <thead>
                  <tr style={{ color: "#5EEAD4" }}>
                    <th className="text-left py-2 px-2">#</th>
                    <th className="text-left py-2 px-2">Wallet</th>
                    <th className="text-right py-2 px-2">Points</th>
                    <th className="text-right py-2 px-2">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row) => (
                    <tr
                      key={row.rank}
                      className="border-t"
                      style={{ borderColor: "rgba(94,234,212,0.1)" }}
                    >
                      <td className="py-2 px-2 text-gray-400">{row.rank}</td>
                      <td className="py-2 px-2 font-mono text-white text-xs">
                        {row.wallet}
                      </td>
                      <td className="py-2 px-2 text-right text-white">
                        {row.points.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className="badge text-xs">{row.tier}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick link cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/depin/quests"
            className="glass-card p-5 hover:border-teal-400 transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-gray-400 uppercase">Quests</p>
              <p className="text-lg font-bold text-white mt-1">Kumpulkan poin</p>
            </div>
            <ChevronRight size={20} style={{ color: "#5EEAD4" }} />
          </Link>
          <Link
            href="/depin/earn"
            className="glass-card p-5 hover:border-teal-400 transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-gray-400 uppercase">Earn</p>
              <p className="text-lg font-bold text-white mt-1">Season Campaign</p>
            </div>
            <ChevronRight size={20} style={{ color: "#5EEAD4" }} />
          </Link>
          <Link
            href="/fi"
            className="glass-card p-5 hover:border-teal-400 transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-gray-400 uppercase">FI Portfolio</p>
              <p className="text-lg font-bold text-white mt-1 flex items-center gap-1">
                <TrendingUp size={18} style={{ color: "#5EEAD4" }} />
                Investasi
              </p>
            </div>
            <ChevronRight size={20} style={{ color: "#5EEAD4" }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
