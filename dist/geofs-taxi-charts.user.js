// ==UserScript==
// @name         GeoFS Taxi Charts Overlay
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Unlock navpanel zoom and overlay taxi charts from X-Plane Gateway
// @author       You
// @match        https://geo-fs.com/*
// @match        https://*.geo-fs.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /********************
     * Logger
     *******************/
    const LOGGER_PREFIX = '[GeoFSTaxi]';
    const LOGGER_FLAG = 'geofsTaxiDebug';

    function shouldLog() {
        try {
            if (typeof window === 'undefined') return true;
            const flag = window[LOGGER_FLAG];
            return flag === undefined ? true : Boolean(flag);
        } catch (err) {
            console.warn(`${LOGGER_PREFIX}[logger] flag check failed`, err);
            return true;
        }
    }

    function makeLogFn(level) {
        return (scope, ...args) => {
            if (!shouldLog()) return;
            const method = console[level] || console.log;
            method.call(console, `${LOGGER_PREFIX}[${scope}]`, ...args);
        };
    }

    const logDebug = makeLogFn('debug');
    const logInfo = makeLogFn('info');
    const logWarn = makeLogFn('warn');
    const logError = makeLogFn('error');

    /********************
     * GeoFS Env Helpers
     *******************/
    const ENV_SCOPE = 'geofs-env';

    function isGeoFs() {
        const match = typeof window !== 'undefined' && /geo-fs\.com/i.test(window.location.hostname);
        logDebug(ENV_SCOPE, 'isGeoFs', { hostname: typeof window !== 'undefined' ? window.location.hostname : '<no-window>', match });
        return match;
    }

    function waitForGeoFsUi(selector, intervalMs = 500) {
        logDebug(ENV_SCOPE, 'waitForGeoFsUi:start', { selector, intervalMs });
        return new Promise(resolve => {
            const handle = setInterval(() => {
                const el = document.querySelector(selector);
                if (!el) {
                    logDebug(ENV_SCOPE, 'waitForGeoFsUi:poll', { selector, found: false });
                    return;
                }
                clearInterval(handle);
                logDebug(ENV_SCOPE, 'waitForGeoFsUi:found', { selector });
                resolve(el);
            }, intervalMs);
        });
    }

    /********************
     * Map Access
     *******************/
    const MAP_SCOPE = 'map-access';

    function findNavPanelMap() {
        const seen = new Set();
        let result = null;

        function hunt(obj) {
            if (!obj || typeof obj !== 'object' || seen.has(obj) || result) return;
            seen.add(obj);

            if ('_zoom' in obj &&
                typeof obj.setZoom === 'function' &&
                typeof obj.getCenter === 'function' &&
                (obj._container?.classList?.contains('geofs-map-viewport') ||
                 obj._container?.classList?.contains('leaflet-container'))
            ) {
                result = obj;
                return;
            }

            for (const key in obj) {
                try {
                    hunt(obj[key]);
                    if (result) return;
                } catch (err) {
                    logWarn(MAP_SCOPE, 'hunt:error', { key, err });
                }
            }
        }

        try {
            hunt(window);
        } catch (err) {
            logWarn(MAP_SCOPE, 'findNavPanelMap:globalError', err);
        }

        if (result) {
            logDebug(MAP_SCOPE, 'findNavPanelMap:found', result);
        } else {
            logDebug(MAP_SCOPE, 'findNavPanelMap:not-found');
        }

        return result;
    }

    /********************
     * Zoom Patch
     *******************/
    const TARGET_MAX_ZOOM = 18;
    const ZOOM_SCOPE = 'zoom-patch';

    function tweakMap(map) {
        if (!map?.options) {
            logDebug(ZOOM_SCOPE, 'tweakMap:no-options');
            return;
        }

        if (map.options.maxZoom >= TARGET_MAX_ZOOM) {
            logDebug(ZOOM_SCOPE, 'tweakMap:already-max', { current: map.options.maxZoom });
            return;
        }

        map.options.maxZoom = TARGET_MAX_ZOOM;
        if (typeof map.setMaxZoom === 'function') {
            map.setMaxZoom(TARGET_MAX_ZOOM);
        }

        if (map._layersMaxZoom == null || map._layersMaxZoom < TARGET_MAX_ZOOM) {
            map._layersMaxZoom = TARGET_MAX_ZOOM;
        }

        Object.values(map._layers || {}).forEach(layer => {
            if (layer?.options?.maxZoom != null && layer.options.maxZoom < TARGET_MAX_ZOOM) {
                layer.options.maxZoom = TARGET_MAX_ZOOM;
            }
        });

        if (map.zoomControl?._updateDisabled) {
            map.zoomControl._updateDisabled();
        } else {
            const zoomIn = map._container?.querySelector('.leaflet-control-zoom-in');
            if (zoomIn) zoomIn.classList.remove('leaflet-disabled');
        }

        logInfo(ZOOM_SCOPE, 'tweakMap:adjusted', {
            optionsMaxZoom: map.options.maxZoom,
            layersMaxZoom: map._layersMaxZoom
        });
    }

    function startZoomPatch() {
        let cached = null;
        logInfo(ZOOM_SCOPE, 'startZoomPatch:init', { targetMaxZoom: TARGET_MAX_ZOOM });

        setInterval(() => {
            if (!cached) {
                cached = findNavPanelMap();
                logDebug(ZOOM_SCOPE, 'interval:map-hunt', { found: Boolean(cached) });
            }
            if (cached) tweakMap(cached);
        }, 2000);
    }

    /********************
     * Cache
     *******************/
    const CACHE_SCOPE = 'cache';
    const memoryCache = new Map();
    const CACHE_TTL = 1000 * 60 * 10;

    function getCached(key) {
        const now = Date.now();
        const entry = memoryCache.get(key);
        if (entry && now - entry.timestamp < CACHE_TTL) {
            logDebug(CACHE_SCOPE, 'hit:memory', { key });
            return entry.value;
        }

        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (now - parsed.timestamp < CACHE_TTL) {
                    memoryCache.set(key, parsed);
                    logDebug(CACHE_SCOPE, 'hit:localStorage', { key });
                    return parsed.value;
                }
            }
        } catch (err) {
            logWarn(CACHE_SCOPE, 'localStorage:error', err);
        }

        logDebug(CACHE_SCOPE, 'miss', { key });
        return null;
    }

    function setCached(key, value) {
        const entry = { value, timestamp: Date.now() };
        memoryCache.set(key, entry);
        logDebug(CACHE_SCOPE, 'set', { key });
        try {
            localStorage.setItem(key, JSON.stringify(entry));
        } catch (err) {
            logWarn(CACHE_SCOPE, 'localStorage:set-error', err);
        }
    }

    /********************
     * X-Plane Client & Parser
     *******************/
    const XPLANE_SCOPE = 'xplane-client';
    const BASE_URL = 'https://gateway.x-plane.com/api';

    async function fetchAirport(icao) {
        const code = (icao || '').trim().toUpperCase();
        if (!code) {
            logWarn(XPLANE_SCOPE, 'fetchAirport:missing-icao');
            return null;
        }

        const cacheKey = `xp:${code}`;
        const cached = getCached(cacheKey);
        if (cached) {
            logInfo(XPLANE_SCOPE, 'fetchAirport:cache-hit', { icao: code });
            return cached;
        }

        const url = `${BASE_URL}/airports/${encodeURIComponent(code)}`;
        logDebug(XPLANE_SCOPE, 'fetchAirport:request', { icao: code, url });

        try {
            const res = await fetch(url);
            if (!res.ok) {
                logError(XPLANE_SCOPE, 'fetchAirport:http-error', { status: res.status, statusText: res.statusText });
                return null;
            }
            const data = await res.json();
            setCached(cacheKey, data);
            logDebug(XPLANE_SCOPE, 'fetchAirport:success', {
                icao: code,
                runways: data?.runways?.length,
                taxiways: data?.taxiways?.length
            });
            return data;
        } catch (err) {
            logError(XPLANE_SCOPE, 'fetchAirport:exception', err);
            return null;
        }
    }

    const PARSER_SCOPE = 'xplane-parser';

    function mapGeometry(geom) {
        if (!Array.isArray(geom)) {
            logWarn(PARSER_SCOPE, 'mapGeometry:invalid', { geom });
            return [];
        }
        return geom.map(([lat, lon]) => ({ lat, lon }));
    }

    function parseXplaneAirport(src) {
        if (!src) return null;

        const polygons = [];
        const lines = [];

        logDebug(PARSER_SCOPE, 'parse:start', {
            icao: src.icao,
            runwayCount: src.runways?.length,
            taxiwayCount: src.taxiways?.length,
            apronCount: src.aprons?.length,
            lineCount: src.lines?.length
        });

        (src.taxiways || []).forEach(twy => {
            polygons.push({
                type: 'taxiway',
                name: twy.name,
                path: mapGeometry(twy.geometry)
            });
        });

        (src.aprons || []).forEach(apron => {
            polygons.push({
                type: 'apron',
                name: apron.name,
                path: mapGeometry(apron.geometry)
            });
        });

        (src.runways || []).forEach(rw => {
            polygons.push({
                type: 'runway',
                name: rw.name || `${rw.designator1}/${rw.designator2}`,
                path: mapGeometry(rw.geometry)
            });
        });

        (src.lines || []).forEach(line => {
            lines.push({
                type: 'taxiline',
                name: line.name,
                path: mapGeometry(line.geometry)
            });
        });

        const diagram = {
            icao: src.icao,
            center: { lat: src.lat, lon: src.lon },
            polygons,
            lines
        };

        logDebug(PARSER_SCOPE, 'parse:complete', {
            icao: src.icao,
            polygons: polygons.length,
            lines: lines.length
        });

        return diagram;
    }

    /********************
     * Styling & Layer Assembly
     *******************/
    const STYLING_SCOPE = 'styling';

    function getPolygonStyle(poly) {
        logDebug(STYLING_SCOPE, 'polygon', { type: poly.type, name: poly.name, points: poly.path.length });
        switch (poly.type) {
            case 'runway':
                return { color: '#d9d9d9', weight: 1, fillColor: '#bfbfbf', fillOpacity: 0.5 };
            case 'taxiway':
                return { color: '#ffee99', weight: 1, fillColor: '#ffee66', fillOpacity: 0.4 };
            case 'apron':
                return { color: '#cccccc', weight: 1, fillColor: '#f0f0f0', fillOpacity: 0.3 };
            default:
                return { color: '#ffffff', weight: 1, fillOpacity: 0.2 };
        }
    }

    function getLineStyle(line) {
        logDebug(STYLING_SCOPE, 'line', { type: line.type, name: line.name, points: line.path.length });
        switch (line.type) {
            case 'taxiline':
                return { color: '#ffcc33', weight: 2, opacity: 0.9 };
            case 'border':
                return { color: '#ffffff', weight: 1, opacity: 0.6 };
            default:
                return { color: '#cccccc', weight: 1, opacity: 0.5 };
        }
    }

    const LAYER_SCOPE = 'leaflet-layer';

    function createDiagramLayer(diagram, L) {
        const group = L.layerGroup();

        logDebug(LAYER_SCOPE, 'create', {
            icao: diagram.icao,
            polygons: diagram.polygons.length,
            lines: diagram.lines.length
        });

        diagram.polygons.forEach(poly => {
            const latLngs = poly.path.map(p => [p.lat, p.lon]);
            const style = getPolygonStyle(poly);
            logDebug(LAYER_SCOPE, 'polygon', { type: poly.type, name: poly.name, points: latLngs.length });
            const layer = L.polygon(latLngs, style);
            group.addLayer(layer);
        });

        diagram.lines.forEach(line => {
            const latLngs = line.path.map(p => [p.lat, p.lon]);
            const style = getLineStyle(line);
            logDebug(LAYER_SCOPE, 'line', { type: line.type, name: line.name, points: latLngs.length });
            const layer = L.polyline(latLngs, style);
            group.addLayer(layer);
        });

        return {
            addTo(map) {
                logDebug(LAYER_SCOPE, 'addTo', { mapHasZoom: Boolean(map?.setMaxZoom) });
                group.addTo(map);
            },
            remove() {
                logDebug(LAYER_SCOPE, 'remove');
                group.remove();
            }
        };
    }

    /********************
     * UI State & Controls
     *******************/
    const STATE_SCOPE = 'state';
    const state = { active: false, icao: null, diagram: null };

    function getState() {
        logDebug(STATE_SCOPE, 'get', { active: state.active, icao: state.icao });
        return state;
    }

    function setActiveDiagram(icao, diagram) {
        state.active = true;
        state.icao = icao;
        state.diagram = diagram;
        logDebug(STATE_SCOPE, 'set', { icao, polygons: diagram.polygons.length, lines: diagram.lines.length });
    }

    function clearDiagram() {
        state.active = false;
        state.icao = null;
        state.diagram = null;
        logDebug(STATE_SCOPE, 'clear');
    }

    const CONTROLS_SCOPE = 'controls';
    let activeLayer = null;

    function initTaxiChartControl() {
        const map = findNavPanelMap();
        if (!map) {
            logError(CONTROLS_SCOPE, 'init:no-map');
            return;
        }

        const panel = document.querySelector('.geofs-map-list');
        if (!panel) {
            logError(CONTROLS_SCOPE, 'init:no-panel');
            return;
        }

        if (panel.querySelector('.geofs-taxi-chart')) {
            logDebug(CONTROLS_SCOPE, 'init:already-present');
            return;
        }

        const btn = document.createElement('div');
        btn.className = 'geofs-flightPlan-pad control-pad geofs-taxi-chart';
        btn.style.bottom = '90px';
        btn.innerHTML = '<div class="control-pad-label transp-pad">TAXI CHART</div>';
        btn.onclick = () => toggleTaxiChart(map);
        panel.appendChild(btn);
        logInfo(CONTROLS_SCOPE, 'init:button-added');
    }

    async function toggleTaxiChart(map) {
        if (activeLayer) {
            logInfo(CONTROLS_SCOPE, 'toggle:remove');
            activeLayer.remove();
            activeLayer = null;
            clearDiagram();
            return;
        }

        const icao = getCurrentAirportICAO();
        if (!icao) {
            logError(CONTROLS_SCOPE, 'toggle:no-icao');
            return;
        }

        const src = await fetchAirport(icao);
        if (!src) {
            logError(CONTROLS_SCOPE, 'toggle:no-data', { icao });
            return;
        }

        const diagram = parseXplaneAirport(src);
        if (!diagram) {
            logError(CONTROLS_SCOPE, 'toggle:parse-failed', { icao });
            return;
        }

        const L = window.L;
        if (!L) {
            logError(CONTROLS_SCOPE, 'toggle:no-leaflet');
            return;
        }

        activeLayer = createDiagramLayer(diagram, L);
        activeLayer.addTo(map);
        setActiveDiagram(icao, diagram);
        logInfo(CONTROLS_SCOPE, 'toggle:added', { icao });
    }

    function getCurrentAirportICAO() {
        const current = getState();
        if (current.icao) return current.icao;
        const input = prompt('ICAO for taxi chart?', 'KLAX');
        logDebug(CONTROLS_SCOPE, 'prompt', { input });
        return input;
    }

    /********************
     * Entry Point
     *******************/
    (function bootstrap() {
        if (!isGeoFs()) {
            logWarn('main', 'not on GeoFS domain, aborting');
            return;
        }

        logInfo('main', 'bootstrap:start');
        startZoomPatch();

        const interval = setInterval(() => {
            const panel = document.querySelector('.geofs-map-list');
            if (!panel) return;
            clearInterval(interval);
            logInfo('main', 'ui:ready');
            initTaxiChartControl();
        }, 1500);
    })();

})();
