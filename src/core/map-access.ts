export interface LeafletMap {
    options: any;
    _layers: Record<string, any>;
    _container: HTMLElement;
    setMaxZoom?(z: number): void;
    whenReady(cb: () => void): void;
    eachLayer(cb: (layer: any) => void): void;
    zoomControl?: { _updateDisabled?: () => void };
}

export function findNavPanelMap(): LeafletMap | null {
    const seen = new Set<any>();
    let result: LeafletMap | null = null;

    function hunt(obj: any) {
        if (!obj || typeof obj !== "object" || seen.has(obj) || result) return;
        seen.add(obj);

        if ("_zoom" in obj &&
            typeof obj.setZoom === "function" &&
            typeof obj.getCenter === "function" &&
            (obj._container?.classList?.contains("geofs-map-viewport") ||
             obj._container?.classList?.contains("leaflet-container"))
        ) {
            result = obj;
            return;
        }

        for (const key in obj) {
            try {
                hunt(obj[key]);
                if (result) return;
            } catch (_) {}
        }
    }

    try {
        hunt(window);
    } catch (_) {}

    return result;
}
