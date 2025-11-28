import { findNavPanelMap, LeafletMap } from "./map-access";
import { logDebug, logInfo } from "./logger";

const TARGET_MAX_ZOOM = 18;
const SCOPE = "zoom-patch";

function tweakMap(map: LeafletMap): void {
    if (!map?.options) {
        logDebug(SCOPE, "tweakMap:no-options");
        return;
    }

    if (map.options.maxZoom >= TARGET_MAX_ZOOM) {
        logDebug(SCOPE, "tweakMap:already-max", { current: map.options.maxZoom });
        return;
    }

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

    logInfo(SCOPE, "tweakMap:adjusted", {
        optionsMaxZoom: map.options.maxZoom,
        layersMaxZoom: (map as any)._layersMaxZoom
    });
}

export function startZoomPatch(): void {
    let cached: LeafletMap | null = null;
    logInfo(SCOPE, "startZoomPatch:init", { targetMaxZoom: TARGET_MAX_ZOOM });

    setInterval(() => {
        if (!cached) {
            cached = findNavPanelMap();
            logDebug(SCOPE, "interval:map-hunt", { found: Boolean(cached) });
        }
        if (cached) tweakMap(cached);
    }, 2000);
}
