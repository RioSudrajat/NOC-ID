"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Camera, Car, CheckCircle2, Clock, Loader2, Nfc, QrCode, Shield, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, type ApiVehicleQrVerification } from "@/lib/api/client";
import { useBookingStore } from "@/store/useBookingStore";
import { useUserStore } from "@/store/useUserStore";

type ScannerControls = { stop: () => void };

type DecodeCanvasCandidate = {
  label: string;
  canvas: HTMLCanvasElement;
};

const describeQrDecodeError = (error: unknown) => {
  if (error instanceof Error) return error.message || error.name || "QR reader tidak memberi detail error.";
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; name?: unknown; toString?: () => string };
    if (typeof maybeError.message === "string" && maybeError.message.trim()) return maybeError.message;
    if (typeof maybeError.name === "string" && maybeError.name.trim()) return maybeError.name;
    const text = maybeError.toString?.();
    if (text && text !== "[object Object]") return text;
  }
  return "QR reader tidak memberi detail error.";
};

const getDecodeAttempts = (error: unknown) => {
  if (!error || typeof error !== "object") return [];
  const attempts = (error as { attempts?: unknown }).attempts;
  return Array.isArray(attempts) ? attempts.filter((item): item is string => typeof item === "string") : [];
};

const getCanvasContext = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Browser tidak bisa membuat canvas untuk membaca QR.");
  return context;
};

const loadImageElementFromFile = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    URL.revokeObjectURL(imageUrl);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    reject(new Error("File gambar QR tidak bisa dibuka browser."));
  };
  image.src = imageUrl;
});

const drawImageToCanvas = (image: HTMLImageElement, width: number, height: number, label: string): DecodeCanvasCandidate => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = getCanvasContext(canvas);
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, width, height);
  return { label, canvas };
};

const drawNormalizedQrCanvas = (image: HTMLImageElement, size: number, padding: number, label: string): DecodeCanvasCandidate => {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = getCanvasContext(canvas);
  const availableSize = size - padding * 2;
  const scale = Math.min(availableSize / sourceWidth, availableSize / sourceHeight);
  const drawWidth = Math.round(sourceWidth * scale);
  const drawHeight = Math.round(sourceHeight * scale);
  const left = Math.round((size - drawWidth) / 2);
  const top = Math.round((size - drawHeight) / 2);

  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, size, size);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, left, top, drawWidth, drawHeight);
  return { label, canvas };
};

const createThresholdCanvas = (candidate: DecodeCanvasCandidate, label: string, invert = false): DecodeCanvasCandidate => {
  const canvas = document.createElement("canvas");
  canvas.width = candidate.canvas.width;
  canvas.height = candidate.canvas.height;
  const context = getCanvasContext(canvas);
  context.drawImage(candidate.canvas, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let index = 0; index < data.length; index += 4) {
    const luminance = (0.2126 * data[index]) + (0.7152 * data[index + 1]) + (0.0722 * data[index + 2]);
    const isDark = luminance < 150;
    const value = invert ? (isDark ? 255 : 0) : (isDark ? 0 : 255);
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }
  context.putImageData(imageData, 0, 0);
  return { label, canvas };
};

const makeQrDecodeCanvases = (image: HTMLImageElement): DecodeCanvasCandidate[] => {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const maxSide = Math.max(sourceWidth, sourceHeight);
  const originalScale = Math.min(1, 1200 / maxSide);
  const original = drawImageToCanvas(
    image,
    Math.max(1, Math.round(sourceWidth * originalScale)),
    Math.max(1, Math.round(sourceHeight * originalScale)),
    "canvas-original",
  );
  const normalized = drawNormalizedQrCanvas(image, 900, 72, "canvas-normalized-white");

  return [
    original,
    normalized,
    createThresholdCanvas(original, "canvas-original-threshold"),
    createThresholdCanvas(normalized, "canvas-normalized-threshold"),
    createThresholdCanvas(normalized, "canvas-normalized-threshold-inverted", true),
  ];
};

const decodeQrFromImageFile = async (file: File) => {
  const { BrowserQRCodeReader } = await import("@zxing/browser");
  const reader = new BrowserQRCodeReader();
  const attempts: string[] = [];

  const imageUrl = URL.createObjectURL(file);
  try {
    const result = await reader.decodeFromImageUrl(imageUrl);
    return { text: result.getText(), method: "blob-url" };
  } catch (error) {
    attempts.push(`blob-url: ${describeQrDecodeError(error)}`);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }

  const image = await loadImageElementFromFile(file);
  try {
    const result = await reader.decodeFromImageElement(image);
    return { text: result.getText(), method: "image-element" };
  } catch (error) {
    attempts.push(`image-element: ${describeQrDecodeError(error)}`);
  }

  for (const candidate of makeQrDecodeCanvases(image)) {
    try {
      const result = reader.decodeFromCanvas(candidate.canvas);
      return { text: result.getText(), method: candidate.label };
    } catch (error) {
      attempts.push(`${candidate.label}: ${describeQrDecodeError(error)}`);
    }
  }

  const error = new Error("QR dari gambar tidak bisa dibaca. Upload PNG/JPG QR NOC ID yang di-download dari Identity Card, lalu coba regenerate kalau QR sudah expired.");
  (error as Error & { attempts: string[] }).attempts = attempts;
  throw error;
};

export default function ScanPage() {
  const router = useRouter();
  const syncBookings = useBookingStore((state) => state.syncFromBackend);
  const currentUser = useUserStore((state) => state.currentUser);
  const sessionToken = useUserStore((state) => state.session?.token);
  const [scanMode, setScanMode] = useState<"nfc" | "qr">("qr");
  const [cameraActive, setCameraActive] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [cameraStatus, setCameraStatus] = useState("Camera ready");
  const [scanDebug, setScanDebug] = useState("Waiting for QR input");
  const [fallbackWorkshopId, setFallbackWorkshopId] = useState<string | undefined>();
  const [verification, setVerification] = useState<ApiVehicleQrVerification | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const scanRunIdRef = useRef(0);

  const activeWorkshopId = currentUser?.workshopId ?? fallbackWorkshopId;

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  useEffect(() => {
    if (currentUser?.workshopId || currentUser?.role !== "workshop_owner") return;
    let cancelled = false;
    void api.workshops()
      .then(({ items }) => {
        if (cancelled) return;
        const approved = items.find((item) => item.status === "approved") ?? items[0];
        setFallbackWorkshopId(approved?.id);
        if (approved?.id) {
          setScanDebug(`Workshop resolved: ${approved.name}`);
          console.info("[NOC ID QR] Workshop resolved for scanner", { workshopId: approved.id, source: "workshops_api" });
        } else {
          setScanDebug("No approved workshop found for scanner");
          console.warn("[NOC ID QR] No approved workshop found for scanner");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setScanDebug("Could not resolve workshop for scanner");
        console.warn("[NOC ID QR] Could not resolve workshop for scanner", error);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.role, currentUser?.workshopId]);

  const verifyDecodedPayload = useCallback(async (payload: string, source: "camera" | "upload") => {
    if (verifying || verification) return;
    if (!sessionToken) {
      setScanError("Login workshop backend diperlukan sebelum scan QR.");
      setScanDebug("Verify blocked: no workshop session token");
      console.warn("[NOC ID QR] Verify blocked: no workshop session token");
      return;
    }
    setVerifying(true);
    setScanError("");
    setScanDebug(`QR decoded from ${source}. Verifying with backend...`);
    console.info("[NOC ID QR] QR decoded", {
      source,
      payloadLength: payload.length,
      workshopId: activeWorkshopId ?? null,
    });
    try {
      const response = await api.verifyVehicleQr({ payload, workshopId: activeWorkshopId }, sessionToken);
      setVerification(response);
      setCameraActive(false);
      stopCamera();
      setScanDebug(`Verified ${response.vehicle.make} ${response.vehicle.model} for ${response.workshop.name}`);
      console.info("[NOC ID QR] QR verified successfully", {
        scanSessionId: response.scanSessionId,
        vehicleId: response.vehicle.id,
        workshopId: response.workshop.id,
        includeServiceHistory: response.includeServiceHistory,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "QR tidak valid atau sudah expired.";
      setScanError(message);
      setScanDebug(`Verify failed: ${message}`);
      console.warn("[NOC ID QR] QR verify failed", { source, workshopId: activeWorkshopId ?? null, message });
      setCameraActive(source === "camera");
    } finally {
      setVerifying(false);
    }
  }, [activeWorkshopId, sessionToken, stopCamera, verification, verifying]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (scanMode !== "qr" || !cameraActive || verification || !videoElement) return;
    let stopped = false;
    const runId = ++scanRunIdRef.current;
    setCameraStatus("Opening camera...");
    setScanError("");
    setScanDebug("Opening camera scanner...");

    void (async () => {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 250 });
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoElement,
        (result, _error, activeControls) => {
          if (!result || stopped || runId !== scanRunIdRef.current) return;
          stopped = true;
          activeControls.stop();
          controlsRef.current = null;
          setCameraStatus("QR detected");
          void verifyDecodedPayload(result.getText(), "camera");
        },
      );
      if (stopped || runId !== scanRunIdRef.current) {
        controls.stop();
        return;
      }
      controlsRef.current = controls;
      if (!stopped) setCameraStatus("Point camera at owner QR");
    })().catch((error) => {
      if (stopped || runId !== scanRunIdRef.current) return;
      setCameraStatus("Camera unavailable");
      setScanError(error instanceof Error ? error.message : "Camera tidak bisa dibuka.");
      setScanDebug("Camera scanner unavailable");
    });

    return () => {
      stopped = true;
      scanRunIdRef.current += 1;
      stopCamera();
    };
  }, [cameraActive, scanMode, stopCamera, verification, verifyDecodedPayload]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    scanRunIdRef.current += 1;
    stopCamera();
    setCameraActive(false);
    setUploading(true);
    setScanError("");
    setCameraStatus("Reading uploaded QR image");
    setScanDebug(`Reading uploaded QR image: ${file.name}`);
    console.info("[NOC ID QR] Upload QR image selected", { fileName: file.name, size: file.size, type: file.type });
    try {
      const decoded = await decodeQrFromImageFile(file);
      setScanDebug(`Upload QR decoded via ${decoded.method}. Verifying with backend...`);
      console.info("[NOC ID QR] Upload QR decoded successfully", {
        fileName: file.name,
        method: decoded.method,
        payloadLength: decoded.text.length,
      });
      await verifyDecodedPayload(decoded.text, "upload");
    } catch (error) {
      const message = describeQrDecodeError(error);
      const attempts = getDecodeAttempts(error);
      setScanError(message);
      setScanDebug(attempts.length ? `Upload decode failed after ${attempts.length} attempts` : `Upload decode failed: ${message}`);
      console.warn("[NOC ID QR] Upload QR decode failed", {
        fileName: file.name,
        size: file.size,
        type: file.type,
        message,
        attempts,
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleAddToQueue = async () => {
    if (!verification || !sessionToken) return;
    try {
      setScanDebug("Creating walk-in booking from verified scan session...");
      await api.createWalkinBooking({
        vehicleId: verification.vehicle.id,
        workshopId: activeWorkshopId ?? verification.workshop.id,
        scanSessionId: verification.scanSessionId,
        complaint: "Walk-in service from verified NOC ID QR scan",
      }, sessionToken);
      console.info("[NOC ID QR] Walk-in booking created from scan session", {
        scanSessionId: verification.scanSessionId,
        vehicleId: verification.vehicle.id,
        workshopId: activeWorkshopId ?? verification.workshop.id,
      });
      await syncBookings();
      router.push("/workshop/queue");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat walk-in booking.";
      setScanError(message);
      setScanDebug(`Walk-in booking failed: ${message}`);
      console.warn("[NOC ID QR] Walk-in booking failed", { message });
    }
  };

  const resetScan = (nextMode: "nfc" | "qr" = scanMode) => {
    setVerification(null);
    setScanError("");
    setScanDebug(nextMode === "qr" ? "Waiting for QR input" : "NFC unavailable; use QR scan");
    setCameraActive(nextMode === "qr");
  };

  const verifiedVehicle = verification?.vehicle;
  const healthScore = verifiedVehicle?.healthScore ?? 0;
  const mileage = verifiedVehicle?.currentMileageKm?.toLocaleString("id-ID") ?? "-";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Scan Vehicle</h1>
        <p className="text-sm mt-1" style={{ color: "var(--solana-text-muted)" }}>Identify vehicle via NFC card or QR code</p>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => { setScanMode("nfc"); stopCamera(); resetScan("nfc"); }} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer" style={{ background: scanMode === "nfc" ? "rgba(94, 234, 212,0.15)" : "rgba(20,20,40,0.5)", border: `1px solid ${scanMode === "nfc" ? "var(--solana-purple)" : "rgba(94, 234, 212,0.2)"}`, color: scanMode === "nfc" ? "var(--solana-purple)" : "var(--solana-text-muted)" }}>
          <Nfc className="w-5 h-5" /> NFC Scan
        </button>
        <button onClick={() => { setScanMode("qr"); resetScan("qr"); }} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer" style={{ background: scanMode === "qr" ? "rgba(94, 234, 212,0.15)" : "rgba(20,20,40,0.5)", border: `1px solid ${scanMode === "qr" ? "var(--solana-green)" : "rgba(94, 234, 212,0.2)"}`, color: scanMode === "qr" ? "var(--solana-green)" : "var(--solana-text-muted)" }}>
          <QrCode className="w-5 h-5" /> QR Scan
        </button>
      </div>

      {!verification ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 md:p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto"
        >
          {scanMode === "nfc" ? (
            <>
              <div className="relative w-48 h-48 mb-8">
                <div className="absolute inset-0 rounded-2xl" style={{ border: "2px dashed rgba(94, 234, 212,0.3)" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Nfc className="w-20 h-20" style={{ color: "var(--solana-text-muted)" }} />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">NFC Reader Unavailable</h3>
              <p className="text-sm mb-6" style={{ color: "var(--solana-text-muted)" }}>Use QR scan for verified workshop intake.</p>
              <button onClick={() => { setScanMode("qr"); resetScan("qr"); }} className="glow-btn flex items-center gap-2 cursor-pointer">
                <QrCode className="w-5 h-5" /> Open QR Scanner
              </button>
            </>
          ) : (
            <>
              <div className="relative w-64 h-64 mb-6 rounded-2xl overflow-hidden" style={{ background: "#111", border: "2px solid rgba(94, 234, 212,0.3)" }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-4 rounded-xl" style={{ border: "2px solid rgba(94, 234, 212,0.5)" }} />
                <motion.div className="absolute left-4 right-4 h-[2px]" style={{ background: "var(--solana-green)", boxShadow: "0 0 10px var(--solana-green)" }} animate={{ top: ["15%", "85%", "15%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: "var(--solana-green)" }} />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: "var(--solana-green)" }} />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: "var(--solana-green)" }} />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: "var(--solana-green)" }} />
                {(verifying || uploading) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-300" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">{verifying ? "Verifying QR..." : "Scanning for QR Code"}</h3>
              <p className="text-sm mb-2" style={{ color: "var(--solana-text-muted)" }}>{cameraStatus}</p>
              <p className="mb-4 text-xs text-teal-200/80">{scanDebug}</p>
              {scanError && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-left text-xs text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              <div className="flex gap-3 w-full max-w-xs">
                <button onClick={() => { setCameraActive(true); setScanError(""); }} disabled={cameraActive || verifying} className="glow-btn flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                  <Camera className="w-5 h-5" /> Camera
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={verifying || uploading} className="glow-btn-outline flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: "rgba(94, 234, 212,0.3)", color: "var(--solana-green)" }}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload QR
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleFileUpload(event)} />
              </div>
            </>
          )}
        </motion.div>
      ) : verifiedVehicle ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <div className="glass-card p-8">
            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: "#86EFAC" }} />
              <div>
                <p className="font-semibold" style={{ color: "#86EFAC" }}>Vehicle Identity Verified</p>
                <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>QR token consumed at {new Date(verification.verifiedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Vehicle</p><p className="font-semibold flex items-center gap-2"><Car className="w-4 h-4" style={{ color: "var(--solana-purple)" }} /> {verifiedVehicle.make} {verifiedVehicle.model}</p></div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>VIN</p><p className="font-semibold mono text-sm">{verifiedVehicle.vin}</p></div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>NOC ID</p><p className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4" style={{ color: "var(--solana-green)" }} /> #{verifiedVehicle.vin.slice(-5)}</p></div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Health Score</p><p className="font-semibold text-xl" style={{ color: "#5EEAD4" }}>{healthScore}</p></div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>Mileage</p><p className="font-semibold mono">{mileage} km</p></div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(20,20,40,0.5)" }}><p className="text-xs mb-1" style={{ color: "var(--solana-text-muted)" }}>History Access</p><p className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: "var(--solana-text-muted)" }} /> {verification.includeServiceHistory ? `${verification.serviceHistory.length} records` : "Verify only"}</p></div>
            </div>
            {scanError && <p className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">{scanError}</p>}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a href={`/workshop/vehicle/${verifiedVehicle.vin}`} className="flex-1 py-4 px-4 rounded-xl text-center font-medium transition-colors hover:bg-white/5" style={{ background: "rgba(20,20,40,0.5)", border: "1px solid rgba(94, 234, 212,0.2)", color: "var(--solana-purple)" }}>View Patient History</a>
              <button onClick={() => void handleAddToQueue()} className="glow-btn flex-1 text-center flex justify-center items-center py-4 cursor-pointer">Add to Active Queue</button>
            </div>
            <button onClick={() => resetScan("qr")} className="mt-4 w-full text-xs font-semibold text-slate-400 transition-colors hover:text-teal-200">Scan another QR</button>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
