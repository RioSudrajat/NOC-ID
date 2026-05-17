"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, CreditCard, Coins, CheckCircle, X, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { useUserStore } from "@/store/useUserStore";
import type { PartItem } from "./SharedServiceCard";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceDetails: {
    serviceName: string;
    description: string;
    amountIDR: number;
    amountUSDC: number;
    amountIDRX?: number;
    amountNOC: number;
    parts?: PartItem[];
    serviceCost?: number;
    gasFee?: number;
  };
  paymentContext?: {
    invoiceId: string;
    bookingId: string;
    recipientWallet: string;
  };
  onPaymentComplete: () => void;
}

type PaymentMethod = "web3" | "fiat" | "idrx" | "noc" | null;

export function PaymentModal({
  isOpen,
  onClose,
  serviceDetails,
  paymentContext,
  onPaymentComplete,
}: PaymentModalProps) {
  const currentUser = useUserStore((state) => state.currentUser);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount);
  const amountIDRX = serviceDetails.amountIDRX ?? serviceDetails.amountIDR;

  const handlePayment = async () => {
    if (!selectedMethod) return;
    
    setIsProcessing(true);
    try {
      if (selectedMethod === "idrx" && paymentContext) {
        const intent = await api.createPaymentIntent({
          invoiceId: paymentContext.invoiceId,
          bookingId: paymentContext.bookingId,
          amountIdr: serviceDetails.amountIDR,
          currency: "IDRX",
          payerWallet: currentUser?.embeddedWalletAddress,
          recipientWallet: paymentContext.recipientWallet,
        });
        await api.confirmDevnetPayment(intent.paymentIntentId, {
          payerWallet: currentUser?.embeddedWalletAddress,
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedMethod(null);
        onPaymentComplete();
        onClose();
      }, 1200);
    } catch (error) {
      console.warn("[payment-modal] payment failed", error);
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    if (!isProcessing) {
      setSelectedMethod(null);
      setIsSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={resetState}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden p-6"
        >
          {/* Close button */}
          <button
            onClick={resetState}
            disabled={isProcessing || isSuccess}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          {!isSuccess ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Invoice Summary</h2>
                <p className="text-sm text-slate-400">Please select a payment method to complete the service and anchor your data to the blockchain.</p>
              </div>

              {/* Invoice Card */}
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-white">{serviceDetails.serviceName}</h3>
                    <p className="text-sm text-slate-400">{serviceDetails.description}</p>
                  </div>
                </div>

                {/* Itemized Parts */}
                {serviceDetails.parts && serviceDetails.parts.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {serviceDetails.parts.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          {p.isOem && <CheckCircle2 className="w-3 h-3 text-teal-400" />}
                          {p.name}
                        </span>
                        <span className="mono text-slate-400 text-xs">Rp {p.priceIDR.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-700 pt-3 mt-3 space-y-2">
                  {serviceDetails.parts && serviceDetails.parts.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Subtotal Parts</span>
                      <span className="mono text-slate-300">Rp {serviceDetails.parts.reduce((s, p) => s + p.priceIDR, 0).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {typeof serviceDetails.serviceCost === 'number' && serviceDetails.serviceCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Service Cost</span>
                      <span className="mono text-slate-300">Rp {serviceDetails.serviceCost.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {/* Network gas fee is absorbed by the workshop — not billed to customer */}
                  <div className="flex justify-between items-end pt-2 mt-2 border-t border-slate-700">
                    <span className="text-sm text-slate-400">Total Due</span>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
                      {formatIDR(serviceDetails.amountIDR)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-300">Payment Method</h3>
                
                {/* 1. Web2 Fiat */}
                <button
                  onClick={() => setSelectedMethod("fiat")}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedMethod === "fiat"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">QRIS / Bank Transfer</div>
                      <div className="text-xs text-slate-400">Pay directly with Rupiah</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{formatIDR(serviceDetails.amountIDR)}</div>
                  </div>
                </button>

                {/* 2. IDRX on Solana */}
                <button
                  onClick={() => setSelectedMethod("idrx")}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedMethod === "idrx"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">IDRX on Solana</div>
                      <div className="text-xs text-slate-400">Pay with IDR-pegged SPL token</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{amountIDRX.toLocaleString("id-ID")} IDRX</div>
                  </div>
                </button>

                {/* 3. Web3 Wallet */}
                <button
                  onClick={() => setSelectedMethod("web3")}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedMethod === "web3"
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">Phantom Wallet</div>
                      <div className="text-xs text-slate-400">Pay using USDC stablecoin</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">${serviceDetails.amountUSDC} USDC</div>
                  </div>
                </button>

                {/* 4. NOC Token (Disabled) */}
                <button
                  disabled={true}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-800/30 opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">Pay with $NOC</div>
                      <div className="text-xs text-teal-400 font-medium tracking-wide text-[10px] uppercase">Coming Soon</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-400">{serviceDetails.amountNOC} NOC</div>
                  </div>
                </button>
              </div>

              {/* Action */}
              <button
                onClick={handlePayment}
                disabled={!selectedMethod || isProcessing}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium hover:from-blue-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing & Anchoring to Solana...
                  </>
                ) : (
                  "Confirm Payment"
                )}
              </button>
            </div>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 mb-2">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
              <p className="text-slate-400 max-w-[280px]">
                Your payment has been settled and the service data is now permanently anchored to the blockchain.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
