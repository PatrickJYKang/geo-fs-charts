export interface LatLon {
    lat: number;
    lon: number;
}

export interface DiagramPolygon {
    name?: string;
    type: "runway" | "taxiway" | "apron" | "stand" | "other";
    path: LatLon[];
}

export interface DiagramLine {
    name?: string;
    type: "taxiline" | "border" | "other";
    path: LatLon[];
}

export interface AirportDiagram {
    icao: string;
    center: LatLon;
    polygons: DiagramPolygon[];
    lines: DiagramLine[];
}
