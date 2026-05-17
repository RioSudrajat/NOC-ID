import { config } from "dotenv";

config({ path: "backend/.env" });

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";
const requiredEnv = ["SOLANA_RPC_URL", "NOC_REGISTRY_PROGRAM_ID", "IDRX_MINT", "DATABASE_URL", "REDIS_URL"];

type CheckResult = {
  name: string;
  ok: boolean;
  detail?: unknown;
  error?: string;
};

async function fetchJson(path: string, init?: RequestInit) {
  const response = await fetch(`${backendUrl}${path}`, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function check(name: string, task: () => Promise<unknown>): Promise<CheckResult> {
  try {
    const detail = await task();
    return { name, ok: true, detail };
  } catch (error) {
    return { name, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function rpcHealth() {
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) {
    return { skipped: true, reason: "SOLANA_RPC_URL missing" };
  }
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "noc-smoke", method: "getHealth" })
  });
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(JSON.stringify(body.error ?? body));
  }
  return body.result;
}

async function main() {
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  const checks = await Promise.all([
    check("backend health", () => fetchJson("/health")),
    check("vehicle registry", async () => {
      const result = await fetchJson("/vehicles");
      return { count: Array.isArray(result.items) ? result.items.length : 0 };
    }),
    check("verified workshops", async () => {
      const result = await fetchJson("/workshops");
      return { count: Array.isArray(result.items) ? result.items.length : 0 };
    }),
    check("bookings", async () => {
      const result = await fetchJson("/bookings");
      return { count: Array.isArray(result.items) ? result.items.length : 0 };
    }),
    check("payments config", () => fetchJson("/payments/currencies")),
    check("on-chain jobs", async () => {
      const result = await fetchJson("/solana/jobs");
      return { count: Array.isArray(result.items) ? result.items.length : 0 };
    }),
    check("solana rpc health", rpcHealth)
  ]);

  const summary = {
    ok: missingEnv.length === 0 && checks.every((item) => item.ok),
    backendUrl,
    cluster: process.env.SOLANA_CLUSTER ?? "devnet",
    idrxMint: process.env.IDRX_MINT,
    missingEnv,
    checks,
    nextDevnetFlow: [
      "deploy Anchor program with funded devnet authority",
      "create Bubblegum tree and Core collection",
      "mint vehicle cNFT and register VehicleRecord PDA",
      "run booking -> invoice -> IDRX payment -> service log anchor",
      "record program id, tree, collection, DAS RPC, and smoke output"
    ]
  };

  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) {
    process.exitCode = 1;
  }
}

void main();
