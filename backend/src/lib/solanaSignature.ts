import { createPublicKey, verify } from "node:crypto";

const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const alphabetMap = new Map([...alphabet].map((char, index) => [char, index]));

export function decodeBase58(value: string) {
  let bytes = [0];
  for (const char of value) {
    const carryBase = alphabetMap.get(char);
    if (carryBase == null) {
      throw new Error("Invalid base58 character.");
    }
    let carry = carryBase;
    for (let index = 0; index < bytes.length; index += 1) {
      carry += bytes[index] * 58;
      bytes[index] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of value) {
    if (char !== "1") break;
    bytes.push(0);
  }
  return Buffer.from(bytes.reverse());
}

export function decodeSignature(value: string) {
  const normalized = value.trim();
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    const parsed = JSON.parse(normalized) as unknown;
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "number")) {
      throw new Error("Invalid signature byte array.");
    }
    return Buffer.from(parsed);
  }
  if (/^[0-9a-f]+$/i.test(normalized) && normalized.length % 2 === 0) {
    return Buffer.from(normalized, "hex");
  }
  try {
    const base64 = Buffer.from(normalized, "base64");
    if (base64.length === 64) return base64;
  } catch {
    // Fall through to base58.
  }
  return decodeBase58(normalized);
}

export function verifySolanaMessageSignature(address: string, message: string, signature: string) {
  const publicKeyBytes = decodeBase58(address);
  if (publicKeyBytes.length !== 32) {
    throw new Error("Solana address must decode to 32 bytes.");
  }
  const signatureBytes = decodeSignature(signature);
  if (signatureBytes.length !== 64) {
    throw new Error("Ed25519 signature must be 64 bytes.");
  }
  const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
  const key = createPublicKey({ key: Buffer.concat([spkiPrefix, publicKeyBytes]), format: "der", type: "spki" });
  return verify(null, Buffer.from(message, "utf8"), key, signatureBytes);
}
