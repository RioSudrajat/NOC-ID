// Shared enterprise constants (MVP / mock)
// Single source of truth for the logged-in enterprise identity and
// the catalog of 3D models the enterprise "owns".

export const ENTERPRISE_NAME = "PT Astra Manufacturing";
export const ENTERPRISE_ROLE = "Genesis Minter";

export type EnterpriseModelKey = "bmw_m4" | "harley" | "pcx_150" | "supra";

export interface EnterpriseModel {
  id: string;
  name: string;
  category: "car" | "motorcycle" | "truck";
  modelKey: EnterpriseModelKey;
  fileName: string;
  fileSize: string;
  blobUrl: string;
  uploadedAt: string;
  status: "active" | "draft";
}

// The 5 seeded 3D models the enterprise already owns.
// These mirror the vehicles the workshop digital-twin viewer can render.
export const SEED_ENTERPRISE_MODELS: EnterpriseModel[] = [  {
    id: "mdl-bmw-m4",
    name: "BMW M4 G82 2025",
    category: "car",
    modelKey: "bmw_m4",
    fileName: "bmw_m4_g82.glb",
    fileSize: "22.1 MB",
    blobUrl: "/models/bmw_m4_g82.glb",
    uploadedAt: "2026-01-15",
    status: "active",
  },  {
    id: "mdl-harley",
    name: "Harley-Davidson Sportster S",
    category: "motorcycle",
    modelKey: "harley",
    fileName: "harley_sportster_s.glb",
    fileSize: "14.7 MB",
    blobUrl: "/models/harley_sportster_s.glb",
    uploadedAt: "2026-02-02",
    status: "active",
  },
  {
    id: "mdl-pcx-150",
    name: "Honda PCX 150 2017",
    category: "motorcycle",
    modelKey: "pcx_150",
    fileName: "PCXDLXABS.glb",
    fileSize: "14.3 MB",
    blobUrl: "/models/honda-pcx/source/PCXDLXABS.glb",
    uploadedAt: "2026-05-15",
    status: "active",
  },
  {
    id: "mdl-supra",
    name: "Toyota Supra Veilside A80",
    category: "car",
    modelKey: "supra",
    fileName: "supra_veilside.glb",
    fileSize: "78.2 MB",
    blobUrl: "/models/supra_veilside.glb",
    uploadedAt: "2026-02-14",
    status: "active",
  },
];

export const ENTERPRISE_MODEL_LABELS: Record<EnterpriseModelKey, string> = {  bmw_m4: "BMW M4 G82",  harley: "Harley-Davidson Sportster S",  pcx_150: "Honda PCX 150 2017",
  supra: "Toyota Supra Veilside",
};

export const PART_CATEGORIES = [
  "Exterior",
  "Interior",
  "Engine",
  "Drivetrain",
  "Brakes",
  "Wheels",
  "Suspension",
  "CVT",
  "Electrical",
  "Fuel",
] as const;

export type PartCategory = (typeof PART_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<PartCategory, string> = {
  Exterior: "#5EEAD4",
  Interior: "#2DD4BF",
  Engine: "#14B8A6",
  Drivetrain: "#0D9488",
  Brakes: "#0F766E",
  Wheels: "#99F6E4",
  Suspension: "#67E8F9",
  CVT: "#22D3EE",
  Electrical: "#A7F3D0",
  Fuel: "#FDE68A",
};
