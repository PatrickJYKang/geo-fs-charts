export interface OpenAipAirportResponse {
    icao: string;
    // Define when integrating real API
}

export async function fetchOpenAipAirport(_icao: string): Promise<OpenAipAirportResponse | null> {
    // Placeholder for future integration
    return null;
}
