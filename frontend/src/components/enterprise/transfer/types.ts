export interface VehicleData {
  vin: string;
  model: string;
  year: number;
  color: string;
  status: string;
}

export interface SaleData {
  invoice: string;
  price: string;
  date: string;
  salesperson: string;
}

export interface BuyerData {
  name: string;
  wallet: string;
  nik: string;
}

export type BuyerMode = "manual" | "qr";

export interface VehicleSelectStepProps {
  search: string;
  onSearchChange: (value: string) => void;
  filteredFleet: VehicleData[];
  selectedVehicle: VehicleData | null;
  onSelectVehicle: (vehicle: VehicleData) => void;
  onNext: () => void;
}

export interface SaleVerifyStepProps {
  selectedVehicle: VehicleData | null;
  saleData: SaleData;
  onSaleDataChange: (updater: (prev: SaleData) => SaleData) => void;
  onBack: () => void;
  onNext: () => void;
}

export interface BuyerInfoStepProps {
  selectedVehicle: VehicleData | null;
  saleData: SaleData;
  buyerData: BuyerData;
  onBuyerDataChange: (updater: (prev: BuyerData) => BuyerData) => void;
  buyerMode: BuyerMode;
  onBuyerModeChange: (mode: BuyerMode) => void;
  onSimulateMockBuyer: () => void;
  onBack: () => void;
  onNext: () => void;
}

export interface ConfirmStepProps {
  selectedVehicle: VehicleData | null;
  saleData: SaleData;
  buyerData: BuyerData;
  buyerMode: BuyerMode;
  transferring: boolean;
  onTransfer: () => void;
  onBack: () => void;
}

export interface TransferCompleteProps {
  selectedVehicle: VehicleData | null;
  saleData: SaleData;
  buyerData: BuyerData;
  txSig: string;
  onReset: () => void;
}
