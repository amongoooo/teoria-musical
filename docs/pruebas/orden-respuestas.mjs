// Prueba que las OPCIONES DE TEXTO de «Escucha y elige» se barajan (pedido del usuario: «si la saco mal ya sé cuál es»).
// Abre 6 veces el paso 12 de la 3.1 («Tono + tono» es la buena) y cuenta los órdenes distintos; elegir la buena por su
// texto da «¡Correcto!». Y `ordenNatural`: las opciones con orden natural (números que suben, «Ninguna · Una · Dos»,
// «La versión A · B») no se barajan. Uso: npm run build && npx vite preview --port 4173, y
// BASE=http://localhost:4173/teoria-musical/ node docs/pruebas/orden-respuestas.mjs
import { createRequire } from 'module'
const { chromium } = createRequire(import.meta.url)('playwright')
const BASE = process.env.BASE || 'http://localhost:4173/teoria-musical/'
const r = {}
const comprobar = (nombre, ok, dato = '') => (r[nombre] = ok ? 'ok' : `FALLA ${dato}`)

const browser = await chromium.launch()
const vistos = new Set()
for (let k = 0; k < 6; k++) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
  await ctx.addInitScript((tema) => {
    localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
    localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { '3.1': { paso: 12 } }, retos: {} }))
  }, k % 2 ? 'oscuro' : 'claro')
  const page = await ctx.newPage()
  await page.goto(BASE + '#/leccion/3.1/guiada')
  await page.waitForTimeout(1000)
  vistos.add((await page.$$eval('main button[aria-pressed]', (b) => b.map((x) => x.textContent.trim()))).join(' | '))
  if (k < 2) {
    await page.getByRole('button', { name: 'Tono + tono', exact: true }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Comprobar' }).click()
    await page.waitForTimeout(800)
    comprobar(`la buena por su texto da ¡Correcto! (${k % 2 ? 'oscuro' : 'claro'})`, (await page.textContent('body')).includes('¡Correcto!'))
  }
  await ctx.close()
}
comprobar('las opciones cambian de orden', vistos.size >= 2, [...vistos].join(' / '))

const { ordenNatural } = await import('../../src/components/exercises/ordenOpciones.js')
if (ordenNatural) {
  comprobar('60 · 90 · 120 BPM fijas', ordenNatural(['60 BPM', '90 BPM', '120 BPM']))
  comprobar('Ninguna · Una · Dos fijas', ordenNatural(['Ninguna', 'Una: Fa♯', 'Dos: Fa♯ y Do♯']))
  comprobar('La versión A · B fijas', ordenNatural(['La versión A', 'La versión B']))
  comprobar('Mayor · Menor se barajan', !ordenNatural(['**Mayor**', '**Menor**']))
}
await browser.close()
console.log(JSON.stringify(r, null, 2))
const fallos = Object.values(r).filter((v) => v !== 'ok').length
console.log(fallos ? `${fallos} FALLOS` : 'TODO BIEN')
