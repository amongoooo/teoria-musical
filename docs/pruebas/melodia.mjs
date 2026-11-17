// Prueba la RUTA DE MELODÍA (fase 4 del rediseño; content/rutas.js → RUTAS.melodia) a 375 px en claro y oscuro:
//  - con node: 3 tramos y 13 paradas; el tramo «Notas y teclado» es el mismo de la ruta de acordes; orden de las rutas
//    Ritmo → Letras → Melodía → Acordes (en bucle).
//  - Aprender › Rutas: la fila Melodía ya no dice «Próximamente» (cuadrito con 0/13).
//  - #/ruta/melodia: 3 letreros, insignia + 13 puntitos; el letrero «Notas y teclado» va en turquesa (y en violeta
//    dentro de la ruta de acordes: el tramo toma el color de la ruta).
//  - Con 1.2–1.4 y 3.1 hechas: 4 de 13 y la actual es la meta «Oído absoluto · nivel 2»; con el oído absoluto en nivel 2,
//    la actual pasa a la 3.2.
//  - Panel de oído: entradas a Melodía y Acordes, en ese orden. Prueba rápida del tramo 3 (3.3, 3.4 y 3.6).
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/melodia.mjs [carpeta-de-capturas]
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
const hecha = { paso: 0, completada: true, aciertos: 5, total: 5 }

// ——— Los datos, con node ———
{
  const r = (resultados.datos = {})
  const { RUTAS, ORDEN_RUTAS } = await import('../../src/content/rutas.js')
  const m = RUTAS.melodia
  comprobar(r, '3 tramos', m.tramos.length === 3, m.tramos.join())
  comprobar(r, '13 paradas', m.paradas.length === 13, String(m.paradas.length))
  comprobar(r, 'tramo 1 compartido con acordes', m.tramos[0] === 'notas-teclado' && RUTAS.acordes.tramos[0] === 'notas-teclado')
  comprobar(r, 'orden de las rutas', ORDEN_RUTAS.join() === 'ritmo,letras,melodia,acordes', ORDEN_RUTAS.join())
  const metas = m.paradas.filter((p) => p.tipo === 'meta').map((p) => `${p.modo}:${p.nivel}`).join()
  comprobar(r, 'metas de Oído', metas === 'absoluto:2,intervalos:5,absoluto:4,intervalos:6', metas)
  comprobar(r, 'termina con el reto', m.paradas.at(-1).tipo === 'reto' && m.paradas.at(-1).id === 'ruta-melodia')
  const { estadoCurso } = await import('../../src/content/curso.js')
  const e = estadoCurso({ progreso: { lecciones: {}, retos: {} }, medir: () => ({ valor: 0, meta: 1 }) })
  const areas = Object.entries(e.areas).map(([a, x]) => `${a}:${x.total}`).join()
  comprobar(r, 'curso: 40 pasos en 4 áreas + todo junto', e.total === 40 && areas === 'melodia:10,acordes:9,ritmo:10,letras:10,tres:1', `${e.total} ${areas}`)
  comprobar(r, 'curso: etapas 1–2 con bloques', e.etapas.map((x) => x.bloques.join('+') || '-').join() === '1+2,3,-,-,-')
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n, completa = false) => carpeta && page.screenshot({ path: `${carpeta}/melodia-${n}-${tema}.png`, fullPage: completa })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async (lecciones = {}, oido = null) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, lecciones, oido]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones, retos: {} }))
        if (oido) localStorage.setItem('teoria-musical:oido:v1', JSON.stringify(oido))
      },
      [tema, lecciones, oido],
    )
  }
  const ir = async (hash) => {
    await page.goto(BASE + hash)
    await page.reload()
    await espera(2200)
  }

  // Aprender › Rutas.
  await preparar()
  await ir('#/aprender/rutas')
  const fila = page.locator('[data-area-rutas="melodia"]')
  comprobar(r, 'aprender: Melodía sin «Próximamente»', (await fila.getByText('Próximamente').count()) === 0)
  comprobar(r, 'aprender: cuadrito 0/13', (await fila.locator('[data-ruta-inicio="melodia"]').getAttribute('data-avance')) === '0/13')
  await fila.scrollIntoViewIfNeeded()
  await foto('aprender')

  // La ruta sin nada hecho.
  await ir('#/ruta/melodia')
  comprobar(r, 'ruta: 3 letreros', (await page.locator('[data-letrero]').count()) === 3)
  comprobar(r, 'ruta: insignia + 13 puntitos', (await page.locator('[data-punto]').count()) === 14, String(await page.locator('[data-punto]').count()))
  const colorLetrero = () => page.$eval('[data-letrero="notas-teclado"] span', (e) => e.getAttribute('style') ?? '')
  comprobar(r, 'tramo 1 en turquesa', /melodia/.test(await colorLetrero()), await colorLetrero())
  const t3 = await page.locator('[data-letrero="escalas-melodias"]').textContent()
  comprobar(r, 'tramo 3: «Escalas y melodías» 0/6', /Escalas y melodías/.test(t3) && /0\/6/.test(t3), t3)
  await foto('vacia', true)
  await ir('#/ruta/acordes')
  comprobar(r, 'el mismo tramo en acordes: violeta', /armonia/.test(await colorLetrero()), await colorLetrero())

  // Con el módulo 1 y la 3.1: la actual es la meta de oído absoluto.
  await preparar({ '1.2': hecha, '1.3': hecha, '1.4': hecha, '3.1': hecha })
  await ir('#/ruta/melodia')
  const cab = await page.locator('[aria-label*="paradas"]').first().getAttribute('aria-label').catch(() => '')
  comprobar(r, 'cabecera: 4 de 13 paradas', /4 de 13/.test(cab ?? ''), cab)
  const t2 = await page.locator('[data-letrero="pasos-intervalos"]').textContent()
  comprobar(r, 'tramo 2: 1/4', /1\/4/.test(t2), t2)
  await foto('actual-absoluto', true)

  // Con el oído absoluto en nivel 2: la meta se cumple sola.
  const oido = { version: 1, dias: {}, mejorRacha: 0, modos: { absoluto: { nivel: 2, nivelMax: 2, ventana: [], carga: 0, aciertos: 0, total: 0, racha: 0, mejorRacha: 0, items: {}, ajustes: {} } } }
  await preparar({ '1.2': hecha, '1.3': hecha, '1.4': hecha, '3.1': hecha }, oido)
  await ir('#/ruta/melodia')
  const t2b = await page.locator('[data-letrero="pasos-intervalos"]').textContent()
  comprobar(r, 'absoluto nivel 2 → tramo 2: 2/4', /2\/4/.test(t2b), t2b)

  // Panel de oído: ya sin entradas a las rutas (pedido del usuario, 2026-11-17).
  await ir('#/oido')
  comprobar(r, 'oído: sin entradas a las rutas', (await page.locator('[data-entrada-ruta]').count()) === 0)

  // Prueba rápida del tramo 3.
  await preparar()
  await ir('#/prueba/ruta/melodia/escalas-melodias')
  comprobar(r, 'prueba del tramo 3: 3 preguntas', (await page.locator('[data-segmento]').count()) === 3, String(await page.locator('[data-segmento]').count()))

  comprobar(r, 'sin errores en la página', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLOS` : 'TODO OK')
process.exit(fallos ? 1 : 0)
