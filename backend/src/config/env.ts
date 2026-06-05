import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32),
  SOLANA_CLUSTER: z.enum(["localnet", "devnet"]).default("devnet"),
  SOLANA_RPC_URL: z.string().url().default("https://api.devnet.solana.com"),
  SOLANA_WS_URL: z.string().url().optional(),
  SOLANA_DAS_RPC_URL: z.string().url().optional(),
  NOC_REGISTRY_PROGRAM_ID: z.string().default("NoCReg1111111111111111111111111111111111111"),
  IDRX_MINT: z.string().default("idrxZcP8xiKkYk6XGD4uz1dxEYCWSgKDHqgjsBbwDur"),
  USDC_MINT: z.string().default("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
  DEPRECATED_IDRX_MINT_PREFIX: z.string().default("idrxTdN"),
  EMBEDDED_WALLET_ENCRYPTION_KEY: z.string().min(32).optional(),
  IRYS_GATEWAY_URL: z.string().url().default("https://gateway.irys.xyz"),
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  DEVNET_KEYPAIR_PATH: z.string().optional(),
  BUBBLEGUM_TREE_ADDRESS: z.string().optional(),
  BUBBLEGUM_TREE_MAX_DEPTH: z.coerce.number().int().positive().optional(),
  BUBBLEGUM_TREE_MAX_BUFFER_SIZE: z.coerce.number().int().positive().optional(),
  BUBBLEGUM_TREE_CANOPY_DEPTH: z.coerce.number().int().nonnegative().optional(),
  METAPLEX_CORE_COLLECTION_ADDRESS: z.string().optional(),
  METAPLEX_CORE_COLLECTION_URI: z.string().url().optional(),
  VEHICLE_QR_EXPIRY_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  CORS_ORIGIN: z.string().default("http://localhost:3000").transform(val => val.split(',').map(s => s.trim()))
});

export const env = envSchema.parse(process.env);

export const paymentMints = {
  IDRX: env.IDRX_MINT,
  USDC: env.USDC_MINT
} as const;

export type SupportedPaymentCurrency = keyof typeof paymentMints;
