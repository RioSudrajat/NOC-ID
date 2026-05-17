import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Keypair } from "@solana/web3.js";
import { env } from "../config/env.js";

function encryptionKey() {
  return createHash("sha256")
    .update(env.EMBEDDED_WALLET_ENCRYPTION_KEY ?? env.JWT_SECRET)
    .digest();
}

export function createEmbeddedWallet() {
  const keypair = Keypair.generate();
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), nonce);
  const secret = Buffer.from(keypair.secretKey).toString("base64");
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    address: keypair.publicKey.toBase58(),
    encryptedSecret: encrypted.toString("base64"),
    nonce: nonce.toString("base64"),
    tag: tag.toString("base64")
  };
}

export function decryptEmbeddedWalletSecret(input: { encryptedSecret: string; nonce: string; tag: string }) {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(input.nonce, "base64"));
  decipher.setAuthTag(Buffer.from(input.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(input.encryptedSecret, "base64")),
    decipher.final()
  ]).toString("utf8");
}
