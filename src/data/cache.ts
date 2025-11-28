interface CacheEntry<T> {
    value: T;
    timestamp: number;
}

import { logDebug } from "../core/logger";

const memoryCache = new Map<string, CacheEntry<any>>();
const TTL = 1000 * 60 * 10; // 10 minutes
const SCOPE = "cache";

export function getCached<T>(key: string): T | null {
    const now = Date.now();
    const entry = memoryCache.get(key);
    if (entry && now - entry.timestamp < TTL) {
        logDebug(SCOPE, "hit:memory", { key });
        return entry.value as T;
    }

    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            const parsed: CacheEntry<T> = JSON.parse(stored);
            if (now - parsed.timestamp < TTL) {
                memoryCache.set(key, parsed);
                logDebug(SCOPE, "hit:localStorage", { key });
                return parsed.value;
            }
        } catch (_) {}
    }

    logDebug(SCOPE, "miss", { key });
    return null;
}

export function setCached<T>(key: string, value: T): void {
    const entry: CacheEntry<T> = { value, timestamp: Date.now() };
    memoryCache.set(key, entry);
    logDebug(SCOPE, "set", { key });
    try {
        localStorage.setItem(key, JSON.stringify(entry));
    } catch (_) {}
}
