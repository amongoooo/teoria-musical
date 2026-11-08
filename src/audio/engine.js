// Motor de audio: un único piano compartido por toda la app.
// Usa los samples Salamander (Tone.Sampler) y, si fallan o aún no cargan,
// un Tone.PolySynth de respaldo para que nunca quede en silencio.
import * as Tone from 'tone'

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
  return Tone.start()
}

function instrument() {
  return status === 'ready' && sampler ? sampler : getSynth()
}

export function noteOn(note, velocity = 0.8) {
  startAudio()
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
 * Devuelve los segundos que dura en total.
 */
export function playNotes(notes, { modo = 'secuencia', duracion = 0.9, intervalo = 0.45, velocidad = 0.8 } = {}) {
  const list = Array.isArray(notes) ? notes : [notes]
  startAudio()
  initPiano()
  const inst = instrument()
  const t0 = Tone.now() + 0.05
  list.forEach((note, i) => {
    const t = modo === 'acorde' ? t0 : t0 + i * intervalo
    inst.triggerAttackRelease(note, duracion, t, velocidad)
  })
  return modo === 'acorde' ? duracion : (list.length - 1) * intervalo + duracion
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
