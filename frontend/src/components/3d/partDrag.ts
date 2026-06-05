import type { Object3D } from "three";

export type PartDragOffset = [number, number, number];
export type PartDragOffsets = Record<string, PartDragOffset>;
export type RegisterPartTransformTarget = (partId: string, target: Object3D | null) => void;
