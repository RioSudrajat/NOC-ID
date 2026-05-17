"use client";

import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapRef } from "react-map-gl/maplibre";
import type { Feature, LineString } from "geojson";
import type { TripPoint } from "@/types/trip";
import { configureNocMap } from "@/lib/mapLibre";
import { useEffect, useMemo, useRef } from "react";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

interface TripDetailMapProps {
  route: TripPoint[];
}

export function TripDetailMap({ route }: TripDetailMapProps) {
  const safeRoute = useMemo(() => Array.isArray(route) ? route : [], [route]);
  const mapRef = useRef<MapRef | null>(null);
  const first = safeRoute[0] ?? { lat: -6.2088, lng: 106.8456 };
  const last = safeRoute[safeRoute.length - 1] ?? first;
  const center = {
    lat: (first.lat + last.lat) / 2,
    lng: (first.lng + last.lng) / 2,
  };
  const line: Feature<LineString> = {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: safeRoute.map((point) => [point.lng, point.lat]) },
  };

  useEffect(() => {
    if (!mapRef.current || safeRoute.length < 2) return;
    const lngs = safeRoute.map((point) => point.lng);
    const lats = safeRoute.map((point) => point.lat);
    mapRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 64, duration: 0 },
    );
  }, [safeRoute]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: 12 }}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%", borderRadius: 16 }}
      attributionControl={false}
      renderWorldCopies={false}
      onLoad={(event) => configureNocMap(event.target)}
    >
      {safeRoute.length > 1 ? (
        <Source id="detail-route" type="geojson" data={line}>
          <Layer
            id="detail-route-line"
            type="line"
            paint={{ "line-color": "#5EEAD4", "line-width": 5, "line-opacity": 0.9 }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
        </Source>
      ) : null}
      <Marker longitude={first.lng} latitude={first.lat} anchor="center">
        <div className="h-4 w-4 rounded-full border-2 border-slate-950 bg-emerald-300" />
      </Marker>
      <Marker longitude={last.lng} latitude={last.lat} anchor="center">
        <div className="h-4 w-4 rounded-full border-2 border-slate-950 bg-rose-300" />
      </Marker>
    </Map>
  );
}
