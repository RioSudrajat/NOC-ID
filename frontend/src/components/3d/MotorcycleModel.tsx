"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

function getHealthColor(health: number): string {
  if (health >= 90) return "#22C55E";
  if (health >= 70) return "#A3E635";
  if (health >= 50) return "#FACC15";
  if (health >= 30) return "#F97316";
  return "#EF4444";
}

interface PartProps {
  name: string;
  health: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  geometry: "box" | "cylinder" | "sphere" | "torus";
  args: number[];
  onSelect: (name: string, health: number) => void;
  selectedPart: string | null;
  xray: boolean;
  exploded: boolean;
  explodeOffset?: [number, number, number];
}

function BikePart({
  name, health, position, rotation = [0, 0, 0], scale = [1, 1, 1],
  geometry, args, onSelect, selectedPart, xray, exploded, explodeOffset = [0, 0, 0],
}: PartProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedPart === name;
  const color = getHealthColor(health);

  const actualPosition: [number, number, number] = exploded
    ? [position[0] + explodeOffset[0], position[1] + explodeOffset[1], position[2] + explodeOffset[2]]
    : position;

  useFrame(() => {
    if (meshRef.current && health <= 30) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
    }
  });

  const geomElement = {
    box: <boxGeometry args={args as [number, number, number]} />,
    cylinder: <cylinderGeometry args={args as [number, number, number, number]} />,
    sphere: <sphereGeometry args={args as [number, number]} />,
    torus: <torusGeometry args={args as [number, number, number, number]} />,
  }[geometry];

  return (
    <mesh
      ref={meshRef}
      position={actualPosition}
      rotation={rotation}
      scale={scale}
      onClick={(e) => { e.stopPropagation(); onSelect(name, health); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
    >
      {geomElement}
      <meshStandardMaterial
        color={isSelected || hovered ? color : xray ? "#334155" : "#64748B"}
        transparent={xray}
        opacity={xray ? 0.15 : 1}
        emissive={isSelected || hovered ? color : health <= 30 ? color : "#000000"}
        emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0}
        wireframe={xray && !isSelected && !hovered}
        roughness={0.4}
        metalness={0.6}
      />
    </mesh>
  );
}

/* ——————————————— Honda Beat Motorcycle Model ——————————————— */
const bikeParts: Record<string, number> = {
  "Frame.Chassis": 90,
  "Body.Front_Fairing": 85, "Body.Rear_Fairing": 88,
  "Body.Seat": 92, "Body.Under_Cowl": 87,
  "Engine.Engine_Block": 72, "Engine.CVT_Cover": 48,
  "Engine.Cylinder_Head": 75,
  "Transmission.CVT_Belt": 38,
  "Exhaust.Pipe": 70, "Exhaust.Muffler": 65,
  "Suspension.Front_Fork_L": 82, "Suspension.Front_Fork_R": 80,
  "Suspension.Rear_Shock": 78,
  "Brakes.Front_Disc": 95, "Brakes.Rear_Drum": 68,
  "Tires.Front_Tire": 85, "Tires.Rear_Tire": 80,
  "Electrical.Battery": 60, "Electrical.CDI": 88,
  "Handlebar.Handlebar": 94,
  "Handlebar.Left_Mirror": 90, "Handlebar.Right_Mirror": 92,
  "Lights.Headlight": 95, "Lights.Taillight": 90,
  "Fluids.Engine_Oil": 55, "Fluids.Brake_Fluid": 62,
  "Cooling.Radiator": 83,
};

interface MotorcycleModelProps {
  onSelectPart: (name: string, health: number) => void;
  selectedPart: string | null;
  xray: boolean;
  exploded: boolean;
}

export default function MotorcycleModel({ onSelectPart, selectedPart, xray, exploded }: MotorcycleModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && !selectedPart) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef} scale={[1.2, 1.2, 1.2]}>
      {/* ===== FRAME ===== */}
      {/* Main frame backbone */}
      <BikePart name="Frame.Chassis" health={bikeParts["Frame.Chassis"]} position={[0, 0.7, 0]} rotation={[0.15, 0, 0]} geometry="box" args={[0.12, 0.12, 1.8]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 1, 0]} />
      {/* Down tube */}
      <BikePart name="Frame.Chassis" health={bikeParts["Frame.Chassis"]} position={[0, 0.45, 0.3]} rotation={[0.6, 0, 0]} geometry="box" args={[0.1, 0.1, 0.8]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 1, 0]} />

      {/* ===== BODY / FAIRINGS ===== */}
      {/* Front fairing */}
      <BikePart name="Body.Front_Fairing" health={bikeParts["Body.Front_Fairing"]} position={[0, 0.85, 0.6]} geometry="box" args={[0.5, 0.5, 0.4]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 0.5, 1]} />
      {/* Under cowl */}
      <BikePart name="Body.Under_Cowl" health={bikeParts["Body.Under_Cowl"]} position={[0, 0.25, -0.1]} geometry="box" args={[0.45, 0.2, 0.8]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, -0.5, 0]} />
      {/* Rear fairing */}
      <BikePart name="Body.Rear_Fairing" health={bikeParts["Body.Rear_Fairing"]} position={[0, 0.65, -0.7]} geometry="box" args={[0.35, 0.3, 0.7]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 0.5, -1]} />
      {/* Seat */}
      <BikePart name="Body.Seat" health={bikeParts["Body.Seat"]} position={[0, 0.95, -0.5]} geometry="box" args={[0.35, 0.1, 0.9]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 1.5, -0.5]} />

      {/* ===== ENGINE ===== */}
      <BikePart name="Engine.Engine_Block" health={bikeParts["Engine.Engine_Block"]} position={[0, 0.3, 0.15]} geometry="box" args={[0.4, 0.35, 0.45]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, -1, 0.5]} />
      <BikePart name="Engine.Cylinder_Head" health={bikeParts["Engine.Cylinder_Head"]} position={[0, 0.52, 0.15]} geometry="box" args={[0.3, 0.1, 0.3]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, -0.5, 0.5]} />
      <BikePart name="Engine.CVT_Cover" health={bikeParts["Engine.CVT_Cover"]} position={[0.25, 0.3, -0.1]} geometry="cylinder" args={[0.2, 0.2, 0.06, 16]} rotation={[0, 0, Math.PI / 2]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1, -0.5, 0]} />

      {/* ===== TRANSMISSION ===== */}
      <BikePart name="Transmission.CVT_Belt" health={bikeParts["Transmission.CVT_Belt"]} position={[0.22, 0.3, -0.1]} geometry="torus" args={[0.14, 0.02, 8, 20]} rotation={[0, 0, Math.PI / 2]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1.5, -1, 0]} />

      {/* ===== EXHAUST ===== */}
      <BikePart name="Exhaust.Pipe" health={bikeParts["Exhaust.Pipe"]} position={[0.2, 0.18, -0.1]} rotation={[0, 0, 0]} geometry="cylinder" args={[0.03, 0.03, 1, 8]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1, -0.5, -0.5]} />
      <BikePart name="Exhaust.Muffler" health={bikeParts["Exhaust.Muffler"]} position={[0.22, 0.2, -0.8]} geometry="cylinder" args={[0.08, 0.06, 0.4, 12]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1.5, 0, -1.5]} />

      {/* ===== FRONT SUSPENSION / FORKS ===== */}
      <BikePart name="Suspension.Front_Fork_L" health={bikeParts["Suspension.Front_Fork_L"]} position={[-0.1, 0.5, 0.9]} rotation={[0.3, 0, 0]} geometry="cylinder" args={[0.025, 0.025, 0.9, 8]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-0.5, 0.5, 0.5]} />
      <BikePart name="Suspension.Front_Fork_R" health={bikeParts["Suspension.Front_Fork_R"]} position={[0.1, 0.5, 0.9]} rotation={[0.3, 0, 0]} geometry="cylinder" args={[0.025, 0.025, 0.9, 8]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0.5, 0.5, 0.5]} />
      {/* Rear shock */}
      <BikePart name="Suspension.Rear_Shock" health={bikeParts["Suspension.Rear_Shock"]} position={[0, 0.45, -0.9]} rotation={[0.35, 0, 0]} geometry="cylinder" args={[0.03, 0.03, 0.5, 8]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 0.5, -1]} />

      {/* ===== WHEELS ===== */}
      {/* Front wheel */}
      <BikePart name="Tires.Front_Tire" health={bikeParts["Tires.Front_Tire"]} position={[0, 0.15, 1.2]} rotation={[Math.PI / 2, 0, 0]} geometry="torus" args={[0.28, 0.08, 12, 24]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 0, 1.5]} />
      <BikePart name="Brakes.Front_Disc" health={bikeParts["Brakes.Front_Disc"]} position={[0.15, 0.15, 1.2]} rotation={[0, 0, Math.PI / 2]} geometry="cylinder" args={[0.18, 0.18, 0.015, 16]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0.5, 0, 1.5]} />
      {/* Rear wheel */}
      <BikePart name="Tires.Rear_Tire" health={bikeParts["Tires.Rear_Tire"]} position={[0, 0.15, -1.1]} rotation={[Math.PI / 2, 0, 0]} geometry="torus" args={[0.28, 0.1, 12, 24]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 0, -1.5]} />
      <BikePart name="Brakes.Rear_Drum" health={bikeParts["Brakes.Rear_Drum"]} position={[0, 0.15, -1.1]} rotation={[0, 0, Math.PI / 2]} geometry="cylinder" args={[0.15, 0.15, 0.06, 12]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 0, -2]} />

      {/* ===== HANDLEBAR ===== */}
      <BikePart name="Handlebar.Handlebar" health={bikeParts["Handlebar.Handlebar"]} position={[0, 1.05, 0.75]} geometry="cylinder" args={[0.02, 0.02, 0.7, 8]} rotation={[0, 0, Math.PI / 2]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 1, 0.5]} />
      {/* Mirrors */}
      <BikePart name="Handlebar.Left_Mirror" health={bikeParts["Handlebar.Left_Mirror"]} position={[-0.4, 1.15, 0.78]} geometry="sphere" args={[0.04, 8]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-1, 1, 0.5]} />
      <BikePart name="Handlebar.Right_Mirror" health={bikeParts["Handlebar.Right_Mirror"]} position={[0.4, 1.15, 0.78]} geometry="sphere" args={[0.04, 8]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1, 1, 0.5]} />

      {/* ===== ELECTRICAL ===== */}
      <BikePart name="Electrical.Battery" health={bikeParts["Electrical.Battery"]} position={[0, 0.55, -0.25]} geometry="box" args={[0.15, 0.12, 0.12]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1, 0, 0]} />
      <BikePart name="Electrical.CDI" health={bikeParts["Electrical.CDI"]} position={[0, 0.6, -0.45]} geometry="box" args={[0.1, 0.05, 0.08]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-1, 0.5, -0.5]} />

      {/* ===== COOLING ===== */}
      <BikePart name="Cooling.Radiator" health={bikeParts["Cooling.Radiator"]} position={[-0.2, 0.4, 0.5]} geometry="box" args={[0.04, 0.2, 0.2]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-1, 0, 1]} />

      {/* ===== LIGHTS ===== */}
      <mesh position={[0, 0.9, 0.85]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#ffee88" emissive="#ffee88" emissiveIntensity={0.6} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.7, -1.05]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={0.6} transparent opacity={0.85} />
      </mesh>

      {/* Ground shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 3.5]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
