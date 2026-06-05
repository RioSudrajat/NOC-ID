"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { PartDragOffsets, RegisterPartTransformTarget } from "@/components/3d/partDrag";
import pcxParts from "@/data/pcx150Parts.json";

interface PCX150ModelProps {
  onSelectPart: (name: string, health: number) => void;
  selectedPart: string | null;
  xray: boolean;
  exploded: boolean;
  partDragOffsets?: PartDragOffsets;
  onPartTransformTarget?: RegisterPartTransformTarget;
}

interface PCXPart {
  id: string;
  label: string;
  health: number;
  zone: string;
  explodeDir: [number, number, number];
}

const pcxPartList = pcxParts as unknown as PCXPart[];
const partsById = new Map(pcxPartList.map((part) => [part.id, part]));
const basePositions = new WeakMap<Object3D, Vector3>();
const targetPosition = new Vector3();

function getHealthColor(health: number): string {
  if (health >= 90) return "#86EFAC";
  if (health >= 70) return "#5EEAD4";
  if (health >= 50) return "#FCD34D";
  if (health >= 30) return "#5EEAD4";
  return "#FCA5A5";
}

function getNames(object: Object3D) {
  const names: string[] = [];
  let current: Object3D | null = object;
  while (current) {
    names.push(current.name);
    if (current instanceof Mesh) {
      const materials = Array.isArray(current.material) ? current.material : [current.material];
      for (const material of materials) names.push(material.name);
    }
    current = current.parent;
  }
  return names.join(" ").toLowerCase();
}

function closestNodeName(object: Object3D) {
  let current: Object3D | null = object;
  while (current) {
    if (current.name) return current.name.toLowerCase();
    current = current.parent;
  }
  return "";
}

function resolvePCXPartId(object: Object3D): string {
  const names = getNames(object);
  const nodeName = closestNodeName(object);

  if (names.includes("traseira") && nodeName.includes("rear tire")) return "Wheel.Rear_Tire";
  if (names.includes("dianteira") && nodeName.includes("rear tire")) return "Wheel.Front_Tire";
  if (names.includes("traseira") && nodeName.includes("circle")) return "Wheel.Rear_Rim";
  if (names.includes("dianteira") && nodeName.includes("circle")) return "Wheel.Front_Rim";
  if (names.includes("disco de freio frente")) return "Brake.Front_Disc";
  if (names.includes("disco de freio atras")) return "Brake.Rear_Drum";
  if (names.includes("freio_ft")) return "Brake.Front_Caliper";
  if (nodeName.includes("brakelever")) return "Controls.Brake_Lever_Right";
  if (nodeName.includes("clutchlever")) return "Controls.Brake_Lever_Left";
  if (nodeName.includes("gripsheater") || nodeName.includes("gripends")) return "Controls.Right_Throttle_Grip";
  if (nodeName.includes("handlebars") || nodeName.includes("handlebar")) return "Controls.Handlebar";
  if (names.includes("banco")) return "Seat.Seat_Assembly";
  if (names.includes("caixa de ar")) return "Fuel.Air_Cleaner_Box";
  if (nodeName.includes("base_f125_engine")) return "Engine.Cylinder_Block";
  if (names.includes("motor.003")) return "Engine.Cylinder_Head";
  if (nodeName.includes("base_f125_frame")) return "Frame.Main_Frame";
  if (nodeName.includes("tampa gas")) return "Fuel.Fuel_Tank";
  if (nodeName.includes("vidro_painel")) return "Controls.Speedometer_Meter";
  if (nodeName.includes("glass_front") || names.includes("farolpcx")) return "Lighting.Headlight_Lens";
  if (nodeName.includes("lightglass_center")) return "Lighting.Headlight_Reflector";
  if (names.includes("pisc")) return names.includes("traseira") ? "Lighting.Rear_Turn_Signal_Right" : "Lighting.Front_Turn_Signal_Right";
  if (names.includes("lanterna")) return "Lighting.Tail_Light_Lens";
  if (names.includes("placa")) return "Body.Rear_Fender";
  if (names.includes("hondachromelogo")) return "Body.Front_Cover";
  if (nodeName.includes("nurbspath") || nodeName.includes("beziercurve")) return "Electrical.Main_Harness";
  if (names.includes("body") || names.includes("pcx azul")) return "Body.Left_Side_Cover";
  if (nodeName.includes("cube.010")) return "Body.Floor_Step";
  if (nodeName.includes("cube.019") || nodeName.includes("cube.029") || nodeName.includes("cube.030")) return "Body.Center_Cover";
  if (nodeName.includes("cube.044") || nodeName.includes("cube.045")) return "Body.Left_Inner_Cover";
  if (nodeName.includes("cube.046") || nodeName.includes("cube.047")) return "Body.Right_Inner_Cover";
  if (nodeName.includes("cube.048") || nodeName.includes("cube.049")) return "Body.Left_Side_Cover";
  if (nodeName.includes("cube.050") || nodeName.includes("cube.051")) return "Body.Right_Side_Cover";
  if (nodeName.includes("plane.090") || nodeName.includes("plane.092") || nodeName.includes("plane.093")) return "Body.Front_Cover";
  if (nodeName.includes("plane.094") || nodeName.includes("plane.095")) return "Body.Rear_Center_Cover";
  if (nodeName.includes("plane")) return "Body.Inner_Floor_Panel";
  if (nodeName.includes("cylinder")) return "Suspension.Front_Fork_Left";

  return "Body.Front_Cover";
}

function prepareScene(scene: Object3D) {
  const cloned = scene.clone(true);
  cloned.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const partId = resolvePCXPartId(object);
    object.userData.partId = partId;
    object.castShadow = true;
    object.receiveShadow = true;
    basePositions.set(object, object.position.clone());

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const clonedMaterials = materials.map((material) => material instanceof MeshStandardMaterial ? material.clone() : new MeshStandardMaterial());
    object.material = Array.isArray(object.material) ? clonedMaterials : clonedMaterials[0];
  });
  return cloned;
}

export default function PCX150Model({ onSelectPart, selectedPart, xray, exploded, partDragOffsets = {}, onPartTransformTarget }: PCX150ModelProps) {
  const { scene } = useGLTF("/models/honda-pcx/source/PCXDLXABS.glb");
  const model = useMemo(() => prepareScene(scene), [scene]);

  useEffect(() => {
    if (!selectedPart) return;
    let target: Mesh | null = null;
    model.traverse((object) => {
      if (target || !(object instanceof Mesh)) return;
      if (object.userData.partId === selectedPart) target = object;
    });
    onPartTransformTarget?.(selectedPart, target);
  }, [model, onPartTransformTarget, selectedPart]);

  useFrame(() => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const partId = object.userData.partId as string | undefined;
      const part = partId ? partsById.get(partId) : null;
      const base = basePositions.get(object);
      if (!part || !base) return;
      const dragOffset = partDragOffsets[part.id] ?? [0, 0, 0];

      targetPosition.copy(base);
      if (exploded) {
        targetPosition.x += part.explodeDir[0] * 0.65;
        targetPosition.y += part.explodeDir[1] * 0.65;
        targetPosition.z += part.explodeDir[2] * 0.65;
      }
      targetPosition.x += dragOffset[0];
      targetPosition.y += dragOffset[1];
      targetPosition.z += dragOffset[2];
      object.position.lerp(targetPosition, 0.08);

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        const selected = selectedPart === part.id;
        material.transparent = xray;
        material.opacity = xray ? 0.32 : 1;
        material.depthWrite = !xray;
        material.emissive.set(selected ? getHealthColor(part.health) : "#000000");
        material.emissiveIntensity = selected ? 0.7 : 0;
        material.wireframe = selected;
      }
    });
  });

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const partId = resolvePCXPartId(event.object);
    const part = partsById.get(partId);
    if (part) onSelectPart(part.id, part.health);
  }, [onSelectPart]);

  return (
    <group scale={1.08} position={[0, -0.48, 0]}>
      <primitive object={model} rotation={[0, Math.PI, 0]} onClick={handleClick} />
    </group>
  );
}

useGLTF.preload("/models/honda-pcx/source/PCXDLXABS.glb");
