"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { vehicleData, VehicleKey } from "@/context/ActiveVehicleContext";
import { Suspense } from "react";

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

function ViewerContent() {
  const searchParams = useSearchParams();
  const vin = searchParams.get("vin");
  
  let initialVehicle: VehicleKey | null = null;
  if (vin) {
    const entry = Object.entries(vehicleData).find(([_, v]) => v.vin === vin);
    if (entry) initialVehicle = entry[0] as VehicleKey;
  }
  
  return <SharedDigitalTwinViewer mode="mechanic" initialVehicle={initialVehicle} />;
}

export default function WorkshopViewerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading 3D Viewer...</div>}>
      <ViewerContent />
    </Suspense>
  );
}
