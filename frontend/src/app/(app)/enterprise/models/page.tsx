"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Box, UploadCloud, CheckCircle2, X, Eye, Plus,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  SEED_ENTERPRISE_MODELS,
  ENTERPRISE_MODEL_LABELS,
  EnterpriseModel,
  EnterpriseModelKey,
} from "@/data/enterprise-models";

const SharedDigitalTwinViewer = dynamic(
  () => import("@/components/3d/SharedDigitalTwinViewer"),
  { ssr: false }
);

const MODEL_KEYS = ["bmw_m4", "harley", "pcx_150", "supra"] as const;
const MODEL_LABELS = ENTERPRISE_MODEL_LABELS;

type UploadedModel = EnterpriseModel;

const SEED_MODELS: UploadedModel[] = SEED_ENTERPRISE_MODELS;

export default function ModelsPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [models, setModels] = useState<UploadedModel[]>(SEED_MODELS);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedModel, setSelectedModel] = useState<UploadedModel | null>(SEED_MODELS[0]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "car" as "car" | "motorcycle" | "truck",
    modelKey: "bmw_m4",
    file: null as File | null,
  });

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".glb") && !file.name.endsWith(".gltf")) {
      showToast("error", "Invalid Format", "Only .glb and .gltf files are supported.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast("error", "File Too Large", "Maximum file size is 50 MB.");
      return;
    }
    setForm(f => ({ ...f, file }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUpload = () => {
    if (!form.file || !form.name) return;
    setUploading(true);
    setTimeout(() => {
      const blobUrl = URL.createObjectURL(form.file!);
      const newModel: UploadedModel = {
        id: `mdl-${Date.now()}`,
        name: form.name,
        category: form.category,
        modelKey: form.modelKey as EnterpriseModelKey,
        fileName: form.file!.name,
        fileSize: `${(form.file!.size / 1024 / 1024).toFixed(1)} MB`,
        blobUrl,
        uploadedAt: new Date().toISOString().split("T")[0],
        status: "draft",
      };
      setModels(prev => [newModel, ...prev]);
      setSelectedModel(newModel);
      setUploading(false);
      setShowUpload(false);
      setForm({ name: "", category: "car", modelKey: "bmw_m4", file: null });
      showToast("success", "Model Uploaded!", `${newModel.name} berhasil diupload dan siap di-preview.`);
    }, 2000);
  };

  const activateModel = (id: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, status: "active" } : m));
    showToast("success", "Model Activated", "Model sekarang akan digunakan di dApp viewer untuk vehicle yang sesuai.");
  };

  const removeModel = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
    if (selectedModel?.id === id) setSelectedModel(null);
    showToast("success", "Model Removed", "Model telah dihapus dari library.");
  };

  const categoryIcon = (cat: string) => cat === "motorcycle" ? "🏍️" : cat === "truck" ? "🚛" : "🚗";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="page-header mb-8 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-bold text-2xl md:text-3xl">
            <Box className="w-7 h-7" style={{ color: "var(--solana-cyan, #2DD4BF)" }} />
            3D Model Library
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>
            Upload & manage 3D digital twin models untuk kendaraan produk perusahaan
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="glow-btn gap-2 text-sm px-5 py-2.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Upload Model
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Model Library */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {models.length === 0 ? (
            <div
              className="glass-card-static rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors border-2 border-dashed"
              style={{ borderColor: "rgba(94, 234, 212,0.2)", minHeight: "200px" }}
              onClick={() => setShowUpload(true)}
            >
              <Box className="w-10 h-10 mb-3" style={{ color: "var(--solana-cyan, #2DD4BF)", opacity: 0.4 }} />
              <p className="text-sm font-semibold mb-1">Belum ada model</p>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Klik untuk upload model pertama</p>
            </div>
          ) : (
            models.map(m => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-static rounded-2xl p-4 cursor-pointer transition-all"
                style={{
                  border: `1px solid ${selectedModel?.id === m.id ? "rgba(94, 234, 212,0.4)" : "rgba(255,255,255,0.05)"}`,
                  background: selectedModel?.id === m.id ? "rgba(94, 234, 212,0.05)" : undefined,
                }}
                onClick={() => setSelectedModel(m)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: "rgba(94, 234, 212,0.1)" }}
                    >
                      {categoryIcon(m.category)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{m.name}</p>
                      <p className="text-xs mono" style={{ color: "var(--solana-text-muted)" }}>{m.fileName}</p>
                      <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{m.fileSize} · {m.uploadedAt}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: m.status === "active" ? "rgba(34,197,94,0.12)" : "rgba(250,204,21,0.12)",
                        color: m.status === "active" ? "#86EFAC" : "#FCD34D",
                      }}
                    >
                      {m.status === "active" ? "Active" : "Draft"}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--solana-text-muted)" }}>
                      {MODEL_LABELS[m.modelKey] || m.modelKey}
                    </span>
                  </div>
                </div>

                {selectedModel?.id === m.id && (
                  <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedModel(m); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: "rgba(94, 234, 212,0.12)", color: "var(--solana-cyan, #2DD4BF)" }}
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    {m.status === "draft" && (
                      <button
                        onClick={e => { e.stopPropagation(); activateModel(m.id); }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: "rgba(34,197,94,0.12)", color: "#86EFAC" }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); removeModel(m.id); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ml-auto"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Right: 3D Preview Panel */}
        <div className="lg:col-span-3">
          <div
            className="glass-card rounded-2xl overflow-hidden"
            style={{ minHeight: "480px", position: "relative" }}
          >
            {selectedModel ? (
              <>
                {/* Preview Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div>
                    <p className="font-semibold text-sm">{selectedModel.name}</p>
                    <p className="text-xs mono" style={{ color: "var(--solana-text-muted)" }}>
                      Linked: {MODEL_LABELS[selectedModel.modelKey] || selectedModel.modelKey}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(94, 234, 212,0.1)", color: "var(--solana-cyan, #2DD4BF)" }}>
                      React Three Fiber
                    </span>
                  </div>
                </div>

                {/* 3D Viewer Area — reuses the same component as the workshop viewer */}
                <div
                  className="relative overflow-hidden [&>div]:!h-[560px]"
                  style={{ height: "560px", background: "#0E0E1A" }}
                >
                  {MODEL_KEYS.includes(selectedModel.modelKey as EnterpriseModelKey) ? (
                    <SharedDigitalTwinViewer
                      key={selectedModel.id}
                      mode="owner"
                      initialVehicle={selectedModel.modelKey as EnterpriseModelKey}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center px-8">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4" style={{ background: "rgba(255,255,255,0.04)" }}>
                        {categoryIcon(selectedModel.category)}
                      </div>
                      <p className="font-semibold">{selectedModel.name}</p>
                      <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>
                        {selectedModel.fileName} · {selectedModel.fileSize}
                      </p>
                      <p className="text-xs mt-3 max-w-xs" style={{ color: "var(--solana-text-muted)" }}>
                        Model ter-upload. Klik <strong className="text-white">Activate</strong> untuk menggunakannya di dApp viewer.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer info */}
                <div className="p-4 border-t flex items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--solana-text-muted)" }}>
                    <span>Status: <span style={{ color: selectedModel.status === "active" ? "#86EFAC" : "#FCD34D" }}>{selectedModel.status}</span></span>
                    <span>·</span>
                    <span>Uploaded: {selectedModel.uploadedAt}</span>
                  </div>
                  {selectedModel.status === "draft" && (
                    <button
                      onClick={() => activateModel(selectedModel.id)}
                      className="glow-btn text-xs px-4 py-2 gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Activate Model
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12" style={{ minHeight: "480px" }}>
                <Box className="w-16 h-16 mb-4" style={{ color: "var(--solana-cyan, #2DD4BF)", opacity: 0.2 }} />
                <p className="font-semibold mb-2">Pilih model dari library</p>
                <p className="text-sm" style={{ color: "var(--solana-text-muted)" }}>
                  Klik salah satu model di sebelah kiri untuk melihat preview
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            key="upload-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={e => e.target === e.currentTarget && setShowUpload(false)}
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
                  <UploadCloud className="w-5 h-5" style={{ color: "var(--solana-cyan, #2DD4BF)" }} />
                  Upload 3D Model
                </h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>Nama Model</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="e.g. BMW M4 G82 Isle of Man Green"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>Kategori</label>
                    <select
                      className="input-field w-full"
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value as "car" | "motorcycle" | "truck" }))}
                    >
                      <option value="car">Mobil</option>
                      <option value="motorcycle">Motor</option>
                      <option value="truck">Truck</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>Link ke Model</label>
                    <select
                      className="input-field w-full"
                      value={form.modelKey}
                      onChange={e => setForm(f => ({ ...f, modelKey: e.target.value }))}
                    >
                      {MODEL_KEYS.map(k => (
                        <option key={k} value={k}>{MODEL_LABELS[k]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Drop Zone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--solana-text-muted)" }}>File 3D Model (.glb / .gltf)</label>
                  <div
                    className="rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors border-2 border-dashed"
                    style={{
                      borderColor: dragging ? "var(--solana-cyan, #2DD4BF)" : form.file ? "rgba(34,197,94,0.4)" : "rgba(94, 234, 212,0.2)",
                      background: dragging ? "rgba(94, 234, 212,0.05)" : form.file ? "rgba(34,197,94,0.05)" : "transparent",
                      minHeight: "120px",
                    }}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".glb,.gltf"
                      onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                    {form.file ? (
                      <>
                        <CheckCircle2 className="w-8 h-8 text-teal-400 mb-2" />
                        <p className="font-semibold text-sm text-teal-400">{form.file.name}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--solana-text-muted)" }}>
                          {(form.file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 mb-2" style={{ color: "var(--solana-cyan, #2DD4BF)", opacity: 0.6 }} />
                        <p className="text-sm font-semibold">Drag & drop atau klik untuk browse</p>
                        <p className="text-xs mt-1" style={{ color: "var(--solana-text-muted)" }}>
                          Format: .glb / .gltf · Maks 50 MB
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.15)" }}>
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300">
                    MVP: model disimpan di browser (localStorage). Untuk production, model akan di-upload ke IPFS/Arweave dan hash-nya disimpan on-chain.
                  </p>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!form.file || !form.name || uploading}
                  className="glow-btn w-full gap-2 disabled:opacity-40"
                >
                  {uploading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                    : <><UploadCloud className="w-4 h-4" /> Upload & Preview</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
