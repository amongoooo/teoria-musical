// Opciones de la app (de momento, el tema claro / oscuro), en localStorage.
//
// Forma de los datos: { tema: 'claro' | 'oscuro' | 'sistema' }
// index.html aplica el tema guardado ANTES de pintar (sin destello blanco); este módulo lo
// mantiene al día cuando se cambia en Opciones o cuando el teléfono cambia de modo (Automático).
import { useSyncExternalStore } from 'react'

const CLAVE = 'teoria-musical:opciones:v1'
const PREDETERMINADAS = { tema: 'claro' }
export const TEMAS = ['claro', 'oscuro', 'sistema']
const COLOR_BARRA = { claro: '#f4f4f5', oscuro: '#07080f' } // <meta name="theme-color">

let cache = null
const listeners = new Set()

function leer() {
  if (cache) return cache
  try {
    const data = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
    cache = { ...PREDETERMINADAS, ...(data && typeof data === 'object' ? data : {}) }
    if (!TEMAS.includes(cache.tema)) cache.tema = PREDETERMINADAS.tema
  } catch {
    cache = { ...PREDETERMINADAS }
  }
  return cache
}

function escribir(datos) {
  cache = datos
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    // Sin almacenamiento (modo privado): la opción dura hasta recargar.
  }
  listeners.forEach((l) => l())
}

const sistema = () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)')

/** ¿Se ve oscuro con este tema? */
export const esOscuro = (tema) => tema === 'oscuro' || (tema === 'sistema' && Boolean(sistema()?.matches))

/** Pone o quita la clase `dark` en <html> y ajusta el color de la barra del navegador. */
export function aplicarTema(tema = leer().tema, { fundido = false } = {}) {
  const html = document.documentElement
  const oscuro = esOscuro(tema)
  if (html.classList.contains('dark') === oscuro) return
  if (fundido) {
    html.classList.add('cambiando-tema')
    clearTimeout(aplicarTema.t)
    aplicarTema.t = setTimeout(() => html.classList.remove('cambiando-tema'), 320)
  }
  html.classList.toggle('dark', oscuro)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[oscuro ? 'oscuro' : 'claro'])
}

export function setTema(tema) {
  if (!TEMAS.includes(tema)) return
  escribir({ ...leer(), tema })
  aplicarTema(tema, { fundido: true })
}

// En «Automático», seguir al teléfono si cambia de modo con la app abierta.
sistema()?.addEventListener?.('change', () => aplicarTema(leer().tema, { fundido: true }))

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useOpciones() {
  return useSyncExternalStore(subscribe, leer, leer)
}
