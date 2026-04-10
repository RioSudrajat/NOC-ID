"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRightLeft, CheckCircle2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import type { VehicleData, SaleData, BuyerData, BuyerMode } from "@/components/enterprise/transfer/types";
import VehicleSelectStep from "@/components/enterprise/transfer/VehicleSelectStep";
import SaleVerifyStep from "@/components/enterprise/transfer/SaleVerifyStep";
import BuyerInfoStep from "@/components/enterprise/transfer/BuyerInfoStep";
import ConfirmStep from "@/components/enterprise/transfer/ConfirmStep";
import TransferComplete from "@/components/enterprise/transfer/TransferComplete";

function mockTxSig() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let s = "";
  for (let i = 0; i < 44; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${s.slice(0, 8)}...${s.slice(-8)}`;
}

const MOCK_BUYERS = [
  { name: "Andi Pratama", wallet: "5YNmS1R5yjLezYFqP8tHnQxDv9WkXcR2bB7JmVhTuA3L", nik: "3201012509870001" },
  { name: "Siti Rahayu", wallet: "8ZpQrTvK2cLmNbWxYuJ4HdGe6RfS9A1oP3iVnEzMqBsD", nik: "3271054407900002" },
  { name: "Budi Wijaya", wallet: "3XkLmRvB9tYjH2nQpC8wD4uFsG7KaZ1iVoP6eNxMqJrT", nik: "3173061102950003" },
];

const MOCK_FLEET: VehicleData[] = [
  { vin: "MHKA1BA1JFK000099", model: "Toyota Avanza", year: 2025, color: "Silver Metallic", status: "Ready to Transfer" },
  { vin: "MHKA1BA1JFK000100", model: "Toyota Rush", year: 2025, color: "Midnight Black", status: "Ready to Transfer" },
  { vin: "MHKA1BA1JFK000101", model: "Toyota Innova", year: 2025, color: "Pearl White", status: "Ready to Transfer" },
  { vin: "MHKA1BA1JFK000102", model: "Toyota Fortuner", year: 2024, color: "Phantom Brown", status: "Ready to Transfer" },
  { vin: "MHKA1BA1JFK000103", model: "Toyota Yaris", year: 2025, color: "Nebula Blue", status: "Ready to Transfer" },
];

type Step = 1 | 2 | 3 | 4;

export default function TransferPage() {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [saleData, setSaleData] = useState<SaleData>({ invoice: "", price: "", date: "", salesperson: "" });
  const [buyerData, setBuyerData] = useState<BuyerData>({ name: "", wallet: "", nik: "" });
  const [buyerMode, setBuyerMode] = useState<BuyerMode>("manual");
  const [transferring, setTransferring] = useState(false);
  const [done, setDone] = useState(false);
  const [txSig, setTxSig] = useState("");

  const filteredFleet = MOCK_FLEET.filter(v =>
    v.vin.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  );

  const handleTransfer = () => {
    setTransferring(true);
    setTxSig(mockTxSig());
    setTimeout(() => {
      setTransferring(false);
      setDone(true);
      const target = buyerData.wallet ? `${buyerData.wallet.slice(0, 8)}...` : "QR claim";
      showToast("success", "Transfer Complete!", `cNFT transferred to ${target}`);
    }, 3500);
  };

  const simulateMockBuyer = () => {
    const mock = MOCK_BUYERS[Math.floor(Math.random() * MOCK_BUYERS.length)];
    setBuyerMode("manual");
    setBuyerData(mock);
    showToast("success", "Mock Buyer Loaded", `${mock.name} siap untuk di-transfer.`);
  };

  const simulateFullTransfer = () => {
    if (!selectedVehicle) setSelectedVehicle(MOCK_FLEET[0]);
    setSaleData({
      invoice: `INV-2026-${Math.floor(10000 + Math.random() * 89999)}`,
      price: "285000000",
      date: new Date().toISOString().split("T")[0],
      salesperson: "Budi Santoso",
    });
    const mock = MOCK_BUYERS[Math.floor(Math.random() * MOCK_BUYERS.length)];
    setBuyerMode("manual");
    setBuyerData(mock);
    setStep(4);
    showToast("success", "Mock Data Loaded", "Form terisi otomatis. Tekan Konfirmasi untuk melanjutkan.");
  };

  const handleReset = () => {
    setDone(false); setStep(1); setSelectedVehicle(null);
    setSaleData({ invoice: "", price: "", date: "", salesperson: "" });
    setBuyerData({ name: "", wallet: "", nik: "" });
  };

  const steps = [
    { n: 1, label: "Select Vehicle" },
    { n: 2, label: "Verify Sale" },
    { n: 3, label: "Buyer Info" },
    { n: 4, label: "Confirm" },
  ];

  if (done) {
    return <TransferComplete selectedVehicle={selectedVehicle} saleData={saleData} buyerData={buyerData} txSig={txSig} onReset={handleReset} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="page-header mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <ArrowRightLeft className="w-7 h-7" style={{ color: "var(--solana-green)" }} />
            Transfer Kepemilikan
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>
            Transfer NFT kendaraan ke pembeli setelah transaksi showroom selesai
          </p>
        </div>
        <button onClick={simulateFullTransfer} className="glow-btn-outline gap-2 text-xs px-4 py-2 shrink-0" style={{ borderColor: "rgba(250,204,21,0.4)", color: "#FCD34D" }}>
          <Sparkles className="w-3.5 h-3.5" /> Simulate Mock Data
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, idx) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: step >= s.n ? "var(--solana-gradient)" : "rgba(255,255,255,0.05)", color: step >= s.n ? "white" : "var(--solana-text-muted)", border: step === s.n ? "2px solid var(--solana-green)" : "none" }}>
                {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{ color: step >= s.n ? "white" : "var(--solana-text-muted)" }}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-4 h-4 flex-1 opacity-30 text-center">›</div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && <VehicleSelectStep search={search} onSearchChange={setSearch} filteredFleet={filteredFleet} selectedVehicle={selectedVehicle} onSelectVehicle={setSelectedVehicle} onNext={() => setStep(2)} />}
        {step === 2 && <SaleVerifyStep selectedVehicle={selectedVehicle} saleData={saleData} onSaleDataChange={setSaleData} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <BuyerInfoStep selectedVehicle={selectedVehicle} saleData={saleData} buyerData={buyerData} onBuyerDataChange={setBuyerData} buyerMode={buyerMode} onBuyerModeChange={setBuyerMode} onSimulateMockBuyer={simulateMockBuyer} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
        {step === 4 && <ConfirmStep selectedVehicle={selectedVehicle} saleData={saleData} buyerData={buyerData} buyerMode={buyerMode} transferring={transferring} onTransfer={handleTransfer} onBack={() => setStep(3)} />}
      </AnimatePresence>
    </div>
  );
}
