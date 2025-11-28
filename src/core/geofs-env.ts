export function isGeoFs(): boolean {
    return typeof window !== "undefined" && /geo-fs\.com/i.test(window.location.hostname);
}

export function waitForGeoFsUi(selector: string, intervalMs = 500): Promise<Element> {
    return new Promise(resolve => {
        const handle = setInterval(() => {
            const el = document.querySelector(selector);
            if (!el) return;
            clearInterval(handle);
            resolve(el);
        }, intervalMs);
    });
}
