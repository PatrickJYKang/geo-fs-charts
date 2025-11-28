# GeoFS Taxi Chart Overlay – Design Sketch

This project adds **airport taxi charts** to the **GeoFS navigation panel map**, similar to a lightweight EFB, by overlaying vector airport geometry on top of the built-in Leaflet map.

The MVP uses **X-Plane Scenery Gateway** as the sole data source. OpenAIP can be added later as a fallback.

---

## Goals

- Allow deeper zoom in the GeoFS navpanel map (beyond the default max zoom).
- Fetch airport geometry (runways, taxiways, aprons, lines) from a public data source.
- Render that geometry as a Leaflet overlay, aligned with GeoFS’s OSM base map.
- Provide a simple UI toggle: **“TAXI CHART”.**

---

## Architecture Overview

### Core

- `core/map-access.ts`  
  Provides a robust way to locate the **Leaflet map instance** used by the GeoFS navpanel by recursively scanning `window` for objects that look like a Leaflet map and whose container has the `.geofs-map-viewport` / `.leaflet-container` classes.

- `core/zoom-patch.ts`  
  Encapsulates the **zoom unlock** logic:
  - Raises `map.options.maxZoom` to a configurable `TARGET_MAX_ZOOM` (e.g. `18`).
  - Updates `_layersMaxZoom`.
  - Patches each layer’s `options.maxZoom`.
  - Refreshes the zoom control, re-enabling the “+” button.

The zoom patch runs periodically and is independent of the taxi overlay.

### Data

- `data/xplane-client.ts`  
  Talks to the **X-Plane Scenery Gateway API** (no local X-Plane install needed) at:  
  `https://gateway.x-plane.com/api/airports/ICAO`  
  and returns a JSON representation of the airport.

- `data/xplane-parser.ts`  
  Converts the Gateway JSON into an internal `AirportDiagram` structure with:
  - `polygons`: runways, taxiways, aprons, stands
  - `lines`: taxi lines, borders

- `data/openaip-client.ts` (future)  
  Intended as a fallback provider if X-Plane data is missing.

- `data/cache.ts` (optional)  
  Can be used to cache per-ICAO lookups in memory or `localStorage`.

### Overlay

- `overlay/model.ts`  
  Defines `AirportDiagram` and supporting types used by the renderer:

  ```ts
  interface AirportDiagram {
      icao: string;
      center: { lat: number; lon: number };
      polygons: DiagramPolygon[];
      lines: DiagramLine[];
  }
  ```

- `overlay/leaflet-layer.ts`  
  Converts `AirportDiagram` into Leaflet polygons and polylines:
  - Uses `L.layerGroup()` as a container.
  - `createDiagramLayer(diagram, L)` returns an object with `addTo(map)` / `remove()`.

- `overlay/styling.ts`  
  Centralised styling decisions:
  - Runways in darker grey or white.
  - Taxiways in yellow-ish or light grey.
  - Aprons lighter background.
  - Line widths scaled to zoom level if desired.

### UI

- `ui/controls.ts`  
  Injects a “TAXI CHART” button into the existing GeoFS navpanel HTML (next to FLIGHT PLAN). On click:
  1. If a diagram is already displayed, remove it.
  2. Otherwise:
     - Determine current airport ICAO (placeholder: prompt; later: integrate with GeoFS APIs).
     - Fetch from X-Plane Gateway.
     - Parse to `AirportDiagram`.
     - Create Leaflet layer and add it to the map.

- `ui/state.ts` (optional)  
  Can track:
  - Whether taxi chart is currently on/off.
  - ICAO of the currently displayed chart.
  - Future: automatic refresh when aircraft switches airports.

### Entry

- `main.user.ts`  
  The Tampermonkey userscript entry that:
  - Starts the zoom patch via `startZoomPatch()`.
  - Waits until GeoFS UI is present, then calls `initTaxiChartControl()`.

  This file is intended to be bundled with the rest of `src/` into a single `geofs-taxi-charts.user.js`.

### Zoom Script

A separate, standalone userscript `geofs-nav-zoom-only.user.js` is provided for users who only want deeper zoom without any taxi overlays.

It:

- Periodically scans `window` to find the Leaflet map instance used by the navpanel.
- Raises `maxZoom` and per-layer zoom limits to `TARGET_MAX_ZOOM` (default 18).
- Fixes the zoom control UI so the “+” button is usable again.

See `dist/geofs-nav-zoom-only.user.js` (or the code in this repo’s README).

### Future Work

- OpenAIP fallback: If X-Plane has no airport entry or incomplete geometry, try OpenAIP.
- Auto-detect current ICAO: Read nearest airport from GeoFS rather than prompting.
- Better styling: EFB-like colours, labelling taxiways, stands, and holding points.
- Performance: Cache parsed diagrams and avoid re-fetching for repeated visits.

### Notes

- X-Plane Gateway data is extremely detailed and well-suited to a taxi-chart overlay, but you should review their licensing if you intend to redistribute derived material.
- GeoFS’s OSM tiles appear to stop at zoom 13; deeper zoom relies on Leaflet upscaling existing tiles, so visual sharpness will not improve past that level. The overlay, however, remains fully vector and will look crisp at any zoom level.
