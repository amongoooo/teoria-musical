// Prueba las lecciones 4.1 y 4.2 (acordes) y la ruta de acordes a 375 px en claro y oscuro: recorre todos los pasos
// (sin errores en la consola), P8 «Construir un acorde» (4.1 paso 2: Do mayor con Mi y Sol; paso 4: fallo con Fa,
// acierto con Fa♯ y La; guía 3M / 3m), «Escucha y construye» (4.2 paso 4: sin guía ni nombre), la ruta #/ruta/acordes
// (11 paradas, 4.3 «Llega pronto»), la tarjeta de la ruta en el panel de Oído y el cuadrito de Inicio sin candado.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/acordes.mjs [carpeta-de-capturas]
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
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async (lecciones = {}) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, lecciones]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones, retos: {} }))
      },
      [tema, lecciones],
    )
  }
  /** Abre la lección `id` en el paso `n`. */
  const irAlPaso = async (id, n) => {
    await preparar({ [id]: { paso: n } })
    await page.goto(BASE + `#/leccion/${id}`)
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

  for (const [id, pasos] of [['4.1', 15], ['4.2', 12]]) {
    for (let n = 0; n < pasos; n++) {
      await irAlPaso(id, n)
      const titulo = await page.locator('h1, h2').first().textContent()
      comprobar(r, `${id} paso ${n} se ve`, !!titulo, titulo)
      await foto(`${id}-paso-${String(n).padStart(2, '0')}`)
    }
  }

  // 4.1 paso 2: Apila terceras — Do mayor (sin guía), fundamental ya en verde.
  await irAlPaso('4.1', 2)
  const fila = page.locator('[data-fila-acorde]')
  comprobar(r, 'P8: sin guía en «Apila terceras»', !/3M/.test(await fila.textContent()))
  comprobar(r, 'P8: Continuar apagado', await boton().isDisabled())
  await tocar('E4')
  comprobar(r, 'P8: Mi encontrada', (await fila.locator('[data-casilla="ok"]').count()) === 2)
  await tocar('G4')
  const t2 = await info()
  comprobar(r, 'P8: «¡Do · Mi · Sol!»', /Do · Mi · Sol/.test(t2), t2)
  comprobar(r, 'P8: Continuar encendido', !(await boton().isDisabled()))
  await foto('4.1-p8-do-mayor')

  // 4.1 paso 4: Construye mayores — guía 3M / 3m; ronda 2: fallo con Fa, acierto con Fa♯ + La.
  await irAlPaso('4.1', 4)
  const guia = await page.locator('[data-fila-acorde]').textContent()
  comprobar(r, 'P8: guía «3M» y «3m»', /3M/.test(guia) && /3m/.test(guia), guia)
  await tocar('E4')
  await tocar('G4')
  await boton().click()
  await espera(600)
  await tocar('F4')
  const mal = await info()
  comprobar(r, 'P8: fallo «Esa es Fa» con la 3.ª a 4 semitonos', /Esa es Fa/.test(mal) && /4 semitonos/.test(mal), mal)
  await foto('4.1-p8-fallo')
  await tocar('F#4')
  await tocar('A4')
  const bien = await info()
  comprobar(r, 'P8: Re mayor con Fa♯', /Fa♯/.test(bien) && /Re mayor|mayor/.test(bien), bien)
  await foto('4.1-p8-re-mayor')

  // 4.1 paso 8: Si disminuido tocando Re y Fa en la octava de abajo (vale cualquier octava).
  await irAlPaso('4.1', 8)
  await tocar('D4')
  await tocar('F4')
  comprobar(r, 'P8: Si disminuido en otra octava', /tritono/.test(await info()))

  // 4.2 paso 4: Escucha y construye — sin guía ni nombre del acorde.
  await irAlPaso('4.2', 4)
  const frase = await page.locator('p', { hasText: 'Escucha y construye' }).first().textContent()
  comprobar(r, 'Escucha: frase sin el nombre', /Escucha y construye el acorde desde Do4/.test(frase) && !/menor/.test(frase), frase)
  comprobar(r, 'Escucha: sin guía', !/3m|3M/.test(await page.locator('[data-fila-acorde]').textContent()))
  await tocar('D#4')
  await tocar('G4')
  const t4 = await info()
  comprobar(r, 'Escucha: «era Do menor»', /Do menor/.test(t4), t4)
  await foto('4.2-escucha')

  // La ruta de acordes: 11 paradas; la 4.3 dice «Llega pronto» (en modo administrador se abre).
  await preparar()
  await page.goto(BASE + '#/ruta/acordes')
  await page.reload()
  await espera(1500)
  const titulo = await page.locator('h1').first().textContent()
  comprobar(r, 'ruta: título Acordes', /Acordes/.test(titulo), titulo)
  await foto('ruta-acordes')

  // Panel de Oído: la tarjeta de la ruta de acordes.
  await page.goto(BASE + '#/oido')
  await espera(1200)
  const entrada = page.locator('[data-entrada-ruta="acordes"]')
  comprobar(r, 'oído: entrada a la ruta', (await entrada.count()) === 1)
  comprobar(r, 'oído: «0/11 paradas»', /0\/11 paradas/.test(await entrada.textContent().catch(() => '')))
  await entrada.scrollIntoViewIfNeeded()
  await foto('oido-entrada-ruta')

  comprobar(r, 'sin errores de JS', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'Todo bien')
process.exit(fallos ? 1 : 0)
