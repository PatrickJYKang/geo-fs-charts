import { startZoomPatch } from "./core/zoom-patch";
import { initTaxiChartControl } from "./ui/controls";

(function() {
    "use strict";

    startZoomPatch();

    const uiInterval = setInterval(() => {
        const panel = document.querySelector(".geofs-map-list");
        if (!panel) return;
        clearInterval(uiInterval);
        initTaxiChartControl();
    }, 1500);
})();
