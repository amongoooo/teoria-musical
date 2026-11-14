// Prueba la lección 4.5 «Voicings», el engrane de Opciones y el botón ⓘ de novedades a 375 px en claro y oscuro:
//  - recorre los 15 pasos de la 4.5 (sin errores en la consola);
//  - P8 con `voicing: 'abierto'` (paso 4): «Abre Do mayor desde Do3»; casillas 1 · 5 · 3; guía 5J / 6M; Mi3 (la 3.ª
//    en la octava de siempre) es un fallo que dice «otra octava»; Do4 = «ya está abajo»; Sol3 + Mi4 = «¡Do mayor abierto!»;
//  - el roll del productor (paso 8) se completa dibujando las notas guía;
//  - Inicio: botón ⓘ con el puntito de oro, la hoja «Novedades» con la versión, el puntito se apaga y «Abrir la 4.5» lleva a la lección;
//  - la ruta de acordes ya no dice «Llega pronto».
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/voicings.mjs [carpeta-de-capturas]
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

  const preparar = async (lecciones = {}, extra = {}) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, lecciones, extra]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones, retos: {} }))
        for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, JSON.stringify(v))
      },
      [tema, lecciones, extra],
    )
  }
  const irAlPaso = async (id, n) => {
    await preparar({ [id]: { paso: n } })
    await page.goto(BASE + `#/leccion/${id}/guiada`)
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(700)
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  const fila = () => page.locator('[data-fila-acorde]')
  const octava = async (o) => {
    await page.locator(`[aria-label="Octava ${o}"]`).click()
    await espera(700)
  }
  const tocar = async (nota) => {
    const t = await page.locator(`[data-note="${nota}"]`).first().boundingBox()
    await page.touchscreen.tap(t.x + t.width / 2, t.y + t.height * 0.85)
    await espera(350)
  }

  for (let n = 0; n < 15; n++) {
    await irAlPaso('4.5', n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `4.5 paso ${n} se ve`, !!titulo, titulo)
    await foto(`4.5-paso-${String(n).padStart(2, '0')}`)
  }

  // ——— Paso 4: «Abre el acorde» (voicing abierto) ———
  await irAlPaso('4.5', 4)
  const f = await page.locator('[data-frase-acorde]').textContent()
  comprobar(r, 'abierto: «Abre Do mayor desde Do3»', /Abre Do mayor desde Do3/.test(f), f)
  const partes = (await page.locator('[data-partes-acorde]').textContent()).replace(/\s/g, '')
  comprobar(r, 'abierto: casillas 1 · 5 · 3', partes === '153', partes)
  const guia = await page.locator('[data-guia-acorde]').textContent()
  comprobar(r, 'abierto: guía 5J y 6M', /5J/.test(guia) && /6M/.test(guia), guia)
  await octava(3)
  await tocar('E3')
  const m1 = await info()
  comprobar(r, 'abierto: Mi3 = «otra octava»', /otra octava/.test(m1) && /3\.ª/.test(m1), m1)
  await foto('4.5-abierto-fallo')
  await tocar('G3')
  await octava(4)
  await tocar('C4')
  const m2 = await info()
  comprobar(r, 'abierto: Do4 = «ya está abajo»', /ya está abajo/.test(m2), m2)
  await tocar('E4')
  const m3 = await info()
  comprobar(r, 'abierto: «¡Do mayor abierto!»', /Do mayor abierto/.test(m3), m3)
  comprobar(r, 'abierto: tres casillas en verde', (await fila().locator('[data-casilla="ok"]').count()) === 3)
  comprobar(r, 'abierto: Continuar encendido', !(await boton().isDisabled()))
  await foto('4.5-abierto-bien')
  // Ronda 2: Re menor abierto → guía 5J y 6m
  await boton().click()
  await espera(600)
  const guia2 = await page.locator('[data-guia-acorde]').textContent()
  comprobar(r, 'abierto: Re menor con 6m', /6m/.test(guia2), guia2)

  // ——— Paso 8: el roll del productor ———
  await irAlPaso('4.5', 8)
  const fantasmas = await page.locator('.border-dashed.border-zinc-400').count()
  comprobar(r, 'roll: 8 notas guía', fantasmas === 8, String(fantasmas))

  // ——— Inicio: botón ⓘ y novedades ———
  await preparar()
  await page.goto(BASE + '#/')
  await page.reload()
  await espera(1200)
  comprobar(r, 'ⓘ: puntito de oro al llegar', (await page.locator('[data-punto-novedad]').count()) === 1)
  await foto('inicio-novedades')
  await page.locator('[data-boton-novedades]').click()
  await espera(700)
  const version = await page.locator('[data-version-novedades]').textContent()
  comprobar(r, 'ⓘ: la hoja dice la versión', /^v\.1\./.test(version), version)
  comprobar(r, 'ⓘ: hay novedades', (await page.locator('[data-novedad]').count()) >= 2)
  await foto('hoja-novedades')
  await page.locator('[data-ir-novedad="#/leccion/4.5"]').first().click()
  await espera(1200)
  comprobar(r, 'ⓘ: «Abrir la 4.5» lleva a la lección', /#\/leccion\/4\.5/.test(page.url()), page.url())
  await page.goto(BASE + '#/')
  await espera(1000)
  comprobar(r, 'ⓘ: el puntito se apagó', (await page.locator('[data-punto-novedad]').count()) === 0)
  await page.locator('[aria-label="Opciones"]').first().click()
  await espera(700)
  await foto('hoja-opciones')
  await page.keyboard.press('Escape')

  // ——— Ruta de acordes: la 4.5 ya no dice «Llega pronto» ———
  await preparar()
  await page.goto(BASE + '#/ruta/acordes')
  await page.reload()
  await espera(1500)
  const html = await page.content()
  comprobar(r, 'ruta: sin «Llega pronto»', !/Llega pronto/.test(html))

  comprobar(r, 'sin errores de JS', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'Todo bien')
process.exit(fallos ? 1 : 0)
