import { findNavPanelMap, LeafletMap } from "./map-access";

const TARGET_MAX_ZOOM = 18;

function tweakMap(map: LeafletMap): void {
    if (!map.options) return;

    if (map.options.maxZoom >= TARGET_MAX_ZOOM) return;

    map.options.maxZoom = TARGET_MAX_ZOOM;
    if (map.setMaxZoom) map.setMaxZoom(TARGET_MAX_ZOOM);

    if ((map as any)._layersMaxZoom == null || (map as any)._layersMaxZoom < TARGET_MAX_ZOOM) {
        (map as any)._layersMaxZoom = TARGET_MAX_ZOOM;
    }

    Object.values((map as any)._layers || {}).forEach((layer: any) => {
        if (layer?.options?.maxZoom != null && layer.options.maxZoom < TARGET_MAX_ZOOM) {
            layer.options.maxZoom = TARGET_MAX_ZOOM;
        }
    });

    if (map.zoomControl?.["_updateDisabled"]) {
        map.zoomControl._updateDisabled();
    } else {
        const zoomIn = map._container.querySelector(".leaflet-control-zoom-in");
        if (zoomIn) zoomIn.classList.remove("leaflet-disabled");
    }
}

export function startZoomPatch(): void {
    let cached: LeafletMap | null = null;

    setInterval(() => {
        if (!cached) {
            cached = findNavPanelMap();
        }
        if (cached) tweakMap(cached);
    }, 2000);
}
