"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/* ——————————————— Health color helper ——————————————— */
function getHealthColor(health: number): string {
  if (health >= 90) return "#22C55E";
  if (health >= 70) return "#A3E635";
  if (health >= 50) return "#FACC15";
  if (health >= 30) return "#F97316";
  return "#EF4444";
}

/* ——————————————— Individual Part Component ——————————————— */
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

function VehiclePart({
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
    if (meshRef.current) {
      // Pulse effect for critical parts
      if (health <= 30) {
        meshRef.current.material = meshRef.current.material as THREE.MeshStandardMaterial;
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
      }
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
        emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : health <= 30 ? 0.2 : 0}
        wireframe={xray && !isSelected && !hovered}
        roughness={0.4}
        metalness={0.6}
      />
    </mesh>
  );
}

/* ——————————————— Toyota Avanza Car Model ——————————————— */
// Component health data (mock)
const carParts: Record<string, number> = {
  "Body.Main": 92, "Body.Hood": 88, "Body.Trunk": 95,
  "Body.Left_Door_Front": 90, "Body.Left_Door_Rear": 93,
  "Body.Right_Door_Front": 91, "Body.Right_Door_Rear": 89,
  "Body.Front_Bumper": 85, "Body.Rear_Bumper": 87,
  "Body.Roof": 96, "Body.Windshield": 94,
  "Engine.Engine_Block": 78, "Engine.Oil_Filter": 45,
  "Engine.Air_Filter": 55, "Engine.Intake_Manifold": 82,
  "Engine.Exhaust_Manifold": 76,
  "Transmission.Gearbox": 80, "Transmission.CVT_Belt": 42,
  "Brakes.Brake_Disc_FL": 100, "Brakes.Brake_Disc_FR": 100,
  "Brakes.Brake_Disc_RL": 72, "Brakes.Brake_Disc_RR": 70,
  "Tires.Tire_FL": 82, "Tires.Tire_FR": 80,
  "Tires.Tire_RL": 78, "Tires.Tire_RR": 76,
  "Electrical.Battery": 65, "Electrical.Alternator": 88,
  "Cooling.Radiator": 83, "Cooling.Water_Pump": 77,
  "Fluids.Engine_Oil": 95, "Fluids.Brake_Fluid": 68,
  "Fluids.Coolant": 72,
};

interface CarModelProps {
  onSelectPart: (name: string, health: number) => void;
  selectedPart: string | null;
  xray: boolean;
  exploded: boolean;
}

export default function CarModel({ onSelectPart, selectedPart, xray, exploded }: CarModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && !selectedPart) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ===== BODY ===== */}
      {/* Main body (lower) */}
      <VehiclePart name="Body.Main" health={carParts["Body.Main"]} position={[0, 0.55, 0]} geometry="box" args={[2.4, 0.7, 5]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 1.5, 0]} />
      {/* Cabin / Roof */}
      <VehiclePart name="Body.Roof" health={carParts["Body.Roof"]} position={[0, 1.3, -0.2]} geometry="box" args={[2.2, 0.65, 2.8]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 2, 0]} />
      {/* Hood */}
      <VehiclePart name="Body.Hood" health={carParts["Body.Hood"]} position={[0, 0.95, 1.8]} geometry="box" args={[2.2, 0.08, 1.4]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 2, 1]} />
      {/* Trunk */}
      <VehiclePart name="Body.Trunk" health={carParts["Body.Trunk"]} position={[0, 0.85, -2.1]} geometry="box" args={[2.1, 0.08, 0.8]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 1.5, -1.5]} />
      {/* Windshield */}
      <VehiclePart name="Body.Windshield" health={carParts["Body.Windshield"]} position={[0, 1.2, 1.0]} rotation={[0.4, 0, 0]} geometry="box" args={[2, 0.03, 1]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 1, 0.5]} />

      {/* Front bumper */}
      <VehiclePart name="Body.Front_Bumper" health={carParts["Body.Front_Bumper"]} position={[0, 0.3, 2.55]} geometry="box" args={[2.5, 0.35, 0.15]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 0, 1.5]} />
      {/* Rear bumper */}
      <VehiclePart name="Body.Rear_Bumper" health={carParts["Body.Rear_Bumper"]} position={[0, 0.3, -2.55]} geometry="box" args={[2.5, 0.35, 0.15]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 0, -1.5]} />

      {/* Doors */}
      <VehiclePart name="Body.Left_Door_Front" health={carParts["Body.Left_Door_Front"]} position={[-1.22, 0.75, 0.4]} geometry="box" args={[0.06, 0.8, 1.2]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-1.5, 0, 0]} />
      <VehiclePart name="Body.Left_Door_Rear" health={carParts["Body.Left_Door_Rear"]} position={[-1.22, 0.75, -0.8]} geometry="box" args={[0.06, 0.8, 1.2]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-1.5, 0, 0]} />
      <VehiclePart name="Body.Right_Door_Front" health={carParts["Body.Right_Door_Front"]} position={[1.22, 0.75, 0.4]} geometry="box" args={[0.06, 0.8, 1.2]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1.5, 0, 0]} />
      <VehiclePart name="Body.Right_Door_Rear" health={carParts["Body.Right_Door_Rear"]} position={[1.22, 0.75, -0.8]} geometry="box" args={[0.06, 0.8, 1.2]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1.5, 0, 0]} />

      {/* ===== ENGINE ===== */}
      <VehiclePart name="Engine.Engine_Block" health={carParts["Engine.Engine_Block"]} position={[0, 0.55, 1.6]} geometry="box" args={[1.2, 0.6, 0.9]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, -0.5, 2]} />
      <VehiclePart name="Engine.Oil_Filter" health={carParts["Engine.Oil_Filter"]} position={[-0.5, 0.35, 1.8]} geometry="cylinder" args={[0.08, 0.08, 0.2, 12]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-1, -0.5, 2]} />
      <VehiclePart name="Engine.Air_Filter" health={carParts["Engine.Air_Filter"]} position={[0.5, 0.8, 1.5]} geometry="box" args={[0.5, 0.15, 0.4]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1.5, 0, 2]} />
      <VehiclePart name="Engine.Intake_Manifold" health={carParts["Engine.Intake_Manifold"]} position={[0, 0.85, 1.5]} geometry="cylinder" args={[0.15, 0.15, 0.8, 8]} rotation={[0, 0, Math.PI / 2]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 1, 2]} />
      <VehiclePart name="Engine.Exhaust_Manifold" health={carParts["Engine.Exhaust_Manifold"]} position={[0, 0.25, 1.5]} geometry="cylinder" args={[0.1, 0.1, 0.8, 8]} rotation={[0, 0, Math.PI / 2]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, -1, 2]} />

      {/* ===== TRANSMISSION ===== */}
      <VehiclePart name="Transmission.Gearbox" health={carParts["Transmission.Gearbox"]} position={[0, 0.35, 0.8]} geometry="box" args={[0.8, 0.4, 0.6]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, -1, 0]} />
      <VehiclePart name="Transmission.CVT_Belt" health={carParts["Transmission.CVT_Belt"]} position={[0, 0.35, 0.4]} geometry="torus" args={[0.2, 0.04, 8, 24]} rotation={[Math.PI / 2, 0, 0]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, -1.5, 0]} />

      {/* ===== WHEELS / TIRES / BRAKES ===== */}
      {/* Front Left */}
      <VehiclePart name="Tires.Tire_FL" health={carParts["Tires.Tire_FL"]} position={[-1.3, 0.2, 1.5]} rotation={[0, 0, Math.PI / 2]} geometry="torus" args={[0.3, 0.12, 12, 24]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-1, 0, 0]} />
      <VehiclePart name="Brakes.Brake_Disc_FL" health={carParts["Brakes.Brake_Disc_FL"]} position={[-1.3, 0.2, 1.5]} rotation={[0, 0, Math.PI / 2]} geometry="cylinder" args={[0.22, 0.22, 0.04, 16]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-1.5, 0, 0]} />
      {/* Front Right */}
      <VehiclePart name="Tires.Tire_FR" health={carParts["Tires.Tire_FR"]} position={[1.3, 0.2, 1.5]} rotation={[0, 0, Math.PI / 2]} geometry="torus" args={[0.3, 0.12, 12, 24]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1, 0, 0]} />
      <VehiclePart name="Brakes.Brake_Disc_FR" health={carParts["Brakes.Brake_Disc_FR"]} position={[1.3, 0.2, 1.5]} rotation={[0, 0, Math.PI / 2]} geometry="cylinder" args={[0.22, 0.22, 0.04, 16]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1.5, 0, 0]} />
      {/* Rear Left */}
      <VehiclePart name="Tires.Tire_RL" health={carParts["Tires.Tire_RL"]} position={[-1.3, 0.2, -1.5]} rotation={[0, 0, Math.PI / 2]} geometry="torus" args={[0.3, 0.12, 12, 24]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-1, 0, 0]} />
      <VehiclePart name="Brakes.Brake_Disc_RL" health={carParts["Brakes.Brake_Disc_RL"]} position={[-1.3, 0.2, -1.5]} rotation={[0, 0, Math.PI / 2]} geometry="cylinder" args={[0.22, 0.22, 0.04, 16]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-1.5, 0, 0]} />
      {/* Rear Right */}
      <VehiclePart name="Tires.Tire_RR" health={carParts["Tires.Tire_RR"]} position={[1.3, 0.2, -1.5]} rotation={[0, 0, Math.PI / 2]} geometry="torus" args={[0.3, 0.12, 12, 24]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1, 0, 0]} />
      <VehiclePart name="Brakes.Brake_Disc_RR" health={carParts["Brakes.Brake_Disc_RR"]} position={[1.3, 0.2, -1.5]} rotation={[0, 0, Math.PI / 2]} geometry="cylinder" args={[0.22, 0.22, 0.04, 16]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1.5, 0, 0]} />

      {/* ===== ELECTRICAL ===== */}
      <VehiclePart name="Electrical.Battery" health={carParts["Electrical.Battery"]} position={[0.7, 0.65, 2.0]} geometry="box" args={[0.35, 0.25, 0.25]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[2, 0, 1]} />
      <VehiclePart name="Electrical.Alternator" health={carParts["Electrical.Alternator"]} position={[-0.4, 0.65, 1.3]} geometry="cylinder" args={[0.12, 0.12, 0.18, 12]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[-2, 0, 1]} />

      {/* ===== COOLING ===== */}
      <VehiclePart name="Cooling.Radiator" health={carParts["Cooling.Radiator"]} position={[0, 0.5, 2.35]} geometry="box" args={[1.8, 0.5, 0.06]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[0, 0, 2]} />
      <VehiclePart name="Cooling.Water_Pump" health={carParts["Cooling.Water_Pump"]} position={[0.3, 0.5, 1.9]} geometry="cylinder" args={[0.1, 0.1, 0.12, 12]} onSelect={onSelectPart} selectedPart={selectedPart} xray={xray} exploded={exploded} explodeOffset={[1, 0, 2]} />

      {/* ===== HEADLIGHTS ===== */}
      <mesh position={[-0.8, 0.6, 2.52]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#ffee88" emissive="#ffee88" emissiveIntensity={0.5} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.8, 0.6, 2.52]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#ffee88" emissive="#ffee88" emissiveIntensity={0.5} transparent opacity={0.8} />
      </mesh>
      {/* Taillights */}
      <mesh position={[-0.8, 0.6, -2.52]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={0.5} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.8, 0.6, -2.52]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={0.5} transparent opacity={0.8} />
      </mesh>

      {/* Ground shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 6]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
