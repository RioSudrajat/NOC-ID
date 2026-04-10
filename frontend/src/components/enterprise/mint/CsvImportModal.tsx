"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, UploadCloud, CheckCircle2, X, Sparkles } from "lucide-react";

export interface CsvImportModalProps {
  csvOpen: boolean;
  csvUploaded: boolean;
  onClose: () => void;
  onUpload: () => void;
  onSimulateCsv: () => void;
}

export default function CsvImportModal({
  csvOpen,
  csvUploaded,
  onClose,
  onUpload,
  onSimulateCsv,
}: CsvImportModalProps) {
  return (
    <AnimatePresence>
      {csvOpen && (
        <motion.div
          key="csv-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card rounded-3xl p-8 w-full max-w-lg"
            style={{ border: "1px solid rgba(94, 234, 212,0.2)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" style={{ color: "var(--solana-cyan, #2DD4BF)" }} />
                Import CSV Batch
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!csvUploaded ? (
              <div
                className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors"
                style={{ borderColor: "rgba(94, 234, 212,0.4)", minHeight: "220px" }}
                onClick={onUpload}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(94, 234, 212,0.1)" }}>
                  <UploadCloud className="w-7 h-7" style={{ color: "var(--solana-purple)" }} />
                </div>
                <p className="font-bold mb-1">Drag & Drop CSV File</p>
                <p className="text-xs max-w-xs" style={{ color: "var(--solana-text-muted)" }}>
                  Upload ERP-generated CSV (VIN, Model, Year, Engine). Max 10.000 rows.
                </p>
                <button className="glow-btn-outline mt-5 px-5 py-2 text-xs">Browse Files</button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
                  <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">astra_production_batch_08.csv</p>
                    <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
                      1,250 valid entries · 0 errors
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="glow-btn w-full gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Use This Batch
                </button>
              </div>
            )}

            <button
              onClick={onSimulateCsv}
              className="glow-btn-outline w-full gap-2 text-xs mt-4"
              style={{ borderColor: "rgba(250,204,21,0.4)", color: "#FCD34D" }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Simulate Mock CSV
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
