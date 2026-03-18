"use client";

import { useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import dynamic from "next/dynamic";
import { Eye, EyeOff, Expand, RotateCcw, Car, Bike, X, ChevronUp, ChevronDown } from "lucide-react";

const CarModel = dynamic(() => import("@/components/3d/CarModel"), { ssr: false });
const MotorcycleModel = dynamic(() => import("@/components/3d/MotorcycleModel"), { ssr: false });
const BMWM4Model = dynamic(() => import("@/components/3d/BMWM4Model"), { ssr: false });
const HarleyDavidsonModel = dynamic(() => import("@/components/3d/HarleyDavidsonModel"), { ssr: false });

type VehicleType = "avanza" | "beat" | "bmw_m4" | "harley";

const vehicleLabels: Record<VehicleType, { label: string; subtitle: string; icon: typeof Car }> = {
  avanza: { label: "Avanza", subtitle: "Toyota Avanza 2025", icon: Car },
  bmw_m4: { label: "BMW M4", subtitle: "BMW M4 G82 2025", icon: Car },
  beat: { label: "Beat", subtitle: "Honda Beat 2024", icon: Bike },
  harley: { label: "Harley", subtitle: "Harley-Davidson Sportster S", icon: Bike },
};

function getHealthColor(health: number): string {
  if (health >= 90) return "#22C55E";
  if (health >= 70) return "#A3E635";
  if (health >= 50) return "#FACC15";
  if (health >= 30) return "#F97316";
  return "#EF4444";
}

function getHealthLabel(health: number): string {
  if (health >= 90) return "Excellent";
  if (health >= 70) return "Good";
  if (health >= 50) return "Warning";
  if (health >= 30) return "Critical";
  return "Danger";
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#9945FF" wireframe />
    </mesh>
  );
}

export default function ViewerPage() {
  const [vehicleType, setVehicleType] = useState<VehicleType>("bmw_m4");
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedHealth, setSelectedHealth] = useState<number>(0);
  const [xray, setXray] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSelectPart = (name: string, health: number) => {
    setSelectedPart(name);
    setSelectedHealth(health);
    if (isMobile) setSheetExpanded(true);
  };

  const clearSelection = () => {
    setSelectedPart(null);
    setSelectedHealth(0);
    setSheetExpanded(false);
  };

  const current = vehicleLabels[vehicleType];

  return (
    <div className="relative" style={{ height: "calc(100dvh - 64px)" }}>
      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">3D Digital Twin</h1>
          <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>
            {current.subtitle} · Click any part to inspect
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Vehicle selector */}
          {(Object.keys(vehicleLabels) as VehicleType[]).map(vt => {
            const v = vehicleLabels[vt];
            const isActive = vehicleType === vt;
            const isCar = vt === "avanza" || vt === "bmw_m4";
            return (
              <button key={vt} onClick={() => { setVehicleType(vt); clearSelection(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: isActive ? (isCar ? "rgba(153,69,255,0.2)" : "rgba(20,241,149,0.2)") : "rgba(20,20,40,0.7)",
                  border: `1px solid ${isActive ? (isCar ? "var(--solana-purple)" : "var(--solana-green)") : "rgba(153,69,255,0.2)"}`,
                  color: isActive ? (isCar ? "var(--solana-purple)" : "var(--solana-green)") : "var(--solana-text-muted)",
                  backdropFilter: "blur(10px)",
                }}>
                <v.icon className="w-3.5 h-3.5" /> {v.label}
              </button>
            );
          })}

          <div className="w-[1px] mx-0.5 self-stretch" style={{ background: "rgba(153,69,255,0.2)" }} />

          {/* X-Ray */}
          <button onClick={() => setXray(!xray)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
            style={{ background: xray ? "rgba(0,209,255,0.15)" : "rgba(20,20,40,0.7)", border: `1px solid ${xray ? "var(--solana-cyan)" : "rgba(153,69,255,0.2)"}`, color: xray ? "var(--solana-cyan)" : "var(--solana-text-muted)", backdropFilter: "blur(10px)" }}>
            {xray ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} X-Ray
          </button>

          {/* Explode */}
          <button onClick={() => setExploded(!exploded)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
            style={{ background: exploded ? "rgba(249,89,255,0.15)" : "rgba(20,20,40,0.7)", border: `1px solid ${exploded ? "var(--solana-pink)" : "rgba(153,69,255,0.2)"}`, color: exploded ? "var(--solana-pink)" : "var(--solana-text-muted)", backdropFilter: "blur(10px)" }}>
            <Expand className="w-3.5 h-3.5" /> Explode
          </button>

          {/* Reset */}
          <button onClick={() => { clearSelection(); setXray(false); setExploded(false); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
            style={{ background: "rgba(20,20,40,0.7)", border: "1px solid rgba(153,69,255,0.2)", color: "var(--solana-text-muted)", backdropFilter: "blur(10px)" }}>
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [5, 3, 5], fov: 50 }}
        style={{ background: "var(--solana-dark)" }}
        onClick={(e) => { if (e.target === e.currentTarget) clearSelection(); }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#9945FF" />
        <pointLight position={[3, 2, 3]} intensity={0.2} color="#14F195" />

        <Suspense fallback={<LoadingFallback />}>
          {vehicleType === "avanza" && <CarModel onSelectPart={handleSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} />}
          {vehicleType === "bmw_m4" && <BMWM4Model onSelectPart={handleSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} />}
          {vehicleType === "beat" && <MotorcycleModel onSelectPart={handleSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} />}
          {vehicleType === "harley" && <HarleyDavidsonModel onSelectPart={handleSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} />}
        </Suspense>

        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} blur={2} far={4} />
        <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={15} autoRotate={!selectedPart} autoRotateSpeed={0.5} />
        <Environment preset="night" />
        <gridHelper args={[20, 40, "#1a1a3e", "#1a1a3e"]} position={[0, 0, 0]} />
      </Canvas>

      {/* Part info panel — Desktop: floating card, Mobile: bottom sheet */}
      {selectedPart && (
        isMobile ? (
          /* Mobile bottom sheet */
          <div className="bottom-sheet" style={{ maxHeight: sheetExpanded ? "65dvh" : "40dvh" }}>
            <div className="bottom-sheet-handle" onClick={() => setSheetExpanded(!sheetExpanded)} style={{ cursor: "pointer" }} />
            <div className="px-5 pb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{selectedPart.split(".").pop()?.replace(/_/g, " ")}</h3>
                  <p className="text-xs mono" style={{ color: "var(--solana-text-muted)" }}>{selectedPart}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSheetExpanded(!sheetExpanded)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    {sheetExpanded ? <ChevronDown className="w-5 h-5" style={{ color: "var(--solana-text-muted)" }} /> : <ChevronUp className="w-5 h-5" style={{ color: "var(--solana-text-muted)" }} />}
                  </button>
                  <button onClick={clearSelection} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5" style={{ color: "var(--solana-text-muted)" }} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-4xl font-bold mono" style={{ color: getHealthColor(selectedHealth) }}>{selectedHealth}</p>
                  <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Health</p>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold" style={{ color: getHealthColor(selectedHealth) }}>{getHealthLabel(selectedHealth)}</span>
                  <div className="w-full h-2 rounded-full mt-2" style={{ background: "rgba(153,69,255,0.1)" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${selectedHealth}%`, background: getHealthColor(selectedHealth) }} />
                  </div>
                </div>
              </div>

              {sheetExpanded && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>Last Service</p><p className="font-semibold">2026-02-10</p></div>
                    <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>Service Count</p><p className="font-semibold">3</p></div>
                    <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>Mileage at Service</p><p className="font-semibold mono">28,000 km</p></div>
                    <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>OEM Verified</p><p className="font-semibold" style={{ color: "var(--solana-green)" }}>✓ Yes</p></div>
                  </div>
                  <button className="glow-btn w-full text-sm" style={{ padding: "10px 16px" }}>Ask AI Copilot About This Part</button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Desktop floating panel */
          <div className="absolute bottom-6 right-6 max-w-sm z-10 glass-card-static p-6" style={{ backdropFilter: "blur(20px)", background: "rgba(14,14,26,0.92)", border: "1px solid rgba(153,69,255,0.2)" }}>
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="text-lg font-bold">{selectedPart.split(".").pop()?.replace(/_/g, " ")}</h3><p className="text-xs mono" style={{ color: "var(--solana-text-muted)" }}>{selectedPart}</p></div>
              <button onClick={clearSelection} className="p-1 rounded-lg transition-colors hover:bg-white/10"><X className="w-5 h-5" style={{ color: "var(--solana-text-muted)" }} /></button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center"><p className="text-4xl font-bold mono" style={{ color: getHealthColor(selectedHealth) }}>{selectedHealth}</p><p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Health</p></div>
              <div className="flex-1">
                <span className="text-sm font-semibold" style={{ color: getHealthColor(selectedHealth) }}>{getHealthLabel(selectedHealth)}</span>
                <div className="w-full h-2 rounded-full mt-2" style={{ background: "rgba(153,69,255,0.1)" }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${selectedHealth}%`, background: getHealthColor(selectedHealth) }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>Last Service</p><p className="font-semibold">2026-02-10</p></div>
              <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>Service Count</p><p className="font-semibold">3</p></div>
              <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>Mileage at Service</p><p className="font-semibold mono">28,000 km</p></div>
              <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>OEM Verified</p><p className="font-semibold" style={{ color: "var(--solana-green)" }}>✓ Yes</p></div>
            </div>
            <button className="glow-btn w-full mt-4 text-sm" style={{ padding: "10px 16px" }}>Ask AI Copilot About This Part</button>
          </div>
        )
      )}

      {/* Legend — Desktop only, hidden when part selected */}
      {!selectedPart && !isMobile && (
        <div className="absolute bottom-6 left-6 z-10 glass-card-static p-3" style={{ backdropFilter: "blur(20px)", background: "rgba(14,14,26,0.85)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--solana-text-muted)" }}>Health Legend</p>
          <div className="flex flex-col gap-1">
            {[
              { label: "90-100 Excellent", color: "#22C55E" },
              { label: "70-89 Good", color: "#A3E635" },
              { label: "50-69 Warning", color: "#FACC15" },
              { label: "30-49 Critical", color: "#F97316" },
              { label: "0-29 Danger", color: "#EF4444" },
            ].map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: h.color }} />
                <span className="text-xs" style={{ color: "var(--solana-text-muted)" }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
