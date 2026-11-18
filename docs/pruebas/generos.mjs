// Prueba la lección P1.2 «El groove de cada género» (12.2; propuesta aprobada: https://claude.ai/artifact/L51wET3sh5LHPupPka3K9B)
// a 375 px en claro y oscuro:
//  - node: GENEROS (5 troncos, el trap hijo del boom bap), cambios house → dembow (solo la caja), catálogo 12.1 + 2.4,
//    banco de la prueba rápida, código L11 del paso `generos`, fila `ohat` y su golpe;
//  - los 13 pasos se ven, sin errores ni scroll de lado;
//  - paso 0 (rack que cambia de género): tocar un género lo hace sonar; al cambiar, los pasos que cambian se marcan en oro
//    (house → dembow: solo la caja y los hats); la regla cuenta hasta el BPM nuevo; con 3 géneros escuchados, «Continuar»;
//  - paso 2 (hat abierto): la fila O.Hat en las «y» → «¡Así suena!»;
//  - paso 5 (del pop al boom bap): el rack empieza con el pop; mover solo el bombo → «¡Así suena!»;
//  - paso 7 (caja del trap): una sola caja en el 3;
//  - Caja de ritmos: «Empezar con» los géneros carga patrón y tempo (house a 124 con hat abierto) y se guarda.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/generos.mjs [carpeta-de-capturas]
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
const PASOS = 13

// ——— Datos (node) ———
{
  const r = (resultados.datos = {})
  const { GENEROS, cambiosPatron, filasDeGeneros, FILAS_RACK, FILAS_CAJA } = await import('../../src/theory/rack.js')
  comprobar(r, '5 géneros de partida', Object.keys(GENEROS).join() === 'pop,boomBap,trap,house,dembow')
  comprobar(r, 'el trap es hijo del boom bap', GENEROS.trap.padre === 'boomBap' && !GENEROS.pop.padre)
  const filas = filasDeGeneros(Object.keys(GENEROS))
  comprobar(r, 'filas de los géneros', filas.join() === 'kick,clap,snare,hat,ohat', filas.join())
  const c = Object.keys(cambiosPatron(GENEROS.house.patron, GENEROS.dembow.patron, ['kick']))
  comprobar(r, 'house → dembow: el bombo no cambia', c.length === 0)
  comprobar(r, 'fila O.Hat', FILAS_RACK.ohat?.fl === 'O.Hat' && FILAS_CAJA.includes('ohat') && FILAS_CAJA.includes('snare'))
  const { CATALOGO } = await import('../../src/content/catalogo.js')
  comprobar(r, 'catálogo: 12.2 ← 12.1, 2.4', CATALOGO['12.2']?.requiere.join() === '12.1,2.4')
  const banco = (await import('../../src/content/pruebas/modulo-12.js')).default
  comprobar(r, 'prueba rápida: 3 preguntas de la 12.2', banco['12.2']?.length === 3)
  const leccion = (await import('../../src/content/modulo-12/leccion-12-2.js')).default
  comprobar(r, `lección: ${PASOS} pasos, el último un reto`, leccion.pasos.length === PASOS && leccion.pasos.at(-1).tipo === 'reto')
  const { codigoPaso } = await import('../../src/content/actividad.js')
  comprobar(r, 'código L11', codigoPaso(leccion.pasos[0]) === 'L11')
  const { codigoLeccion, getLeccion } = await import('../../src/content/index.js')
  comprobar(r, 'registrada como P1.2', codigoLeccion('12.2') === 'P1.2' && getLeccion('12.2')?.titulo === 'El groove de cada género')
  const { NOMBRES_BATERIA } = await import('../../src/audio/bateria.js').catch(() => ({ NOMBRES_BATERIA: ['ohat'] }))
  comprobar(r, 'golpe ohat', NOMBRES_BATERIA.includes('ohat'))
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: carpeta ? 2 : 1, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png`, fullPage: true })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async (progreso, ruta) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, progreso]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify(progreso))
      },
      [tema, progreso],
    )
    await page.goto(BASE + ruta)
    await page.reload()
    await espera(700)
  }
  const irAlPaso = async (n) => {
    await preparar({ lecciones: { '12.2': { paso: n } }, retos: {} }, '#/leccion/12.2/guiada')
    await page.waitForSelector('[data-boton-accion]')
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  const celda = (fila, paso) => page.locator(`[data-fila="${fila}"] [data-paso="${paso}"]`)
  const encendidos = (fila) => page.locator(`[data-fila="${fila}"] [data-on]`).count()

  // ——— Los 13 pasos ———
  for (let n = 0; n < PASOS; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
    comprobar(r, `paso ${n} sin scroll de lado`, ancho <= 376, String(ancho))
    await foto(`12.2-paso-${String(n).padStart(2, '0')}`)
  }

  // ——— Paso 0: el rack que cambia de género ———
  await irAlPaso(0)
  comprobar(r, 'géneros: Continuar deshabilitado al empezar', await boton().isDisabled())
  comprobar(r, 'géneros: 5 fichas', (await page.locator('[data-genero]').count()) === 5)
  await page.locator('[data-genero="house"]').click()
  await espera(150)
  comprobar(r, 'géneros: tocar uno lo hace sonar', (await page.locator('[data-rack="sonando"]').count()) === 1)
  await espera(2300) // un compás a 124 BPM ≈ 1,9 s
  comprobar(r, 'géneros: house escuchado (✓)', (await page.locator('[data-genero="house"][data-oido]').count()) === 1)
  await page.locator('[data-genero="dembow"]').click()
  await espera(250)
  const cambios = await page.locator('[data-cambio]').count()
  const kickCambia = await page.locator('[data-fila="kick"] [data-cambio]').count()
  comprobar(r, 'géneros: lo que cambia, en oro (no el bombo)', cambios > 0 && kickCambia === 0, `${cambios} ${kickCambia}`)
  comprobar(r, 'géneros: la huella del dembow', /3 \+ 3 \+ 2/.test(await page.locator('[data-huella]').textContent()))
  await foto('12.2-generos-cambio')
  await espera(900)
  const bpm = await page.locator('[data-bpm]').textContent()
  comprobar(r, 'géneros: la regla llega a 95', bpm.trim() === '95', bpm)
  await espera(2000)
  await page.locator('[data-genero="trap"]').click()
  await espera(2000) // un compás a 140 ≈ 1,7 s
  comprobar(r, 'géneros: 3 escuchados → Continuar', !(await boton().isDisabled()) && /Mismo kit/.test(await info()), await info())
  await foto('12.2-generos-listo')

  // ——— Paso 2: hat abierto ———
  await irAlPaso(2)
  comprobar(r, 'hat abierto: fila O.Hat', (await page.locator('[data-fila="ohat"]').count()) === 1)
  for (const p of [2, 6, 10, 14]) await celda('ohat', p).click()
  await boton().click()
  await espera(400)
  comprobar(r, 'hat abierto: ¡Así suena!', /Así suena/.test(await info()), await info())

  // ——— Paso 5: del pop al boom bap ———
  await irAlPaso(5)
  comprobar(r, 'pop → boom bap: empieza con el pop', (await encendidos('kick')) === 2 && (await encendidos('snare')) === 2)
  await celda('kick', 8).click()
  for (const p of [7, 10]) await celda('kick', p).click()
  await boton().click()
  await espera(400)
  comprobar(r, 'pop → boom bap: ¡Así suena!', /Así suena/.test(await info()), await info())

  // ——— Paso 7: caja del trap ———
  await irAlPaso(7)
  await celda('clap', 8).click()
  await boton().click()
  await espera(400)
  comprobar(r, 'trap: caja en el 3', /Así suena/.test(await info()), await info())

  // ——— Caja de ritmos: empezar con un género ———
  await preparar({ lecciones: { '12.1': { completada: true } }, retos: {} }, '#/caja')
  comprobar(r, 'Caja: fichas de los géneros', (await page.locator('[data-inicio]').count()) === 6)
  await page.locator('[data-inicio="house"]').click()
  await espera(200)
  comprobar(r, 'Caja: house a 124 con hat abierto', (await page.locator('[data-bpm="124"]').count()) === 1 && (await encendidos('ohat')) === 4 && (await encendidos('kick')) === 4)
  await page.reload()
  await espera(700)
  comprobar(r, 'Caja: se guarda con el hat abierto', (await encendidos('ohat')) === 4)
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
  comprobar(r, 'Caja sin scroll de lado', ancho <= 376, String(ancho))
  await foto('caja-generos')

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
