const SHELL_CACHE  = 'jf-shell-v1'
const IMAGE_CACHE  = 'jf-images-v1'
const API_CACHE    = 'jf-api-v1'

const KNOWN_CACHES = [SHELL_CACHE, IMAGE_CACHE, API_CACHE]

// Activate immediately — don't wait for old tabs to close
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !KNOWN_CACHES.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // ── Images: Cache First ──────────────────────────────────────────────
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async cache => {
        const cached = await cache.match(request)
        if (cached) return cached
        try {
          const response = await fetch(request)
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

  // ── WordPress REST API: Network First, cache fallback on error/offline ─
  if (request.url.includes('/wp-json/')) {
    event.respondWith(
      caches.open(API_CACHE).then(async cache => {
        try {
          const response = await fetch(request)
          if (response.ok) {
            cache.put(request, response.clone())
            return response
          }
          // Non-ok (e.g. 500) — serve cached version if available
          const cached = await cache.match(request)
          return cached || response
        } catch {
          // Offline or network error — serve cached version if available
          const cached = await cache.match(request)
          return cached || Response.error()
        }
      })
    )
    return
  }

  // ── Static assets (JS, CSS, fonts): Cache First ──────────────────────
  // Vite hashes filenames on every build so stale cache is never an issue.
  if (
    url.pathname.startsWith('/assets/') ||
    request.destination === 'script'   ||
    request.destination === 'style'    ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async cache => {
        const cached = await cache.match(request)
        if (cached) return cached
        try {
          const response = await fetch(request)
          if (response.ok) cache.put(request, response.clone())
          return response
        } catch {
          return Response.error()
        }
      })
    )
    return
  }

  // ── Navigation (HTML): Network First, fall back to shell ────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async cache => {
        try {
          const response = await fetch(request)
          if (response.ok) cache.put(request, response.clone())
          return response
        } catch {
          const cached = await cache.match(request) ||
                         await cache.match('/')
          return cached || Response.error()
        }
      })
    )
    return
  }
})
