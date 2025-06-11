// Service Worker for offline caching
const CACHE_NAME = 'weather-app-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/assets/bg.jpg',
    '/assets/favicon.ico',
    '/assets/icon-192.png',
    '/assets/message/search-city.png',
    '/assets/message/not-found.png',
    '/assets/message/offline.png',
    '/assets/weather/clear.svg',
    '/assets/weather/clouds.svg',
    '/assets/weather/rain.svg',
    '/assets/weather/snow.svg',
    '/assets/weather/thunderstorm.svg',
    '/assets/weather/drizzle.svg',
    '/assets/weather/atmosphere.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Skip API requests
    if (event.request.url.includes('api.openweathermap.org')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});