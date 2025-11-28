import { logDebug, logError } from "../core/logger";

const SCOPE = "xplane-client";

export interface XpAirportResponse {
    icao: string;
    lat: number;
    lon: number;
    runways: any[];
    taxiways: any[];
    aprons: any[];
    lines: any[];
}

const BASE_URL = "https://gateway.x-plane.com/api";

export async function fetchAirport(icao: string): Promise<XpAirportResponse | null> {
    const code = icao.trim().toUpperCase();
    const url = `${BASE_URL}/airports/${encodeURIComponent(code)}`;

    logDebug(SCOPE, "fetchAirport:request", { icao: code, url });

    const res = await fetch(url);
    if (!res.ok) {
        logError(SCOPE, "fetchAirport:http-error", { status: res.status, statusText: res.statusText });
        return null;
    }

    const data = await res.json();
    logDebug(SCOPE, "fetchAirport:success", { icao: code, runways: data?.runways?.length, taxiways: data?.taxiways?.length });
    return data;
}
