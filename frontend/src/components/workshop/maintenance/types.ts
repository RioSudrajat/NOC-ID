export interface PartRow {
  name: string;
  partNumber: string;
  isOem: boolean;
  manufacturer: string;
  priceIDR: number | "";
  scanned: boolean;
}

export const emptyPart = (): PartRow => ({
  name: "",
  partNumber: "",
  isOem: false,
  manufacturer: "",
  priceIDR: "",
  scanned: false,
});

export const serviceTypes = [
  "Oil Change",
  "Brake Pad Replacement",
  "Full Inspection",
  "CVT Fluid Replacement",
  "Tire Rotation",
  "Air Filter Replacement",
  "Coolant Flush",
  "Battery Replacement",
  "Spark Plug Replacement",
  "Timing Belt Replacement",
];

// Mock OEM Part Catalog -- simulates data pulled from on-chain NFT catalog after scanning
export const oemCatalog = [
  { name: "Engine Oil 5W-30 (4L)", partNumber: "08880-83264", manufacturer: "Toyota Motor Corp", priceIDR: 380000 },
  { name: "Oil Filter", partNumber: "90915-YZZD4", manufacturer: "Denso Corp", priceIDR: 45000 },
  { name: "Front Brake Pad Set", partNumber: "04465-BZ010", manufacturer: "Aisin Corp", priceIDR: 450000 },
  { name: "Spark Plugs (Iridium x4)", partNumber: "90919-01253", manufacturer: "Denso Corp", priceIDR: 320000 },
  { name: "Air Filter", partNumber: "17801-BZ050", manufacturer: "Toyota Motor Corp", priceIDR: 85000 },
  { name: "CVT Grease", partNumber: "08C30-K59-600ML", manufacturer: "Honda Motor Co", priceIDR: 35000 },
  { name: "Brake Disc Rotor FL", partNumber: "43512-BZ130", manufacturer: "Toyota Motor Corp", priceIDR: 550000 },
  { name: "Coolant (1L)", partNumber: "08889-80100", manufacturer: "Toyota Motor Corp", priceIDR: 65000 },
  { name: "V-Belt", partNumber: "90916-02708", manufacturer: "Bando Chemical", priceIDR: 120000 },
  { name: "Battery 45B24L", partNumber: "28800-BZ050", manufacturer: "GS Yuasa", priceIDR: 850000 },
];
