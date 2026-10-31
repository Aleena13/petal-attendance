
const CACHE_NAME = "petal-v3";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icons/petal-icon.svg",
    "./icons/petal-192.png",
    "./icons/petal-512.png",
    "./icons/apple-touch-icon.png"
];

// Install and cache the app files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// Remove older versions of Petal's cache
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key =>
                        key.startsWith("petal-") &&
                        key !== CACHE_NAME
                    )
                    .map(key => caches.delete(key))
            );
        })
    );

    self.clients.claim();
});

// Serve cached files when offline
self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);

    // Only handle requests from this website
    if (url.origin !== self.location.origin) return;
    if (request.method !== "GET") return;

    // Network first for page navigation
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();

                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, copy);
                        });
                    }

                    return response;
                })
                .catch(async () => {
                    return await caches.match("./index.html");
                })
        );

        return;
    }

    // Cache first for other files
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;

            return fetch(request).then(response => {
                if (response.ok) {
                    const copy = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, copy);
                    });
                }

                return response;
            });
        })
    );
});
