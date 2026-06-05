import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

function sha256Hex(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function main() {
  const ownerWallet = "DemoOwner1111111111111111111111111111111111";
  const workshopWallet = "DemoWorkshop111111111111111111111111111111";
  const enterpriseWallet = "DemoEnterprise111111111111111111111111111";

  const owner = await prisma.user.upsert({
    where: { email: "owner@noc.local" },
    update: {},
    create: {
      displayName: "Demo Owner",
      email: "owner@noc.local",
      role: "user",
      walletState: "self_custody",
      embeddedWalletAddress: ownerWallet,
      selfCustodyAddress: ownerWallet
    }
  });

  await prisma.wallet.upsert({
    where: { address: ownerWallet },
    update: { userId: owner.id, role: "user" },
    create: { address: ownerWallet, userId: owner.id, role: "user", entityName: "Demo Owner" }
  });

  const enterprise = await prisma.enterprise.create({
    data: {
      name: `NOC Motors ${Date.now()}`,
      authorityWallet: enterpriseWallet,
      metadataHash: sha256Hex({ name: "NOC Motors" })
    }
  });

  const workshop = await prisma.workshop.create({
    data: {
      name: `NOC Verified Garage ${Date.now()}`,
      city: "Jakarta",
      address: "Jl. Devnet No. 1",
      phone: "+628111111111",
      authorityWallet: workshopWallet,
      treasuryWallet: workshopWallet,
      status: "approved",
      metadataHash: sha256Hex({ name: "NOC Verified Garage" }),
      credentials: {
        create: [
          { credential: "verified_signer", issuedBy: enterpriseWallet, enterpriseId: enterprise.id },
          { credential: "manufacturer_audit_partner", issuedBy: enterpriseWallet, enterpriseId: enterprise.id }
        ]
      }
    }
  });

  await prisma.wallet.upsert({
    where: { address: workshopWallet },
    update: { role: "workshop_owner", entityName: workshop.name },
    create: { address: workshopWallet, role: "workshop_owner", entityName: workshop.name }
  });

  const vehicleMeta = {
    vin: "NOCDEVNETVIN001",
    make: "Honda",
    model: "PCX 150",
    year: 2024
  };

  const vehicle = await prisma.vehicle.upsert({
    where: { vin: vehicleMeta.vin },
    update: { currentOwnerId: owner.id, enterpriseId: enterprise.id },
    create: {
      ...vehicleMeta,
      currentOwnerId: owner.id,
      enterpriseId: enterprise.id,
      color: "Pearl White",
      category: "motorcycle_matic",
      transmissionType: "CVT",
      fuelType: "gasoline",
      licensePlate: "B 1234 NOC",
      mintStatus: "demo",
      currentMileageKm: 12450,
      healthScore: 92,
      metadataUri: "https://gateway.irys.xyz/demo-noc-pcx150.json",
      metadataHash: sha256Hex(vehicleMeta),
      cnftAssetId: "demo-cnft-asset",
      treeAddress: "demo-tree-address",
      leafIndex: 0,
      vehicleRecordPda: "demo-vehicle-record-pda"
    }
  });

  const seededServiceWhere = {
    vehicleId: vehicle.id,
    complaint: "Routine devnet service and brake inspection"
  };
  await prisma.payment.deleteMany({
    where: { invoice: { booking: seededServiceWhere } }
  });
  await prisma.invoice.deleteMany({
    where: { booking: seededServiceWhere }
  });
  await prisma.booking.deleteMany({
    where: seededServiceWhere
  });

  console.log({
    ownerId: owner.id,
    enterpriseId: enterprise.id,
    workshopId: workshop.id,
    vehicleId: vehicle.id
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
