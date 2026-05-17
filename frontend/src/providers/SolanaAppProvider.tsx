"use client";

import React from "react";
import { SolanaProvider } from "@solana/react-hooks";
import { autoDiscover, createClient } from "@solana/client";
import type { ClientLogger } from "@solana/client";

const solanaLogger: ClientLogger = (event) => {
  const message = String(event.data?.message ?? "");

  if (event.message === "wallet connection failed" && message.includes("User rejected")) {
    return;
  }

  if (event.message === "cluster warmup failed" && message.includes("signal timed out")) {
    return;
  }

  const payload = event.data ? { ...event.data } : {};
  const prefix = `[solana] ${event.message}`;

  if (event.level === "error") {
    console.error(prefix, payload);
  } else if (event.level === "warn") {
    console.warn(prefix, payload);
  } else if (event.level === "info") {
    console.info(prefix, payload);
  } else {
    console.debug(prefix, payload);
  }
};

// Connect to devnet for the demo
const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

// Derive WSS endpoint from HTTP endpoint
const websocketEndpoint =
  process.env.NEXT_PUBLIC_SOLANA_WS_URL ??
  endpoint.replace("https://", "wss://").replace("http://", "ws://");

// Initialize the framework-kit client
export const solanaClient = createClient({
  endpoint,
  websocketEndpoint,
  logger: solanaLogger,
  walletConnectors: autoDiscover(),
});

export function SolanaAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <SolanaProvider client={solanaClient} walletPersistence={false}>
      {children}
    </SolanaProvider>
  );
}
