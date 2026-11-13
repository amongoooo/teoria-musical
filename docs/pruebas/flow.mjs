// Prueba el flow (pestaña «Flow» de una letra) a 375 px en claro y oscuro: ejemplo → Flow → verso 1 (16 casillas) →
// Repartir (acentos en el pulso) → Escuchar (casilla que suena) → grabar tocando el pad en corcheas tras la cuenta →
// guardado en la letra → mover una sílaba → verso siguiente.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/flow.mjs [carpeta-de-capturas]
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

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/flow-${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  await page.addInitScript((tema) => {
    if (sessionStorage.getItem('iniciado')) return
    sessionStorage.setItem('iniciado', '1')
    localStorage.clear()
    localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
  }, tema)

  await page.goto(BASE + '#/letras')
  await page.click('[data-ejemplo]')
  await page.waitForSelector('[data-estrofa]')
  await page.click('[role="radio"]:has-text("Flow")')
  await page.waitForSelector('[data-flow]')
  await espera(500)
  const flow = page.locator('[data-flow]')
  comprobar(r, 'casillas', (await page.getAttribute('[data-rejilla]', 'data-rejilla')) === '16')
  await foto('1-vacio')

  await page.click('[data-repartir]')
  await espera(400)
  const n = Number(await flow.getAttribute('data-colocadas'))
  comprobar(r, 'repartir', n === 11, String(n))
  comprobar(r, 'acentos', (await page.locator('[data-acentos]').count()) === 1)
  await page.click('[data-escuchar-flow]')
  await espera(1200)
  comprobar(r, 'suena', (await flow.getAttribute('data-modo')) === 'sonando' && (await page.locator('[data-casilla].ring-4').count()) === 1)
  await foto('2-escuchar')
  await page.click('[data-escuchar-flow]')
  await espera(300)

  // Grabar: el pad empieza la cuenta (un compás a 90 BPM = 2,67 s); luego una sílaba por semicorchea (0,167 s).
  const pad = page.locator('[data-pad-flow]')
  const caja = await pad.boundingBox()
  const x = caja.x + caja.width / 2
  const y = caja.y + caja.height / 2
  await page.mouse.click(x, y)
  await espera(400)
  comprobar(r, 'grabando', (await flow.getAttribute('data-modo')) === 'grabando')
  await foto('3-cuenta')
  const inicio = Date.now() + 2667 - 400 - 30
  for (let i = 0; i < 11; i++) {
    await espera(Math.max(0, inicio + i * 167 - Date.now()))
    await page.mouse.click(x, y)
  }
  await foto('4-grabando')
  await page.waitForFunction(() => document.querySelector('[data-flow]')?.dataset.modo === 'quieto', null, { timeout: 8000 })
  const grabadas = await page.$$eval('[data-silaba]', (es) => es.map((e) => Number(e.dataset.casilla)))
  const pasos = grabadas.slice(1).map((c, i) => c - grabadas[i])
  comprobar(r, 'grabado', grabadas.length === 11 && pasos.filter((p) => p === 1).length >= 7, grabadas.join(','))
  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('teoria-musical:letras:v1')).letras[0].flows)
  comprobar(r, 'guardado', guardado && Object.values(guardado)[0].c.length === 11)
  await foto('5-grabado')

  // Mover la última sílaba a la casilla 15
  const ultima = grabadas.at(-1)
  if (ultima < 15) {
    await page.click(`[data-casilla="${ultima}"]`)
    await espera(250)
    await foto('6-elegida')
    await page.click('[data-casilla="15"]')
    await espera(300)
    comprobar(r, 'mover', (await page.getAttribute('[data-casilla="15"]', 'data-silaba')) !== null)
  }

  await page.click('[aria-label="Verso siguiente"]')
  await espera(400)
  comprobar(r, 'otroVerso', (await page.getAttribute('[data-elegir-verso]', 'data-elegir-verso')) === '1')

  comprobar(r, 'sinErrores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `✗ ${fallos} fallos` : '✓ todo bien')
process.exitCode = fallos ? 1 : 0
