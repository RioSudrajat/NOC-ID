import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { config } from "dotenv";

config({ path: "backend/.env" });

const file = process.argv[2];
const kind = (process.argv[3] ?? "vehicle") as "vehicle" | "part" | "service-log" | "case";
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

if (!file) {
  throw new Error("Usage: node --import tsx scripts/devnet/upload-metadata.ts <metadata.json> [vehicle|part|service-log|case]");
}

// Semuanya dibungkus di dalam fungsi main()
async function main() {
  const bytes = await readFile(file);
  const metadata = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;
  const fileHash = createHash("sha256").update(bytes).digest("hex");

  async function uploadThroughBackend() {
    const response = await fetch(`${backendUrl}/storage/metadata/upload`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, metadata })
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
    }
    return response.json();
  }

  const result = await uploadThroughBackend().catch((error) => ({
    kind,
    metadataHash: fileHash,
    uri: `irys://pending/${fileHash}`,
    public: true,
    backendUpload: false,
    warning: error instanceof Error ? error.message : String(error)
  }));

  console.log(JSON.stringify({
    file,
    fileHash,
    backendUrl,
    ...result
  }, null, 2));
}

// Jalankan fungsinya dan tangkap error kalau ada
main().catch((error) => {
  console.error(error);
  process.exit(1);
});