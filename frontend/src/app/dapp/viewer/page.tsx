"use client";

import dynamic from "next/dynamic";

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

export default function ViewerPage() {
  return <SharedDigitalTwinViewer mode="owner" />;
}
