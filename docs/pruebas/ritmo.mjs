// Prueba el entrenamiento de ritmo a 375 px en claro y oscuro (sintetizador de respaldo):
//  Inicio (bloque Ritmo) → panel → arranque de Seguir → una ronda buena (sube de nivel) → una fallida (pierde una
//  vida) → Eco: arranque, demo, una ronda buena y una fallida (le faltan golpes).
// Los toques se dan a la hora exacta con `window.__ritmo` (solo existe en desarrollo).
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/ritmo.mjs [carpeta-de-capturas]
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')

const BASE = process.env.BASE || 'http://localhost:5199/teoria-musical/'
const carpeta = process.argv[2] || null
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
const resultados = {}
let fallos = 0
const comprobar = (r, nombre, ok, detalle = '') => {
  r[nombre] = ok ? 'ok' : `FALLA ${detalle}`
  if (!ok) fallos++
}

const RITMO = {
  version: 1,
  dias: {},
  mejorRacha: 0,
  // Con 9 rondas buenas en la ventana (8 de las últimas 10 aprueban): la primera ronda buena sube de nivel. 3 vidas.
  modos: {
    seguir: { v: 2, nivel: 1, nivelMax: 1, ventana: Array.from({ length: 9 }, () => ({ b: true, e: 'negras', d: 1 })), ajustes: { vidas: 3 } },
    eco: { v: 2, nivel: 1, nivelMax: 1, ventana: Array.from({ length: 9 }, () => ({ b: true, e: 'negras', d: 1 })), ajustes: { vidas: 3 } },
  },
}

/** Toca los golpes de los compases `ks` de la ronda que suena (desfases en s, en ciclo; `solo` = cuántos). */
async function tocar(page, { ks, desfases = [0], solo = null }) {
  return page.evaluate(
    async ({ ks, desfases, solo }) => {
      const R = window.__ritmo
      const { pista, ronda } = R
      const pad = document.querySelector('[data-pad]')
      let lista = ks.flatMap((k) => ronda.patron.map((c) => (k * 4 + c / ronda.porTiempo) * pista.pulso))
      lista = lista.map((t, i) => t + desfases[i % desfases.length])
      if (solo != null) lista = lista.slice(0, solo)
      for (const t of lista) {
        const meta = pista.inicio + t + R.latenciaAudio()
        while (R.tiempoAudio() < meta - 0.02) await new Promise((r) => setTimeout(r, 4))
        while (R.tiempoAudio() < meta) {
          /* espera activa: unos ms */
        }
        pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', isPrimary: true }))
      }
      return { patron: ronda.patron, porTiempo: ronda.porTiempo, bpm: ronda.bpm, toques: lista.length }
    },
    { ks, desfases, solo },
  )
}

const esperarRonda = (page, n) => page.waitForFunction((n) => window.__ritmo?.ronda.n === n, n)
const evaluada = (page) => page.waitForSelector('[data-fase="evaluada"]', { timeout: 30000 })
const foto = (page, nombre, tema) => carpeta && page.screenshot({ path: `${carpeta}/ritmo-${nombre}-${tema}.png` })
const boton = (page, nombre) => page.locator('[data-barra-accion] button', { hasText: nombre }).first()

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  await page.addInitScript(
    ({ tema, ritmo }) => {
      if (sessionStorage.getItem('iniciado')) return
      sessionStorage.setItem('iniciado', '1')
      localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
      localStorage.setItem('teoria-musical:ritmo:v1', JSON.stringify(ritmo))
    },
    { tema, ritmo: RITMO },
  )

  // Entrenar › Ritmo: «tu día» lleva al panel.
  await page.goto(BASE + '#/entrenar/ritmo')
  const bloque = page.locator('[data-panel-entrenar="ritmo"]')
  await bloque.waitFor()
  await bloque.scrollIntoViewIfNeeded()
  await espera(900)
  comprobar(r, 'inicioBloqueReal', (await bloque.getAttribute('href'))?.includes('#/ritmo'))
  await foto(page, '1-inicio', tema)
  await bloque.click()
  await page.waitForSelector('[data-ejercicio="seguir"]')
  await espera(700)
  await foto(page, '2-panel', tema)

  // Seguir: arranque.
  await page.click('[data-ejercicio="seguir"]')
  await boton(page, 'Empezar').waitFor()
  await espera(900)
  await foto(page, '3-arranque-seguir', tema)

  // Ronda buena (sube de nivel).
  await boton(page, 'Empezar').click()
  await esperarRonda(page, 1)
  await espera(700)
  await foto(page, '4-seguir-entrada', tema)
  const p1 = tocar(page, { ks: [1, 2], desfases: [0.01, -0.02, 0.015] })
  await page.waitForSelector('[data-pad="toca"]')
  comprobar(r, 'bocinaApagadaJugando', await page.locator('[data-escuchar]').isDisabled())
  // Guía del medidor: la barra vertical cruza la línea en cada golpe (se mide unos fotogramas).
  const guias = await page.evaluate(async () => {
    const vistos = []
    for (let i = 0; i < 40; i++) {
      const g = document.querySelector('[data-guia]')
      if (g?.dataset.guia && Number(g.style.opacity) > 0.5) vistos.push(Number(g.dataset.guia))
      await new Promise((r) => setTimeout(r, 25))
    }
    return vistos
  })
  comprobar(r, 'guiaBarre', guias.length > 3 && Math.min(...guias) < Math.max(...guias), JSON.stringify(guias))
  await espera(1500)
  await foto(page, '5-seguir-tocando', tema)
  const info1 = await p1
  await evaluada(page)
  await espera(600)
  const fb1 = await page.locator('[data-barra-accion]').innerText()
  comprobar(r, 'seguirBuena', /Clavado|A tiempo/.test(fb1), fb1)
  comprobar(r, 'seguirSubio', /Subiste/.test(fb1) && (await page.getAttribute('[data-nivel]', 'data-nivel')) === '2', fb1)
  r.ronda1 = info1
  await foto(page, '6-seguir-buena', tema)

  // Bocina con el turno terminado: la app toca la respuesta en el pad (se ilumina en cada golpe).
  comprobar(r, 'bocinaListaEvaluada', !(await page.locator('[data-escuchar]').isDisabled()))
  await page.click('[data-escuchar]')
  await page.waitForSelector('[data-repaso] [data-pad="respuesta"]', { timeout: 8000 })
  const conGolpes = await page
    .waitForFunction(() => Number(document.querySelector('[data-pad]')?.dataset.destellos) > 0, null, { timeout: 5000 })
    .then(() => true, () => false)
  comprobar(r, 'respuestaEnElPad', conGolpes)
  await foto(page, '6b-seguir-respuesta', tema)

  // Ronda fallida (pierde una vida). Subió de nivel: esta ronda sí entra con transición (otro bloque).
  const bloque1 = await page.locator('[data-ronda]').elementHandle()
  await boton(page, 'Continuar').click()
  await esperarRonda(page, 2)
  comprobar(r, 'transicionAlSubir', !(await bloque1.evaluate((el) => el.isConnected && el.dataset.ronda === '2')))
  await tocar(page, { ks: [1, 2], desfases: [0.17, -0.17] })
  await evaluada(page)
  await espera(900)
  const fb2 = await page.locator('[data-barra-accion]').innerText()
  const vidas = await page.getAttribute('[data-vidas]', 'data-vidas')
  const golpesVidrio = await page.getAttribute('[data-golpes]', 'data-golpes')
  comprobar(r, 'seguirFallida', /a tiempo\./.test(fb2) && /adelantaste|atrasaste/.test(fb2), fb2)
  comprobar(r, 'perdioVida', vidas === '2' && golpesVidrio === '1', `vidas ${vidas}, golpes ${golpesVidrio}`)
  await page.evaluate(() => window.scrollTo(0, 0))
  await foto(page, '7-seguir-fallida', tema)

  // Misma ronda de nivel: sin transición (el mismo bloque, solo cambian las casillas).
  const bloque2 = await page.locator('[data-ronda]').elementHandle()
  await boton(page, 'Continuar').click()
  await esperarRonda(page, 3)
  await espera(300)
  comprobar(r, 'sinTransicion', await bloque2.evaluate((el) => el.isConnected && el.dataset.ronda === '3'))

  // Eco: arranque → demo → ronda buena (sube) → ronda fallida.
  await page.goto(BASE + '#/ritmo/eco')
  await boton(page, 'Empezar').waitFor()
  await espera(900)
  await foto(page, '8-arranque-eco', tema)
  await page.evaluate(() => (window.__ritmo = null)) // el entrenador de Eco cuenta sus rondas desde 1
  const n0 = 0
  await boton(page, 'Empezar').click()
  await esperarRonda(page, n0 + 1)
  await page.waitForSelector('[data-pad="demo"]')
  await espera(900)
  comprobar(r, 'ecoPatronOculto', (await page.locator('[data-objetivo]').count()) === 0)
  comprobar(r, 'ecoSeguimiento', Number(await page.getAttribute('[data-pad-seguimiento]', 'data-destellos')) > 0)
  comprobar(r, 'ecoBocinaApagada', await page.locator('[data-escuchar]').isDisabled())
  await foto(page, '9-eco-escucha', tema)
  await tocar(page, { ks: [2], desfases: [0.01, -0.01] })
  await evaluada(page)
  await espera(600)
  const fb3 = await page.locator('[data-barra-accion]').innerText()
  comprobar(r, 'ecoBuena', /Clavado|A tiempo/.test(fb3) && /Subiste/.test(fb3), fb3)
  comprobar(r, 'ecoPatronVisible', (await page.locator('[data-objetivo]').count()) > 0)
  await foto(page, '10-eco-buena', tema)

  await boton(page, 'Continuar').click()
  await esperarRonda(page, n0 + 2)
  await tocar(page, { ks: [2], solo: 1 })
  await evaluada(page)
  await espera(900)
  const fb4 = await page.locator('[data-barra-accion]').innerText()
  comprobar(r, 'ecoFallida', /faltó|faltaron/.test(fb4), fb4)
  await foto(page, '11-eco-fallida', tema)

  // Bocina tras evaluar: pregunta (pad de seguimiento) y respuesta (tu pad), sin evaluar.
  await page.click('[data-escuchar]')
  await page.waitForSelector('[data-repaso]')
  await page.waitForSelector('[data-pad="demo"]', { timeout: 8000 })
  await page.waitForSelector('[data-pad="respuesta"]', { timeout: 8000 })
  const conRespuesta = await page
    .waitForFunction(() => Number(document.querySelector('[data-pad]')?.dataset.destellos) > 0, null, { timeout: 5000 })
    .then(() => true, () => false)
  comprobar(r, 'repaso', conRespuesta)
  await foto(page, '12-eco-respuesta', tema)

  comprobar(r, 'sinErrores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
process.exit(fallos ? 1 : 0)
