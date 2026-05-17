"use client";

import dynamic from "next/dynamic";
import { useActiveVehicle } from "@/context/ActiveVehicleContext";
import type { VehicleIdentity } from "@/types/vehicle";

const SharedDigitalTwinViewer = dynamic(
  () => import("@/components/3d/SharedDigitalTwinViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Loading 3D Viewer...</p>
        </div>
      </div>
    ),
  }
);

type ViewerVehicleType = "bmw_m4" | "harley" | "pcx_150" | "supra";

function resolveViewerVehicleType(vehicle?: VehicleIdentity): ViewerVehicleType {
  const makeModel = `${vehicle?.make ?? ""} ${vehicle?.model ?? ""}`.toLowerCase();
  if (makeModel.includes("pcx")) return "pcx_150";
  if (makeModel.includes("supra")) return "supra";
  if (makeModel.includes("harley") || makeModel.includes("sportster")) return "harley";
  if (makeModel.includes("bmw") || makeModel.includes("m4")) return "bmw_m4";
  if (vehicle?.category === "motorcycle_matic") return "pcx_150";
  if (vehicle?.category === "motorcycle_big") return "harley";
  return "bmw_m4";
}

export default function ViewerPage() {
  const ctx = useActiveVehicle();
  const activeVehicle = resolveViewerVehicleType(ctx?.activeVehicleIdentity);
  return <SharedDigitalTwinViewer key={ctx?.activeVehicleId ?? activeVehicle} mode="owner" initialVehicle={activeVehicle} />;
}
