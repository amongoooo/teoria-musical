// Motor de audio: un único piano compartido por toda la app.
// Usa los samples Salamander (Tone.Sampler) y, si fallan o aún no cargan,
// un Tone.PolySynth de respaldo para que nunca quede en silencio.
import * as Tone from 'tone'
import { NOMBRES_BATERIA, golpe } from './bateria.js'

const SALAMANDER_URL = 'https://tonejs.github.io/audio/salamander/'

const SALAMANDER_NOTES = {
  A0: 'A0.mp3',
  C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3', A1: 'A1.mp3',
  C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3', A2: 'A2.mp3',
  C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', A3: 'A3.mp3',
  C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3',
  C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3',
  C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3', A6: 'A6.mp3',
  C7: 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3', A7: 'A7.mp3',
  C8: 'C8.mp3',
}

/** Estado: 'loading' | 'ready' | 'fallback' */
let status = 'loading'
let sampler = null
let synth = null
let initialized = false
const listeners = new Set()

function setStatus(next) {
  status = next
  listeners.forEach((fn) => fn(status))
}

function getSynth() {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 1 },
    }).toDestination()
    synth.volume.value = -8
  }
  return synth
}

/** Empieza a descargar los samples (se puede llamar varias veces). */
export function initPiano() {
  if (initialized) return
  initialized = true
  instalarDesbloqueo()
  try {
    sampler = new Tone.Sampler({
      urls: SALAMANDER_NOTES,
      baseUrl: SALAMANDER_URL,
      release: 1,
      onload: () => setStatus('ready'),
      onerror: (err) => {
        if (status === 'fallback') return
        console.warn('No se pudieron cargar los samples de piano, uso sintetizador.', err)
        setStatus('fallback')
      },
    }).toDestination()
  } catch (err) {
    console.warn('Error creando el Sampler, uso sintetizador.', err)
    setStatus('fallback')
  }
}

export function getStatus() {
  return status
}

/** Suscribirse a cambios de estado. Devuelve la función para desuscribirse. */
export function onStatusChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** ¿El AudioContext ya está activo? (iOS lo arranca suspendido.) */
export function isAudioRunning() {
  return Tone.getContext().state === 'running'
}

/** Activa el audio. Debe llamarse dentro de un gesto del usuario. */
export function startAudio() {
  if (isAudioRunning()) return Promise.resolve()
  usarCanalDeReproduccion()
  return Tone.start()
}

/**
 * En iPhone el audio web se silencia con el interruptor de silencio, salvo que
 * la página se declare como "reproducción" (Safari 17+). Sin esto, el piano
 * puede no sonar aunque todo funcione.
 */
/**
 * Safari en iPhone a veces solo acepta activar el audio al SOLTAR el dedo
 * (touchend / click), no al apoyarlo. Escuchamos esos gestos en toda la página
 * hasta que el audio quede activo, para que la primera tecla no quede muda.
 */
function instalarDesbloqueo() {
  if (typeof document === 'undefined') return
  const eventos = ['touchend', 'pointerup', 'click', 'keydown']
  const desbloquear = () => {
    startAudio().then(() => {
      if (isAudioRunning()) eventos.forEach((ev) => document.removeEventListener(ev, desbloquear, true))
    })
  }
  eventos.forEach((ev) => document.addEventListener(ev, desbloquear, true))
}

function usarCanalDeReproduccion() {
  try {
    if (navigator.audioSession && navigator.audioSession.type !== 'playback') {
      navigator.audioSession.type = 'playback'
    }
  } catch {
    // Navegadores sin audioSession: no hace falta nada.
  }
}

function instrument() {
  return status === 'ready' && sampler ? sampler : getSynth()
}

/** Toca una nota (o un acorde, o un golpe de batería como 'kick') en el instante `t`. */
function sonar(inst, nota, duracion, t, velocidad) {
  const lista = Array.isArray(nota) ? nota : [nota]
  const tonos = lista.filter((n) => !NOMBRES_BATERIA.includes(n))
  lista.filter((n) => NOMBRES_BATERIA.includes(n)).forEach((n) => golpe(n, t, velocidad))
  if (tonos.length) inst.triggerAttackRelease(tonos.length === 1 ? tonos[0] : tonos, duracion, t, velocidad)
}

export function noteOn(note, velocity = 0.8) {
  startAudio()
  if (NOMBRES_BATERIA.includes(note)) return golpe(note, Tone.now(), velocity)
  instrument().triggerAttack(note, Tone.now(), velocity)
}

export function noteOff(note) {
  // Soltamos en ambos por si cambió el estado mientras se mantenía la nota.
  if (sampler && status === 'ready') sampler.triggerRelease(note, Tone.now())
  if (synth) synth.triggerRelease(note, Tone.now())
}

export function releaseAll() {
  if (sampler && status === 'ready') sampler.releaseAll()
  if (synth) synth.releaseAll()
}

// ---------------------------------------------------------------------------
// Reproducción programada (para lecciones y ejercicios)
// ---------------------------------------------------------------------------

/**
 * Toca una o varias notas.
 *  - notes: 'C4' o ['C4', 'E4', 'G4']
 *  - modo: 'secuencia' (una tras otra) o 'acorde' (todas a la vez)
 *  - duracion: segundos que suena cada nota
 *  - intervalo: segundos entre notas en modo secuencia
 *  - velocidad: 0–1 (fuerza / volumen)
 *  - retraso: segundos de espera antes de empezar
 * Devuelve los segundos que dura en total.
 */
export function playNotes(notes, { modo = 'secuencia', duracion = 0.9, intervalo = 0.45, velocidad = 0.8, retraso = 0 } = {}) {
  const list = Array.isArray(notes) ? notes : [notes]
  startAudio()
  initPiano()
  const inst = instrument()
  const t0 = Tone.now() + 0.05 + retraso
  list.forEach((note, i) => {
    const t = modo === 'acorde' ? t0 : t0 + i * intervalo
    sonar(inst, note, duracion, t, velocidad)
  })
  return modo === 'acorde' ? duracion : (list.length - 1) * intervalo + duracion
}

/** Copia de los eventos ordenada por `inicio` (con swing o humanizados pueden venir desordenados). */
const ordenar = (eventos) => [...eventos].sort((a, b) => a.inicio - b.inicio)

/**
 * Toca un patrón de Piano Roll: [{ nota, inicio, duracion, velocity }] con
 * `inicio` y `duracion` en casillas. `paso` = segundos por casilla.
 * Devuelve la duración total en segundos.
 */
export function playPattern(notas, { paso = 0.3 } = {}) {
  startAudio()
  initPiano()
  const inst = instrument()
  const t0 = Tone.now() + 0.05
  let fin = 0
  // En orden de tiempo: los sintes de batería son monofónicos y no admiten golpes programados hacia atrás.
  ordenar(notas).forEach(({ nota, inicio, duracion = 1, velocity = 0.8 }) => {
    sonar(inst, nota, Math.max(0.1, duracion * paso * 0.95), t0 + inicio * paso, velocity)
    fin = Math.max(fin, inicio + duracion)
  })
  return fin * paso
}

// ---------------------------------------------------------------------------
// Ritmo en bucle (metrónomo / groove) con tiempos exactos
// ---------------------------------------------------------------------------

/** Tiempo actual del reloj de audio (segundos, sin margen de programación). */
export function tiempoAudio() {
  return Tone.getContext().rawContext.currentTime
}

/** Retraso entre programar un sonido y oírlo (salida del dispositivo), en segundos. */
export function latenciaAudio() {
  const ctx = Tone.getContext().rawContext
  return (ctx.outputLatency || 0) + (ctx.baseLatency || 0)
}

let ritmoActual = null

/**
 * Repite un patrón de 1 compás (eventos en casillas) a `bpm` hasta llamar a parar().
 * Devuelve { inicio, pulso, tiempos, parar } — `inicio`: tiempo de audio del primer tiempo,
 * `pulso`: segundos entre tiempos. Solo suena un ritmo a la vez.
 */
export function iniciarRitmo(eventos, { bpm = 90, casillas = 8, porTiempo = 2 } = {}) {
  eventos = ordenar(eventos)
  pararRitmo()
  startAudio()
  initPiano()
  const pulso = 60 / bpm
  const paso = pulso / porTiempo
  const compas = casillas * paso
  const inicio = tiempoAudio() + 0.15
  let siguiente = 0 // índice de compás ya programado
  const programar = () => {
    const limite = tiempoAudio() + 0.25
    while (inicio + siguiente * compas < limite) {
      const base = inicio + siguiente * compas
      eventos.forEach((e) => sonar(instrument(), e.nota, Math.max(0.1, (e.duracion ?? 1) * paso * 0.95), base + e.inicio * paso, e.velocity ?? 0.8))
      siguiente += 1
    }
  }
  programar()
  const id = setInterval(programar, 50)
  const ritmo = {
    inicio,
    pulso,
    tiempos: casillas / porTiempo,
    parar: () => {
      clearInterval(id)
      if (ritmoActual === ritmo) ritmoActual = null
    },
  }
  ritmoActual = ritmo
  return ritmo
}

export function pararRitmo() {
  ritmoActual?.parar()
}

// Onda pura (seno) para demostrar frecuencias en Hz.
let sine = null
function getSine() {
  if (!sine) {
    sine = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.03, decay: 0.1, sustain: 0.9, release: 0.25 },
    }).toDestination()
    sine.volume.value = -10
  }
  return sine
}

/** Toca una frecuencia pura (Hz) durante `duracion` segundos. */
export function playFrequency(hz, duracion = 1.2) {
  startAudio()
  getSine().triggerAttackRelease(hz, duracion, Tone.now() + 0.05)
  return duracion
}

/** Empieza una onda pura sostenida (para el pad de frecuencias). */
export function toneStart(hz) {
  startAudio()
  getSine().triggerAttack(hz, Tone.now())
}

/** Cambia la frecuencia de la onda sostenida, con un deslizamiento suave. */
export function toneSet(hz) {
  if (sine) sine.frequency.rampTo(hz, 0.04)
}

export function toneStop() {
  if (sine) sine.triggerRelease(Tone.now())
}

// ---------------------------------------------------------------------------
// "Borrador" de oído: notas al azar + ruido corto, para que la nota anterior
// no sirva de referencia (oído absoluto).
// ---------------------------------------------------------------------------

let ruido = null
function getRuido() {
  if (!ruido) {
    const filtro = new Tone.Filter(2500, 'lowpass').toDestination()
    ruido = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.2 },
    }).connect(filtro)
    ruido.volume.value = -16
  }
  return ruido
}

/**
 * Toca una ráfaga de notas cromáticas al azar repartidas por todo el teclado y
 * un soplo de ruido. Devuelve los segundos que hay que esperar antes de la
 * siguiente nota (incluye un silencio para "limpiar" la memoria).
 */
export function limpiarOido({ cantidad = 7 } = {}) {
  startAudio()
  initPiano()
  const inst = instrument()
  const t0 = Tone.now() + 0.05
  const paso = 0.09
  for (let i = 0; i < cantidad; i++) {
    const m = 36 + Math.floor(Math.random() * 49) // de Do2 a Do6
    const nota = Tone.Frequency(m, 'midi').toNote()
    inst.triggerAttackRelease(nota, 0.25, t0 + i * paso, 0.45 + Math.random() * 0.25)
  }
  const fin = cantidad * paso
  getRuido().triggerAttackRelease(0.45, t0 + fin)
  return fin + 0.45 + 0.9 // ráfaga + ruido + silencio
}
