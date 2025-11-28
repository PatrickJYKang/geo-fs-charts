import { AirportDiagram } from "./model";
import { LeafletMap } from "../core/map-access";
import { getPolygonStyle, getLineStyle } from "./styling";
import { logDebug } from "../core/logger";

export interface DiagramLayer {
    addTo(map: LeafletMap): void;
    remove(): void;
}

export function createDiagramLayer(diagram: AirportDiagram, L: any): DiagramLayer {
    const group = L.layerGroup();

    logDebug("leaflet-layer", "create", {
        icao: diagram.icao,
        polygons: diagram.polygons.length,
        lines: diagram.lines.length
    });

    diagram.polygons.forEach(poly => {
        const latLngs = poly.path.map(p => [p.lat, p.lon]);
        const style = getPolygonStyle(poly);
        logDebug("leaflet-layer", "polygon", { type: poly.type, name: poly.name, points: latLngs.length });
        const layer = L.polygon(latLngs, style);
        group.addLayer(layer);
    });

    diagram.lines.forEach(line => {
        const latLngs = line.path.map(p => [p.lat, p.lon]);
        const style = getLineStyle(line);
        logDebug("leaflet-layer", "line", { type: line.type, name: line.name, points: latLngs.length });
        const layer = L.polyline(latLngs, style);
        group.addLayer(layer);
    });

    return {
        addTo(map: LeafletMap) {
            logDebug("leaflet-layer", "addTo", { mapHasZoom: Boolean(map.setMaxZoom) });
            group.addTo(map as any);
        },
        remove() {
            logDebug("leaflet-layer", "remove");
            group.remove();
        }
    };
}
