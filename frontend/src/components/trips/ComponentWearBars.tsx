"use client";

import { Wrench } from "lucide-react";
import { getWearState } from "@/lib/componentWear";
import type { ComponentWearSnapshot } from "@/types/trip";

interface ComponentWearBarsProps {
  items: ComponentWearSnapshot[];
  showDelta?: boolean;
}

export function ComponentWearBars({ items, showDelta = false }: ComponentWearBarsProps) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Wrench className="h-4 w-4" style={{ color: "var(--solana-green)" }} />
        <h2 className="text-sm font-bold tracking-wide">COMPONENT WEAR</h2>
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const state = getWearState(item.percentWorn);
          return (
            <div key={item.id} className="grid grid-cols-[96px_1fr_auto] items-center gap-3 text-xs sm:grid-cols-[120px_1fr_auto]">
              <span className="font-medium text-white/85">{item.name}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={state.pulse ? "h-full rounded-full animate-pulse" : "h-full rounded-full"}
                  style={{
                    width: `${Math.min(100, item.percentWorn)}%`,
                    background: state.color,
                    boxShadow: `0 0 12px ${state.color}55`,
                  }}
                />
              </div>
              <div className="w-[122px] text-right leading-tight">
                <p className="mono font-semibold">{Math.round(item.kmSinceService).toLocaleString("id-ID")}/{item.intervalKm.toLocaleString("id-ID")} km</p>
                <p style={{ color: state.color }}>
                  {Math.round(item.percentWorn)}%
                  {showDelta ? ` +${((item.deltaKmFromTrip / item.intervalKm) * 100).toFixed(2)}%` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
