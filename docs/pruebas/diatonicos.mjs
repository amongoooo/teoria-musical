// Prueba las lecciones 4.3 (acordes diatónicos y números romanos) y 4.4 (inversiones y bajo) a 375 px en claro y
// oscuro: recorre todos los pasos (sin errores en la consola) y las opciones nuevas de P8:
//  - `revelar` (4.3 paso 2): «Apila sobre Re4 con las notas de Do mayor», sin guía ni tipo; fallo dentro y fuera de la
//    escala; al completarlo se revela «Re menor» y aparece la guía 3m / 3M.
//  - `romano` (4.3 paso 6): «Construye el IV de Do mayor», sin nota dada; se tocan las tres (cualquier octava).
//  - `inversion` (4.4 paso 2 y 7): la marcada es el bajo; casillas 3 · 5 · 1; una nota debajo del bajo no vale.
// Y la ruta de acordes se sigue abriendo con las dos lecciones nuevas.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/diatonicos.mjs [carpeta-de-capturas]
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
  const irAlPaso = async (id, n) => {
    await preparar({ [id]: { paso: n } })
    await page.goto(BASE + `#/leccion/${id}/guiada`)
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(700)
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  const frase = () => page.locator('[data-frase-acorde]').textContent()
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

  for (const [id, pasos] of [['4.3', 13], ['4.4', 13]]) {
    for (let n = 0; n < pasos; n++) {
      await irAlPaso(id, n)
      const titulo = await page.locator('h1, h2').first().textContent()
      comprobar(r, `${id} paso ${n} se ve`, !!titulo, titulo)
      await foto(`${id}-paso-${String(n).padStart(2, '0')}`)
    }
  }

  // ——— 4.3 paso 2: `revelar` ———
  await irAlPaso('4.3', 2)
  const f1 = await frase()
  comprobar(r, 'revelar: frase «Apila sobre Re4 con las notas de Do mayor»', /Apila sobre Re4 con las notas de Do mayor/.test(f1), f1)
  comprobar(r, 'revelar: no dice el tipo', !/menor/.test(f1.replace('Do mayor', '')), f1)
  comprobar(r, 'revelar: sin guía al empezar', (await page.locator('[data-guia-acorde]').count()) === 0)
  await tocar('G4')
  const m1 = await info()
  comprobar(r, 'revelar: fallo en la escala «Nota sí, nota no»', /Nota sí, nota no/.test(m1) && !/3 semitonos \(/.test(m1), m1)
  await tocar('F#4')
  const m2 = await info()
  comprobar(r, 'revelar: fallo fuera de la escala', /no está en Do mayor/.test(m2), m2)
  await foto('4.3-revelar-fallo')
  await tocar('F4')
  await tocar('A4')
  const m3 = await info()
  comprobar(r, 'revelar: se revela «Re menor»', /Re menor/.test(m3) && /menor/.test(m3), m3)
  await espera(400)
  const guia = await page.locator('[data-guia-acorde]').textContent().catch(() => '')
  comprobar(r, 'revelar: aparece la guía 3m / 3M', /3m/.test(guia) && /3M/.test(guia), guia)
  await foto('4.3-revelar-bien')

  // ——— 4.3 paso 6: `romano` ———
  await irAlPaso('4.3', 6)
  const f2 = await frase()
  comprobar(r, 'romano: frase «Construye el IV de Do mayor»', /Construye el IV de Do mayor/.test(f2), f2)
  comprobar(r, 'romano: ninguna casilla dada', (await fila().locator('[data-casilla="ok"]').count()) === 0)
  await tocar('E4')
  const m4 = await info()
  comprobar(r, 'romano: fallo habla del 4.º grado', /4\.º/.test(m4), m4)
  await tocar('F4')
  await tocar('A4')
  await tocar('C4')
  const m5 = await info()
  comprobar(r, 'romano: «¡IV = F!»', /IV = F/.test(m5), m5)
  comprobar(r, 'romano: tres casillas en verde', (await fila().locator('[data-casilla="ok"]').count()) === 3)
  await foto('4.3-romano-bien')

  // ——— 4.4 paso 2: `inversion` (C/E) ———
  await irAlPaso('4.4', 2)
  const f3 = await frase()
  comprobar(r, 'inversión: frase «… con Mi4 en el bajo»', /Do mayor/.test(f3) && /Mi4 en el bajo/.test(f3), f3)
  const partes = (await page.locator('[data-partes-acorde]').textContent()).replace(/\s/g, '')
  comprobar(r, 'inversión: casillas 3 · 5 · 1', partes === '351', partes)
  comprobar(r, 'inversión: guía con 4J', /4J/.test(await fila().textContent()))
  await tocar('C4')
  const m6 = await info()
  comprobar(r, 'inversión: debajo del bajo no vale', /encima del bajo/.test(m6), m6)
  await foto('4.4-inversion-fallo')
  await tocar('G4')
  await octava(5)
  await tocar('C5')
  const m7 = await info()
  comprobar(r, 'inversión: «1.ª inversión»', /1\.ª inversión/.test(m7), m7)
  await foto('4.4-inversion-bien')

  // ——— 4.4 paso 7: Encadena (G/B con cifrado) ———
  await irAlPaso('4.4', 7)
  const f4 = await frase()
  comprobar(r, 'encadena: «G/B con Si3 en el bajo»', /G\/B/.test(f4) && /Si3 en el bajo/.test(f4), f4)
  await octava(4)
  await tocar('D4')
  await tocar('G4')
  const m8 = await info()
  comprobar(r, 'encadena: G/B construido', /G\/B/.test(m8), m8)
  comprobar(r, 'encadena: Continuar encendido', !(await boton().isDisabled()))

  // ——— La 4.1 sigue igual (estado fundamental) ———
  await irAlPaso('4.1', 2)
  const f5 = await frase()
  comprobar(r, '4.1: «Construye Do mayor desde Do4»', /Construye Do mayor desde Do4/.test(f5), f5)
  const p41 = (await page.locator('[data-partes-acorde]').textContent()).replace(/\s/g, '')
  comprobar(r, '4.1: casillas 1 · 3 · 5', p41 === '135', p41)

  // ——— Ruta de acordes ———
  await preparar()
  await page.goto(BASE + '#/ruta/acordes')
  await page.reload()
  await espera(1500)
  comprobar(r, 'ruta: título Acordes', /Acordes/.test(await page.locator('h1').first().textContent()))
  await foto('ruta-acordes')

  comprobar(r, 'sin errores de JS', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'Todo bien')
process.exit(fallos ? 1 : 0)
