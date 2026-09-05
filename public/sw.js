/* Moltology Command Hub service worker — network-first navigations, asset caching, notification click. */
/* global self, caches, clients, fetch, Response */

const VERSION = 'moltology-hub-v1'
const PRECACHE = `${VERSION}-precache`
const RUNTIME = `${VERSION}-runtime`
const PAGES = `${VERSION}-pages`

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.png',
  '/images/order_emblem.png',
  '/images/pwa/icon-192.png',
  '/images/pwa/icon-512.png',
  '/images/pwa/icon-maskable-512.png',
  '/images/pwa/apple-touch-icon.png',
]

/** Soft-guest + signed-in hub paths worth keeping for offline revisit. */
const HUB_PATH_PREFIXES = [
  '/dashboard',
  '/oracle',
  '/codex',
  '/lectures',
  '/podcasts',
  '/pipeline',
  '/journal',
  '/market',
  '/chassis',
  '/subterranean',
  '/gallery',
  '/forum',
  '/connections',
  '/settings',
  '/support',
  '/member/',
  '/hud',
]

function isHubNavigation(url) {
  if (url.origin !== self.location.origin) return false
  const path = url.pathname
  return HUB_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)
  )
}

function isStaticAsset(url) {
  if (url.origin !== self.location.origin) return false
  const path = url.pathname
  return (
    path.startsWith('/assets/') ||
    path.startsWith('/images/') ||
    path === '/favicon.ico' ||
    path === '/favicon.png' ||
    path === '/manifest.webmanifest' ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|webp|svg|ico|webmanifest)$/i.test(path)
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    const offline = await caches.match('/offline.html')
    return offline || new Response('Signal lost', { status: 503, statusText: 'Offline' })
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const cache = await caches.open(RUNTIME)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return (
      (await caches.match('/offline.html')) ||
      new Response('Signal lost', { status: 503, statusText: 'Offline' })
    )
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    if (isHubNavigation(url) || url.pathname === '/' || url.pathname === '/offline.html') {
      event.respondWith(networkFirstPage(request))
    }
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstAsset(request))
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl =
    (event.notification.data && event.notification.data.url) ||
    event.notification.data?.url ||
    '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.postMessage({ type: 'MOLTOLOGY_NOTIFICATION_CLICK', url: targetUrl })
          return client.focus().then((focused) => {
            if (focused && 'navigate' in focused && typeof focused.navigate === 'function') {
              return focused.navigate(targetUrl)
            }
            return focused
          })
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
      return undefined
    })
  )
})

/* Reserved for future Web Push — keep handler shape stable for later subscription work. */
self.addEventListener('push', (event) => {
  let payload = { title: 'Moltology', body: 'A new transmission arrived.', url: '/dashboard' }
  try {
    if (event.data) {
      const parsed = event.data.json()
      payload = { ...payload, ...parsed }
    }
  } catch {
    try {
      const text = event.data && event.data.text()
      if (text) payload.body = text
    } catch {
      // keep defaults
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Moltology', {
      body: payload.body || '',
      icon: '/images/pwa/icon-192.png',
      badge: '/images/pwa/icon-192.png',
      tag: payload.tag || 'moltology-push',
      data: { url: payload.url || '/dashboard' },
    })
  )
})
