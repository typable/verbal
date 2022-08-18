const VERSION = '0.0.1';

self.addEventListener('install', self.skipWaiting);

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => {
            if(key === VERSION) return;
            return caches.delete(key);
        }));
    }));
});

self.addEventListener('fetch', (event) => {
    event.respondWith((async () => {
        const file = await caches.match(event.request);
        if(file) return file;
        const response = await fetch(event.request);
        if(!event.request.url.includes('/api')) {
            const cache = await caches.open(VERSION);
            cache.put(event.request, response.clone());
        }
        return response;
    })());
});
