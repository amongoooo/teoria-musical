// Prueba la lección 5.5 «I–vi–IV–V, ii–V–I y blues» a 375 px en claro y oscuro:
//  - los 16 pasos se ven, sin errores en la consola ni scroll de lado (las fichas y la rejilla caben);
//  - P8 «Construye las séptimas» (paso 5): Dm7 (`tipo: 'm7'`) → «¡Re menor séptima!»;
//  - P8 «El ii–V–I de Fa» (paso 7): el ii7 de Fa (G · B♭ · D · F) → «¡ii7 = Gm7!»;
//  - R2 «Las séptimas caen» (paso 8): Do · Si · Si arriba → «Perfecto»;
//  - L10 rejilla del blues (paso 9): 12 compases (C7 · F7 · G7), Escuchar enciende un compás y tocar el 5 lo enciende;
//  - node: acordeDeGrado con séptimas, banco de la prueba rápida, catálogo y tramo «Progresiones».
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/blues.mjs [carpeta-de-capturas]
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
const PASOS = 16

// ——— Datos (node) ———
{
  const r = (resultados.datos = {})
  const { acordeDeGrado } = await import('../../src/theory/acordes.js')
  const c = (t, rn) => acordeDeGrado(t, rn)?.cifrado
  comprobar(r, 'ii7 · V7 · Imaj7 de Do', [c('C4', 'ii7'), c('C4', 'V7'), c('C4', 'Imaj7')].join() === 'Dm7,G7,Cmaj7')
  comprobar(r, 'ii–V–I de Fa', [c('F4', 'ii7'), c('F4', 'V7'), c('F4', 'Imaj7')].join() === 'Gm7,C7,Fmaj7')
  comprobar(r, 'blues: I7 · IV7 · V7', [c('C4', 'I7'), c('C4', 'IV7'), c('C4', 'V7')].join() === 'C7,F7,G7')
  comprobar(r, 'V7 en menor sigue siendo E7', acordeDeGrado('A3', 'V7', { menor: true }).cifrado === 'E7')
  comprobar(r, 'tríadas sin cambio', c('G3', 'vi') === 'Em' && acordeDeGrado('C4', 'vii°')?.tipo === 'dis')
  const banco = (await import('../../src/content/pruebas/modulo-5.js')).default
  comprobar(r, 'prueba rápida: 3 preguntas de la 5.5', banco['5.5']?.length === 3)
  const { CATALOGO } = await import('../../src/content/catalogo.js')
  comprobar(r, 'catálogo: 5.5 ← 5.3, 5.4', JSON.stringify(CATALOGO['5.5']?.requiere) === '["5.3","5.4"]', JSON.stringify(CATALOGO['5.5']))
  const { TRAMOS } = await import('../../src/content/rutas.js')
  const paradas = TRAMOS.progresiones.paradas.map((p) => p.id ?? `${p.modo}:${p.nivel}`).join(' ')
  comprobar(r, 'tramo «Progresiones»: 5.4, Funciones 4, 5.5, Acordes 6', paradas === '5.4 funciones:4 5.5 acordes:6', paradas)
  const leccion = (await import('../../src/content/modulo-05/leccion-5-5.js')).default
  comprobar(r, `lección: ${PASOS} pasos, el último un reto`, leccion.pasos.length === PASOS && leccion.pasos.at(-1).tipo === 'reto')
  const rej = leccion.pasos[9].rejilla
  comprobar(r, 'rejilla: 12 compases y 12 acordes', rej.compases.length === 12 && rej.sonido.notas.length === 12)
  comprobar(r, 'rejilla: C7 F7 G7', rej.compases.map((x) => x.cifrado).join(' ') === 'C7 C7 C7 C7 F7 F7 C7 C7 G7 F7 C7 G7')
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: carpeta ? 2 : 1, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const irAlPaso = async (n) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, n]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { '5.5': { paso: n } }, retos: {} }))
      },
      [tema, n],
    )
    await page.goto(BASE + '#/leccion/5.5/guiada')
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(700)
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  const tocar = async (nota) => {
    const tecla = page.locator(`[data-note="${nota}"]`).first()
    await tecla.scrollIntoViewIfNeeded().catch(() => {})
    const t = await tecla.boundingBox()
    await page.touchscreen.tap(t.x + t.width / 2, t.y + t.height * 0.85)
    await espera(350)
  }

  // ——— Los 16 pasos ———
  for (let n = 0; n < PASOS; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
    comprobar(r, `paso ${n} sin scroll de lado`, ancho <= 376, String(ancho))
    await foto(`5.5-paso-${String(n).padStart(2, '0')}`)
  }

  // ——— Paso 1: las canciones ———
  await irAlPaso(1)
  const texto1 = await page.locator('body').textContent()
  comprobar(r, 'canciones: Stand by Me y Perfect', /Stand by Me/.test(texto1) && /Perfect/.test(texto1) && /A – F♯m – D – E/.test(texto1) && /A♭ – Fm – D♭ – E♭/.test(texto1), texto1.slice(0, 300))

  // ——— Paso 5: Dm7 con la raíz dada ———
  await irAlPaso(5)
  await tocar('F4')
  await tocar('A4')
  await tocar('C4')
  comprobar(r, 'P8 m7: ¡Re menor séptima!', /menor séptima/i.test(await info()) && /Dm7/.test(await info()), await info())
  await foto('5.5-p8-m7')

  // ——— Paso 7: el ii7 de Fa, sin nota dada ———
  await irAlPaso(7)
  for (const n of ['G4', 'A#4', 'D5', 'F5']) await tocar(n)
  comprobar(r, 'P8 romano: ¡ii7 = Gm7!', /¡ii7 = Gm7!/.test(await info()), await info())

  // ——— Paso 8: las notas guía ———
  await irAlPaso(8)
  await page.locator('[data-rejilla]').evaluate((e) => e.scrollIntoView({ block: 'center' }))
  await espera(300)
  const celda = async (col, fila) => {
    const g = await page.locator('[data-rejilla]').boundingBox()
    await page.mouse.click(g.x + ((col + 0.5) / 3) * g.width, g.y + ((fila + 0.5) / 9) * g.height)
    await espera(250)
  }
  await celda(0, 0) // Do4
  await celda(1, 1) // Si3
  await celda(2, 1) // Si3
  await foto('5.5-roll')
  await boton().click()
  await espera(600)
  comprobar(r, 'roll: Do · Si · Si', /Perfecto/.test(await info()), await info())

  // ——— Paso 9: la rejilla del blues ———
  await irAlPaso(9)
  const rejilla = page.locator('[data-rejilla-compases]')
  comprobar(r, 'rejilla: 12 casillas', (await rejilla.locator('[data-compas]').count()) === 12)
  const ancho = await rejilla.evaluate((e) => e.getBoundingClientRect().width)
  comprobar(r, 'rejilla cabe a 375 px', ancho <= 343 + 1, String(ancho))
  await rejilla.evaluate((e) => e.scrollIntoView({ block: 'center' }))
  await rejilla.getByRole('button', { name: /Escuchar los 12/ }).click()
  await espera(1200)
  const encendidas = await rejilla.locator('[data-suena]').count()
  comprobar(r, 'Escuchar enciende un compás', encendidas === 1, String(encendidas))
  await foto('5.5-rejilla-sonando')
  await rejilla.locator('[data-compas="5"]').click()
  await espera(250)
  const cual = await rejilla.locator('[data-suena]').getAttribute('data-compas').catch(() => null)
  comprobar(r, 'tocar el compás 5 lo enciende', cual === '5', String(cual))
  await espera(1500)
  comprobar(r, 'luego se apaga', (await rejilla.locator('[data-suena]').count()) === 0)

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
