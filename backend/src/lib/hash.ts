import { createHash } from "node:crypto";

export function sha256Hex(value: unknown) {
  const normalized = typeof value === "string" ? value : JSON.stringify(value);
  return createHash("sha256").update(normalized).digest("hex");
}
