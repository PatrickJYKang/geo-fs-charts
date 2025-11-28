import { AirportDiagram, DiagramLine, DiagramPolygon, LatLon } from "../overlay/model";
import { XpAirportResponse } from "./xplane-client";

export function parseXplaneAirport(src: XpAirportResponse): AirportDiagram {
    const polygons: DiagramPolygon[] = [];
    const lines: DiagramLine[] = [];

    for (const twy of src.taxiways || []) {
        polygons.push({
            type: "taxiway",
            name: twy.name,
            path: mapGeometry(twy.geometry)
        });
    }

    for (const apron of src.aprons || []) {
        polygons.push({
            type: "apron",
            name: apron.name,
            path: mapGeometry(apron.geometry)
        });
    }

    for (const rw of src.runways || []) {
        polygons.push({
            type: "runway",
            name: rw.name || `${rw.designator1}/${rw.designator2}`,
            path: mapGeometry(rw.geometry)
        });
    }

    for (const line of src.lines || []) {
        lines.push({
            type: "taxiline",
            name: line.name,
            path: mapGeometry(line.geometry)
        });
    }

    return {
        icao: src.icao,
        center: { lat: src.lat, lon: src.lon },
        polygons,
        lines
    };
}

function mapGeometry(geom: [number, number][]): LatLon[] {
    return (geom || []).map(([lat, lon]) => ({ lat, lon }));
}
