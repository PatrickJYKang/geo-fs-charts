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

    const res = await fetch(url);
    if (!res.ok) return null;

    return res.json();
}
