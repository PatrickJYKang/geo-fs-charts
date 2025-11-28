import { LeafletMap, findNavPanelMap } from "../core/map-access";
import { fetchAirport } from "../data/xplane-client";
import { parseXplaneAirport } from "../data/xplane-parser";
import { createDiagramLayer, DiagramLayer } from "../overlay/leaflet-layer";
import { clearDiagram, getState, setActiveDiagram } from "./state";

let activeLayer: DiagramLayer | null = null;

export function initTaxiChartControl(): void {
    const map = findNavPanelMap();
    if (!map) return;

    const panel = document.querySelector(".geofs-map-list");
    if (!panel) return;

    if (panel.querySelector(".geofs-taxi-chart")) return;

    const btn = document.createElement("div");
    btn.className = "geofs-flightPlan-pad control-pad geofs-taxi-chart";
    btn.style.bottom = "90px";
    btn.innerHTML = `<div class="control-pad-label transp-pad">TAXI CHART</div>`;
    btn.onclick = () => toggleTaxiChart(map);
    panel.appendChild(btn);
}

async function toggleTaxiChart(map: LeafletMap): Promise<void> {
    if (activeLayer) {
        activeLayer.remove();
        activeLayer = null;
        clearDiagram();
        return;
    }

    const icao = getCurrentAirportICAO();
    if (!icao) return;

    const src = await fetchAirport(icao);
    if (!src) return;

    const diagram = parseXplaneAirport(src);
    const L = (window as any).L;
    activeLayer = createDiagramLayer(diagram, L);
    activeLayer.addTo(map);
    setActiveDiagram(icao, diagram);
}

function getCurrentAirportICAO(): string | null {
    const state = getState();
    if (state.icao) return state.icao;
    return prompt("ICAO for taxi chart?", "KLAX");
}
