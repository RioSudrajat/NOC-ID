import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOC ID — Trustless Vehicle Identity on Solana",
  description:
    "Decentralized vehicle passport system. On-chain service history, AI predictive maintenance, and interactive 3D Digital Twins — all powered by Solana blockchain.",
  keywords: ["NOC ID", "Solana", "blockchain", "vehicle", "digital passport", "NFT", "Web3", "automotive"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
