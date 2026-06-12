const IMAGE_CACHE = 'jf-images-v1'
const API_CACHE   = 'jf-api-v1'

// Activate immediately — don't wait for old tabs to close
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  // Remove any outdated caches from old SW versions
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== IMAGE_CACHE && k !== API_CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event

  // ── Images: Cache First ─────────────────────────────────────────────
  // Serve from SW cache if available. On miss, fetch from network and
  // store the blob so every subsequent request is instant — even offline.
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async cache => {
        const cached = await cache.match(request)
        if (cached) return cached

        try {
          const response = await fetch(request)
          // response.type === 'opaque' means cross-origin image with no CORS headers —
          // still safe to cache; we just can't inspect the body.
          if (response.ok || response.type === 'opaque') {
            cache.put(request, response.clone())
          }
          return response
        } catch {
          return Response.error()
        }
      })
    )
    return
  }

  // ── WordPress REST API: Network First ───────────────────────────────
  // Always try fresh data. If offline, fall back to the last cached response.
  // This makes the app fully usable offline after the first successful load.
  if (request.url.includes('/wp-json/')) {
    event.respondWith(
      caches.open(API_CACHE).then(async cache => {
        try {
          const response = await fetch(request)
          if (response.ok) cache.put(request, response.clone())
          return response
        } catch {
          const cached = await cache.match(request)
          return cached || Response.error()
        }
      })
    )
    return
  }
})
