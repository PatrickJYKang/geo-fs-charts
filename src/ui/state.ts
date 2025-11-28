import { AirportDiagram } from "../overlay/model";

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
    return state;
}

export function setActiveDiagram(icao: string, diagram: AirportDiagram): void {
    state.active = true;
    state.icao = icao;
    state.diagram = diagram;
}

export function clearDiagram(): void {
    state.active = false;
    state.icao = null;
    state.diagram = null;
}
