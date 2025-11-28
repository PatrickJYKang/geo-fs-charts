import { AirportDiagram } from "./model";
import { LeafletMap } from "../core/map-access";
import { getPolygonStyle, getLineStyle } from "./styling";

export interface DiagramLayer {
    addTo(map: LeafletMap): void;
    remove(): void;
}

export function createDiagramLayer(diagram: AirportDiagram, L: any): DiagramLayer {
    const group = L.layerGroup();

    diagram.polygons.forEach(poly => {
        const latLngs = poly.path.map(p => [p.lat, p.lon]);
        const layer = L.polygon(latLngs, getPolygonStyle(poly));
        group.addLayer(layer);
    });

    diagram.lines.forEach(line => {
        const latLngs = line.path.map(p => [p.lat, p.lon]);
        const layer = L.polyline(latLngs, getLineStyle(line));
        group.addLayer(layer);
    });

    return {
        addTo(map: LeafletMap) {
            group.addTo(map as any);
        },
        remove() {
            group.remove();
        }
    };
}
