import type { Metadata } from "next";
import { Providers } from "@/context/Providers";
import { Orbitron, Exo_2 } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo2",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NOC ID — Trustless Vehicle Identity on Solana",
  description:
    "Decentralized vehicle passport system. On-chain service history, AI predictive maintenance, and interactive 3D Digital Twins — all powered by Solana blockchain.",
  keywords: ["NOC ID", "Solana", "blockchain", "vehicle", "digital passport", "NFT", "Web3", "automotive"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${exo2.variable}`}>
      <body className="font-exo bg-[#1A1D23] text-zinc-100 antialiased selection:bg-teal-400/25 selection:text-teal-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
