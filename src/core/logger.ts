const PREFIX = "[GeoFSTaxi]";
const GLOBAL_FLAG = "geofsTaxiDebug";

function shouldLog(): boolean {
    try {
        if (typeof window === "undefined") return true;
        const flag = (window as any)[GLOBAL_FLAG];
        return flag === undefined ? true : Boolean(flag);
    } catch (_) {
        return true;
    }
}

export function logDebug(scope: string, ...args: any[]): void {
    if (!shouldLog()) return;
    console.debug(`${PREFIX}[${scope}]`, ...args);
}

export function logInfo(scope: string, ...args: any[]): void {
    if (!shouldLog()) return;
    console.info(`${PREFIX}[${scope}]`, ...args);
}

export function logWarn(scope: string, ...args: any[]): void {
    if (!shouldLog()) return;
    console.warn(`${PREFIX}[${scope}]`, ...args);
}

export function logError(scope: string, ...args: any[]): void {
    if (!shouldLog()) return;
    console.error(`${PREFIX}[${scope}]`, ...args);
}
