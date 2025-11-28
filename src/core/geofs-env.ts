import { logDebug } from "./logger";

const SCOPE = "geofs-env";

export function isGeoFs(): boolean {
    const match = typeof window !== "undefined" && /geo-fs\.com/i.test(window.location.hostname);
    logDebug(SCOPE, "isGeoFs", { hostname: typeof window !== "undefined" ? window.location.hostname : "<no-window>", match });
    return match;
}

export function waitForGeoFsUi(selector: string, intervalMs = 500): Promise<Element> {
    logDebug(SCOPE, "waitForGeoFsUi:start", { selector, intervalMs });
    return new Promise(resolve => {
        const handle = setInterval(() => {
            const el = document.querySelector(selector);
            if (!el) {
                logDebug(SCOPE, "waitForGeoFsUi:poll", { selector, found: false });
                return;
            }
            clearInterval(handle);
            logDebug(SCOPE, "waitForGeoFsUi:found", { selector });
            resolve(el);
        }, intervalMs);
    });
}
