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

    let cachedMap = null;
    let alreadyLoggedFound = false;

    console.log("[GeoFSZoom] userscript loaded");

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
                } catch (e) {}
            }
        }

        try {
            hunt(window);
        } catch (e) {
            console.log("[GeoFSZoom] Error while hunting map:", e);
        }

        if (found && !alreadyLoggedFound) {
            alreadyLoggedFound = true;
            console.log("[GeoFSZoom] Leaflet map found:", found);
        }

        return found;
    }

    function tweakMap(map) {
        if (!map || !map.options) {
            return;
        }

        if (map.options.maxZoom && map.options.maxZoom >= TARGET_MAX_ZOOM &&
            (map._layersMaxZoom || 0) >= TARGET_MAX_ZOOM) {
            return;
        }

        console.log("[GeoFSZoom] Adjusting map zoom limits. Before:",
            "options.maxZoom =", map.options.maxZoom,
            " _layersMaxZoom =", map._layersMaxZoom);

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
                }
            }
        }

        console.log("[GeoFSZoom] Zoom limits after:",
            "options.maxZoom =", map.options.maxZoom,
            " _layersMaxZoom =", map._layersMaxZoom);
    }

    const interval = setInterval(() => {
        if (!window.L) {
            return;
        }

        if (!cachedMap) {
            cachedMap = findLeafletMapOnce();
        }

        if (!cachedMap) {
            return;
        }

        tweakMap(cachedMap);

    }, 2000);

})();
