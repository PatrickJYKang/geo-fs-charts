import { AirportDiagram } from "../overlay/model";
import { logDebug } from "../core/logger";

export interface TaxiChartState {
    active: boolean;
    icao: string | null;
    diagram: AirportDiagram | null;
}

const state: TaxiChartState = {
    active: false,
    icao: null,
    diagram: null
};

export function getState(): TaxiChartState {
    logDebug("state", "get", { active: state.active, icao: state.icao });
    return state;
}

export function setActiveDiagram(icao: string, diagram: AirportDiagram): void {
    state.active = true;
    state.icao = icao;
    state.diagram = diagram;
    logDebug("state", "set", { icao, polygons: diagram.polygons.length, lines: diagram.lines.length });
}

export function clearDiagram(): void {
    state.active = false;
    state.icao = null;
    state.diagram = null;
    logDebug("state", "clear");
}
