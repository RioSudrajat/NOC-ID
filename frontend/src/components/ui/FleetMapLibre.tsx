"use client";

import { useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FleetVehicle } from "@/context/EnterpriseContext";
import { configureNocMap } from "@/lib/mapLibre";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

interface FleetMapLibreProps {
  vehicles: FleetVehicle[];
}

const regionCoordinates: Record<string, { lat: number; lng: number }> = {
  Jakarta: { lat: -6.2, lng: 106.845 },
  Tangerang: { lat: -6.302, lng: 106.652 },
  Bandung: { lat: -6.917, lng: 107.619 },
  Surabaya: { lat: -7.291, lng: 112.738 },
  Semarang: { lat: -6.991, lng: 110.423 },
  Medan: { lat: 3.595, lng: 98.672 },
  Other: { lat: -2.5, lng: 118 },
};

function getHealthColor(health: number) {
  if (health >= 70) return "#86EFAC";
  if (health >= 50) return "#FCD34D";
  return "#FCA5A5";
}

export default function FleetMapLibre({ vehicles }: FleetMapLibreProps) {
  const [activeVin, setActiveVin] = useState<string | null>(null);
  const activeVehicle = vehicles.find((vehicle) => vehicle.vin === activeVin);
  const activeIndex = activeVehicle ? vehicles.findIndex((vehicle) => vehicle.vin === activeVehicle.vin) : -1;
  const activeRegion = activeVehicle ? regionCoordinates[activeVehicle.region] ?? regionCoordinates.Other : null;
  const activeOffset = activeIndex >= 0 ? activeIndex * 0.015 : 0;

  return (
    <Map
      initialViewState={{ longitude: 118, latitude: -2.5, zoom: 4.2 }}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%", borderRadius: 16 }}
      attributionControl={false}
      renderWorldCopies={false}
      onLoad={(event) => configureNocMap(event.target)}
    >
      {vehicles.map((vehicle, index) => {
        const coords = regionCoordinates[vehicle.region] ?? regionCoordinates.Other;
        const offset = index * 0.015;
        const color = getHealthColor(vehicle.health);
        return (
          <Marker
            key={`${vehicle.vin}-${index}`}
            longitude={coords.lng + offset * Math.cos(index)}
            latitude={coords.lat + offset * Math.sin(index)}
            anchor="center"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setActiveVin(vehicle.vin);
            }}
          >
            <button
              aria-label={`Lihat ${vehicle.name}`}
              className="h-3.5 w-3.5 rounded-full border-2 cursor-pointer transition-transform hover:scale-125"
              style={{
                background: color,
                borderColor: `${color}80`,
                boxShadow: `0 0 10px ${color}70, 0 0 20px ${color}30`,
              }}
            />
          </Marker>
        );
      })}

      {activeVehicle && activeRegion && (
        <Popup
          longitude={activeRegion.lng + activeOffset * Math.cos(activeIndex)}
          latitude={activeRegion.lat + activeOffset * Math.sin(activeIndex)}
          closeOnClick={false}
          onClose={() => setActiveVin(null)}
          className="noc-map-popup"
          maxWidth="260px"
        >
          <div className="min-w-[210px] text-white">
            <p className="mb-0.5 text-sm font-bold">{activeVehicle.name}</p>
            <p className="mono mb-2 text-[10px] text-white/45">{activeVehicle.vin}</p>
            {[
              ["Health Score", activeVehicle.health],
              ["Region", activeVehicle.region],
              ["Mileage", activeVehicle.mileage],
            ].map(([label, value]) => (
              <div key={label} className="mb-1 flex justify-between gap-4 text-xs">
                <span className="text-white/50">{label}</span>
                <span className="font-semibold" style={{ color: label === "Health Score" ? getHealthColor(activeVehicle.health) : undefined }}>
                  {value}
                </span>
              </div>
            ))}
            <div className="mt-1 flex justify-between gap-4 text-xs">
              <span className="text-white/50">Owner</span>
              <span className="mono text-[10px]" style={{ color: "var(--solana-purple)" }}>
                {activeVehicle.owner.slice(0, 8)}...
              </span>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  );
}
