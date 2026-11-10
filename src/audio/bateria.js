// Batería sintetizada con Tone.js (sin samples): bombo, caja, hi-hat, palmas y clic de metrónomo.
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

  const filtroClap = new Tone.Filter(1200, 'bandpass').toDestination()
  const clap = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0 } }).connect(filtroClap)
  clap.volume.value = 2

  const click = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 } }).toDestination()
  click.volume.value = -6

  return { kick, snare, cuerpo, hat, clap, click }
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
    } else if (nombre === 'hat') kit.hat.triggerAttackRelease(0.04, t, v)
    else if (nombre === 'clap') kit.clap.triggerAttackRelease(0.1, t, v)
    else if (nombre === 'click') kit.click.triggerAttackRelease(v >= 0.9 ? 'E6' : 'A5', 0.04, t, v)
  } catch {
    // golpe repetido en el mismo instante
  }
}

export const NOMBRES_BATERIA = ['kick', 'snare', 'hat', 'clap', 'click']
