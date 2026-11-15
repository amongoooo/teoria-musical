// Prueba la regla única de los niveles y el dominio por dificultad (plan de niveles y dificultad, 2026-11) a 375 px
// en claro y oscuro:
//  - Acordes con datos de ANTES (niveles = arpegio, solo el acorde, invertidos): se migra (nivel 2 «+ Disminuido»
//    abierto, el 1 superado con dificultad 2, la forma de sonar elegida pasa a la Dificultad «Sonido»), y la rueda de
//    Nivel enseña los puntitos de dominio.
//  - Acordes: las séptimas (nivel 4) con candado hasta la lección 5.2 aunque ya se hubieran alcanzado.
//  - Intervalos: con 9 aciertos en la ventana (y la 5.ª justa 2 veces), la siguiente respuesta buena aprueba el nivel
//    1 («¡Subiste…!», Nivel 2, el dominio se guarda con la dificultad).
//  - Ritmo: el bloque Tempo (Lento · Normal · Rápido), con Normal elegido.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/dominio.mjs [carpeta-de-capturas]
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
const ventana = (lista) => lista.map((e) => ({ b: true, e, d: 1 }))

async function abrir(browser, tema, { opciones = {}, oido = {}, ritmo = {} }) {
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  await page.addInitScript(
    ({ opciones, oido, ritmo }) => {
      if (sessionStorage.getItem('iniciado')) return
      sessionStorage.setItem('iniciado', '1')
      localStorage.clear()
      localStorage.setItem('teoria-musical:opciones:v1', opciones)
      localStorage.setItem('teoria-musical:oido:v1', oido)
      localStorage.setItem('teoria-musical:ritmo:v1', ritmo)
    },
    { opciones: JSON.stringify({ tema, ...opciones }), oido: entrenamiento(oido), ritmo: entrenamiento(ritmo) },
  )
  return { page, errores }
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch()
  const foto = (page, n) => carpeta && page.screenshot({ path: `${carpeta}/dominio-${n}-${tema}.png` })

  // 1) Acordes con datos de antes: llegó a «invertidos» (nivel 3) y tenía elegido ese nivel.
  {
    const { page, errores } = await abrir(browser, tema, { oido: { acordes: { nivel: 3, nivelMax: 3, ajustes: { octavas: 1 } } } })
    await page.goto(BASE + '#/oido/acordes')
    await page.click('[data-boton-configurar]')
    await page.waitForSelector('[data-rueda="nivel"]')
    await espera(700)
    comprobar(r, 'acordes: nivel 2 elegido', (await page.getAttribute('[data-rueda="nivel"]', 'data-posicion')) === '2')
    comprobar(r, 'acordes: dificultad 3 (la forma de sonar de antes)', (await page.getAttribute('[data-rueda="dificultad"]', 'data-posicion')) === '3')
    comprobar(r, 'acordes: nivel 1 superado con dificultad 2', (await page.locator('[data-rueda="nivel"] [data-valor="1"] [data-dominio="2"]').count()) === 1)
    comprobar(r, 'acordes: la rueda se llama «Sonido»', /Sonido/i.test(await page.locator('[data-medidores]').innerText()))
    const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('teoria-musical:oido:v1')).modos.acordes)
    await page.evaluate(() => window.scrollBy(0, document.querySelector('[data-medidores]').getBoundingClientRect().top - 120))
    await espera(400)
    await foto(page, '1-acordes-migrado')
    // Empezar: opciones de nivel 2 = Mayor, Menor y Disminuido.
    await boton(page, 'Empezar').click()
    await page.waitForSelector('main .grid button')
    const opciones = await page.locator('main .grid button').allInnerTexts()
    comprobar(r, 'acordes: 3 opciones (mayor, menor, disminuido)', opciones.length === 3 && opciones.some((t) => /Disminuido/.test(t)), opciones.join(','))
    await page.locator('main .grid button').first().click()
    await espera(500)
    const despues = await page.evaluate(() => JSON.parse(localStorage.getItem('teoria-musical:oido:v1')).modos.acordes)
    comprobar(r, 'acordes: se guarda migrado (v 2, legado 3)', despues.v === 2 && despues.legado === 3 && despues.superado?.['1'] === 2, JSON.stringify(despues))
    comprobar(r, 'acordes: la ventana guarda la dificultad', despues.ventana?.[0]?.d === 3, JSON.stringify(despues.ventana))
    comprobar(r, 'acordes: sin errores', !errores.length, errores.join(' | '))
    void guardado
    await page.close()
  }

  // 2) Acordes: el nivel 4 (séptimas) espera a la lección 5.2.
  {
    const { page, errores } = await abrir(browser, tema, { oido: { acordes: { v: 2, nivel: 4, nivelMax: 4, superado: { 1: 1, 2: 1, 3: 1 }, ajustes: {} } } })
    await page.goto(BASE + '#/oido/acordes')
    await page.click('[data-boton-configurar]')
    await page.waitForSelector('[data-rueda="nivel"]')
    await espera(700)
    comprobar(r, 'séptimas: se queda en el nivel 3', (await page.getAttribute('[data-rueda="nivel"]', 'data-posicion')) === '3')
    comprobar(r, 'séptimas: el máximo elegible es 3', (await page.getAttribute('[data-rueda="nivel"]', 'aria-valuemax')) === '3')
    comprobar(r, 'séptimas: sin errores', !errores.length, errores.join(' | '))
    await page.close()
  }

  // 3) Intervalos (modo administrador: la respuesta se señala al sonar): la siguiente buena aprueba el nivel 1.
  {
    const { page, errores } = await abrir(browser, tema, {
      opciones: { admin: true },
      oido: { intervalos: { v: 2, nivel: 1, nivelMax: 1, ventana: ventana(['3M', '3M', '5J', '3M', '3M', '5J', '3M', '3M', '3M']), ajustes: {} } },
    })
    await page.goto(BASE + '#/oido/intervalos')
    await boton(page, 'Empezar').click()
    await page.waitForSelector('main [data-pista]', { timeout: 15000 })
    await page.locator('main [data-pista]').first().click()
    await espera(600)
    const texto = await page.locator('[data-barra-accion]').innerText()
    comprobar(r, 'intervalos: «¡Subiste…!»', /Subiste/.test(texto), texto)
    comprobar(r, 'intervalos: Nivel 2', (await page.getAttribute('[data-nivel]', 'data-nivel')) === '2')
    const m = await page.evaluate(() => JSON.parse(localStorage.getItem('teoria-musical:oido:v1')).modos.intervalos)
    comprobar(r, 'intervalos: superado[1] = 1', m.superado?.['1'] === 1 && m.nivelMax === 2, JSON.stringify(m.superado))
    await foto(page, '2-intervalos-sube')
    comprobar(r, 'intervalos: sin errores', !errores.length, errores.join(' | '))
    await page.close()
  }

  // 4) Ritmo: bloque Tempo.
  {
    const { page, errores } = await abrir(browser, tema, {})
    await page.goto(BASE + '#/ritmo/seguir')
    await page.waitForSelector('[data-bloque="tempo:normal"]')
    comprobar(r, 'ritmo: tempo Normal elegido', (await page.getAttribute('[data-bloque="tempo:normal"]', 'aria-checked')) === 'true')
    await page.click('[data-bloque="tempo:lento"]')
    await espera(300)
    const t = await page.evaluate(() => JSON.parse(localStorage.getItem('teoria-musical:ritmo:v1')).modos.seguir.ajustes.tempo)
    comprobar(r, 'ritmo: se guarda «lento»', t === 'lento', String(t))
    await page.locator('[data-bloque="tempo:lento"]').scrollIntoViewIfNeeded()
    await foto(page, '3-ritmo-tempo')
    await boton(page, 'Empezar').click()
    await page.waitForFunction(() => window.__ritmo?.ronda?.n === 1)
    const bpm = await page.evaluate(() => window.__ritmo.ronda.bpm)
    comprobar(r, 'ritmo: lento = 56 bpm (70 × 0,8)', bpm === 56, String(bpm))
    comprobar(r, 'ritmo: sin errores', !errores.length, errores.join(' | '))
    await page.close()
  }

  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'todo bien')
process.exit(fallos ? 1 : 0)
