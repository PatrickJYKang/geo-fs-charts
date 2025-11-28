import { DiagramLine, DiagramPolygon } from "./model";

export function getPolygonStyle(poly: DiagramPolygon): any {
    switch (poly.type) {
        case "runway":
            return {
                color: "#d9d9d9",
                weight: 1,
                fillColor: "#bfbfbf",
                fillOpacity: 0.5
            };
        case "taxiway":
            return {
                color: "#ffee99",
                weight: 1,
                fillColor: "#ffee66",
                fillOpacity: 0.4
            };
        case "apron":
            return {
                color: "#cccccc",
                weight: 1,
                fillColor: "#f0f0f0",
                fillOpacity: 0.3
            };
        default:
            return {
                color: "#ffffff",
                weight: 1,
                fillOpacity: 0.2
            };
    }
}

export function getLineStyle(line: DiagramLine): any {
    switch (line.type) {
        case "taxiline":
            return {
                color: "#ffcc33",
                weight: 2,
                opacity: 0.9
            };
        case "border":
            return {
                color: "#ffffff",
                weight: 1,
                opacity: 0.6
            };
        default:
            return {
                color: "#cccccc",
                weight: 1,
                opacity: 0.5
            };
    }
}
