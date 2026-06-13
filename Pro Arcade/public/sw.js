const CACHE_NAME = 'pro-arcade-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/src/components/NeonProtocol.jsx',
  '/src/components/SnakeGame.jsx',
  '/src/components/GamePlayer.jsx'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  // If it's an API call, try network first, then fail gracefully
  if (e.request.url.includes('/api/games/freetogame')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }
  
  // Otherwise, Cache First strategy for assets
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request).catch(() => {
        return caches.match('/'); // Return root if completely offline and asset fails
      });
    })
  );
});
