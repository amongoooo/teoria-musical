// Opciones de la app (tema claro / oscuro y cómo se ve el vidrio), en localStorage.
//
// Forma de los datos: { tema: 'claro' | 'oscuro' | 'sistema' | 'programa', programa: { claro: 420, oscuro: 1200 }, vidrio: 'desenfoque' | 'opaco', octavas: 'vista' | 'teclas', gesto: 'pagina' | 'invertido', admin: boolean }
// (programa: a qué hora del día empieza el modo claro y a cuál el oscuro, en minutos desde las 0:00, o null si no se ha
//  puesto; cada punto manda desde su hora hasta la del otro. Sin ninguno, «Programar» se comporta como Automático)
// (admin: modo administrador, se activa con PIN en Opciones: todas las lecciones abiertas y saltar entre pasos; ver admin.js)
// (octavas: sentido de la barra de octavas del Piano; 'teclas' = invertida, como arrastrar el teclado)
// (gesto: sentido del gesto del botón de las lecciones; 'pagina' (predeterminado) = el lado donde empieza es de donde
//  viene la página: de derecha a izquierda es el siguiente; 'invertido' = de izquierda a derecha es el siguiente)
// index.html aplica el tema y el vidrio guardados ANTES de pintar (sin destello); este módulo los
// mantiene al día cuando se cambian en Opciones o cuando el teléfono cambia de modo (Automático).
import { useSyncExternalStore } from 'react'

const CLAVE = 'teoria-musical:opciones:v1'
const PREDETERMINADAS = { tema: 'claro', programa: { claro: null, oscuro: null }, reloj: '24', vidrio: 'desenfoque', octavas: 'vista', gesto: 'pagina', admin: false }
export const TEMAS = ['claro', 'oscuro', 'sistema', 'programa']
export const MINUTOS_DIA = 24 * 60
export const RELOJES = ['24', '12'] // formato de las horas de «Programar»: 24 h o am/pm
export const VIDRIOS = ['desenfoque', 'opaco']
export const SENTIDOS_OCTAVAS = ['vista', 'teclas']
export const GESTOS = ['pagina', 'invertido']
const COLOR_BARRA = { claro: '#f4f4f5', oscuro: '#07080f' } // <meta name="theme-color">

let cache = null
const listeners = new Set()

function leer() {
  if (cache) return cache
  try {
    const data = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
    cache = { ...PREDETERMINADAS, ...(data && typeof data === 'object' ? data : {}) }
    if (!TEMAS.includes(cache.tema)) cache.tema = PREDETERMINADAS.tema
    cache.programa = limpiarPrograma(cache.programa)
    if (!RELOJES.includes(cache.reloj)) cache.reloj = PREDETERMINADAS.reloj
    if (!VIDRIOS.includes(cache.vidrio)) cache.vidrio = PREDETERMINADAS.vidrio
    if (!SENTIDOS_OCTAVAS.includes(cache.octavas)) cache.octavas = PREDETERMINADAS.octavas
    if (!GESTOS.includes(cache.gesto)) cache.gesto = PREDETERMINADAS.gesto
    cache.admin = cache.admin === true
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

const esMinuto = (m) => Number.isInteger(m) && m >= 0 && m < MINUTOS_DIA
function limpiarPrograma(p) {
  return { claro: esMinuto(p?.claro) ? p.claro : null, oscuro: esMinuto(p?.oscuro) ? p.oscuro : null }
}

/**
 * Con «Programar»: ¿toca oscuro a esta hora? Cada punto manda desde su hora (hacia la derecha, dando la vuelta a
 * medianoche) hasta la del otro; con un solo punto, ese manda todo el día; sin ninguno, null (como Automático).
 */
export function oscuroProgramado({ claro, oscuro } = {}, fecha = new Date()) {
  if (claro == null && oscuro == null) return null
  if (oscuro == null) return false
  if (claro == null) return true
  const m = fecha.getHours() * 60 + fecha.getMinutes()
  const d = MINUTOS_DIA
  return (m - oscuro + d) % d < (claro - oscuro + d) % d
}

/** ¿Se ve oscuro con este tema? */
export const esOscuro = (tema, programa = leer().programa) =>
  tema === 'oscuro' ||
  (tema === 'sistema' && Boolean(sistema()?.matches)) ||
  (tema === 'programa' && (oscuroProgramado(programa) ?? Boolean(sistema()?.matches)))

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

/** «Programar»: guarda a qué hora empieza el modo claro y a cuál el oscuro (minutos o null) y lo aplica. */
export function setPrograma(programa) {
  const datos = { ...leer(), programa: limpiarPrograma(programa) }
  escribir(datos)
  aplicarTema(datos.tema, { fundido: true })
}

/** Formato de las horas de «Programar»: '24' (20:30) o '12' (8:30 pm). */
export function setReloj(reloj) {
  if (!RELOJES.includes(reloj)) return
  escribir({ ...leer(), reloj })
}

/** Pone o quita la clase `opaco` en <html>: el vidrio pasa a superficie sólida (reglas en src/index.css). */
export function aplicarVidrio(vidrio = leer().vidrio) {
  document.documentElement.classList.toggle('opaco', vidrio === 'opaco')
}

export function setVidrio(vidrio) {
  if (!VIDRIOS.includes(vidrio)) return
  escribir({ ...leer(), vidrio })
  aplicarVidrio(vidrio)
}

/** Sentido de la barra de octavas: 'vista' (a la derecha = más agudo) o 'teclas' (al revés: se arrastra el teclado). */
export function setOctavas(octavas) {
  if (!SENTIDOS_OCTAVAS.includes(octavas)) return
  escribir({ ...leer(), octavas })
}

/** Sentido del gesto del botón de las lecciones: 'pagina' (derecha → izquierda = siguiente) o 'invertido' (al revés). */
export function setGesto(gesto) {
  if (!GESTOS.includes(gesto)) return
  escribir({ ...leer(), gesto })
}

/** Modo administrador (lo activa `desbloquearAdmin` de admin.js tras comprobar el PIN). */
export function setAdmin(admin) {
  escribir({ ...leer(), admin: Boolean(admin) })
}

// En «Automático», seguir al teléfono si cambia de modo con la app abierta.
sistema()?.addEventListener?.('change', () => aplicarTema(leer().tema, { fundido: true }))

// En «Programar», cambiar a la hora puesta aunque la app siga abierta (y al volver a ella).
if (typeof window !== 'undefined') {
  const revisar = () => leer().tema === 'programa' && aplicarTema('programa', { fundido: true })
  setInterval(revisar, 20 * 1000)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && revisar())
}

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function getOpciones() {
  return leer()
}

export function useOpciones() {
  return useSyncExternalStore(subscribe, leer, leer)
}
