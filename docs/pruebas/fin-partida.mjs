// Prueba la pantalla de fin de partida (oído y ritmo, con 1 vida), los botones translúcidos de la barra de abajo, los
// títulos de los carruseles de Rápido / Contrarreloj y la rueda del mouse (5 muescas = 5 pasos), a 375 px en claro y
// oscuro. Uso: npm run dev -- --port 5199   y   node docs/pruebas/fin-partida.mjs [carpeta-de-capturas]
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
const boton = (page, nombre) => page.locator('[data-barra-accion] button', { hasText: nombre }).first()
const entrenamiento = (modos) => JSON.stringify({ version: 1, dias: {}, mejorRacha: 0, modos })

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/fin-${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  await page.addInitScript(
    ({ tema, oido, ritmo }) => {
      if (sessionStorage.getItem('iniciado')) return
      sessionStorage.setItem('iniciado', '1')
      localStorage.clear()
      localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
      localStorage.setItem('teoria-musical:oido:v1', oido)
      localStorage.setItem('teoria-musical:ritmo:v1', ritmo)
    },
    {
      tema,
      oido: entrenamiento({ intervalos: { nivel: 2, nivelMax: 2, ajustes: { vidas: 1 } } }),
      ritmo: entrenamiento({ seguir: { nivel: 1, nivelMax: 1, ajustes: { vidas: 1 } } }),
    },
  )

  // Oído (intervalos, 1 vida): se responde hasta fallar.
  await page.goto(BASE + '#/oido/intervalos')
  await boton(page, 'Empezar').click()
  let texto = ''
  for (let i = 0; i < 12; i++) {
    await page.waitForSelector('main .grid button:not([disabled])', { timeout: 10000 })
    await espera(300)
    await page.locator('main .grid button').first().click()
    await espera(500)
    texto = await page.locator('[data-barra-accion]').innerText()
    if (i === 0) await foto('1-barra-translucida')
    if (/vidas/.test(texto)) break
    await boton(page, 'Continuar').click()
  }
  comprobar(r, 'tarjetaInfo', (await page.locator('[data-tarjeta-info]').count()) === 1)
  comprobar(r, 'translucido', (await page.locator('[data-translucido]').count()) === 1)
  comprobar(r, 'sinVidas', /Se acabaron las vidas/.test(texto), texto)
  await boton(page, 'Continuar').click()
  await page.waitForSelector('[data-fin-partida]')
  await espera(1000)
  const aciertos = await page.locator('[data-dato-fin="aciertos"]').innerText()
  comprobar(r, 'finOido', /\d+\/\d+/.test(aciertos), aciertos)
  await foto('2-fin-oido')
  await boton(page, 'Continuar').click()
  await page.waitForFunction(() => location.hash === '#/oido')
  comprobar(r, 'vuelvePanel', true)

  // Ritmo (Seguir, 1 vida): una ronda tocando fuera de tiempo.
  await page.goto(BASE + '#/ritmo/seguir')
  await boton(page, 'Empezar').click()
  await page.waitForFunction(() => window.__ritmo?.ronda?.n === 1)
  await page.evaluate(async () => {
    const R = window.__ritmo
    const pad = document.querySelector('[data-pad]')
    // Alternando adelantado y atrasado (todo igual de tarde se tomaría como retraso del dispositivo).
    const lista = [1, 2].flatMap((k) => R.ronda.patron.map((c, i) => (k * 4 + c / R.ronda.porTiempo) * R.pista.pulso + (i % 2 ? -0.19 : 0.19)))
    for (const t of lista) {
      const meta = R.pista.inicio + t + R.latenciaAudio()
      while (R.tiempoAudio() < meta) await new Promise((res) => setTimeout(res, 4))
      pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', isPrimary: true }))
    }
  })
  await page.waitForSelector('[data-fase="evaluada"]', { timeout: 30000 })
  await espera(500)
  const textoRitmo = await page.locator('[data-barra-accion]').innerText()
  comprobar(r, 'ritmoSinVidas', /vidas/.test(textoRitmo), textoRitmo)
  await boton(page, 'Continuar').click()
  await page.waitForSelector('[data-fin-partida]')
  await espera(1000)
  await foto('3-fin-ritmo')
  await page.click('[data-otra-partida]')
  await boton(page, 'Empezar').waitFor()
  comprobar(r, 'otraPartida', true)

  // Oído absoluto, modo Rápido: título del carrusel y sin ícono; la rueda del mouse (5 muescas = 5 pasos).
  await page.goto(BASE + '#/oido/absoluto')
  await page.click('[data-boton-configurar]')
  await page.click('[data-juego="rapido"]')
  await page.waitForSelector('[data-ajuste="cadaAciertos"] [data-titulo-ajuste]')
  await page.locator('[data-ajuste]').scrollIntoViewIfNeeded()
  await espera(600)
  comprobar(r, 'tituloRapido', (await page.locator('[data-ajuste] [data-titulo-ajuste]').innerText()).length > 0)
  await foto('4-rapido')
  const rueda = page.locator('[data-rueda="cadaAciertos"]')
  const antes = Number(await rueda.getAttribute('data-posicion'))
  const caja = await rueda.boundingBox()
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2)
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 100)
    await espera(30)
  }
  await espera(900)
  const despues = Number(await rueda.getAttribute('data-posicion'))
  comprobar(r, 'rueda5', despues - antes === 5, `${antes} → ${despues}`)
  await page.click('[data-juego="contrarreloj"]')
  await page.waitForSelector('[data-ajuste="segundos"] [data-titulo-ajuste]')
  await espera(500)
  await foto('5-contrarreloj')

  comprobar(r, 'sinErrores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `✗ ${fallos} fallos` : '✓ todo bien')
process.exitCode = fallos ? 1 : 0
