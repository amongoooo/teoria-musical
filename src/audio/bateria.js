// Batería sintetizada con Tone.js (sin samples): bombo, caja, hi-hat (cerrado y abierto), palmas, clic de metrónomo, un tom agudo
// (el patrón del entrenamiento de ritmo; `toque` es el mismo tom en otra voz, para lo que se toca en vivo en el pad), el
// CENCERRO del phonk y el 808 (P1.4: un bombo largo con nota, `nota808`).
import * as Tone from 'tone'

let kit = null

function crearKit() {
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 },
  }).toDestination()
  kick.volume.value = -2

  const filtroCaja = new Tone.Filter(1800, 'bandpass').toDestination()
  const snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.16, sustain: 0 } }).connect(filtroCaja)
  snare.volume.value = 2
  const cuerpo = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 2, envelope: { attack: 0.001, decay: 0.1, sustain: 0 } }).toDestination()
  cuerpo.volume.value = -12

  const filtroHat = new Tone.Filter(8000, 'highpass').toDestination()
  const hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.045, sustain: 0 } }).connect(filtroHat)
  hat.volume.value = -10

  // Hat abierto (Producción, P1.2): el mismo ruido con cola larga. Un hat cerrado lo corta, como en una batería real.
  const filtroAbierto = new Tone.Filter(7000, 'highpass').toDestination()
  const ohat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.03 } }).connect(filtroAbierto)
  ohat.volume.value = -11

  const filtroClap = new Tone.Filter(1200, 'bandpass').toDestination()
  const clap = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0 } }).connect(filtroClap)
  clap.volume.value = 2

  const click = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 } }).toDestination()
  click.volume.value = -6

  // Tom agudo («toc»): se distingue del bombo (grave), de la caja y el hi-hat (ruido) y del clic (agudo). Dos voces
  // iguales: una para lo programado y otra para los toques en vivo (una voz no admite sonidos hacia atrás en el tiempo).
  const crearTom = () => {
    const t = new Tone.MembraneSynth({
      pitchDecay: 0.015,
      octaves: 2.5,
      envelope: { attack: 0.001, decay: 0.14, sustain: 0, release: 0.05 },
    }).toDestination()
    t.volume.value = -3
    return t
  }

  // Cencerro (P1.4, la firma del phonk): dos ondas cuadradas desafinadas (540 y 800 Hz, como el de la TR-808) por un
  // filtro de banda, con un golpe corto y una cola breve.
  const filtroCencerro = new Tone.Filter(2600, 'bandpass').toDestination()
  const envCencerro = new Tone.AmplitudeEnvelope({ attack: 0.001, decay: 0.28, sustain: 0, release: 0.05 }).connect(filtroCencerro)
  const tonoCencerro = new Tone.Gain(0.35).connect(envCencerro)
  for (const f of [540, 800]) new Tone.Oscillator(f, 'square').connect(tonoCencerro).start()
  filtroCencerro.Q.value = 1.2

  return { kick, snare, cuerpo, hat, ohat, clap, click, tom: crearTom(), toque: crearTom(), cencerro: envCencerro }
}

/** Toca un golpe de batería en el instante `t` (tiempo del contexto de audio). */
export function golpe(nombre, t, velocity = 0.8) {
  if (!kit) kit = crearKit()
  const v = Math.max(0.05, Math.min(1, velocity))
  // Los NoiseSynth son monofónicos: si dos golpes caen a la vez se ignora el segundo sin error.
  try {
    if (nombre === 'kick') kit.kick.triggerAttackRelease('C1', 0.3, t, v)
    else if (nombre === 'snare') {
      kit.snare.triggerAttackRelease(0.15, t, v)
      kit.cuerpo.triggerAttackRelease('G2', 0.08, t, v)
    } else if (nombre === 'hat') {
      kit.hat.triggerAttackRelease(0.04, t, v)
      // El cerrado corta al abierto (el que suene en ese momento).
      try {
        kit.ohat.triggerRelease(t)
      } catch {
        // no había hat abierto sonando
      }
    } else if (nombre === 'ohat') kit.ohat.triggerAttackRelease(0.3, t, v)
    else if (nombre === 'clap') kit.clap.triggerAttackRelease(0.1, t, v)
    else if (nombre === 'click') kit.click.triggerAttackRelease(v >= 0.9 ? 'E6' : 'A5', 0.04, t, v)
    else if (nombre === 'tom' || nombre === 'toque') kit[nombre].triggerAttackRelease('A3', 0.12, t, v)
    else if (nombre === 'cencerro') kit.cencerro.triggerAttackRelease(0.08, t, v)
  } catch {
    // golpe repetido en el mismo instante
  }
}

export const NOMBRES_BATERIA = ['kick', 'snare', 'hat', 'ohat', 'clap', 'click', 'tom', 'cencerro']

// ---------------------------------------------------------------------------
// EL 808 (P1.4 «El 808: el bombo que canta»; propuesta aprobada: https://claude.ai/artifact/XMnFwLjZLG7f8GjQUdnF4d)
// ---------------------------------------------------------------------------
// Un seno grave con un GOLPE DE TONO al empezar (arranca 2 octavas arriba y cae en 30 ms: el «punch» de bombo), una COLA
// que se apaga sola (~1,6 s) y que el largo de la nota corta (como un sample de 808 en FL Studio), y una saturación
// suave para que se oiga en la bocina del celular (más fuerte con `saturado`: el phonk). MONOFÓNICO, como el «Cut itself»
// de FL: cada nota corta a la anterior. Una nota con `slide` no vuelve a golpear: la que suena DESLIZA su tono hasta
// la nueva (el glide) y sigue con su cola.

let bajo = null
const COLA = 1.6 // segundos en que la cola se apaga sola
const GLIDE = 0.12 // segundos del deslizamiento

function crearBajo() {
  const salida = new Tone.Gain(1).toDestination()
  const saturacion = new Tone.Distortion({ distortion: 0.7, wet: 0.3 }).connect(salida)
  const vca = new Tone.Gain(0).connect(saturacion)
  const osc = new Tone.Oscillator(55, 'sine').connect(vca).start()
  return { osc, vca, saturacion, salida, hz: 55, fin: 0 }
}

/**
 * Toca una nota del 808 en el instante `t` (tiempo del contexto de audio), `duracion` segundos.
 * `slide`: desliza desde la nota que sonaba (o la última que sonó) en vez de golpear. `saturado`: el 808 del phonk.
 * Las notas se mandan en orden de tiempo (como los golpes de batería).
 */
export function nota808(nota, t, duracion = 0.5, velocity = 0.9, { slide = false, saturado = false } = {}) {
  if (!bajo) bajo = crearBajo()
  const { osc, vca, saturacion, salida } = bajo
  const hz = Tone.Frequency(nota).toFrequency()
  const v = Math.max(0.05, Math.min(1, velocity))
  const pico = 0.85 * v
  try {
    const f = osc.frequency
    const g = vca.gain
    f.cancelAndHoldAtTime(t)
    g.cancelAndHoldAtTime(t)
    saturacion.wet.setValueAtTime(saturado ? 1 : 0.3, t)
    salida.gain.setValueAtTime(saturado ? 0.45 : 1, t)
    if (slide) {
      // Glide: del tono anterior al nuevo, sin golpe. Si ya no sonaba, vuelve a sonar desde el tono anterior.
      f.setValueAtTime(bajo.hz, t)
      f.exponentialRampToValueAtTime(hz, t + GLIDE)
      if (bajo.fin <= t) g.linearRampToValueAtTime(pico, t + 0.01)
      g.setTargetAtTime(0.0001, t + 0.01, COLA / 4)
    } else {
      f.setValueAtTime(hz * 4, t)
      f.exponentialRampToValueAtTime(hz, t + 0.03)
      g.linearRampToValueAtTime(pico, t + 0.004)
      g.setTargetAtTime(0.0001, t + 0.01, COLA / 4)
    }
    // El largo de la nota corta la cola (una nota que empieza después cancela este corte).
    const fin = t + Math.max(0.05, duracion)
    g.cancelAndHoldAtTime(fin)
    g.linearRampToValueAtTime(0, fin + 0.05)
    bajo.hz = hz
    bajo.fin = fin
  } catch {
    // nota en el mismo instante que otra
  }
}

/** Calla el 808 enseguida (al parar una reproducción). */
export function callar808() {
  if (!bajo) return
  const t = Tone.immediate()
  try {
    bajo.vca.gain.cancelAndHoldAtTime(t)
    bajo.vca.gain.linearRampToValueAtTime(0, t + 0.04)
    bajo.fin = t
  } catch {
    // nada sonando
  }
}
