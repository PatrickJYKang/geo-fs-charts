import { startZoomPatch } from "./core/zoom-patch";
import { initTaxiChartControl } from "./ui/controls";
import { logInfo } from "./core/logger";

(function() {
    "use strict";

    logInfo("main", "bootstrap:start");
    startZoomPatch();

    const uiInterval = setInterval(() => {
        const panel = document.querySelector(".geofs-map-list");
        if (!panel) return;
        clearInterval(uiInterval);
        logInfo("main", "ui:ready");
        initTaxiChartControl();
    }, 1500);
})();
