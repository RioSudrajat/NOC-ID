import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { argString, parseArgs } from "./lib/devnet.js";

config({ path: "backend/.env" });

async function main() {
  const args = parseArgs();
  const vehicleId = argString(args, "vehicle-id");
  const cnftAssetId = argString(args, "asset-id");
  const treeAddress = argString(args, "tree");
  const leafIndex = args["leaf-index"] == null ? undefined : Number(args["leaf-index"]);
  const vehicleRecordPda = argString(args, "vehicle-record-pda");
  const enterpriseRecordPda = argString(args, "enterprise-record-pda");

  if (!vehicleId || !cnftAssetId || !treeAddress || leafIndex == null || !vehicleRecordPda) {
    throw new Error("Usage: --vehicle-id <id> --asset-id <asset> --tree <tree> --leaf-index <n> --vehicle-record-pda <pda> [--enterprise-record-pda <pda>]");
  }

  const prisma = new PrismaClient();
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        cnftAssetId,
        treeAddress,
        leafIndex,
        vehicleRecordPda,
        mintStatus: "minted"
      },
      include: { enterprise: true }
    });

    const enterprise = enterpriseRecordPda && vehicle.enterpriseId
      ? await prisma.enterprise.update({
        where: { id: vehicle.enterpriseId },
        data: { recordPda: enterpriseRecordPda }
      })
      : null;

    console.log(JSON.stringify({
      vehicle: {
        id: vehicle.id,
        vin: vehicle.vin,
        mintStatus: vehicle.mintStatus,
        cnftAssetId: vehicle.cnftAssetId,
        treeAddress: vehicle.treeAddress,
        leafIndex: vehicle.leafIndex,
        vehicleRecordPda: vehicle.vehicleRecordPda
      },
      enterprise: enterprise
        ? { id: enterprise.id, recordPda: enterprise.recordPda }
        : null
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

void main();
