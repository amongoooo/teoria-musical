// Prueba la lección 5.4 «Las progresiones pop» a 375 px en claro y oscuro:
//  - los 15 pasos se ven, sin errores en la consola ni scroll de lado (las fichas de canciones caben);
//  - P8 «Construye el loop en Re» (paso 2): el I de Re (D · F♯ · A) → «¡I = D!»;
//  - P8 «Construye el loop en Mi menor» (paso 7): el i de Mi menor (E · G · B) → «¡i = Em!»;
//  - O6 «Empareja la rotación» (paso 4): 4 filas y los nombres «Empieza en …»;
//  - R2 «Escribe el bajo del loop» (paso 11): La · Fa · Do · Sol en las filas de abajo → «Perfecto»;
//  - el bloque 4 del curso (etapa 3): insignia + 15 islas;
//  - node: banco de la prueba rápida, catálogo, tramo «Progresiones» de la ruta de Acordes y el bloque 4.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/progresiones.mjs [carpeta-de-capturas]
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

// ——— Datos (node) ———
{
  const r = (resultados.datos = {})
  const banco = (await import('../../src/content/pruebas/modulo-5.js')).default
  comprobar(r, 'prueba rápida: 3 preguntas de la 5.4', banco['5.4']?.length === 3)
  const { CATALOGO } = await import('../../src/content/catalogo.js')
  comprobar(r, 'catálogo: 5.4 ← 5.1, armonía + producción', JSON.stringify(CATALOGO['5.4']?.requiere) === '["5.1"]' && CATALOGO['5.4'].areas.join() === 'armonia,produccion', JSON.stringify(CATALOGO['5.4']))
  const { TRAMOS, RUTAS } = await import('../../src/content/rutas.js')
  const paradas = TRAMOS.progresiones.paradas.map((p) => p.id ?? `${p.modo}:${p.nivel}`).join(' ')
  comprobar(r, 'tramo «Progresiones»: empieza con 5.4, Funciones 4', paradas.startsWith('5.4 funciones:4'), paradas)
  comprobar(r, 'ruta de Acordes: 6 tramos', RUTAS.acordes.tramos.at(-1) === 'progresiones' && RUTAS.acordes.tramos.length === 6)
  const { BLOQUES, ETAPAS } = await import('../../src/content/curso.js')
  const b4 = BLOQUES.find((b) => b.numero === 4)
  comprobar(r, 'curso: bloque 4 en la etapa 3', b4?.etapa === 3 && ETAPAS[2].titulo === 'Construir canciones')
  comprobar(r, 'curso: bloque 4 con 15 pasos', b4?.paradas.length === 15, String(b4?.paradas.length))
  const total = BLOQUES.flatMap((b) => b.paradas).filter((p) => !p.opcional).length
  comprobar(r, 'curso: 55 pasos', total === 55, String(total))
  const areas = b4.paradas.map((p) => p.area[0]).join('')
  comprobar(r, 'curso: bloque 4 mezcla las áreas', /m/.test(areas) && /r/.test(areas) && /l/.test(areas) && /a/.test(areas) && areas.endsWith('t'), areas)
  const leccion = (await import('../../src/content/modulo-05/leccion-5-4.js')).default
  comprobar(r, 'lección: 15 pasos, el último un reto', leccion.pasos.length === 15 && leccion.pasos.at(-1).tipo === 'reto')
  const roll = leccion.pasos[11]
  comprobar(r, 'roll: 12 notas arriba + 4 de bajo', roll.roll.notas.length === 12 && roll.objetivo.notas.length === 16)
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const irAlPaso = async (n) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, n]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { '5.4': { paso: n } }, retos: {} }))
      },
      [tema, n],
    )
    await page.goto(BASE + '#/leccion/5.4/guiada')
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(700)
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  const tocar = async (nota) => {
    const t = await page.locator(`[data-note="${nota}"]`).first().boundingBox()
    await page.touchscreen.tap(t.x + t.width / 2, t.y + t.height * 0.85)
    await espera(350)
  }

  // ——— Los 15 pasos ———
  for (let n = 0; n < 15; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
    comprobar(r, `paso ${n} sin scroll de lado`, ancho <= 376, String(ancho))
    await foto(`5.4-paso-${String(n).padStart(2, '0')}`)
  }

  // ——— Paso 1: las canciones ———
  await irAlPaso(1)
  const texto1 = await page.locator('main, body').first().textContent()
  comprobar(r, 'canciones: Let It Be y With or Without You', /Let It Be/.test(texto1) && /With or Without You/.test(texto1) && /D – A – Bm – G/.test(texto1))

  // ——— Paso 2: Construye el loop en Re ———
  await irAlPaso(2)
  await tocar('D4')
  await tocar('F#4')
  await tocar('A4')
  comprobar(r, 'P8: ¡I = D!', /¡I = D!/.test(await info()), await info())

  // ——— Paso 4: Empareja la rotación ———
  await irAlPaso(4)
  const textoE = await page.locator('body').textContent()
  comprobar(r, 'emparejar: «Empieza en Am»', /Empieza en Am/.test(textoE) && /Empieza en F/.test(textoE))

  // ——— Paso 7: Construye el loop en Mi menor ———
  await irAlPaso(7)
  await tocar('E4')
  await tocar('G4')
  await tocar('B4')
  comprobar(r, 'P8 en menor: ¡i = Em!', /¡i = Em!/.test(await info()), await info())
  await foto('5.4-p8-menor')

  // ——— Paso 11: Escribe el bajo del loop ———
  await irAlPaso(11)
  await page.locator('[data-rejilla]').evaluate((e) => e.scrollIntoView({ block: 'center' }))
  await espera(300)
  const celda = async (col, fila) => {
    const rejilla = await page.locator('[data-rejilla]').boundingBox()
    await page.mouse.click(rejilla.x + ((col + 0.5) / 4) * rejilla.width, rejilla.y + ((fila + 0.5) / 11) * rejilla.height)
    await espera(250)
  }
  await celda(0, 8) // La2
  await celda(1, 10) // Fa2
  await celda(2, 7) // Do3
  await celda(3, 9) // Sol2
  await foto('5.4-roll')
  await boton().click()
  await espera(600)
  comprobar(r, 'roll: el bajo La · Fa · Do · Sol', /Perfecto/.test(await info()), await info())

  // ——— Curso: bloque 4 ———
  await page.goto(BASE + '#/curso/bloque/4')
  await espera(2000)
  const puntos = await page.locator('[data-punto]').count()
  comprobar(r, 'bloque 4: insignia + 15 islas', puntos === 16, String(puntos))
  await foto('5.4-bloque-4')

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
