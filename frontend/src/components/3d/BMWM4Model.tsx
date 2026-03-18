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

/* ----- BMW M4 Isle of Man Green metallic paint ----- */
const BODY_COLOR = "#1D6B3F";      // deep Isle of Man Green
const BODY_METALNESS = 0.92;
const BODY_ROUGHNESS = 0.12;
const CHROME = { color: "#D4D4D8", metalness: 1, roughness: 0.05 };
const CARBON = { color: "#1A1A1A", metalness: 0.4, roughness: 0.35 };
const GLASS  = { color: "#88CCEE", metalness: 0.1, roughness: 0.05, opacity: 0.35, transparent: true };
const RUBBER = { color: "#111111", metalness: 0.0, roughness: 0.9 };
const INTERIOR_LEATHER = { color: "#1A1A1A", metalness: 0.0, roughness: 0.6 };
const RED_CALIPER = { color: "#CC0000", metalness: 0.7, roughness: 0.3 };
const HEADLIGHT = { color: "#FFFFFF", emissive: "#FFFFFF", emissiveIntensity: 0.6 };
const TAILLIGHT = { color: "#FF2222", emissive: "#FF2222", emissiveIntensity: 0.5 };

interface PartProps {
  name: string;
  health: number;
  onSelect: (n: string, h: number) => void;
  selected: string | null;
  xray: boolean;
  exploded: boolean;
  explodeOffset?: [number, number, number];
  children: React.ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
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
      const target = new THREE.Vector3(...finalPos);
      ref.current.position.lerp(target, 0.08);
    }
  });

  return (
    <group ref={ref} position={position} rotation={rotation}>
      <group onClick={(e) => { e.stopPropagation(); if (drill && !isSelected) { setDrill(false); } onSelect(name, health); if (isSelected && drillParts) setDrill(!drill); }}>
        {children}
        {/* Glow ring on select */}
        {isSelected && (
          <mesh>
            <ringGeometry args={[0.35, 0.4, 32]} />
            <meshBasicMaterial color={getHealthColor(health)} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
      {/* Drill-down sub-parts */}
      {drill && drillParts && (
        <group position={[0, 0.6, 0]}>
          {drillParts.map((dp, i) => (
            <mesh key={i} position={[(i - drillParts.length / 2) * 0.25, 0, 0]}
              onClick={(e) => { e.stopPropagation(); onSelect(`${name}.${dp.name}`, dp.health); }}>
              <boxGeometry args={[0.12, 0.12, 0.12]} />
              <meshStandardMaterial color={getHealthColor(dp.health)} metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

/* ====== BMW M4 (G82) Geometry ====== */

interface BMWM4Props {
  onSelectPart: (name: string, health: number) => void;
  selectedPart: string | null;
  xray: boolean;
  exploded: boolean;
}

const partData: Record<string, { health: number; drill?: { name: string; health: number }[] }> = {
  "Body.Hood": { health: 95 },
  "Body.Roof": { health: 98 },
  "Body.Trunk": { health: 97 },
  "Body.FrontBumper": { health: 92 },
  "Body.RearBumper": { health: 88 },
  "Body.Door_FL": { health: 96 },
  "Body.Door_FR": { health: 96 },
  "Body.Fender_FL": { health: 94 },
  "Body.Fender_FR": { health: 94 },
  "Body.SideSkirt_L": { health: 90 },
  "Body.SideSkirt_R": { health: 90 },
  "Body.Spoiler": { health: 99 },
  "Body.KidneyGrille": { health: 97 },
  "Glass.Windshield": { health: 100 },
  "Glass.RearWindow": { health: 100 },
  "Glass.Window_FL": { health: 99 },
  "Glass.Window_FR": { health: 99 },
  "Wheels.FL": { health: 82, drill: [{ name: "Tire", health: 80 }, { name: "Rim", health: 95 }, { name: "BrakeDisc", health: 72 }, { name: "BrakePad", health: 65 }, { name: "Caliper", health: 90 }] },
  "Wheels.FR": { health: 84, drill: [{ name: "Tire", health: 82 }, { name: "Rim", health: 94 }, { name: "BrakeDisc", health: 74 }, { name: "BrakePad", health: 68 }, { name: "Caliper", health: 91 }] },
  "Wheels.RL": { health: 88 },
  "Wheels.RR": { health: 86 },
  "Lights.Headlight_L": { health: 100 },
  "Lights.Headlight_R": { health: 100 },
  "Lights.Taillight_L": { health: 98 },
  "Lights.Taillight_R": { health: 98 },
  "Lights.DRL_L": { health: 100 },
  "Lights.DRL_R": { health: 100 },
  "Engine.S58_Block": { health: 45, drill: [{ name: "Piston1", health: 42 }, { name: "Piston2", health: 48 }, { name: "Piston3", health: 40 }, { name: "Piston4", health: 50 }, { name: "Piston5", health: 44 }, { name: "Piston6", health: 46 }, { name: "Camshaft", health: 55 }, { name: "TimingChain", health: 38 }, { name: "OilPump", health: 60 }] },
  "Engine.Turbo_L": { health: 52, drill: [{ name: "Compressor", health: 50 }, { name: "Turbine", health: 48 }, { name: "Wastegate", health: 55 }, { name: "BearingHousing", health: 45 }, { name: "OilFeed", health: 62 }] },
  "Engine.Turbo_R": { health: 55 },
  "Engine.Intercooler": { health: 78 },
  "Engine.IntakeManifold": { health: 85 },
  "Engine.ExhaustHeaders": { health: 60 },
  "Engine.OilFilter": { health: 40 },
  "Engine.ValveCover": { health: 88 },
  "Drivetrain.Gearbox_8AT": { health: 72, drill: [{ name: "TorqueConverter", health: 68 }, { name: "Gear1", health: 75 }, { name: "Gear2", health: 78 }, { name: "Gear3", health: 72 }, { name: "OilSeal", health: 60 }] },
  "Drivetrain.Driveshaft": { health: 90 },
  "Drivetrain.RearDiff": { health: 85 },
  "Drivetrain.TransferCase": { health: 80 },
  "Suspension.Strut_FL": { health: 76 },
  "Suspension.Strut_FR": { health: 78 },
  "Suspension.MultiLink_RL": { health: 82 },
  "Suspension.MultiLink_RR": { health: 80 },
  "Exhaust.Downpipe_L": { health: 65 },
  "Exhaust.Downpipe_R": { health: 67 },
  "Exhaust.Muffler": { health: 58 },
  "Exhaust.Tips": { health: 92 },
  "Interior.Dashboard": { health: 99 },
  "Interior.SteeringWheel": { health: 100 },
  "Interior.Seat_FL": { health: 98 },
  "Interior.Seat_FR": { health: 97 },
  "Interior.CenterConsole": { health: 95 },
  "Interior.iDrive": { health: 100 },
  "Cooling.Radiator": { health: 70 },
  "Cooling.WaterPump": { health: 65 },
  "Fluids.EngineOil": { health: 55 },
  "Fluids.BrakeFluid": { health: 62 },
  "Fluids.Coolant": { health: 68 },
  "Electrical.Battery": { health: 75 },
  "Electrical.Alternator": { health: 88 },
};

export default function BMWM4Model({ onSelectPart, selectedPart, xray, exploded }: BMWM4Props) {
  const groupRef = useRef<THREE.Group>(null);

  const P = (name: string, pos: [number, number, number], explOff: [number, number, number], children: React.ReactNode, rot?: [number, number, number]) => {
    const pd = partData[name] || { health: 80 };
    return (
      <Part key={name} name={name} health={pd.health} onSelect={onSelectPart} selected={selectedPart} xray={xray} exploded={exploded} explodeOffset={explOff} position={pos} rotation={rot} drillParts={pd.drill}>
        {children}
      </Part>
    );
  };

  const bodyMat = <meshPhysicalMaterial color={BODY_COLOR} metalness={BODY_METALNESS} roughness={BODY_ROUGHNESS} clearcoat={1} clearcoatRoughness={0.05} transparent={xray} opacity={xray ? 0.18 : 1} depthWrite={!xray} envMapIntensity={1.2} />;

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* ===== MAIN BODY ===== */}

      {/* Hood — long sloping shape */}
      {P("Body.Hood", [0, 0.72, 1.0], [0, 1.2, 0.6],
        <RoundedBox args={[1.72, 0.06, 1.4]} radius={0.02} smoothness={4} castShadow>{bodyMat}</RoundedBox>
      )}

      {/* Roof — carbon fiber */}
      {P("Body.Roof", [0, 1.18, -0.3], [0, 1.5, 0],
        <RoundedBox args={[1.52, 0.05, 1.4]} radius={0.02} smoothness={4}><meshStandardMaterial {...CARBON} transparent={xray} opacity={xray ? 0.15 : 1} /></RoundedBox>
      )}

      {/* Front bumper + kidney grille integrated */}
      {P("Body.FrontBumper", [0, 0.35, 1.85], [0, 0, 1.2],
        <group>
          <RoundedBox args={[1.82, 0.5, 0.15]} radius={0.05} smoothness={4} castShadow>{bodyMat}</RoundedBox>
          {/* Air intakes */}
          <mesh position={[-0.5, -0.1, 0.08]}><boxGeometry args={[0.35, 0.2, 0.04]} /><meshStandardMaterial color="#080808" metalness={0.3} roughness={0.5} /></mesh>
          <mesh position={[0.5, -0.1, 0.08]}><boxGeometry args={[0.35, 0.2, 0.04]} /><meshStandardMaterial color="#080808" metalness={0.3} roughness={0.5} /></mesh>
        </group>
      )}

      {/* Kidney grille — vertical slats */}
      {P("Body.KidneyGrille", [0, 0.56, 1.88], [0, 0, 0.5],
        <group>
          <mesh position={[-0.22, 0, 0]}><boxGeometry args={[0.38, 0.35, 0.05]} /><meshStandardMaterial color="#0A0A0A" metalness={0.6} roughness={0.3} /></mesh>
          <mesh position={[0.22, 0, 0]}><boxGeometry args={[0.38, 0.35, 0.05]} /><meshStandardMaterial color="#0A0A0A" metalness={0.6} roughness={0.3} /></mesh>
          {/* Chrome surround */}
          <mesh position={[-0.22, 0, 0.03]}><torusGeometry args={[0.19, 0.015, 8, 4]} /><meshStandardMaterial {...CHROME} /></mesh>
          <mesh position={[0.22, 0, 0.03]}><torusGeometry args={[0.19, 0.015, 8, 4]} /><meshStandardMaterial {...CHROME} /></mesh>
        </group>
      )}

      {/* Rear bumper + diffuser */}
      {P("Body.RearBumper", [0, 0.35, -1.95], [0, 0, -1.2],
        <group>
          <RoundedBox args={[1.82, 0.5, 0.15]} radius={0.05} smoothness={4} castShadow>{bodyMat}</RoundedBox>
          <mesh position={[0, -0.15, -0.05]}><boxGeometry args={[1.2, 0.18, 0.08]} /><meshStandardMaterial {...CARBON} /></mesh>
        </group>
      )}

      {/* Trunk */}
      {P("Body.Trunk", [0, 0.85, -1.5], [0, 0.8, -0.6],
        <RoundedBox args={[1.5, 0.06, 0.7]} radius={0.02} smoothness={4} castShadow>{bodyMat}</RoundedBox>
      )}

      {/* Spoiler — ducktail lip */}
      {P("Body.Spoiler", [0, 0.92, -1.82], [0, 0.5, -0.8],
        <mesh><boxGeometry args={[1.3, 0.03, 0.12]} /><meshStandardMaterial {...CARBON} /></mesh>
      )}

      {/* Doors */}
      {P("Body.Door_FL", [-0.88, 0.65, 0.0], [-1.2, 0, 0],
        <RoundedBox args={[0.05, 0.6, 1.2]} radius={0.02} smoothness={4} castShadow>{bodyMat}</RoundedBox>
      )}
      {P("Body.Door_FR", [0.88, 0.65, 0.0], [1.2, 0, 0],
        <RoundedBox args={[0.05, 0.6, 1.2]} radius={0.02} smoothness={4} castShadow>{bodyMat}</RoundedBox>
      )}

      {/* Fenders */}
      {P("Body.Fender_FL", [-0.88, 0.55, 1.2], [-0.8, 0, 0.4],
        <RoundedBox args={[0.06, 0.45, 0.6]} radius={0.02} smoothness={4} castShadow>{bodyMat}</RoundedBox>
      )}
      {P("Body.Fender_FR", [0.88, 0.55, 1.2], [0.8, 0, 0.4],
        <RoundedBox args={[0.06, 0.45, 0.6]} radius={0.02} smoothness={4} castShadow>{bodyMat}</RoundedBox>
      )}

      {/* Side skirts */}
      {P("Body.SideSkirt_L", [-0.88, 0.2, 0], [-0.6, 0, 0],
        <mesh><boxGeometry args={[0.05, 0.12, 2.5]} /><meshStandardMaterial {...CARBON} /></mesh>
      )}
      {P("Body.SideSkirt_R", [0.88, 0.2, 0], [0.6, 0, 0],
        <mesh><boxGeometry args={[0.05, 0.12, 2.5]} /><meshStandardMaterial {...CARBON} /></mesh>
      )}

      {/* ===== GLASS ===== */}
      {P("Glass.Windshield", [0, 1.08, 0.55], [0, 0.8, 0.3],
        <mesh rotation={[Math.PI * 0.2, 0, 0]}><planeGeometry args={[1.44, 0.7]} /><meshPhysicalMaterial {...GLASS} /></mesh>
      )}
      {P("Glass.RearWindow", [0, 1.05, -1.1], [0, 0.8, -0.3],
        <mesh rotation={[-Math.PI * 0.18, 0, 0]}><planeGeometry args={[1.3, 0.5]} /><meshPhysicalMaterial {...GLASS} /></mesh>
      )}
      {P("Glass.Window_FL", [-0.86, 0.92, 0.0], [-0.6, 0.3, 0],
        <mesh rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.1, 0.4]} /><meshPhysicalMaterial {...GLASS} /></mesh>
      )}
      {P("Glass.Window_FR", [0.86, 0.92, 0.0], [0.6, 0.3, 0],
        <mesh rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[1.1, 0.4]} /><meshPhysicalMaterial {...GLASS} /></mesh>
      )}

      {/* ===== WHEELS (4x) ===== */}
      {[
        { name: "Wheels.FL", pos: [-0.78, 0.32, 1.3] as [number, number, number], off: [-0.8, 0, 0.6] as [number, number, number], rot: Math.PI / 2 },
        { name: "Wheels.FR", pos: [0.78, 0.32, 1.3] as [number, number, number], off: [0.8, 0, 0.6] as [number, number, number], rot: -Math.PI / 2 },
        { name: "Wheels.RL", pos: [-0.78, 0.32, -1.2] as [number, number, number], off: [-0.8, 0, -0.6] as [number, number, number], rot: Math.PI / 2 },
        { name: "Wheels.RR", pos: [0.78, 0.32, -1.2] as [number, number, number], off: [0.8, 0, -0.6] as [number, number, number], rot: -Math.PI / 2 },
      ].map(w => P(w.name, w.pos, w.off,
        <group rotation={[0, w.rot, 0]}>
          {/* Tire */}
          <mesh><torusGeometry args={[0.32, 0.11, 32, 48]} /><meshStandardMaterial {...RUBBER} /></mesh>
          {/* Rim — multi-spoke */}
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.08, 12]} /><meshStandardMaterial {...CHROME} /></mesh>
          {/* Center cap */}
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.06, 0.06, 0.03, 16]} /><meshStandardMaterial color="#1D6B3F" metalness={0.8} roughness={0.2} /></mesh>
          {/* Brake caliper */}
          <mesh position={[0.15, 0.15, -0.04]} rotation={[0, 0, Math.PI / 4]}><RoundedBox args={[0.1, 0.14, 0.08]} radius={0.02} smoothness={2}><meshStandardMaterial {...RED_CALIPER} /></RoundedBox></mesh>
          {/* Brake disc */}
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.02, 32]} /><meshStandardMaterial color="#777777" metalness={0.9} roughness={0.3} /></mesh>
        </group>
      ))}

      {/* ===== LIGHTS ===== */}
      {P("Lights.Headlight_L", [-0.55, 0.58, 1.88], [0, 0, 0.3],
        <group>
          <mesh><boxGeometry args={[0.3, 0.14, 0.08]} /><meshStandardMaterial {...HEADLIGHT} /></mesh>
          <mesh position={[0, -0.1, 0.02]}><boxGeometry args={[0.28, 0.025, 0.04]} /><meshStandardMaterial color="#00AAFF" emissive="#00AAFF" emissiveIntensity={0.4} /></mesh>
        </group>
      )}
      {P("Lights.Headlight_R", [0.55, 0.58, 1.88], [0, 0, 0.3],
        <group>
          <mesh><boxGeometry args={[0.3, 0.14, 0.08]} /><meshStandardMaterial {...HEADLIGHT} /></mesh>
          <mesh position={[0, -0.1, 0.02]}><boxGeometry args={[0.28, 0.025, 0.04]} /><meshStandardMaterial color="#00AAFF" emissive="#00AAFF" emissiveIntensity={0.4} /></mesh>
        </group>
      )}
      {P("Lights.Taillight_L", [-0.55, 0.62, -1.98], [0, 0, -0.3],
        <mesh><boxGeometry args={[0.32, 0.08, 0.04]} /><meshStandardMaterial {...TAILLIGHT} /></mesh>
      )}
      {P("Lights.Taillight_R", [0.55, 0.62, -1.98], [0, 0, -0.3],
        <mesh><boxGeometry args={[0.32, 0.08, 0.04]} /><meshStandardMaterial {...TAILLIGHT} /></mesh>
      )}

      {/* ===== ENGINE BAY ===== */}
      {P("Engine.S58_Block", [0, 0.52, 1.1], [0, 1.5, 1.5],
        <group>
          <mesh><boxGeometry args={[0.55, 0.35, 0.5]} /><meshStandardMaterial color="#3A3A3A" metalness={0.85} roughness={0.25} /></mesh>
          {/* Cylinder head detail */}
          <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.5, 0.06, 0.45]} /><meshStandardMaterial color="#222222" metalness={0.7} roughness={0.35} /></mesh>
        </group>
      )}
      {P("Engine.ValveCover", [0, 0.73, 1.1], [0, 1.8, 1.5],
        <mesh><boxGeometry args={[0.48, 0.05, 0.4]} /><meshStandardMaterial color="#1A1A1A" metalness={0.6} roughness={0.4} /></mesh>
      )}
      {P("Engine.Turbo_L", [-0.35, 0.45, 1.25], [-0.8, 1.5, 1.5],
        <group>
          <mesh><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#555555" metalness={0.9} roughness={0.15} /></mesh>
          <mesh position={[0, 0, 0.12]}><cylinderGeometry args={[0.04, 0.06, 0.1, 12]} /><meshStandardMaterial {...CHROME} /></mesh>
        </group>
      )}
      {P("Engine.Turbo_R", [0.35, 0.45, 1.25], [0.8, 1.5, 1.5],
        <group>
          <mesh><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#555555" metalness={0.9} roughness={0.15} /></mesh>
          <mesh position={[0, 0, 0.12]}><cylinderGeometry args={[0.04, 0.06, 0.1, 12]} /><meshStandardMaterial {...CHROME} /></mesh>
        </group>
      )}
      {P("Engine.Intercooler", [0, 0.35, 1.7], [0, 1.0, 2.0],
        <mesh><boxGeometry args={[1.0, 0.15, 0.08]} /><meshStandardMaterial color="#888888" metalness={0.85} roughness={0.2} /></mesh>
      )}
      {P("Engine.IntakeManifold", [0, 0.65, 0.85], [0, 1.6, 1.2],
        <mesh><boxGeometry args={[0.4, 0.12, 0.3]} /><meshStandardMaterial color="#2A2A2A" metalness={0.5} roughness={0.5} /></mesh>
      )}
      {P("Engine.ExhaustHeaders", [0, 0.32, 0.9], [0, 1.2, 1.0],
        <group>
          {[...Array(3)].map((_, i) => (
            <mesh key={i} position={[(i - 1) * 0.12, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.3, 8]} /><meshStandardMaterial {...CHROME} />
            </mesh>
          ))}
        </group>
      )}
      {P("Engine.OilFilter", [0.3, 0.35, 0.75], [0.6, 1.4, 1.0],
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.04, 0.1, 12]} /><meshStandardMaterial color="#FFD700" metalness={0.3} roughness={0.5} /></mesh>
      )}

      {/* ===== DRIVETRAIN ===== */}
      {P("Drivetrain.Gearbox_8AT", [0, 0.3, 0.3], [0, 1.3, 0.5],
        <mesh><boxGeometry args={[0.35, 0.25, 0.45]} /><meshStandardMaterial color="#444444" metalness={0.8} roughness={0.3} /></mesh>
      )}
      {P("Drivetrain.Driveshaft", [0, 0.22, -0.4], [0, 1.0, 0],
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 1.2, 8]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}
      {P("Drivetrain.RearDiff", [0, 0.22, -1.2], [0, 1.0, -0.5],
        <mesh><boxGeometry args={[0.3, 0.2, 0.25]} /><meshStandardMaterial color="#333333" metalness={0.85} roughness={0.25} /></mesh>
      )}
      {P("Drivetrain.TransferCase", [0, 0.25, 0.1], [0, 1.2, 0.3],
        <mesh><boxGeometry args={[0.2, 0.15, 0.2]} /><meshStandardMaterial color="#3A3A3A" metalness={0.75} roughness={0.35} /></mesh>
      )}

      {/* ===== SUSPENSION ===== */}
      {P("Suspension.Strut_FL", [-0.65, 0.5, 1.3], [-1.2, 0.5, 0.5],
        <mesh rotation={[0, 0, 0.1]}><cylinderGeometry args={[0.03, 0.025, 0.45, 8]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}
      {P("Suspension.Strut_FR", [0.65, 0.5, 1.3], [1.2, 0.5, 0.5],
        <mesh rotation={[0, 0, -0.1]}><cylinderGeometry args={[0.03, 0.025, 0.45, 8]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}
      {P("Suspension.MultiLink_RL", [-0.6, 0.25, -1.2], [-1.0, 0.3, -0.5],
        <group>
          <mesh rotation={[0, 0, Math.PI / 6]}><cylinderGeometry args={[0.015, 0.015, 0.3, 6]} /><meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} /></mesh>
          <mesh position={[0.1, -0.05, 0]} rotation={[0, 0, -Math.PI / 8]}><cylinderGeometry args={[0.015, 0.015, 0.25, 6]} /><meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} /></mesh>
        </group>
      )}
      {P("Suspension.MultiLink_RR", [0.6, 0.25, -1.2], [1.0, 0.3, -0.5],
        <group>
          <mesh rotation={[0, 0, -Math.PI / 6]}><cylinderGeometry args={[0.015, 0.015, 0.3, 6]} /><meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} /></mesh>
          <mesh position={[-0.1, -0.05, 0]} rotation={[0, 0, Math.PI / 8]}><cylinderGeometry args={[0.015, 0.015, 0.25, 6]} /><meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} /></mesh>
        </group>
      )}

      {/* ===== EXHAUST ===== */}
      {P("Exhaust.Downpipe_L", [-0.15, 0.15, -0.5], [-0.5, 0.8, -0.3],
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 1.0, 8]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}
      {P("Exhaust.Downpipe_R", [0.15, 0.15, -0.5], [0.5, 0.8, -0.3],
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 1.0, 8]} /><meshStandardMaterial {...CHROME} /></mesh>
      )}
      {P("Exhaust.Muffler", [0, 0.12, -1.6], [0, 0.6, -1.0],
        <mesh><boxGeometry args={[0.5, 0.12, 0.2]} /><meshStandardMaterial color="#333" metalness={0.8} roughness={0.25} /></mesh>
      )}
      {P("Exhaust.Tips", [0, 0.15, -2.05], [0, 0, -0.5],
        <group>
          {[-0.35, -0.15, 0.15, 0.35].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.045, 0.08, 12]} /><meshStandardMaterial {...CHROME} />
            </mesh>
          ))}
        </group>
      )}

      {/* ===== INTERIOR ===== */}
      {P("Interior.Dashboard", [0, 0.82, 0.4], [0, 0.5, 0.2],
        <mesh><boxGeometry args={[1.3, 0.2, 0.3]} /><meshStandardMaterial {...INTERIOR_LEATHER} /></mesh>
      )}
      {P("Interior.iDrive", [0, 0.92, 0.42], [0, 0.6, 0.2],
        <mesh><boxGeometry args={[0.5, 0.12, 0.02]} /><meshStandardMaterial color="#111111" emissive="#1155FF" emissiveIntensity={0.3} metalness={0.3} roughness={0.2} /></mesh>
      )}
      {P("Interior.SteeringWheel", [-0.35, 0.82, 0.2], [-0.5, 0.4, 0.15],
        <mesh rotation={[Math.PI * 0.35, 0, 0]}><torusGeometry args={[0.14, 0.015, 12, 24]} /><meshStandardMaterial {...INTERIOR_LEATHER} /></mesh>
      )}
      {P("Interior.Seat_FL", [-0.35, 0.55, -0.2], [-0.5, 0.3, -0.1],
        <group>
          <mesh><boxGeometry args={[0.35, 0.08, 0.4]} /><meshStandardMaterial {...INTERIOR_LEATHER} /></mesh>
          <mesh position={[0, 0.22, -0.15]}><boxGeometry args={[0.32, 0.4, 0.08]} /><meshStandardMaterial {...INTERIOR_LEATHER} /></mesh>
        </group>
      )}
      {P("Interior.Seat_FR", [0.35, 0.55, -0.2], [0.5, 0.3, -0.1],
        <group>
          <mesh><boxGeometry args={[0.35, 0.08, 0.4]} /><meshStandardMaterial {...INTERIOR_LEATHER} /></mesh>
          <mesh position={[0, 0.22, -0.15]}><boxGeometry args={[0.32, 0.4, 0.08]} /><meshStandardMaterial {...INTERIOR_LEATHER} /></mesh>
        </group>
      )}
      {P("Interior.CenterConsole", [0, 0.55, -0.15], [0, 0.3, -0.1],
        <mesh><boxGeometry args={[0.22, 0.12, 0.8]} /><meshStandardMaterial {...INTERIOR_LEATHER} /></mesh>
      )}

      {/* ===== COOLING ===== */}
      {P("Cooling.Radiator", [0, 0.45, 1.75], [0, 1.0, 2.2],
        <mesh><boxGeometry args={[0.8, 0.35, 0.06]} /><meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} /></mesh>
      )}
      {P("Cooling.WaterPump", [-0.2, 0.4, 0.95], [-0.4, 1.2, 1.3],
        <mesh><cylinderGeometry args={[0.06, 0.06, 0.08, 12]} /><meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} /></mesh>
      )}

      {/* ===== FLUIDS ===== */}
      {P("Fluids.EngineOil", [0.35, 0.6, 0.95], [0.8, 1.6, 1.2],
        <mesh><cylinderGeometry args={[0.03, 0.03, 0.15, 8]} /><meshStandardMaterial color="#2A2A00" metalness={0.2} roughness={0.7} /></mesh>
      )}
      {P("Fluids.BrakeFluid", [-0.45, 0.75, 0.5], [-0.8, 1.0, 0.4],
        <mesh><cylinderGeometry args={[0.025, 0.025, 0.1, 8]} /><meshStandardMaterial color="#CCAA00" metalness={0.1} roughness={0.5} transparent opacity={0.6} /></mesh>
      )}
      {P("Fluids.Coolant", [0.45, 0.6, 1.4], [0.8, 1.0, 1.6],
        <mesh><cylinderGeometry args={[0.035, 0.035, 0.12, 8]} /><meshStandardMaterial color="#FF6688" metalness={0.1} roughness={0.5} transparent opacity={0.5} /></mesh>
      )}

      {/* ===== ELECTRICAL ===== */}
      {P("Electrical.Battery", [0.5, 0.55, 0.6], [1.0, 1.2, 0.8],
        <mesh><boxGeometry args={[0.18, 0.12, 0.12]} /><meshStandardMaterial color="#111111" metalness={0.3} roughness={0.6} /></mesh>
      )}
      {P("Electrical.Alternator", [-0.25, 0.38, 0.85], [-0.5, 1.0, 1.1],
        <mesh><cylinderGeometry args={[0.06, 0.06, 0.1, 12]} /><meshStandardMaterial color="#444" metalness={0.8} roughness={0.25} /></mesh>
      )}

      {/* Underbody pan */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[1.7, 0.02, 3.6]} />
        <meshStandardMaterial color="#111111" metalness={0.3} roughness={0.8} />
      </mesh>
    </group>
  );
}
