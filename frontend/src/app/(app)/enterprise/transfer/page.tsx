"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRightLeft, CheckCircle2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api/client";
import { requestDevnetNetworkFeeSignature } from "@/lib/devnetWalletFee";
import { useUserStore } from "@/store/useUserStore";
import { useVehicleRegistryStore } from "@/store/useVehicleRegistryStore";
import type { VehicleData, SaleData, BuyerData, BuyerMode } from "@/components/enterprise/transfer/types";
import VehicleSelectStep from "@/components/enterprise/transfer/VehicleSelectStep";
import SaleVerifyStep from "@/components/enterprise/transfer/SaleVerifyStep";
import BuyerInfoStep from "@/components/enterprise/transfer/BuyerInfoStep";
import ConfirmStep from "@/components/enterprise/transfer/ConfirmStep";
import TransferComplete from "@/components/enterprise/transfer/TransferComplete";

type Step = 1 | 2 | 3 | 4;

export default function TransferPage() {
  const { showToast } = useToast();
  const hydrateVehicles = useVehicleRegistryStore((state) => state.hydrate);
  const syncVehicles = useVehicleRegistryStore((state) => state.syncFromBackend);
  const vehicles = useVehicleRegistryStore((state) => state.vehicles);
  const updateVehicle = useVehicleRegistryStore((state) => state.updateVehicle);
  const registeredBuyers = useUserStore((state) => state.registeredUsers);
  const syncRegisteredUsers = useUserStore((state) => state.syncRegisteredUsers);
  const currentUser = useUserStore((state) => state.currentUser);
  const [step, setStep] = useState<Step>(1);
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [saleData, setSaleData] = useState<SaleData>({ invoice: "", price: "", date: "", salesperson: "" });
  const [buyerData, setBuyerData] = useState<BuyerData>({ userId: "", name: "", email: "", wallet: "", nik: "" });
  const [buyerMode, setBuyerMode] = useState<BuyerMode>("manual");
  const [transferring, setTransferring] = useState(false);
  const [done, setDone] = useState(false);
  const [txSig, setTxSig] = useState("");

  useEffect(() => {
    hydrateVehicles();
    void syncVehicles();
    void syncRegisteredUsers();
  }, [hydrateVehicles, syncVehicles, syncRegisteredUsers]);

  const registryFleet: VehicleData[] = vehicles
    .filter((vehicle) => !vehicle.isDemo)
    .filter((vehicle) => vehicle.mintStatus === "minted" || vehicle.mintStatus === "escrow")
    .filter((vehicle) => !currentUser?.enterpriseId || vehicle.enterpriseId === currentUser.enterpriseId)
    .filter((vehicle) => vehicle.vin && vehicle.make && vehicle.model && vehicle.year)
    .map((vehicle) => ({
    vehicleId: vehicle.vehicleId,
    vin: vehicle.vin,
    model: `${vehicle.make} ${vehicle.model}`,
    year: vehicle.year,
    color: vehicle.color,
    status: vehicle.mintStatus === "escrow" ? "Minted Escrow" : "Ready to Transfer",
  }));

  const filteredFleet = registryFleet.filter(v =>
    v.vin.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  );

  const handleTransfer = async () => {
    const buyer = registeredBuyers.find((item) => item.userId === buyerData.userId && item.walletAddress === buyerData.wallet);
    if (!buyer || !selectedVehicle) {
      showToast("error", "Buyer Invalid", "Pilih buyer yang sudah terdaftar di NOC ID sebelum transfer.");
      return;
    }
    setTransferring(true);
    try {
      const fee = await requestDevnetNetworkFeeSignature(`NOC ID transfer ${selectedVehicle.vin}`);
      const result = await api.transferVehicle(selectedVehicle.vehicleId, {
        newOwnerId: buyer.userId,
        newOwnerEmail: buyer.email,
        newOwnerWallet: buyer.walletAddress,
        enterpriseAuthorityWallet: currentUser?.selfCustodyAddress,
        feeSignature: fee.signature,
        feePayer: fee.feePayer,
      });
      setTxSig(`${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`);
      updateVehicle(selectedVehicle.vehicleId, {
        currentOwnerId: result.newOwnerId,
        mintStatus: "transferred",
      });
      await syncVehicles();
      setTransferring(false);
      setDone(true);
      const target = `${buyer.displayName} (${buyer.email})`;
      showToast("success", "Transfer Complete!", `cNFT transferred to ${target}`);
    } catch (error) {
      setTransferring(false);
      showToast("error", "Transfer gagal", error instanceof Error ? error.message : "Backend transfer gagal.");
    }
  };

  const simulateMockBuyer = () => {
    const mock = registeredBuyers[Math.floor(Math.random() * registeredBuyers.length)];
    setBuyerMode("manual");
    setBuyerData({
      userId: mock.userId,
      name: mock.displayName,
      email: mock.email,
      wallet: mock.walletAddress,
      nik: mock.nik ?? "",
    });
    showToast("success", "Mock Buyer Loaded", `${mock.displayName} siap untuk di-transfer.`);
  };

  const simulateFullTransfer = () => {
    if (!selectedVehicle) setSelectedVehicle(registryFleet[0] ?? null);
    setSaleData({
      invoice: `INV-2026-${Math.floor(10000 + Math.random() * 89999)}`,
      price: "285000000",
      date: new Date().toISOString().split("T")[0],
      salesperson: "Budi Santoso",
    });
    const mock = registeredBuyers[Math.floor(Math.random() * registeredBuyers.length)];
    setBuyerMode("manual");
    setBuyerData({
      userId: mock.userId,
      name: mock.displayName,
      email: mock.email,
      wallet: mock.walletAddress,
      nik: mock.nik ?? "",
    });
    setStep(4);
    showToast("success", "Mock Data Loaded", "Form terisi otomatis. Tekan Konfirmasi untuk melanjutkan.");
  };

  const handleReset = () => {
    setDone(false); setStep(1); setSelectedVehicle(null);
    setSaleData({ invoice: "", price: "", date: "", salesperson: "" });
    setBuyerData({ userId: "", name: "", email: "", wallet: "", nik: "" });
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
        {step === 3 && <BuyerInfoStep selectedVehicle={selectedVehicle} saleData={saleData} buyerData={buyerData} onBuyerDataChange={setBuyerData} buyerMode={buyerMode} onBuyerModeChange={setBuyerMode} onSimulateMockBuyer={simulateMockBuyer} registeredBuyers={registeredBuyers} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
        {step === 4 && <ConfirmStep selectedVehicle={selectedVehicle} saleData={saleData} buyerData={buyerData} buyerMode={buyerMode} transferring={transferring} onTransfer={handleTransfer} onBack={() => setStep(3)} />}
      </AnimatePresence>
    </div>
  );
}
