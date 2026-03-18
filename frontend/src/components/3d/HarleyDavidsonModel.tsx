"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";

function getHealthColor(health: number): string {
  if (health >= 90) return "#22C55E";
  if (health >= 70) return "#A3E635";
  if (health >= 50) return "#FACC15";
  if (health >= 30) return "#F97316";
  return "#EF4444";
}

const VIVID_BLACK = { color: "#0A0A0A", metalness: 0.92, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04 };
const CHROME = { color: "#D8D8D8", metalness: 1, roughness: 0.04 };
const MATTE_BLACK = { color: "#1A1A1A", metalness: 0.5, roughness: 0.6 };
const RUBBER = { color: "#080808", metalness: 0.0, roughness: 0.85 };
const LEATHER = { color: "#1A1008", metalness: 0.0, roughness: 0.7 };
const RED_ACCENT = { color: "#CC0000", metalness: 0.7, roughness: 0.3 };
const HEADLIGHT_MAT = { color: "#FFFFFF", emissive: "#FFFFFF", emissiveIntensity: 0.7 };
const TAILLIGHT_MAT = { color: "#FF2222", emissive: "#FF2222", emissiveIntensity: 0.5 };

interface PartProps {
  name: string; health: number; onSelect: (n: string, h: number) => void;
  selected: string | null; xray: boolean; exploded: boolean;
  explodeOffset?: [number, number, number]; children: React.ReactNode;
  position?: [number, number, number]; rotation?: [number, number, number];
  drillParts?: { name: string; health: number }[];
}

function Part({ name, health, onSelect, selected, xray, exploded, explodeOffset = [0, 0, 0], children, position = [0, 0, 0], rotation, drillParts }: PartProps) {
  const ref = useRef<THREE.Group>(null);
  const isSelected = selected === name;
  const [drill, setDrill] = useState(false);

  const finalPos: [number, number, number] = exploded
    ? [position[0] + explodeOffset[0], position[1] + explodeOffset[1], position[2] + explodeOffset[2]]
    : position;

  useFrame(() => {
    if (ref.current) {
      ref.current.position.lerp(new THREE.Vector3(...finalPos), 0.08);
    }
  });

  return (
    <group ref={ref} position={position} rotation={rotation}>
      <group onClick={(e) => { e.stopPropagation(); if (drill && !isSelected) setDrill(false); onSelect(name, health); if (isSelected && drillParts) setDrill(!drill); }}>
        {children}
        {isSelected && (
          <mesh><ringGeometry args={[0.25, 0.29, 32]} /><meshBasicMaterial color={getHealthColor(health)} transparent opacity={0.6} side={THREE.DoubleSide} /></mesh>
        )}
      </group>
      {drill && drillParts && (
        <group position={[0, 0.45, 0]}>
          {drillParts.map((dp, i) => (
            <mesh key={i} position={[(i - drillParts.length / 2) * 0.2, 0, 0]}
              onClick={(e) => { e.stopPropagation(); onSelect(`${name}.${dp.name}`, dp.health); }}>
              <boxGeometry args={[0.09, 0.09, 0.09]} />
              <meshStandardMaterial color={getHealthColor(dp.health)} metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

interface HarleyProps {
  onSelectPart: (name: string, health: number) => void;
  selectedPart: string | null;
  xray: boolean;
  exploded: boolean;
}

const partData: Record<string, { health: number; drill?: { name: string; health: number }[] }> = {
  "Frame.MainFrame": { health: 95 },
  "Frame.Swingarm": { health: 92 },
  "Frame.Subframe": { health: 94 },
  "Body.FuelTank": { health: 98 },
  "Body.FrontFender": { health: 96 },
  "Body.RearFender": { health: 94 },
  "Body.TailSection": { health: 97 },
  "Body.SidePanel_L": { health: 95 },
  "Body.SidePanel_R": { health: 95 },
  "Engine.RevMax1250T": { health: 42, drill: [{ name: "Piston_F", health: 40 }, { name: "Piston_R", health: 44 }, { name: "Crankshaft", health: 38 }, { name: "ConnRod_F", health: 42 }, { name: "ConnRod_R", health: 45 }, { name: "Camshaft_F", health: 50 }, { name: "Camshaft_R", health: 48 }, { name: "RockerArm_F", health: 55 }, { name: "OilPump", health: 60 }, { name: "Bolt_headM8", health: 90 }, { name: "Bolt_headM6", health: 92 }] },
  "Engine.CylinderHead_F": { health: 55 },
  "Engine.CylinderHead_R": { health: 58 },
  "Engine.OilCooler": { health: 72 },
  "Engine.IntakeVelocityStack": { health: 85 },
  "Engine.FuelInjector_F": { health: 78 },
  "Engine.FuelInjector_R": { health: 76 },
  "Engine.FuelRail": { health: 88 },
  "Exhaust.Header_F": { health: 60 },
  "Exhaust.Header_R": { health: 62 },
  "Exhaust.Muffler": { health: 55 },
  "Exhaust.HeatShield": { health: 70 },
  "Drivetrain.Transmission_6spd": { health: 68, drill: [{ name: "ClutchPack", health: 55 }, { name: "Gear1", health: 72 }, { name: "Gear2", health: 75 }, { name: "Gear3", health: 70 }, { name: "Gear4", health: 74 }, { name: "Gear5", health: 68 }, { name: "Gear6", health: 65 }, { name: "ShiftFork", health: 58 }] },
  "Drivetrain.BeltDrive": { health: 45 },
  "Drivetrain.ClutchAssembly": { health: 52 },
  "Drivetrain.Sprocket_F": { health: 78 },
  "Drivetrain.Sprocket_R": { health: 74 },
  "Suspension.InvertedFork_L": { health: 80 },
  "Suspension.InvertedFork_R": { health: 78 },
  "Suspension.Monoshock": { health: 75 },
  "Suspension.Linkage": { health: 82 },
  "Wheels.Front": { health: 86, drill: [{ name: "Tire", health: 82 }, { name: "Rim", health: 95 }, { name: "BrakeDisc", health: 78 }, { name: "BrakePad", health: 68 }, { name: "AxleBolt", health: 92 }] },
  "Wheels.Rear": { health: 84 },
  "Brakes.FrontCaliper": { health: 70 },
  "Brakes.RearCaliper": { health: 72 },
  "Lights.Headlight": { health: 100 },
  "Lights.Taillight": { health: 98 },
  "Lights.TurnSignal_L": { health: 95 },
  "Lights.TurnSignal_R": { health: 95 },
  "Controls.Handlebar": { health: 99 },
  "Controls.Switchgear_L": { health: 97 },
  "Controls.Switchgear_R": { health: 97 },
  "Controls.Mirror_L": { health: 100 },
  "Controls.Mirror_R": { health: 100 },
  "Controls.InstrumentCluster": { health: 100 },
  "Controls.Throttle": { health: 96 },
  "Controls.ClutchLever": { health: 94 },
  "Controls.BrakeLever": { health: 92 },
  "Seat.RiderSeat": { health: 88 },
  "Seat.UnderStorage": { health: 95 },
  "Electrical.Battery": { health: 70 },
  "Electrical.ECU": { health: 100 },
  "Fluids.EngineOil": { health: 50 },
  "Fluids.BrakeFluid": { health: 58 },
  "Fluids.Coolant": { health: 65 },
  "FootControls.Peg_L": { health: 94 },
  "FootControls.Peg_R": { health: 93 },
  "FootControls.ShiftLever": { health: 88 },
  "FootControls.BrakePedal": { health: 85 },
};

export default function HarleyDavidsonModel({ onSelectPart, selectedPart, xray, exploded }: HarleyProps) {
  const groupRef = useRef<THREE.Group>(null);

  const P = (name: string, pos: [number, number, number], explOff: [number, number, number], children: React.ReactNode, rot?: [number, number, number]) => {
    const pd = partData[name] || { health: 80 };
    return (
      <Part key={name} name={name} health={pd.health} onSelect={onSelectPart} selected={selectedPart} xray={xray} exploded={exploded} explodeOffset={explOff} position={pos} rotation={rot} drillParts={pd.drill}>
        {children}
      </Part>
    );
  };

  const bodyMat = <meshPhysicalMaterial {...VIVID_BLACK} transparent={xray} opacity={xray ? 0.18 : 1} depthWrite={!xray} envMapIntensity={1.2} />;

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      {/* ===== FRAME ===== */}
      {P("Frame.MainFrame", [0, 0.55, 0], [0, 0.5, 0],
        <group>
          {/* Main spine */}
          <mesh rotation={[0.3, 0, 0]} position={[0, 0, 0.2]}><cylinderGeometry args={[0.035, 0.04, 1.0, 8]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
          {/* Downtubes */}
          <mesh rotation={[0.8, 0, 0.1]} position={[-0.06, -0.15, 0.4]}><cylinderGeometry args={[0.025, 0.03, 0.7, 8]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
          <mesh rotation={[0.8, 0, -0.1]} position={[0.06, -0.15, 0.4]}><cylinderGeometry args={[0.025, 0.03, 0.7, 8]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
        </group>
      )}
      {P("Frame.Swingarm", [0, 0.32, -0.55], [0, 0.3, -0.5],
        <group>
          <mesh rotation={[0, 0, 0]} position={[-0.08, 0, 0]}><boxGeometry args={[0.04, 0.08, 0.55]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
          <mesh rotation={[0, 0, 0]} position={[0.08, 0, 0]}><boxGeometry args={[0.04, 0.08, 0.55]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
        </group>
      )}

      {/* ===== BODY PANELS ===== */}
      {/* Fuel tank — muscular shape */}
      {P("Body.FuelTank", [0, 0.82, 0.25], [0, 0.8, 0.4],
        <group>
          <RoundedBox args={[0.38, 0.22, 0.55]} radius={0.05} smoothness={4} castShadow>{bodyMat}</RoundedBox>
          {/* Tank badge */}
          <mesh position={[-0.195, 0.02, 0]}><boxGeometry args={[0.005, 0.08, 0.2]} /><meshStandardMaterial {...CHROME} /></mesh>
          <mesh position={[0.195, 0.02, 0]}><boxGeometry args={[0.005, 0.08, 0.2]} /><meshStandardMaterial {...CHROME} /></mesh>
          {/* Fuel cap */}
          <mesh position={[0, 0.12, 0.1]}><cylinderGeometry args={[0.04, 0.04, 0.02, 16]} /><meshStandardMaterial {...CHROME} /></mesh>
        </group>
      )}
      {P("Body.FrontFender", [0, 0.52, 0.92], [0, 0.4, 0.8],
        <RoundedBox args={[0.2, 0.04, 0.4]} radius={0.015} smoothness={4} castShadow>{bodyMat}</RoundedBox>
      )}
      {P("Body.RearFender", [0, 0.38, -0.72], [0, 0.3, -0.5],
        <RoundedBox args={[0.22, 0.04, 0.35]} radius={0.015} smoothness={4} castShadow>{bodyMat}</RoundedBox>
      )}
      {P("Body.TailSection", [0, 0.58, -0.55], [0, 0.5, -0.5],
        <RoundedBox args={[0.25, 0.1, 0.25]} radius={0.04} smoothness={4}>{bodyMat}</RoundedBox>
      )}
      {P("Body.SidePanel_L", [-0.2, 0.55, -0.1], [-0.4, 0.3, 0],
        <RoundedBox args={[0.04, 0.15, 0.35]} radius={0.015} smoothness={4}>{bodyMat}</RoundedBox>
      )}
      {P("Body.SidePanel_R", [0.2, 0.55, -0.1], [0.4, 0.3, 0],
        <RoundedBox args={[0.04, 0.15, 0.35]} radius={0.015} smoothness={4}>{bodyMat}</RoundedBox>
      )}

      {/* ===== ENGINE — Rev Max 1250T V-Twin ===== */}
      {P("Engine.RevMax1250T", [0, 0.35, 0.15], [0, 1.2, 0.8],
        <group>
          {/* V-Twin block */}
          <RoundedBox args={[0.28, 0.3, 0.35]} radius={0.04} smoothness={4}><meshStandardMaterial {...MATTE_BLACK} transparent={xray} opacity={xray ? 0.15 : 1} /></RoundedBox>
          {/* Crankcase */}
          <mesh position={[0, -0.12, 0]}><boxGeometry args={[0.3, 0.08, 0.3]} /><meshStandardMaterial color="#2A2A2A" metalness={0.8} roughness={0.3} /></mesh>
        </group>
      )}
      {/* Front cylinder — angled forward */}
      {P("Engine.CylinderHead_F", [0, 0.48, 0.35], [0, 1.4, 1.2],
        <group rotation={[-0.6, 0, 0]}>
          <mesh><boxGeometry args={[0.24, 0.18, 0.12]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
          {/* Cooling fins */}
          {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[0, (i - 2.5) * 0.028, 0]}><boxGeometry args={[0.28, 0.003, 0.14]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
          ))}
        </group>
      )}
      {/* Rear cylinder — angled back */}
      {P("Engine.CylinderHead_R", [0, 0.48, -0.05], [0, 1.4, 0.4],
        <group rotation={[0.6, 0, 0]}>
          <mesh><boxGeometry args={[0.24, 0.18, 0.12]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
          {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[0, (i - 2.5) * 0.028, 0]}><boxGeometry args={[0.28, 0.003, 0.14]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
          ))}
        </group>
      )}
      {P("Engine.OilCooler", [0, 0.22, 0.55], [0, 0.8, 1.0],
        <mesh><boxGeometry args={[0.2, 0.1, 0.04]} /><meshStandardMaterial color="#333" metalness={0.8} roughness={0.25} /></mesh>
      )}
      {P("Engine.IntakeVelocityStack", [0, 0.52, 0.05], [0, 1.5, 0.6],
        <group>
          <mesh rotation={[0, 0, 0]} position={[0, 0, 0.08]}><cylinderGeometry args={[0.03, 0.04, 0.1, 12]} /><meshStandardMaterial {...CHROME} /></mesh>
          <mesh rotation={[0, 0, 0]} position={[0, 0, -0.08]}><cylinderGeometry args={[0.03, 0.04, 0.1, 12]} /><meshStandardMaterial {...CHROME} /></mesh>
        </group>
      )}
      {P("Engine.FuelRail", [0.12, 0.48, 0.15], [0.5, 1.3, 0.8],
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.012, 0.012, 0.35, 8]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}

      {/* ===== EXHAUST ===== */}
      {P("Exhaust.Header_F", [-0.18, 0.3, 0.4], [-0.5, 0.6, 0.8],
        <mesh rotation={[0.3, 0, -0.2]}><cylinderGeometry args={[0.025, 0.03, 0.4, 10]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}
      {P("Exhaust.Header_R", [-0.18, 0.3, 0.0], [-0.5, 0.6, 0.4],
        <mesh rotation={[0, 0, -0.15]}><cylinderGeometry args={[0.025, 0.03, 0.35, 10]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}
      {P("Exhaust.Muffler", [-0.25, 0.22, -0.5], [-0.7, 0.3, -0.4],
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.05, 0.055, 0.4, 14]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
          {/* Tip */}
          <mesh position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.05, 0.05, 14]} /><meshStandardMaterial {...CHROME} /></mesh>
        </group>
      )}
      {P("Exhaust.HeatShield", [-0.25, 0.3, -0.15], [-0.6, 0.5, 0],
        <mesh><boxGeometry args={[0.06, 0.1, 0.3]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}

      {/* ===== DRIVETRAIN ===== */}
      {P("Drivetrain.Transmission_6spd", [0, 0.22, -0.1], [0, 1.0, 0.2],
        <mesh><boxGeometry args={[0.22, 0.15, 0.2]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
      )}
      {P("Drivetrain.BeltDrive", [0, 0.32, -0.55], [0.3, 0.3, -0.3],
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.12, 0.015, 4, 32]} /><meshStandardMaterial color="#222" metalness={0.3} roughness={0.7} /></mesh>
      )}
      {P("Drivetrain.Sprocket_F", [0, 0.22, -0.15], [0, 0.8, 0.1],
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.04, 0.02, 16]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}
      {P("Drivetrain.Sprocket_R", [0, 0.32, -0.82], [0, 0.3, -0.6],
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.08, 0.08, 0.015, 20]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}

      {/* ===== SUSPENSION ===== */}
      {P("Suspension.InvertedFork_L", [-0.1, 0.55, 0.72], [-0.3, 0.5, 0.6],
        <mesh rotation={[0.35, 0, 0]}><cylinderGeometry args={[0.025, 0.02, 0.65, 8]} /><meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} /></mesh>
      )}
      {P("Suspension.InvertedFork_R", [0.1, 0.55, 0.72], [0.3, 0.5, 0.6],
        <mesh rotation={[0.35, 0, 0]}><cylinderGeometry args={[0.025, 0.02, 0.65, 8]} /><meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} /></mesh>
      )}
      {P("Suspension.Monoshock", [0, 0.38, -0.4], [0, 0.6, -0.3],
        <mesh rotation={[0.2, 0, 0]}><cylinderGeometry args={[0.025, 0.02, 0.35, 8]} /><meshStandardMaterial color="#333" metalness={0.8} roughness={0.25} /></mesh>
      )}

      {/* ===== WHEELS ===== */}
      {P("Wheels.Front", [0, 0.32, 0.95], [0, 0.3, 1.0],
        <group rotation={[0, Math.PI / 2, 0]}>
          <mesh><torusGeometry args={[0.3, 0.08, 32, 48]} /><meshStandardMaterial {...RUBBER} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.06, 12]} /><meshStandardMaterial color="#333" metalness={0.85} roughness={0.15} /></mesh>
          <mesh position={[0, 0, 0.22]}><boxGeometry args={[0.05, 0.06, 0.1]} /><meshStandardMaterial {...RED_ACCENT} /></mesh>
        </group>
      )}
      {P("Wheels.Rear", [0, 0.32, -0.82], [0, 0.3, -0.8],
        <group rotation={[0, Math.PI / 2, 0]}>
          <mesh><torusGeometry args={[0.3, 0.1, 32, 48]} /><meshStandardMaterial {...RUBBER} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.08, 12]} /><meshStandardMaterial color="#333" metalness={0.85} roughness={0.15} /></mesh>
          <mesh position={[0, 0, 0.2]}><boxGeometry args={[0.04, 0.05, 0.08]} /><meshStandardMaterial {...RED_ACCENT} /></mesh>
        </group>
      )}

      {/* ===== BRAKES ===== */}
      {P("Brakes.FrontCaliper", [-0.2, 0.25, 0.95], [-0.4, 0.2, 0.8],
        <mesh><boxGeometry args={[0.06, 0.08, 0.04]} /><meshStandardMaterial {...RED_ACCENT} /></mesh>
      )}
      {P("Brakes.RearCaliper", [-0.15, 0.2, -0.82], [-0.3, 0.2, -0.6],
        <mesh><boxGeometry args={[0.05, 0.06, 0.03]} /><meshStandardMaterial {...RED_ACCENT} /></mesh>
      )}

      {/* ===== LIGHTS ===== */}
      {P("Lights.Headlight", [0, 0.72, 1.0], [0, 0.4, 0.5],
        <group>
          <mesh><sphereGeometry args={[0.08, 16, 16, 0, Math.PI]} /><meshStandardMaterial {...HEADLIGHT_MAT} /></mesh>
          <mesh position={[0, 0, -0.01]}><sphereGeometry args={[0.09, 16, 16, 0, Math.PI]} /><meshStandardMaterial {...CHROME} /></mesh>
        </group>
      )}
      {P("Lights.Taillight", [0, 0.52, -0.7], [0, 0.3, -0.4],
        <mesh><boxGeometry args={[0.08, 0.025, 0.04]} /><meshStandardMaterial {...TAILLIGHT_MAT} /></mesh>
      )}
      {P("Lights.TurnSignal_L", [-0.22, 0.88, 0.45], [-0.3, 0.4, 0.3],
        <mesh><sphereGeometry args={[0.015, 12, 12]} /><meshStandardMaterial color="#FF8800" emissive="#FF8800" emissiveIntensity={0.4} /></mesh>
      )}
      {P("Lights.TurnSignal_R", [0.22, 0.88, 0.45], [0.3, 0.4, 0.3],
        <mesh><sphereGeometry args={[0.015, 12, 12]} /><meshStandardMaterial color="#FF8800" emissive="#FF8800" emissiveIntensity={0.4} /></mesh>
      )}

      {/* ===== CONTROLS & HANDLEBARS ===== */}
      {P("Controls.Handlebar", [0, 0.92, 0.55], [0, 0.6, 0.4],
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.015, 0.015, 0.55, 8]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}
      {P("Controls.Mirror_L", [-0.3, 0.95, 0.55], [-0.5, 0.5, 0.3],
        <group>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.008, 0.008, 0.08, 6]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
          <mesh position={[-0.05, 0, 0]}><boxGeometry args={[0.04, 0.003, 0.06]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
        </group>
      )}
      {P("Controls.Mirror_R", [0.3, 0.95, 0.55], [0.5, 0.5, 0.3],
        <group>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.008, 0.008, 0.08, 6]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
          <mesh position={[0.05, 0, 0]}><boxGeometry args={[0.04, 0.003, 0.06]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
        </group>
      )}
      {P("Controls.InstrumentCluster", [0, 0.90, 0.6], [0, 0.5, 0.35],
        <mesh rotation={[-0.3, 0, 0]}><cylinderGeometry args={[0.06, 0.06, 0.015, 16]} /><meshStandardMaterial color="#111" emissive="#1155FF" emissiveIntensity={0.2} metalness={0.3} roughness={0.3} /></mesh>
      )}

      {/* Grips */}
      {P("Controls.Throttle", [0.25, 0.92, 0.55], [0.4, 0.5, 0.3],
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.018, 0.018, 0.1, 8]} /><meshStandardMaterial {...RUBBER} /></mesh>
      )}
      {P("Controls.ClutchLever", [-0.25, 0.92, 0.58], [-0.4, 0.5, 0.35],
        <mesh rotation={[0.3, 0.4, 0]}><boxGeometry args={[0.08, 0.008, 0.015]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}
      {P("Controls.BrakeLever", [0.25, 0.92, 0.58], [0.4, 0.5, 0.35],
        <mesh rotation={[0.3, -0.4, 0]}><boxGeometry args={[0.08, 0.008, 0.015]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}

      {/* ===== SEAT ===== */}
      {P("Seat.RiderSeat", [0, 0.68, -0.22], [0, 0.6, -0.15],
        <mesh><boxGeometry args={[0.28, 0.06, 0.4]} /><meshStandardMaterial {...LEATHER} /></mesh>
      )}
      {P("Seat.UnderStorage", [0, 0.6, -0.35], [0, 0.5, -0.25],
        <mesh><boxGeometry args={[0.2, 0.06, 0.15]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
      )}

      {/* ===== FOOT CONTROLS ===== */}
      {P("FootControls.Peg_L", [-0.18, 0.28, 0.0], [-0.4, 0.2, 0],
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 0.08, 8]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
      )}
      {P("FootControls.Peg_R", [0.18, 0.28, 0.0], [0.4, 0.2, 0],
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 0.08, 8]} /><meshStandardMaterial {...MATTE_BLACK} /></mesh>
      )}
      {P("FootControls.ShiftLever", [-0.2, 0.25, 0.05], [-0.42, 0.18, 0.05],
        <mesh rotation={[0, 0.3, 0]}><boxGeometry args={[0.06, 0.008, 0.01]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}
      {P("FootControls.BrakePedal", [0.2, 0.25, 0.0], [0.42, 0.18, 0],
        <mesh rotation={[0, -0.3, 0]}><boxGeometry args={[0.06, 0.008, 0.015]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}

      {/* ===== ELECTRICAL ===== */}
      {P("Electrical.Battery", [0, 0.45, -0.3], [0.3, 0.8, -0.2],
        <mesh><boxGeometry args={[0.12, 0.08, 0.1]} /><meshStandardMaterial color="#111" metalness={0.3} roughness={0.6} /></mesh>
      )}
      {P("Electrical.ECU", [0.1, 0.48, -0.15], [0.4, 0.8, 0],
        <mesh><boxGeometry args={[0.06, 0.04, 0.08]} /><meshStandardMaterial color="#1A1A2A" metalness={0.5} roughness={0.4} /></mesh>
      )}

      {/* ===== FLUIDS ===== */}
      {P("Fluids.EngineOil", [0.15, 0.25, 0.1], [0.5, 0.8, 0.5],
        <mesh><cylinderGeometry args={[0.02, 0.02, 0.08, 8]} /><meshStandardMaterial color="#2A2A00" metalness={0.2} roughness={0.7} /></mesh>
      )}
      {P("Fluids.Coolant", [-0.12, 0.52, 0.45], [-0.4, 0.8, 0.7],
        <mesh><cylinderGeometry args={[0.025, 0.025, 0.08, 8]} /><meshStandardMaterial color="#FF6688" metalness={0.1} roughness={0.5} transparent opacity={0.5} /></mesh>
      )}
    </group>
  );
}
