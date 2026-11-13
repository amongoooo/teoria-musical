// Utilidades de prueba: abre la app con una «sonda» que graba el pico de la salida de audio
// bloque a bloque (128 muestras) y la hora de audio de cada toque.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')

export const BASE = process.env.BASE || 'http://localhost:5199/teoria-musical/'

/** WAV mono de 16 bits: seno de amplitud constante (así una nota colgada se nota: no decae sola). */
function wavSeno(hz, segundos = 8, sr = 22050) {
  const n = Math.floor(segundos * sr)
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write('WAVEfmt ', 8)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(sr, 24)
  buf.writeUInt32LE(sr * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin((2 * Math.PI * hz * i) / sr) * 0.5 * 32767), 44 + i * 2)
  return buf
}

const SEMITONO = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
function hzDeArchivo(nombre) {
  const m = /^([A-G])(s?)(\d)\.mp3$/.exec(nombre)
  if (!m) return 440
  const midi = (Number(m[3]) + 1) * 12 + SEMITONO[m[1]] + (m[2] ? 1 : 0)
  return 440 * 2 ** ((midi - 69) / 12)
}

const SONDA = () => {
  const tap = (window.__tap = { ctx: null, picos: [], eventos: [], listo: false })
  const conectar = AudioNode.prototype.connect
  const codigo = `
    class Sonda extends AudioWorkletProcessor {
      constructor() { super(); this.buf = [] }
      process(inputs) {
        const ch = inputs[0] && inputs[0][0]
        let pico = 0
        if (ch) for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > pico) pico = a }
        this.buf.push(currentTime, pico)
        if (this.buf.length >= 16) { this.port.postMessage(this.buf); this.buf = [] }
        return true
      }
    }
    registerProcessor('sonda', Sonda)`
  let nodo = null
  const pendientes = []
  AudioNode.prototype.connect = function (destino, ...resto) {
    if (destino instanceof AudioDestinationNode) {
      const ctx = this.context
      if (!tap.ctx) {
        tap.ctx = ctx
        const url = URL.createObjectURL(new Blob([codigo], { type: 'application/javascript' }))
        ctx.audioWorklet.addModule(url).then(() => {
          nodo = new AudioWorkletNode(ctx, 'sonda', { numberOfInputs: 1, numberOfOutputs: 0 })
          nodo.port.onmessage = (e) => {
            for (let i = 0; i < e.data.length; i += 2) tap.picos.push([e.data[i], e.data[i + 1]])
          }
          pendientes.forEach((n) => conectar.call(n, nodo))
          tap.listo = true
        })
      }
      if (nodo) conectar.call(this, nodo)
      else pendientes.push(this)
    }
    return conectar.call(this, destino, ...resto)
  }
  const marcar = (tipo) => (e) => {
    if (tap.ctx) tap.eventos.push({ tipo, t: tap.ctx.currentTime, estado: tap.ctx.state })
  }
  window.addEventListener('pointerdown', marcar('down'), true)
  window.addEventListener('pointerup', marcar('up'), true)
  window.addEventListener('keydown', marcar('down'), true)
  window.addEventListener('keyup', marcar('up'), true)
}

/**
 * samples: 'no' (fallan -> sintetizador de respaldo) | 'si' (senos de prueba -> Sampler)
 */
export async function abrir({ tema = 'claro', samples = 'no', progreso = null, opciones = {}, ruta = '' } = {}) {
  const browser = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] })
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
    colorScheme: tema === 'oscuro' ? 'dark' : 'light',
  })
  const page = await context.newPage()
  const errores = []
  const avisos = []
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text())
    if (m.type() === 'warning') avisos.push(m.text())
  })
  page.on('pageerror', (e) => errores.push('pageerror: ' + e.message))
  await page.route('https://tonejs.github.io/**', (route) => {
    if (samples === 'no') return route.abort()
    const nombre = route.request().url().split('/').pop()
    return route.fulfill({ status: 200, contentType: 'audio/wav', headers: { 'access-control-allow-origin': '*' }, body: wavSeno(hzDeArchivo(nombre)) })
  })
  await page.addInitScript(SONDA)
  await page.addInitScript(
    ([op, pr]) => {
      localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify(op))
      if (pr) localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify(pr))
    },
    [{ tema, ...opciones }, progreso],
  )
  await page.goto(BASE + ruta)
  const cdp = await context.newCDPSession(page)
  return { browser, page, cdp, errores, avisos }
}

export const espera = (ms) => new Promise((r) => setTimeout(r, ms))

/** Centro (parte baja) de una tecla. */
export async function tecla(page, nota) {
  const el = page.locator(`[data-note="${nota}"]`).first()
  await el.scrollIntoViewIfNeeded()
  const b = await el.boundingBox()
  if (!b) throw new Error('No encuentro la tecla ' + nota)
  return { x: b.x + b.width / 2, y: b.y + b.height * 0.85 }
}

/** Toque real (CDP): apoya el dedo, espera `ms` y lo suelta. Con ms = 0, suelta en seguida. */
export async function toque(cdp, puntos, ms = 0) {
  const lista = Array.isArray(puntos) ? puntos : [puntos]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: lista.map((p, i) => ({ x: p.x, y: p.y, id: i + 1 })) })
  if (ms) await espera(ms)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

export const marca = (page) => page.evaluate(() => ({ t: window.__tap.ctx?.currentTime ?? null, picos: window.__tap.picos.length, eventos: window.__tap.eventos.length }))

/** Desde una marca: primer bloque con sonido, pico máximo y eventos. */
export const desde = (page, m, umbral = 0.01) =>
  page.evaluate(
    ([m, umbral]) => {
      const picos = window.__tap.picos.slice(m.picos)
      const eventos = window.__tap.eventos.slice(m.eventos)
      const primero = picos.find(([, p]) => p > umbral)
      let ultimo = null
      for (const [t, p] of picos) if (p > umbral) ultimo = t
      return { inicio: primero ? primero[0] : null, fin: ultimo, max: picos.reduce((a, [, p]) => Math.max(a, p), 0), eventos, ahora: window.__tap.ctx.currentTime }
    },
    [m, umbral],
  )

/** Pico máximo de los últimos `ms` de audio. */
export const picoReciente = (page, ms = 200) =>
  page.evaluate((ms) => {
    const t = window.__tap.ctx.currentTime - ms / 1000
    return window.__tap.picos.filter(([x]) => x >= t).reduce((a, [, p]) => Math.max(a, p), 0)
  }, ms)

export const motor = (page, fn, ...args) =>
  page.evaluate(
    async ([fn, args]) => {
      const m = await import('/teoria-musical/src/audio/engine.js')
      return m[fn](...args)
    },
    [fn, args],
  )

export const ms = (s) => (s == null ? null : Math.round(s * 1000 * 10) / 10)
