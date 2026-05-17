import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { config } from "dotenv";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

config({ path: "backend/.env" });

export type Args = Record<string, string | boolean>;

export function parseArgs(argv = process.argv.slice(2)): Args {
  const args: Args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function argString(args: Args, key: string, fallback?: string) {
  const value = args[key];
  return typeof value === "string" ? value : fallback;
}

export function isExecute(args: Args) {
  return args.execute === true || args.execute === "true";
}

export function rpcUrl() {
  return process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
}

export function dasRpcUrl() {
  return process.env.SOLANA_DAS_RPC_URL || rpcUrl();
}

export function programId() {
  return new PublicKey(process.env.NOC_REGISTRY_PROGRAM_ID ?? "GpQrQR2pQnA7ihao7yJoCceas2x1nLor1nfB5QPPhHJU");
}

export function connection() {
  return new Connection(rpcUrl(), "confirmed");
}

export function backendUrl(args: Args) {
  return argString(args, "backend-url", process.env.BACKEND_URL ?? "http://localhost:4000")!;
}

export function keypairPath(args: Args) {
  return argString(args, "keypair", process.env.DEVNET_KEYPAIR_PATH);
}

export async function readKeypair(path: string) {
  const parsed = JSON.parse(await readFile(path, "utf8")) as number[];
  return Keypair.fromSecretKey(new Uint8Array(parsed));
}

export async function requireKeypair(args: Args) {
  const path = keypairPath(args);
  if (!path) {
    throw new Error("Missing --keypair or DEVNET_KEYPAIR_PATH. Store it outside the repo, e.g. C:\\tmp\\noc-keys\\noc-devnet-deployer.json");
  }
  return readKeypair(path);
}

export function sha256Bytes(value: string) {
  return Array.from(createHash("sha256").update(value).digest());
}

export function sha256Hex(value: unknown) {
  const normalized = typeof value === "string" ? value : JSON.stringify(value);
  return createHash("sha256").update(normalized).digest("hex");
}

export function hexToBytes32(hex: string | null | undefined) {
  const normalized = hex && /^[0-9a-f]{64}$/i.test(hex) ? hex : "0".repeat(64);
  return Array.from(Buffer.from(normalized, "hex"));
}

export function pda(seeds: Array<Buffer | Uint8Array | string>, id = programId()) {
  return PublicKey.findProgramAddressSync(seeds.map((seed) => typeof seed === "string" ? Buffer.from(seed) : Buffer.from(seed)), id);
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  }
  return body as T;
}

export async function printWalletReadiness(args: Args) {
  const path = keypairPath(args);
  const result: Record<string, unknown> = { rpcUrl: rpcUrl(), keypairPath: path ?? null };
  if (!path) {
    result.ready = false;
    result.reason = "missing_keypair_path";
    return result;
  }
  const kp = await readKeypair(path);
  const balanceLamports = await connection().getBalance(kp.publicKey, "confirmed");
  result.wallet = kp.publicKey.toBase58();
  result.balanceSol = balanceLamports / 1_000_000_000;
  result.ready = balanceLamports >= 2_000_000_000;
  result.reason = result.ready ? "funded" : "needs_devnet_sol_airdrop";
  return result;
}

export async function printProgramDeployment() {
  const id = programId();
  const account = await connection().getAccountInfo(id, "confirmed");
  return {
    rpcUrl: rpcUrl(),
    programId: id.toBase58(),
    deployed: Boolean(account?.executable),
    exists: Boolean(account),
    executable: Boolean(account?.executable),
    owner: account?.owner.toBase58() ?? null,
    lamports: account?.lamports ?? 0
  };
}

export async function assertProgramDeployed() {
  const deployment = await printProgramDeployment();
  if (!deployment.deployed) {
    throw new Error(
      `NOC Registry program is not deployed on devnet at ${deployment.programId}. Run npm run devnet:deploy-program first, then rerun this command.`
    );
  }
  return deployment;
}

export function requireExecute(args: Args, summary: unknown) {
  if (!isExecute(args)) {
    console.log(JSON.stringify({ dryRun: true, executeHint: "Add --execute to send the transaction after reviewing this summary.", summary }, null, 2));
    process.exit(0);
  }
}
