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

  const booking = await prisma.booking.create({
    data: {
      vehicleId: vehicle.id,
      workshopId: workshop.id,
      date: "2026-05-20",
      time: "10:00",
      complaint: "Routine devnet service and brake inspection",
      status: "INVOICE_SENT"
    }
  });

  const invoice = await prisma.invoice.create({
    data: {
      bookingId: booking.id,
      serviceType: "Periodic maintenance",
      serviceCost: 350000,
      gasFee: 5000,
      totalIdr: 355000,
      mechanicNotes: "Demo invoice for IDRX flow",
      parts: [{ name: "Engine oil", qty: 1, priceIdr: 120000 }]
    }
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      currency: "IDRX",
      amountAtomic: BigInt(35500000),
      amountDisplay: 355000,
      mint: "idrxZcP8xiKkYk6XGD4uz1dxEYCWSgKDHqgjsBbwDur",
      recipientWallet: workshopWallet,
      payerWallet: ownerWallet,
      status: "REQUIRES_SIGNATURE"
    }
  });

  console.log({
    ownerId: owner.id,
    enterpriseId: enterprise.id,
    workshopId: workshop.id,
    vehicleId: vehicle.id,
    bookingId: booking.id,
    invoiceId: invoice.id
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
