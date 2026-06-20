// sw.js — DreamWash PWA Service Worker
const CACHE_NAME  = 'dreamwash-v2'
const SHELL_PATHS = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png']

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_PATHS))
      .catch(() => {})
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/__vite') ||
    url.pathname.startsWith('/node_modules')
  ) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then(r => r ?? fetch('/index.html'))
      )
    )
    return
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response.ok && response.type === 'basic') {
          caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()))
        }
        return response
      }).catch(() => Response.error())
      return cached ?? networkFetch
    })
  )
})
