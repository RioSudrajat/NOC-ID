import { Wrench } from "lucide-react";
import type { ServiceEvent, PartItem } from "@/components/ui/SharedServiceCard";

function readText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function mapInvoiceParts(parts: unknown): PartItem[] {
  if (!Array.isArray(parts)) return [];
  return parts.map((raw, index) => {
    const part = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    return {
      name: readText(part.name ?? part.componentName, `Part ${index + 1}`),
      partNumber: readText(part.partNumber, "-"),
      isOem: Boolean(part.isOem ?? part.isOEM ?? true),
      manufacturer: readText(part.manufacturer, "NOC"),
      priceIDR: readNumber(part.priceIDR ?? part.priceIdr ?? part.price),
      serviceAction: typeof part.serviceAction === "string" ? part.serviceAction : undefined,
      originStatus: typeof part.originStatus === "string" ? part.originStatus : null,
      originSignature: typeof part.originSignature === "string" ? part.originSignature : null,
      originRecordPda: typeof part.originRecordPda === "string" ? part.originRecordPda : null,
      originCatalogItemId: typeof part.originCatalogItemId === "string" ? part.originCatalogItemId : null,
    };
  }).filter((part) => part.name !== "-" || part.priceIDR > 0);
}

export function mapBackendServiceTimelineEntry(
  entry: { type: string; at: string; item: Record<string, unknown> },
  index: number,
  fallback: { health: number; mileage: string },
): ServiceEvent | null {
  if (entry.type !== "service_log") return null;

  const item = entry.item;
  const booking = item.booking as Record<string, unknown> | undefined;
  const invoice = booking?.invoice as Record<string, unknown> | undefined;
  const txSig = typeof item.txSignature === "string" ? item.txSignature : null;
  const passportReceipt = item.passportUpdateReceipt as Record<string, unknown> | null | undefined;
  const passportTxSig = typeof passportReceipt?.signature === "string" ? passportReceipt.signature : null;
  const originVerification = item.componentOriginVerification as Record<string, unknown> | null | undefined;
  const originTxSig = typeof originVerification?.txSignature === "string" ? originVerification.txSignature : null;
  const parts = mapInvoiceParts(invoice?.parts);
  const originParts = Array.isArray(originVerification?.parts) ? originVerification.parts as Record<string, unknown>[] : [];
  const partsWithOrigin = parts.map((part) => {
    const originPart = originParts.find((origin) =>
      (part.partNumber !== "-" && String(origin.partNumber ?? "") === part.partNumber) ||
      String(origin.name ?? "") === part.name ||
      String(origin.componentName ?? "") === part.name
    );
    if (!originPart) return part;
    const status = originPart.originStatus === "verified_oem"
      ? "verified"
      : originPart.originStatus === "verified_non_oem"
        ? "non_oem"
        : part.originStatus;
    return {
      ...part,
      isOem: status === "verified" ? true : status === "non_oem" ? false : part.isOem,
      originStatus: status,
      originSignature: originTxSig,
      originRecordPda: typeof originVerification?.recordPda === "string" ? originVerification.recordPda : part.originRecordPda,
      originCatalogItemId: typeof originPart.catalogItemId === "string" ? originPart.catalogItemId : part.originCatalogItemId,
    };
  });

  const totalIdr = readNumber(invoice?.totalIdr);
  return {
    id: readText(item.id, `backend-${index}`),
    status: "ANCHORED",
    date: String(entry.at).slice(0, 10),
    type: readText(invoice?.serviceType, "Service Log"),
    category: "Devnet Anchored",
    icon: Wrench,
    mechanic: readText((item.workshop as Record<string, unknown> | undefined)?.name, "Verified Workshop"),
    workshop: readText((item.workshop as Record<string, unknown> | undefined)?.name, "Verified Workshop"),
    rating: 0,
    mileage: `${item.odometerKm ?? fallback.mileage} km`,
    parts: partsWithOrigin,
    serviceCost: readNumber(invoice?.serviceCost),
    gasFee: readNumber(invoice?.gasFee),
    costIDR: totalIdr,
    costUSDC: totalIdr ? Math.round(totalIdr / 16000 * 100) / 100 : 0,
    costNOC: totalIdr ? Math.round(totalIdr / 52) : 0,
    costStr: totalIdr ? `Rp ${totalIdr.toLocaleString("id-ID")}` : "Rp 0",
    txSig,
    passportTxSig,
    originTxSig,
    healthBefore: 70,
    healthAfter: fallback.health,
    notes: readText(invoice?.mechanicNotes, "Service log anchored via backend devnet flow."),
    images: [],
  };
}
