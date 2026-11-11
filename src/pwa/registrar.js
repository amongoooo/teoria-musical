// Registra el service worker (solo en la versión publicada, no en `npm run dev`).
// El archivo sw.js lo genera el plugin `swApp` de vite.config.js a partir de src/pwa/sw-plantilla.js.
export function registrarServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch((err) => {
      console.warn('No se pudo registrar el service worker (la app funciona igual, pero no sin internet).', err)
    })
  })
}
