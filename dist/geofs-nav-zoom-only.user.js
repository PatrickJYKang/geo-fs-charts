// ==UserScript==
// @name         GeoFS Navpanel Deeper Zoom
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Increase max zoom level of the GeoFS navigation panel Leaflet map
// @author       you
// @match        https://geo-fs.com/*
// @match        https://*.geo-fs.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_MAX_ZOOM = 18;
    const PREFIX = '[GeoFSZoom]';

    let cachedMap = null;
    let alreadyLoggedFound = false;

    function log(scope, message, payload) {
        const parts = [`${PREFIX}[${scope}]`, message];
        if (payload) parts.push(payload);
        console.debug(...parts);
    }

    log('main', 'userscript loaded');

    function findLeafletMapOnce() {
        const seen = new Set();
        let found = null;

        function hunt(obj) {
            if (!obj || typeof obj !== "object" || seen.has(obj) || found) {
                return;
            }
            seen.add(obj);

            if ("_zoom" in obj &&
                typeof obj.setZoom === "function" &&
                typeof obj.getCenter === "function" &&
                (obj._container?.classList?.contains("geofs-map-viewport") ||
                 obj._container?.classList?.contains("leaflet-container"))) {
                found = obj;
                return;
            }

            for (const key in obj) {
                try {
                    const val = obj[key];
                    if (val && typeof val === "object") {
                        hunt(val);
                        if (found) return;
                    }
                } catch (e) {
                    log('hunt', 'error walking key', { key, error: e });
                }
            }
        }

        try {
            hunt(window);
        } catch (e) {
            log('hunt', 'global error', e);
        }

        if (found && !alreadyLoggedFound) {
            alreadyLoggedFound = true;
            log('hunt', 'Leaflet map found', found);
        }

        return found;
    }

    function tweakMap(map) {
        if (!map || !map.options) {
            log('tweak', 'missing map or options');
            return;
        }

        if (map.options.maxZoom && map.options.maxZoom >= TARGET_MAX_ZOOM &&
            (map._layersMaxZoom || 0) >= TARGET_MAX_ZOOM) {
            log('tweak', 'already at target zoom');
            return;
        }

        log('tweak', 'adjusting map zoom limits (before)', {
            optionsMaxZoom: map.options.maxZoom,
            layersMaxZoom: map._layersMaxZoom
        });

        map.options.maxZoom = TARGET_MAX_ZOOM;
        if (typeof map.setMaxZoom === "function") {
            map.setMaxZoom(TARGET_MAX_ZOOM);
        }

        if (!map._layersMaxZoom || map._layersMaxZoom < TARGET_MAX_ZOOM) {
            map._layersMaxZoom = TARGET_MAX_ZOOM;
        }

        if (map._layers) {
            Object.keys(map._layers).forEach(id => {
                const layer = map._layers[id];
                if (layer && layer.options && layer.options.maxZoom != null && layer.options.maxZoom < TARGET_MAX_ZOOM) {
                    layer.options.maxZoom = TARGET_MAX_ZOOM;
                    log('tweak', 'layer patched', { id });
                }
            });
        }

        if (map.zoomControl && typeof map.zoomControl._updateDisabled === "function") {
            map.zoomControl._updateDisabled();
        } else {
            const container = map._container || document.querySelector(".geofs-map-viewport.leaflet-container");
            if (container) {
                const zoomIn = container.querySelector(".leaflet-control-zoom-in");
                if (zoomIn) {
                    zoomIn.classList.remove("leaflet-disabled");
                    log('tweak', 'zoom control re-enabled');
                }
            }
        }

        log('tweak', 'adjusting map zoom limits (after)', {
            optionsMaxZoom: map.options.maxZoom,
            layersMaxZoom: map._layersMaxZoom
        });
    }

    const interval = setInterval(() => {
        if (!window.L) {
            log('interval', 'Leaflet not yet available');
            return;
        }

        if (!cachedMap) {
            cachedMap = findLeafletMapOnce();
            log('interval', 'map lookup', { found: Boolean(cachedMap) });
        }

        if (!cachedMap) {
            log('interval', 'map still missing');
            return;
        }

        tweakMap(cachedMap);

    }, 2000);

})();
