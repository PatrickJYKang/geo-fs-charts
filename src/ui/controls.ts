import { LeafletMap, findNavPanelMap } from "../core/map-access";
import { fetchAirport } from "../data/xplane-client";
import { parseXplaneAirport } from "../data/xplane-parser";
import { createDiagramLayer, DiagramLayer } from "../overlay/leaflet-layer";
import { clearDiagram, getState, setActiveDiagram } from "./state";
import { logDebug, logError, logInfo } from "../core/logger";

let activeLayer: DiagramLayer | null = null;
const SCOPE = "controls";

export function initTaxiChartControl(): void {
    const map = findNavPanelMap();
    if (!map) {
        logError(SCOPE, "init:no-map");
        return;
    }

    const panel = document.querySelector(".geofs-map-list");
    if (!panel) {
        logError(SCOPE, "init:no-panel");
        return;
    }

    if (panel.querySelector(".geofs-taxi-chart")) {
        logDebug(SCOPE, "init:already-present");
        return;
    }

    const btn = document.createElement("div");
    btn.className = "geofs-flightPlan-pad control-pad geofs-taxi-chart";
    btn.style.bottom = "90px";
    btn.innerHTML = `<div class="control-pad-label transp-pad">TAXI CHART</div>`;
    btn.onclick = () => toggleTaxiChart(map);
    panel.appendChild(btn);
    logInfo(SCOPE, "init:button-added");
}

async function toggleTaxiChart(map: LeafletMap): Promise<void> {
    if (activeLayer) {
        logInfo(SCOPE, "toggle:remove");
        activeLayer.remove();
        activeLayer = null;
        clearDiagram();
        return;
    }

    const icao = getCurrentAirportICAO();
    if (!icao) {
        logError(SCOPE, "toggle:no-icao");
        return;
    }

    const src = await fetchAirport(icao);
    if (!src) {
        logError(SCOPE, "toggle:no-data", { icao });
        return;
    }

    const diagram = parseXplaneAirport(src);
    const L = (window as any).L;
    activeLayer = createDiagramLayer(diagram, L);
    activeLayer.addTo(map);
    setActiveDiagram(icao, diagram);
    logInfo(SCOPE, "toggle:added", { icao });
}

function getCurrentAirportICAO(): string | null {
    const state = getState();
    if (state.icao) return state.icao;
    const input = prompt("ICAO for taxi chart?", "KLAX");
    logDebug(SCOPE, "prompt", { input });
    return input;
}
