import { AirportDiagram, DiagramLine, DiagramPolygon, LatLon } from "../overlay/model";
import { logDebug, logWarn } from "../core/logger";
import { XpAirportResponse } from "./xplane-client";

const SCOPE = "xplane-parser";

export function parseXplaneAirport(src: XpAirportResponse): AirportDiagram {
    const polygons: DiagramPolygon[] = [];
    const lines: DiagramLine[] = [];

    logDebug(SCOPE, "parse:start", {
        icao: src.icao,
        runwayCount: src.runways?.length,
        taxiwayCount: src.taxiways?.length,
        apronCount: src.aprons?.length,
        lineCount: src.lines?.length
    });

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

    const diagram: AirportDiagram = {
        icao: src.icao,
        center: { lat: src.lat, lon: src.lon },
        polygons,
        lines
    };

    logDebug(SCOPE, "parse:complete", {
        icao: src.icao,
        polygons: polygons.length,
        lines: lines.length
    });

    return diagram;
}

function mapGeometry(geom: [number, number][]): LatLon[] {
    if (!Array.isArray(geom)) {
        logWarn(SCOPE, "mapGeometry:invalid", { geom });
        return [];
    }
    return (geom || []).map(([lat, lon]) => ({ lat, lon }));
}
