// Prueba los PRERREQUISITOS SUAVES (content/catalogo.js, `faltanRequisitos` de content/index.js, «Antes te conviene»
// de pages/Leccion.jsx y la prueba #/prueba/leccion/ID):
//  - con node: cada lección existente tiene su entrada (áreas válidas, nivel válido, requisitos que existen), no hay
//    ciclos y ningún prerrequisito llega DESPUÉS de su lección en una ruta o en el Curso completo;
//  - a 375 px en claro y oscuro: #/leccion/4.1 sin progreso → «Antes te conviene» con la 3.2, «Ir a la 3.2»,
//    «¿Ya lo sabes?» y «Seguir con la 4.1» (que empieza la lección); con la 3.2 hecha, sin aviso; abierta desde una
//    ruta o el curso (#/leccion/4.1/guiada), sin aviso; en modo administrador, sin aviso; ya empezada, sin aviso;
//    la 4.3 pide 3.3 y 4.1; tocar la fila 3.3 lleva a la 3.3 (que avisa por la 3.1); «¿Ya lo sabes?» abre la prueba de
//    2 preguntas; con «No lo sé» en las dos → «Ir a la 4.3» vuelve al aviso; «Sigue aquí» del curso abre /guiada.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/prerrequisitos.mjs [carpeta-de-capturas]
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

// ——— El catálogo, con node ———
{
  const r = (resultados.catalogo = {})
  const { CATALOGO, NIVELES } = await import('../../src/content/catalogo.js')
  const { AREAS_CONOCIMIENTO } = await import('../../src/content/areas.js')
  const { leccionDisponible, MODULOS, faltanRequisitos } = await import('../../src/content/index.js')
  const { RUTAS } = await import('../../src/content/rutas.js')
  const { BLOQUES } = await import('../../src/content/curso.js')
  const ids = [...MODULOS.flatMap((m) => m.lecciones.map((l) => l.id)), ...RUTAS.letras.paradas.filter((p) => p.tipo === 'leccion').map((p) => p.id)].filter(leccionDisponible)
  comprobar(r, '26 lecciones en el catálogo', ids.length === 26 && ids.every((id) => CATALOGO[id]), ids.filter((id) => !CATALOGO[id]).join(','))
  const malas = Object.entries(CATALOGO).filter(
    ([, c]) => !c.areas.length || !c.areas.every((a) => AREAS_CONOCIMIENTO[a]) || !NIVELES.includes(c.nivel) || !c.requiere.every(leccionDisponible),
  )
  comprobar(r, 'áreas, nivel y requisitos válidos', malas.length === 0, malas.map(([id]) => id).join(','))
  // Sin ciclos: cada lección llega a sus raíces.
  const visitar = (id, camino = []) => (camino.includes(id) ? [...camino, id] : (CATALOGO[id]?.requiere ?? []).map((x) => visitar(x, [...camino, id])).find(Boolean) ?? null)
  const ciclo = ids.map((id) => visitar(id)).find(Boolean)
  comprobar(r, 'sin ciclos', !ciclo, ciclo?.join(' → '))
  // En cada camino lineal (rutas y curso), lo que una lección pide y está en el camino va antes.
  const caminos = [...Object.values(RUTAS).map((ru) => [ru.id, ru.paradas]), ['curso', BLOQUES.flatMap((b) => b.paradas)]]
  const desorden = []
  for (const [nombre, paradas] of caminos) {
    const orden = paradas.filter((p) => p.tipo === 'leccion').map((p) => p.id)
    orden.forEach((id, i) => (CATALOGO[id]?.requiere ?? []).forEach((req) => orden.indexOf(req) > i && desorden.push(`${nombre}: ${id} ← ${req}`)))
  }
  comprobar(r, 'orden de rutas y curso', desorden.length === 0, desorden.join('; '))
  const vacio = { lecciones: {} }
  comprobar(r, 'faltan de la 4.3', String(faltanRequisitos('4.3', vacio)) === '3.3,4.1')
  comprobar(r, 'saltada cuenta', faltanRequisitos('4.1', { lecciones: { '3.2': { completada: true, saltada: true } } }).length === 0)
  comprobar(r, 'curso: «Sigue aquí» usa /guiada', (await import('node:fs')).readFileSync('src/components/cursoModulo.js', 'utf8').includes('rutas.leccionGuiada(p.id)'))
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async (lecciones = {}, opciones = {}) => {
    await page.goto(BASE)
    await page.evaluate(
      ([opciones, lecciones]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify(opciones))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones, retos: {} }))
      },
      [{ tema, ...opciones }, lecciones],
    )
    await page.reload()
    await espera(500)
  }
  const ir = async (hash) => {
    await page.goto(BASE + hash)
    await espera(800)
  }
  const aviso = () => page.locator('[data-antes-te-conviene]').count()
  const filas = () => page.locator('[data-requisito]').evaluateAll((els) => els.map((e) => e.dataset.requisito).join(','))

  // 4.1 sin progreso → aviso con la 3.2
  await preparar()
  await ir('#/leccion/4.1')
  comprobar(r, '4.1: aviso', (await aviso()) === 1)
  comprobar(r, '4.1: pide la 3.2', (await filas()) === '3.2', await filas())
  comprobar(r, '4.1: «Ir a la 3.2»', (await page.locator('[data-ir-requisito]').textContent()).trim() === 'Ir a la 3.2')
  comprobar(r, '4.1: «¿Ya lo sabes?»', (await page.locator('[data-ya-lo-sabes]').count()) === 1)
  await foto('1-aviso-4.1')
  await page.locator('[data-seguir]').click()
  await espera(700)
  comprobar(r, 'Seguir: empieza la lección', (await aviso()) === 0 && (await page.locator('[role="progressbar"]').count()) > 0)

  // Sin aviso: guiada, requisito hecho, administrador, ya empezada
  await ir('#/leccion/4.1/guiada')
  comprobar(r, 'guiada: sin aviso', (await aviso()) === 0)
  await preparar({ '3.2': { completada: true } })
  await ir('#/leccion/4.1')
  comprobar(r, '3.2 hecha: sin aviso', (await aviso()) === 0)
  await preparar({}, { admin: true })
  await ir('#/leccion/4.1')
  comprobar(r, 'administrador: sin aviso', (await aviso()) === 0)
  await preparar({ '4.1': { paso: 2 } })
  await ir('#/leccion/4.1')
  comprobar(r, 'empezada: sin aviso', (await aviso()) === 0)

  // 4.3 pide dos; la fila 3.3 lleva a la 3.3 (que avisa por la 3.1)
  await preparar()
  await ir('#/leccion/4.3')
  comprobar(r, '4.3: pide 3.3 y 4.1', (await filas()) === '3.3,4.1', await filas())
  await foto('2-aviso-4.3')
  await page.locator('[data-requisito="3.3"]').click()
  await espera(900)
  comprobar(r, 'fila → 3.3', /#\/leccion\/3\.3$/.test(page.url()), page.url())
  comprobar(r, '3.3 avisa por la 3.1', (await filas()) === '3.1', await filas())

  // «¿Ya lo sabes?» de la 4.3: 2 preguntas; «No lo sé» en las dos → «Ir a la 4.3»
  await ir('#/leccion/4.3')
  await page.locator('[data-ya-lo-sabes]').click()
  await espera(900)
  comprobar(r, 'prueba de la 4.3', (await page.locator('[data-prueba="leccion/4.3"]').count()) === 1)
  comprobar(r, 'prueba: 2 preguntas', (await page.locator('[data-segmento]').count()) === 2)
  await foto('3-prueba-4.3')
  for (let i = 0; i < 2; i++) {
    await page.locator('[data-no-lo-se]').click()
    await espera(450)
    await page.locator('[data-boton-accion] button').first().click()
    await espera(700)
  }
  comprobar(r, 'resultado', (await page.locator('[data-resultado-prueba]').count()) === 1)
  const volver = page.getByText('Ir a la 4.3', { exact: true })
  comprobar(r, 'resultado: «Ir a la 4.3»', (await volver.count()) === 1)
  await foto('4-resultado')
  await volver.click()
  await espera(900)
  comprobar(r, 'vuelve al aviso', (await aviso()) === 1 && /#\/leccion\/4\.3$/.test(page.url()), page.url())

  // Curso: «Sigue aquí» abre la lección guiada
  await preparar()
  await ir('#/curso')
  await page.locator('[data-sigue-aqui]').first().click()
  await espera(900)
  comprobar(r, 'curso → /guiada', /#\/leccion\/1\.1\/guiada$/.test(page.url()), page.url())

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO OK')
process.exit(fallos ? 1 : 0)
