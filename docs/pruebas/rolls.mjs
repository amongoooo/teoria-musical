// Prueba la P1.3 «Hi-hats y rolls» (propuesta aprobada: https://claude.ai/artifact/C11uGNnXRJFKmmSF8tth2S) a 375 px en
// claro y oscuro:
//  - node: motor del pincel (tipoDe, conPaso, normalizar, golpes, cuantos, mezclar), el roll suena repartido y creciendo,
//    comparar con `distintos`, avisos de rolls y suaves (le/les), marcas; drill, jersey club y dubstep se abren con la
//    12.3 sin dominar al padre y no salen en «se abren con…» del padre; catálogo, banco y 14 pasos;
//  - los 14 pasos se ven, sin errores ni scroll de lado;
//  - paso 3: el pincel Suave pinta la «e» y la «a» (pálidos) → «¡Así suena!»;
//  - paso 5: ×2 en los dos últimos hats → dos barritas → «¡Así suena!»;
//  - paso 7 (dictado): un roll mal → oro tachado y «les falta/sobra… roll»; otra vez → la solución con borde rojo;
//  - paso 12 (libre): Continuar pide un roll y un suave;
//  - árbol: con la 12.3 hecha, drill, jersey club y dubstep abiertos; Prográmalo del drill trae el pincel;
//  - Caja de ritmos: el pincel sale con la 12.3 hecha (sin ella, no).
// Uso: npm run build && npx vite preview --port 5199   y   node docs/pruebas/rolls.mjs [carpeta-de-capturas]
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
const PASOS = 14

// ——— Motor (node) ———
{
  const r = (resultados.datos = {})
  const R = await import('../../src/theory/rack.js')
  const p = R.normalizar({ hat: [0, 1, 14], tipo: { hat: { 1: 's', 14: '2', 9: 3 } } }, ['kick', 'hat'])
  comprobar(r, 'normalizar limpia el tipo (paso apagado fuera, «2» → 2)', JSON.stringify(p) === '{"kick":[],"hat":[0,1,14],"tipo":{"hat":{"1":"s","14":2}}}', JSON.stringify(p))
  comprobar(r, 'sin tipo, el patrón queda igual que antes', JSON.stringify(R.normalizar({ kick: [0] }, ['kick'])) === '{"kick":[0]}')
  let q = R.conPaso(p, 'hat', 5, 3)
  q = R.conPaso(q, 'hat', 1, 1)
  q = R.conPaso(q, 'hat', 0, null)
  comprobar(r, 'conPaso con pincel', R.tipoDe(q, 'hat', 5) === 3 && R.tipoDe(q, 'hat', 1) === 1 && R.tipoDe(q, 'hat', 0) === null, JSON.stringify(q))
  comprobar(r, 'golpes y cuantos', R.golpes(q) === 3 && R.cuantos(q, 'roll') === 2 && R.cuantos(q, 's') === 0, `${R.golpes(q)} ${R.cuantos(q, 'roll')}`)
  const g = R.sonidoRack({ hat: [14], tipo: { hat: { 14: 3 } } }).groove
  comprobar(r, 'roll ×3: tres golpes en la casilla, creciendo', g.length === 3 && g[1].inicio > 14.3 && g[2].inicio < 15 && g[0].velocity < g[1].velocity && g[1].velocity < g[2].velocity)
  const s = R.sonidoRack({ hat: [3], tipo: { hat: { 3: 's' } } }).groove[0]
  comprobar(r, 'suave = menos velocity', s.velocity < R.velocidad('hat', 3))
  const m = R.mezclar({ kick: [0], hat: [1], tipo: { hat: { 1: 's' }, kick: { 0: 2 } } }, { hat: [2] })
  comprobar(r, 'mezclar reemplaza la fila con sus rolls', JSON.stringify(m) === '{"kick":[0],"hat":[2],"tipo":{"kick":{"0":2}}}', JSON.stringify(m))
  const meta = R.normalizar({ hat: R.SEMICORCHEAS, tipo: { hat: { 7: 3, 15: 2 } } }, ['hat'])
  const u = R.normalizar({ hat: R.SEMICORCHEAS, tipo: { hat: { 15: 2, 3: 2 } } }, ['hat'])
  const cmp = R.comparar(u, meta, ['hat'])
  comprobar(r, 'comparar: distintos', !cmp.ok && cmp.distintos.hat?.join() === '3,7', JSON.stringify(cmp))
  const aviso = R.avisoRack(cmp, ['hat'], meta, u)
  comprobar(r, 'aviso: les falta un roll y les sobra un roll', aviso === 'A los hats les falta un roll y les sobra un roll.', aviso)
  comprobar(r, 'marcas: oro y luego rojo', JSON.stringify(R.marcasRack(cmp)) === '{"hat:3":"sobra","hat:7":"sobra"}' && R.marcasRack({ ...cmp, rojo: true })['hat:7'] === 'mal')
  const viejo = R.avisoRack(R.comparar({ kick: [0, 3] }, { kick: [0, 7, 10] }, ['kick']), ['kick'])
  comprobar(r, 'aviso de siempre: «Al bombo le faltan…»', viejo === 'Al bombo le faltan 2 golpes y le sobra 1.', viejo)
  comprobar(r, 'cambiosPatron ve el roll', R.cambiosPatron({ hat: [14] }, { hat: [14], tipo: { hat: { 14: 2 } } }, ['hat'])['hat:14'] === true)

  const G = await import('../../src/theory/generos.js')
  const hecha = { lecciones: { '12.2': { completada: true }, '12.3': { completada: true } } }
  const sin = { lecciones: { '12.2': { completada: true } } }
  const nada = () => false
  for (const id of ['drill', 'jersey', 'dubstep']) {
    comprobar(r, `${id}: abierto con la 12.3 (sin dominar al padre)`, G.estadoGenero(id, { domina: nada, progreso: hecha }) === 'abierto')
    comprobar(r, `${id}: cerrado sin la 12.3`, G.estadoGenero(id, { domina: nada, progreso: sin }) === 'bloqueado')
    comprobar(r, `${id}: con rolls`, Boolean(R.GENEROS[id].patron.tipo))
  }
  comprobar(r, 'dominar el trap no «abre» el drill (ya lo abrió la lección)', !G.seAbrenCon('trap', { domina: (x) => x === 'trap', progreso: hecha }).includes('drill'))
  comprobar(r, 'phonk sigue esperando la P1.4', G.estadoGenero('phonk', { domina: (x) => x === 'trap', progreso: hecha }) === 'bloqueado')

  const { CATALOGO } = await import('../../src/content/catalogo.js')
  comprobar(r, 'catálogo: 12.3 ← 12.2', CATALOGO['12.3']?.requiere.join() === '12.2' && CATALOGO['12.3'].areas.join() === 'produccion,ritmo')
  const banco = (await import('../../src/content/pruebas/modulo-12.js')).default
  comprobar(r, 'prueba rápida: 3 preguntas de la 12.3', banco['12.3']?.length === 3)
  const leccion = (await import('../../src/content/modulo-12/leccion-12-3.js')).default
  comprobar(r, `lección: ${PASOS} pasos, el último un reto`, leccion.pasos.length === PASOS && leccion.pasos.at(-1).tipo === 'reto')
  const { codigoLeccion, estadoLeccion } = await import('../../src/content/index.js')
  comprobar(r, 'código P1.3 y ya no «Próximamente»', codigoLeccion('12.3') === 'P1.3' && estadoLeccion('12.3', { lecciones: {} }) !== 'proximamente', estadoLeccion('12.3', { lecciones: {} }))
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
    await preparar({ lecciones: { '12.3': { paso: n } }, retos: {} }, '#/leccion/12.3/guiada')
    await page.waitForSelector('[data-boton-accion]')
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  const celda = (fila, paso) => page.locator(`[data-fila="${fila}"] [data-paso="${paso}"]`)
  const pincel = (x) => page.locator(`[data-pincel="${x}"]`).click()

  // ——— Los 14 pasos ———
  for (let n = 0; n < PASOS; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
    comprobar(r, `paso ${n} sin scroll de lado`, ancho <= 376, String(ancho))
    await foto(`12.3-paso-${String(n).padStart(2, '0')}`)
  }

  // ——— Paso 3: suaves ———
  await irAlPaso(3)
  comprobar(r, 'suaves: el pincel se ve', (await page.locator('[data-pinceles] [data-pincel]').count()) === 4)
  await pincel('s')
  comprobar(r, 'suaves: pincel elegido', (await page.locator('[data-pincel="s"]').getAttribute('aria-checked')) === 'true')
  for (let p = 1; p < 16; p += 2) await celda('hat', p).click()
  comprobar(r, 'suaves: 8 pálidos', (await page.locator('[data-fila="hat"] [data-tipo="s"]').count()) === 8)
  await foto('12.3-suaves')
  await boton().click()
  await espera(400)
  comprobar(r, 'suaves: ¡Así suena!', /Así suena/.test(await info()), await info())

  // ——— Paso 5: primer roll ———
  await irAlPaso(5)
  comprobar(r, 'roll: la guía marca dónde se parte', (await page.locator('[data-fila="hat"] [data-paso="14"] .border-dashed').count()) >= 1)
  await pincel(2)
  await celda('hat', 14).click()
  await celda('hat', 15).click()
  comprobar(r, 'roll: dos barritas', (await page.locator('[data-fila="hat"] [data-paso="14"][data-tipo="2"] > span > span').count()) === 2)
  await foto('12.3-primer-roll')
  await boton().click()
  await espera(400)
  comprobar(r, 'roll: ¡Así suena!', /Así suena/.test(await info()), await info())

  // ——— Paso 7: dictado con dos errores ———
  await irAlPaso(7)
  comprobar(r, 'dictado: Escuchar el original', (await page.getByText('Escuchar el original').count()) >= 1)
  await pincel(2)
  await celda('hat', 7).click()
  await celda('hat', 15).click()
  await boton().click()
  await espera(400)
  comprobar(r, 'dictado: 1.er error en oro, sin decir dónde', /Casi/.test(await info()) && /roll/.test(await info()) && (await page.locator('[data-marca="sobra"]').count()) === 1, await info())
  await foto('12.3-dictado-oro')
  await celda('hat', 3).click() // otro cambio cualquiera (sigue mal)
  await boton().click()
  await espera(400)
  comprobar(r, 'dictado: 2.º error → la solución en rojo', /Así queda/.test(await info()) && (await page.locator('[data-marca="mal"]').count()) >= 1 && (await page.locator('[data-fila="hat"] [data-paso="7"][data-tipo="3"]').count()) === 1, await info())
  await foto('12.3-dictado-rojo')

  // ——— Paso 12: libre ———
  await irAlPaso(12)
  for (const p of [0, 2, 4, 6, 8, 10, 12, 14]) await celda('hat', p).click()
  comprobar(r, 'libre: sin roll no avanza', await boton().isDisabled())
  await pincel(3)
  await celda('hat', 14).click()
  await pincel('s')
  await celda('hat', 3).click()
  await espera(200)
  comprobar(r, 'libre: con roll y suave, Continuar', !(await boton().isDisabled()))
  await foto('12.3-libre')

  // ——— Árbol de géneros ———
  const conP13 = { lecciones: { '12.1': { completada: true }, '12.2': { completada: true }, '12.3': { completada: true } }, retos: {} }
  await preparar(conP13, '#/generos/drill/programa')
  comprobar(r, 'árbol: Prográmalo del drill abierto con el pincel', (await page.locator('[data-prueba-programa="drill"]').count()) === 1 && (await page.locator('[data-pinceles]').count()) === 1)
  await foto('12.3-programa-drill')

  // ——— Caja de ritmos ———
  await preparar({ lecciones: { '12.1': { completada: true } }, retos: {} }, '#/caja')
  comprobar(r, 'Caja: sin la 12.3, sin pincel', (await page.locator('[data-pinceles]').count()) === 0)
  await preparar(conP13, '#/caja')
  comprobar(r, 'Caja: con la 12.3, con pincel', (await page.locator('[data-pinceles]').count()) === 1)
  comprobar(r, 'Caja: «Empezar con» trae el drill', (await page.locator('[data-inicio="drill"]').count()) === 1)
  await page.locator('[data-inicio="jersey"]').click()
  await espera(300)
  comprobar(r, 'Caja: el jersey trae su roll de bombo', (await page.locator('[data-fila="kick"] [data-tipo="2"]').count()) === 1)
  await foto('12.3-caja')

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
