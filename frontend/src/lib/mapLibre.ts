import type { Map, MapStyleImageMissingEvent } from "maplibre-gl";

const MAP_MIN_ZOOM = 1.8;

const transparentImage = {
  width: 1,
  height: 1,
  data: new Uint8Array([0, 0, 0, 0]),
};

export function installStyleImageMissingHandler(map: Map) {
  map.on("styleimagemissing", (event: MapStyleImageMissingEvent) => {
    if (!event.id) return;
    if (!map.hasImage(event.id)) {
      map.addImage(event.id, transparentImage);
    }
  });
}

export function configureSingleWorldMap(map: Map) {
  map.setRenderWorldCopies(false);
  map.setMinZoom(MAP_MIN_ZOOM);
}

export function configureNocMap(map: Map) {
  configureSingleWorldMap(map);
  installStyleImageMissingHandler(map);
}
