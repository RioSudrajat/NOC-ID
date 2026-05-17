import { createHash, randomBytes } from "node:crypto";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function toBase58(bytes: Uint8Array) {
  let value = BigInt(`0x${Buffer.from(bytes).toString("hex")}`);
  let output = "";
  while (value > 0n) {
    const mod = Number(value % 58n);
    output = BASE58_ALPHABET[mod] + output;
    value /= 58n;
  }
  for (const byte of bytes) {
    if (byte === 0) output = BASE58_ALPHABET[0] + output;
    else break;
  }
  return output || BASE58_ALPHABET[0];
}

export function createDevnetUiSignature(namespace: string, payload: unknown) {
  const digest = createHash("sha512")
    .update(namespace)
    .update(JSON.stringify(payload))
    .update(randomBytes(16))
    .digest();
  return toBase58(digest).slice(0, 88);
}
