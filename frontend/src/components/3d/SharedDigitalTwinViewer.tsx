"use client";

import { useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import dynamic from "next/dynamic";
import { Eye, EyeOff, Expand, RotateCcw, Car, Bike, X, ChevronUp, ChevronDown, Wrench, ChevronDown as DropdownIcon, ExternalLink } from "lucide-react";
import { useActiveVehicle, vehicleData } from "@/context/ActiveVehicleContext";

const CarModel = dynamic(() => import("@/components/3d/CarModel"), { ssr: false });
const MotorcycleModel = dynamic(() => import("@/components/3d/MotorcycleModel"), { ssr: false });
const BMWM4Model = dynamic(() => import("@/components/3d/BMWM4Model"), { ssr: false });
const HarleyDavidsonModel = dynamic(() => import("@/components/3d/HarleyDavidsonModel"), { ssr: false });
const SupraModel = dynamic(() => import("@/components/3d/SupraModel"), { ssr: false });

type VehicleType = "avanza" | "beat" | "bmw_m4" | "harley" | "supra";

const vehicleLabels: Record<VehicleType, { label: string; subtitle: string; icon: typeof Car }> = {
  avanza: { label: "Avanza", subtitle: "Toyota Avanza 2025", icon: Car },
  bmw_m4: { label: "BMW M4", subtitle: "BMW M4 G82 2025", icon: Car },
  beat: { label: "Beat", subtitle: "Honda Beat 2024", icon: Bike },
  harley: { label: "Harley", subtitle: "Harley-Davidson Sportster S", icon: Bike },
  supra: { label: "Supra", subtitle: "Toyota Supra Veilside", icon: Car },
};

function getHealthColor(health: number): string {
  if (health >= 90) return "#86EFAC";
  if (health >= 70) return "#5EEAD4";
  if (health >= 50) return "#FCD34D";
  if (health >= 30) return "#5EEAD4";
  return "#FCA5A5";
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
      <meshStandardMaterial color="#5EEAD4" wireframe />
    </mesh>
  );
}

interface SharedViewerProps {
  mode: "owner" | "mechanic";
  initialVehicle?: VehicleType | null; 
}

export default function SharedDigitalTwinViewer({ mode, initialVehicle }: SharedViewerProps) {
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(
    mode === "owner" ? (initialVehicle || "avanza") : (initialVehicle || null)
  );
  
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedHealth, setSelectedHealth] = useState<number>(0);
  const [xray, setXray] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const activeVehicleCtx = useActiveVehicle();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    
    // Sync active vehicle context for DApp users
    if (mode === "owner" && activeVehicleCtx?.activeVehicle) {
      if (vehicleLabels[activeVehicleCtx.activeVehicle]) {
        setVehicleType(activeVehicleCtx.activeVehicle);
      }
    }

    return () => window.removeEventListener("resize", check);
  }, [mode, activeVehicleCtx?.activeVehicle]);

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

  const current = vehicleType ? vehicleLabels[vehicleType] : null;

  return (
    <div className="relative" style={{ height: "calc(100dvh - 64px)" }}>
      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        
        {/* Title Area */}
        <div className="relative">
          {mode === "mechanic" ? (
            <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-lg relative">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold flex items-center gap-2 text-white group-hover:text-teal-400 transition-colors">
                    {current ? `${current.subtitle}` : "Select Active Queue Vehicle"} 
                    <DropdownIcon className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {current ? "Connected to Queue Data" : "Waiting for selection..."}
                  </p>
                </div>
              </div>
              
              {/* Workshop Queue Dropdown */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full min-w-[300px] rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden z-50">
                  <div className="p-2 bg-slate-800/50 border-b border-slate-700 text-xs font-semibold text-slate-400">
                    Active Service Queue
                  </div>
                  <div className="p-2 flex flex-col gap-1 max-h-64 overflow-y-auto">
                    {[
                      { vt: "avanza", label: vehicleData.avanza.name, vin: vehicleData.avanza.vin, owner: vehicleData.avanza.owner || "Pak Budi" },
                      { vt: "bmw_m4", label: vehicleData.bmw_m4.name, vin: vehicleData.bmw_m4.vin, owner: vehicleData.bmw_m4.owner || "Andi Wijaya" },
                      { vt: "beat", label: vehicleData.beat.name, vin: vehicleData.beat.vin, owner: vehicleData.beat.owner || "Siti Nur" },
                      { vt: "harley", label: vehicleData.harley.name, vin: vehicleData.harley.vin, owner: vehicleData.harley.owner || "John Doe" },
                      { vt: "supra", label: vehicleData.supra.name, vin: vehicleData.supra.vin, owner: vehicleData.supra.owner || "Ryo Takahashi" }
                    ].map((item, i) => (
                      <button 
                        key={i}
                        onClick={() => { setVehicleType(item.vt as VehicleType); setDropdownOpen(false); clearSelection(); }}
                        className={`text-left p-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-between ${vehicleType === item.vt ? 'bg-teal-500/10 border border-teal-500/30' : ''}`}
                      >
                        <div>
                          <p className={`text-sm font-semibold ${vehicleType === item.vt ? 'text-teal-400' : 'text-white'}`}>{item.label}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{item.vin}</p>
                        </div>
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{item.owner}</span>
                      </button>
                    ))}
                    <div className="p-3 text-center text-xs text-slate-500">
                      *Vehicles disappear from here once invoice is paid.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-lg">
              <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-teal-400" /> 
                {current?.subtitle}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Active Vehicle Dashboard Link
              </p>
            </div>
          )}
        </div>

        {/* Action Controls (Right side) */}
        {vehicleType && (
          <div className="flex gap-2">
            {/* X-Ray */}
            <button onClick={() => setXray(!xray)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer shadow-lg hover:scale-105"
              style={{ background: xray ? "rgba(94, 234, 212,0.15)" : "rgba(30,30,40,0.9)", border: `1px solid ${xray ? "var(--solana-cyan)" : "rgba(255,255,255,0.1)"}`, color: xray ? "var(--solana-cyan)" : "white", backdropFilter: "blur(10px)" }}>
              {xray ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} X-Ray
            </button>

            {/* Explode */}
            <button onClick={() => setExploded(!exploded)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer shadow-lg hover:scale-105"
              style={{ background: exploded ? "rgba(94, 234, 212,0.15)" : "rgba(30,30,40,0.9)", border: `1px solid ${exploded ? "var(--solana-pink)" : "rgba(255,255,255,0.1)"}`, color: exploded ? "var(--solana-pink)" : "white", backdropFilter: "blur(10px)" }}>
              <Expand className="w-4 h-4" /> Explode
            </button>

            {/* Reset */}
            <button onClick={() => { clearSelection(); setXray(false); setExploded(false); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer shadow-lg hover:scale-105"
              style={{ background: "rgba(30,30,40,0.9)", border: "1px solid rgba(255,255,255,0.1)", color: "white", backdropFilter: "blur(10px)" }}>
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      {vehicleType ? (
        <Canvas
          camera={{ position: [5, 3, 5], fov: 50 }}
          style={{ background: "#0E0E1A" }}
          gl={{ 
            powerPreference: "high-performance",
            antialias: true,
            failIfMajorPerformanceCaveat: false,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#0E0E1A', 1);
            const canvas = gl.domElement;
            canvas.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.warn('WebGL context lost — will attempt restore');
            });
            canvas.addEventListener('webglcontextrestored', () => {
              console.log('WebGL context restored');
              gl.setClearColor('#0E0E1A', 1);
            });
          }}
        >
          <color attach="background" args={['#0E0E1A']} />
          <ambientLight intensity={0.8} />
          <hemisphereLight args={["#c8d8e8", "#2a2a3a", 0.6]} />
          <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.8} />
          <directionalLight position={[0, 3, -8]} intensity={0.4} />
          <pointLight position={[0, 5, 0]} intensity={0.2} color="#5EEAD4" />
          <pointLight position={[3, 2, 3]} intensity={0.15} color="#5EEAD4" />

          <Suspense fallback={<LoadingFallback />}>
            <group visible={vehicleType === "avanza"}>
              <CarModel onSelectPart={handleSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} />
            </group>
            <group visible={vehicleType === "bmw_m4"}>
              <BMWM4Model onSelectPart={handleSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} />
            </group>
            <group visible={vehicleType === "beat"}>
              <MotorcycleModel onSelectPart={handleSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} />
            </group>
            <group visible={vehicleType === "harley"}>
              <HarleyDavidsonModel onSelectPart={handleSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} />
            </group>
            <group visible={vehicleType === "supra"}>
              <SupraModel onSelectPart={handleSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} />
            </group>
          </Suspense>

          <ContactShadows position={[0, -0.01, 0]} opacity={0.4} blur={2} far={4} />
          <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={15} autoRotate={!selectedPart} autoRotateSpeed={0.5} />
          {/* Environment removed — 75MB GLB + PMREM causes WebGL context loss */}
          <gridHelper args={[20, 40, "#1a1a3e", "#1a1a3e"]} position={[0, 0, 0]} />
        </Canvas>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: "#0E0E1A", border: "2px dashed rgba(100,116,139,0.4)", borderRadius: 12 }}>
           <Wrench className="w-16 h-16 text-slate-600 mb-4" />
           <h2 className="text-xl font-bold text-slate-400">No Vehicle Selected</h2>
           <p className="text-sm text-slate-500 mt-2 max-w-sm text-center">Open the dropdown menu in the top left to select a vehicle currently in the active queue.</p>
        </div>
      )}

      {/* Part info panel — Desktop: floating card, Mobile: bottom sheet */}
      {selectedPart && vehicleType && (
        isMobile ? (
          /* Mobile bottom sheet */
          <div className="bottom-sheet z-20" style={{ maxHeight: sheetExpanded ? "65dvh" : "40dvh" }}>
            <div className="bottom-sheet-handle" onClick={() => setSheetExpanded(!sheetExpanded)} style={{ cursor: "pointer" }} />
            <div className="px-5 pb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {selectedPart.split(".").pop()?.replace(/_/g, " ")}
                  </h3>
                  <p className="text-xs mono" style={{ color: "var(--solana-text-muted)" }}>{selectedPart}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSheetExpanded(!sheetExpanded)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                    {sheetExpanded ? <ChevronDown className="w-5 h-5" style={{ color: "var(--solana-text-muted)" }} /> : <ChevronUp className="w-5 h-5" style={{ color: "var(--solana-text-muted)" }} />}
                  </button>
                  <button onClick={clearSelection} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
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
                  <div className="w-full h-2 rounded-full mt-2" style={{ background: "rgba(94, 234, 212,0.1)" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${selectedHealth}%`, background: getHealthColor(selectedHealth) }} />
                  </div>
                </div>
              </div>

              {sheetExpanded && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    {mode === "mechanic" ? (
                      <>
                        <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>OEM Part #</p><p className="font-semibold mono text-teal-400">04152-YZZA1</p></div>
                        <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>Torque Spec</p><p className="font-semibold">30 Nm / 22 ft-lbf</p></div>
                        <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>Mileage at Service</p><p className="font-semibold mono">28,000 km</p></div>
                        <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>DTC Codes</p><p className="font-semibold text-red-400">None</p></div>
                      </>
                    ) : (
                      <>
                        <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>Last Service</p><p className="font-semibold">2026-02-10</p></div>
                        <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>Service Count</p><p className="font-semibold">3</p></div>
                        <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>Mileage at Service</p><p className="font-semibold mono">28,000 km</p></div>
                        <div className="p-2.5 rounded-lg" style={{ background: "rgba(20,20,40,0.5)" }}><p style={{ color: "var(--solana-text-muted)" }}>OEM Verified</p><a href="https://explorer.solana.com/address/NocPart1Toyota...mock" target="_blank" rel="noopener noreferrer" className="font-semibold flex items-center gap-1 hover:underline" style={{ color: "var(--solana-green)" }}>✓ Toyota Motor Corp <ExternalLink className="w-3 h-3" /></a></div>
                      </>
                    )}
                  </div>
                  <button onClick={() => { window.dispatchEvent(new Event('open-copilot')); setSheetExpanded(false); }} className={`glow-btn${mode === "mechanic" ? "-outline" : ""} w-full text-sm cursor-pointer`} style={{ padding: "10px 16px", ...(mode === "mechanic" ? { borderColor: "var(--solana-cyan)", color: "var(--solana-cyan)" } : {}) }}>
                    {mode === "mechanic" ? "Get Repair Procedure via Copilot" : "Ask AI Copilot About This Part"}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Desktop floating panel */
          <div className="absolute bottom-6 right-6 max-w-sm z-10 glass-card-static p-6" style={{ backdropFilter: "blur(20px)", background: "rgba(14,14,26,0.92)", border: "1px solid rgba(94, 234, 212,0.2)" }}>
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="text-lg font-bold text-white">{selectedPart.split(".").pop()?.replace(/_/g, " ")}</h3><p className="text-xs mono" style={{ color: "var(--solana-text-muted)" }}>{selectedPart}</p></div>
              <button onClick={clearSelection} className="p-1 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"><X className="w-5 h-5" style={{ color: "var(--solana-text-muted)" }} /></button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center"><p className="text-4xl font-bold mono" style={{ color: getHealthColor(selectedHealth) }}>{selectedHealth}</p><p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Health</p></div>
              <div className="flex-1">
                <span className="text-sm font-semibold" style={{ color: getHealthColor(selectedHealth) }}>{getHealthLabel(selectedHealth)}</span>
                <div className="w-full h-2 rounded-full mt-2" style={{ background: "rgba(94, 234, 212,0.1)" }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${selectedHealth}%`, background: getHealthColor(selectedHealth) }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              {mode === "mechanic" ? (
                <>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50"><p className="text-slate-400 mb-1">OEM Part #</p><p className="font-semibold mono text-teal-400">04152-YZZA6</p></div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50"><p className="text-slate-400 mb-1">Torque Spec</p><p className="font-semibold text-teal-400">40 Nm</p></div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50"><p className="text-slate-400 mb-1">Mileage at Service</p><p className="font-semibold mono text-white">28,000 km</p></div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50"><p className="text-slate-400 mb-1">DTC Codes</p><p className="font-semibold text-teal-400">None</p></div>
                </>
              ) : (
                <>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10"><p className="text-slate-400">Last Service</p><p className="font-semibold text-white">2026-02-10</p></div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10"><p className="text-slate-400">Service Count</p><p className="font-semibold text-white">3</p></div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10"><p className="text-slate-400">Mileage</p><p className="font-semibold mono text-white">28,000 km</p></div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10"><p className="text-slate-400">OEM Verified</p><a href="https://explorer.solana.com/address/NocPart1Toyota...mock" target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-400 flex items-center gap-1 hover:underline">✓ Toyota Motor Corp <ExternalLink className="w-3 h-3" /></a></div>
                </>
              )}
            </div>
            <button onClick={() => window.dispatchEvent(new Event('open-copilot'))} className={`glow-btn${mode === "mechanic" ? "-outline" : ""} w-full text-sm font-semibold cursor-pointer rounded-xl`} style={{ padding: "12px 16px", ...(mode === "mechanic" ? { borderColor: "var(--solana-cyan)", color: "var(--solana-cyan)", boxShadow: "0 0 10px rgba(94, 234, 212,0.2)" } : {}) }}>
              {mode === "mechanic" ? "Get Repair Procedure via Copilot" : "Ask AI Copilot About This Part"}
            </button>
          </div>
        )
      )}

      {/* Legend — Desktop only, hidden when part selected */}
      {!selectedPart && !isMobile && vehicleType && (
        <div className="absolute bottom-6 left-6 z-10 p-4 rounded-xl border border-slate-700/50" style={{ backdropFilter: "blur(20px)", background: "rgba(14,14,26,0.85)" }}>
          <p className="text-xs font-bold text-white mb-3">Health Legend</p>
          <div className="flex flex-col gap-2">
            {[
              { label: "90-100 Excellent", color: "#86EFAC" },
              { label: "70-89 Good", color: "#5EEAD4" },
              { label: "50-69 Warning", color: "#FCD34D" },
              { label: "30-49 Critical", color: "#5EEAD4" },
              { label: "0-29 Danger", color: "#FCA5A5" },
            ].map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-md shadow-sm" style={{ background: h.color }} />
                <span className="text-xs font-medium text-slate-300">{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
