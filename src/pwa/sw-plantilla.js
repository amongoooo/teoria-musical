// Service worker de la app (plantilla). NO se importa desde la app: en `npm run build` el plugin
// `swApp` de vite.config.js lo copia a dist/sw.js cambiando los __MARCADORES__ por la lista real
// de archivos del build y una versión (hash). Así la app funciona sin internet:
//  - Al instalarse guarda TODA la app (HTML, JS, CSS, fuentes, íconos) y los samples del piano.
//  - Páginas (navegación): primero la red (para tener siempre la última versión) y, sin red, la copia.
//  - Archivos de la app y samples del piano: primero la copia guardada; si no está, la red (y se guarda).
//  - Al activarse una versión nueva borra las copias viejas de la app.

const VERSION = '__VERSION__'
const BASE = '__BASE__' // '/teoria-musical/'
const ARCHIVOS = __ARCHIVOS__ // rutas relativas a BASE
const PIANO_URL = '__PIANO_URL__'
const PIANO = __PIANO__ // nombres de los samples (A0.mp3…)

const CACHE_APP = `app-${VERSION}`
const CACHE_PIANO = 'piano-salamander-v1' // no cambia con cada versión de la app
const ESPERA_RED = 4000 // ms: con red lenta, a los 4 s se usa la copia guardada

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const app = await caches.open(CACHE_APP)
      await app.addAll([BASE, ...ARCHIVOS.map((f) => BASE + f)])
      // Samples del piano: si alguno falla, la app usa el sintetizador de respaldo (no rompe la instalación).
      const piano = await caches.open(CACHE_PIANO)
      await Promise.allSettled(
        PIANO.map(async (f) => {
          const url = PIANO_URL + f
          if (await piano.match(url)) return
          const r = await fetch(url, { mode: 'cors' })
          if (r.ok) await piano.put(url, r)
        }),
      )
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys()
      await Promise.all(nombres.filter((n) => n.startsWith('app-') && n !== CACHE_APP).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (req.url.startsWith(PIANO_URL)) {
    event.respondWith(primeroCopia(req, CACHE_PIANO))
    return
  }
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return

  if (req.mode === 'navigate') {
    event.respondWith(primeroRed(req))
    return
  }
  event.respondWith(primeroCopia(req, CACHE_APP))
})

/** Copia guardada si existe; si no, la red (y se guarda para la próxima). */
async function primeroCopia(req, nombreCache) {
  // ignoreVary: lo guardado al instalar no llevaba las mismas cabeceras (p. ej. Origin en los módulos JS)
  const guardada = await caches.match(req, { ignoreVary: true })
  if (guardada) return guardada
  const r = await fetch(req)
  if (r.ok) {
    const cache = await caches.open(nombreCache)
    cache.put(req, r.clone())
  }
  return r
}

/** Página: la red (sin pasar de ESPERA_RED); sin red o muy lenta, la copia del index.html. */
async function primeroRed(req) {
  try {
    const r = await Promise.race([
      fetch(req),
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('lenta')), ESPERA_RED)),
    ])
    if (r.ok) {
      const cache = await caches.open(CACHE_APP)
      cache.put(BASE, r.clone())
    }
    return r
  } catch {
    const op = { ignoreVary: true }
    return (await caches.match(BASE, op)) ?? (await caches.match(BASE + 'index.html', op)) ?? Response.error()
  }
}
