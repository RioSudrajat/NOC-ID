"use client";

import Map, { Marker, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Star } from "lucide-react";
import type { Workshop } from "@/context/BookingContext";
import { configureNocMap } from "@/lib/mapLibre";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

interface MapLibreMapProps {
  workshops: Workshop[];
}

export default function MapLibreMap({ workshops }: MapLibreMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeWorkshop = workshops.find((workshop) => workshop.id === activeId);

  return (
    <Map
      initialViewState={{ longitude: 118, latitude: -2.5, zoom: 4.3 }}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%", borderRadius: 16 }}
      attributionControl={false}
      renderWorldCopies={false}
      onLoad={(event) => configureNocMap(event.target)}
    >
      {workshops.map((workshop) => {
        const color = workshop.verified ? "#5EEAD4" : "#FCD34D";
        return (
          <Marker
            key={workshop.id}
            longitude={workshop.coordinates.lng}
            latitude={workshop.coordinates.lat}
            anchor="center"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setActiveId(workshop.id);
            }}
          >
            <button
              aria-label={`Lihat ${workshop.name}`}
              className="h-4 w-4 rounded-full border-2 cursor-pointer transition-transform hover:scale-125"
              style={{
                background: color,
                borderColor: `${color}80`,
                boxShadow: `0 0 12px ${color}80, 0 0 24px ${color}30`,
              }}
            />
          </Marker>
        );
      })}

      {activeWorkshop && (
        <Popup
          longitude={activeWorkshop.coordinates.lng}
          latitude={activeWorkshop.coordinates.lat}
          closeButton
          closeOnClick={false}
          onClose={() => setActiveId(null)}
          className="noc-map-popup"
          maxWidth="240px"
        >
          <div className="min-w-[190px] text-white">
            <p className="mb-1 text-sm font-semibold">{activeWorkshop.name}</p>
            <div className="mb-2 flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-yellow-300" />
              <span className="text-xs font-semibold text-yellow-300">{activeWorkshop.rating}</span>
              <span className="text-[10px] text-white/45">({activeWorkshop.totalReviews} review)</span>
            </div>
            <div className="mb-2 flex flex-wrap gap-1">
              {activeWorkshop.badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px]"
                  style={{
                    background: badge === "Pending KYC" ? "rgba(252, 211, 77, 0.12)" : "rgba(94, 234, 212, 0.12)",
                    borderColor: badge === "Pending KYC" ? "rgba(252, 211, 77, 0.25)" : "rgba(94, 234, 212, 0.25)",
                    color: badge === "Pending KYC" ? "#FCD34D" : "#5EEAD4",
                  }}
                >
                  {badge.includes("Verified") ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
                  {badge.includes("OEM") ? <ShieldCheck className="h-2.5 w-2.5" /> : null}
                  {badge}
                </span>
              ))}
            </div>
            <p className="mb-3 text-[10px] text-white/45">{activeWorkshop.specialization}</p>
            <Link
              href={`/dapp/book/${activeWorkshop.id}`}
              className="block rounded-lg px-3 py-2 text-center text-xs font-semibold text-slate-950"
              style={{ background: "#5EEAD4" }}
            >
              Lihat Profil
            </Link>
          </div>
        </Popup>
      )}
    </Map>
  );
}
