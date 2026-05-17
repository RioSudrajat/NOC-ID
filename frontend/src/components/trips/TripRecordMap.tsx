"use client";

import { useEffect, useRef } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapRef } from "react-map-gl/maplibre";
import type { Feature, LineString } from "geojson";
import { LocateFixed } from "lucide-react";
import type { TripPoint } from "@/types/trip";
import { configureNocMap } from "@/lib/mapLibre";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";
const DEFAULT_VIEW = { lat: -6.9147, lng: 107.6098 };

interface TripRecordMapProps {
  route: TripPoint[];
}

export function TripRecordMap({ route }: TripRecordMapProps) {
  const safeRoute = Array.isArray(route) ? route : [];
  const mapRef = useRef<MapRef | null>(null);
  const previousLength = useRef(safeRoute.length);
  const current = safeRoute[safeRoute.length - 1] ?? DEFAULT_VIEW;
  const hasPosition = safeRoute.length > 0;
  const line: Feature<LineString> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: safeRoute.map((point) => [point.lng, point.lat]),
    },
  };

  const centerOnCurrent = () => {
    if (!hasPosition) return;
    mapRef.current?.flyTo({
      center: [current.lng, current.lat],
      zoom: 14,
      duration: 700,
    });
  };

  useEffect(() => {
    if (safeRoute.length === 1 && previousLength.current === 0) {
      centerOnCurrent();
    }
    previousLength.current = safeRoute.length;
  });

  return (
    <>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: current.lng, latitude: current.lat, zoom: 12 }}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        renderWorldCopies={false}
        onLoad={(event) => configureNocMap(event.target)}
      >
        {safeRoute.length > 1 ? (
          <Source id="trip-route" type="geojson" data={line}>
            <Layer
              id="trip-route-line"
              type="line"
              paint={{
                "line-color": "#5EEAD4",
                "line-width": 5,
                "line-opacity": 0.9,
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </Source>
        ) : null}
        {hasPosition ? (
          <Marker longitude={current.lng} latitude={current.lat} anchor="center">
            <div className="h-5 w-5 rounded-full border-4 border-slate-950 bg-teal-300 shadow-[0_0_24px_rgba(94,234,212,0.9)]" />
          </Marker>
        ) : null}
      </Map>
      <button
        type="button"
        onClick={centerOnCurrent}
        disabled={!hasPosition}
        className="absolute right-4 top-20 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-teal-300/25 bg-[#0B111A]/90 text-teal-200 shadow-2xl transition-colors hover:bg-teal-300/15 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Center map on current position"
      >
        <LocateFixed className="h-5 w-5" />
      </button>
    </>
  );
}
