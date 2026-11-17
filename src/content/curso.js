// CURSO COMPLETO (pedido del usuario; maqueta: https://claude.ai/artifact/7pwg9QVpih3UueHpwWQooH, cambios aprobados:
// https://claude.ai/artifact/K9mUUjKNofxBuLNV2QsoEZ). Las tres rutas a la par, en BLOQUES de 10–17 pasos hechos de
// paradas que ya existen en content/rutas.js (lecciones, metas de práctica, lo que se abre y los retos). Cada paso
// lleva su ÁREA (la ruta de la que sale: su color y la práctica con la que se mide). Lo hecho en módulos y rutas
// cuenta solo aquí. El curso es LINEAL, como las rutas: lo cumplido más adelante sale bloqueado hasta llegar.
// OPCIONALES (3.6 y 3.7): al final de su bloque, siempre abiertos; no cuentan para cerrar el bloque ni para el %.
// ETAPAS (fase 4 del rediseño; plan aprobado: https://claude.ai/artifact/JT5CGCcMc457BZF8XTYe8L): los bloques se
// agrupan en 5 etapas (1 Fundamentos · 2 Tu primera canción · 3 Construir canciones · 4 Sonido propio · 5 Terminar y
// publicar). Cada bloque dice su `etapa`; las etapas sin bloques salen «Próximamente». Desde la fase 4 el curso usa
// CUATRO colores: cada lección toma su área principal del catálogo (Melodía = notas, intervalos y escalas; Armonía =
// acordes) y cada meta, la de su modo. No se añaden pasos a los bloques que ya existen: el curso es lineal y un paso
// nuevo antes de donde vas te regresaría.
import { ARMONIA, LETRAS, MELODIA, RITMO } from './areas.js'
import { TRAMOS, cumplidaParada, tituloLeccion } from './rutas.js'

/** Las áreas del curso: una por ruta (su color y su práctica) y «todo junto» para el reto final. */
export const AREAS = {
  melodia: { id: 'melodia', nombre: 'Melodía', ruta: 'melodia', practica: 'oido', acento: MELODIA },
  acordes: { id: 'acordes', nombre: 'Armonía', ruta: 'acordes', practica: 'oido', acento: ARMONIA },
  ritmo: { id: 'ritmo', nombre: 'Ritmo', ruta: 'ritmo', practica: 'ritmo', acento: RITMO },
  letras: { id: 'letras', nombre: 'Letras', ruta: 'letras', practica: 'letras', acento: LETRAS },
  tres: { id: 'tres', nombre: 'Todo junto', ruta: null, practica: null, acento: 'var(--color-neutro)' },
}
/** Las áreas que se cuentan por separado (el anillo y las filas de avance). */
export const ORDEN_AREAS = ['melodia', 'acordes', 'ritmo', 'letras']

/** Clave de una parada de los tramos, para buscarla: '2.1', 'seguir:2', 'vocab:noche', 'letra', 'abre:flow', 'reto:ruta-ritmo'. */
function clave(p) {
  if (p.tipo === 'leccion') return p.id
  // Una meta de un modo: 'modo:nivel', o su `id` si dos piden el mismo nivel (Acordes: «acordes:3» = invertidos).
  if (p.tipo === 'meta') return p.modo ? (p.id ?? `${p.modo}:${p.nivel}`) : p.clave === 'vocab' ? `vocab:${p.tema}` : p.clave
  if (p.tipo === 'abre') return `abre:${p.herramienta}`
  return `reto:${p.id}`
}
const PARADAS = new Map()
for (const t of Object.values(TRAMOS)) for (const p of t.paradas) if (!PARADAS.has(clave(p))) PARADAS.set(clave(p), p)

/** Un paso del curso: la parada de los tramos (o una lección suelta, como la 1.1) con su área y lo que se cambie. */
function paso(area, c, extra = {}) {
  const base = PARADAS.get(c) ?? (/^\d+\.\d+$/.test(c) ? { tipo: 'leccion', id: c } : null)
  if (!base && !extra.tipo) throw new Error(`Curso: no existe la parada «${c}»`)
  return { ...base, ...extra, area }
}
const M = (c, e) => paso('melodia', c, e)
const A = (c, e) => paso('acordes', c, e)
const R = (c, e) => paso('ritmo', c, e)
const L = (c, e) => paso('letras', c, e)

/** Las etapas del curso, en orden (sus bloques llevan `etapa`). */
export const ETAPAS = [
  { numero: 1, titulo: 'Fundamentos' },
  { numero: 2, titulo: 'Tu primera canción' },
  { numero: 3, titulo: 'Construir canciones' },
  { numero: 4, titulo: 'Sonido propio' },
  { numero: 5, titulo: 'Terminar y publicar' },
]

export const BLOQUES = [
  {
    numero: 1,
    etapa: 1,
    titulo: 'Arrancar',
    meta: 'Analiza tu primera letra',
    descripcion: 'Las notas y el teclado, el pulso y el compás, y tu primera rima.',
    paradas: [M('1.1'), R('2.1'), L('L1'), M('1.2'), R('seguir:2'), M('1.3'), R('2.2'), L('vocab:noche'), M('1.4'), R('eco:3'), L('letra')],
  },
  {
    numero: 2,
    etapa: 1,
    titulo: 'El idioma de la música',
    meta: 'Se abre el Flow',
    descripcion: 'Tonos e intervalos, la escala mayor y la menor, figuras y síncopa, esquemas y sílabas.',
    paradas: [
      M('3.1'), R('2.3'), L('L2'), M('3.2'), R('seguir:5'), L('L3'), M('intervalos:4'), M('3.3'), L('vocab:calle'), M('3.4'), R('2.4'), R('abre:flow'),
      M('3.6', { opcional: true }),
    ],
  },
  {
    numero: 3,
    etapa: 2,
    titulo: 'Tu primera canción',
    meta: 'Tus tres retos en una canción',
    descripcion: 'El círculo de quintas, los acordes y sus inversiones, el swing, los multis y el flow: todo junto en una canción.',
    paradas: [
      M('3.5'), R('2.5'), L('L4'), A('abre:circulo'),
      A('4.1'), A('acordes:2'),
      L('abre:flow', { titulo: 'Flow en tus letras', texto: 'Tus versos sobre el beat, sílaba por sílaba: la pestaña Flow de cada letra.' }),
      A('4.2'), L('L5'), R('reto:ruta-ritmo'), A('4.3'), A('4.4'), A('acordes:3'), L('reto:ruta-letras'), A('4.5'), A('reto:ruta-acordes'),
      paso('tres', 'reto:curso-cancion', {
        tipo: 'reto',
        id: 'curso-cancion',
        titulo: 'Tus tres retos en una canción',
        texto: 'En FL Studio, junta en una sola canción tu progresión I–V–vi–IV, tu groove con swing y tus 8 versos con flow encima: 8 compases que suenen juntos.',
      }),
      M('3.7', { opcional: true }),
    ],
  },
  // Etapa 3 «Construir canciones» (plan aprobado: https://claude.ai/artifact/5y8ppYbWa9MwyVdc2Bh31n), con la 5.1–5.4 (bloque 4) y la 5.5–5.7 (bloque 5).
  // Ritmo y Letras no tienen lecciones nuevas: avanzan con metas de práctica que solo están en el curso.
  {
    numero: 4,
    etapa: 3,
    titulo: 'Funciones y loops',
    meta: 'Tu loop con letra',
    descripcion: 'Qué trabajo hace cada acorde, tensión, cadencias y los loops del pop, con semicorcheas, síncopa y palabras nuevas.',
    paradas: [
      A('5.1'), M('intervalos:5'),
      R('seguir:7', { tipo: 'meta', modo: 'seguir', nivel: 7, dificultad: 2, titulo: 'Seguir · nivel 7', texto: 'Llega a las semicorcheas: cuatro golpes en cada tiempo, «1 e y a».' }),
      A('funciones:3'),
      L('vocab:amor', { tipo: 'meta', clave: 'vocab', tema: 'amor', palabras: 10, titulo: 'Vocabulario · Amor', texto: 'Aprende 10 palabras del tema Amor y desamor.' }),
      A('5.2'),
      R('eco:6', { tipo: 'meta', modo: 'eco', nivel: 6, dificultad: 2, titulo: 'Eco · nivel 6', texto: 'Escucha un compás y repítelo: llega a la síncopa.' }),
      A('acordes:5'), M('intervalos:6'), A('5.3'),
      L('vocab:dinero', { tipo: 'meta', clave: 'vocab', tema: 'dinero', palabras: 10, titulo: 'Vocabulario · Dinero', texto: 'Aprende 10 palabras del tema Dinero.' }),
      A('5.4'), A('funciones:4'), M('absoluto:4'),
      paso('tres', 'reto:curso-loop', {
        tipo: 'reto',
        id: 'curso-loop',
        titulo: 'Tu loop con letra',
        texto: 'En FL Studio, arma un loop de 4 compases en menor (acordes, bajo y un beat de trap o dembow) y escribe encima 4 versos con palabras del tema Amor o Dinero.',
      }),
    ],
  },
  // Bloque 5 (plan aprobado de la 5.7: https://claude.ai/artifact/V9Q8tet1BajDdwTbVjQBfE), al final de la etapa 3: la 5.5–5.7
  // con sus metas. Ritmo, Melodía y Letras siguen con metas que solo están en el curso; las de Letras piden más de lo que
  // ya pedían el bloque 1 y la ruta (20 palabras de un tema, una segunda letra en el cuaderno).
  {
    numero: 5,
    etapa: 3,
    titulo: 'Progresiones y análisis',
    meta: 'Tu canción, de punta a punta',
    descripcion: 'Séptimas, el ii–V–I y el blues, cada cuánto cambia el acorde y el método para analizar cualquier canción, con swing y más palabras.',
    paradas: [
      A('5.5'),
      M('intervalos:7', { tipo: 'meta', modo: 'intervalos', nivel: 7, dificultad: 2, titulo: 'Intervalos · nivel 7', texto: 'Se suman las séptimas: la 7.ª menor y la 7.ª mayor, las que dan color a los acordes de séptima.' }),
      R('seguir:8', { tipo: 'meta', modo: 'seguir', nivel: 8, dificultad: 2, titulo: 'Seguir · nivel 8', texto: 'Llega a la síncopa de semicorchea: golpes en la «e» y en la «a».' }),
      A('acordes:6'),
      L('vocab:noche', { palabras: 20, titulo: 'Vocabulario · Noche, 20', texto: 'Llega a 20 palabras del tema Noche.' }),
      A('5.6'),
      R('eco:7', { tipo: 'meta', modo: 'eco', nivel: 7, dificultad: 2, titulo: 'Eco · nivel 7', texto: 'Escucha un compás y repítelo: llega a las semicorcheas.' }),
      M('absoluto:5', { tipo: 'meta', modo: 'absoluto', nivel: 5, dificultad: 1, titulo: 'Oído absoluto · nivel 5', texto: 'Seis notas: se suma Fa.' }),
      A('5.7'),
      A('funciones:5'),
      L('vocab:amor', { tipo: 'meta', clave: 'vocab', tema: 'amor', palabras: 20, titulo: 'Vocabulario · Amor, 20', texto: 'Llega a 20 palabras del tema Amor y desamor.' }),
      R('seguir:9', { tipo: 'meta', modo: 'seguir', nivel: 9, dificultad: 2, titulo: 'Seguir · nivel 9', texto: 'Llega al swing: las corcheas se reparten largo-corto.' }),
      A('reto:ruta-progresiones'),
      L('letra', { letras: 2, titulo: 'Tu segunda letra', texto: 'Escribe otra letra en tu cuaderno (dos con texto) y mira sus rimas y su esquema.' }),
      paso('tres', 'reto:curso-cancion-completa', {
        tipo: 'reto',
        id: 'curso-cancion-completa',
        titulo: 'Tu canción, de punta a punta',
        texto: 'En FL Studio, arma 16 compases: un verso con la armonía lenta que acaba en semicadencia, un coro que cierra con una auténtica, tu beat y 8 versos tuyos con palabras de Noche o Amor.',
      }),
    ],
  },
]

export const getBloque = (n) => BLOQUES.find((b) => b.numero === Number(n)) ?? null

/** La etapa de un bloque ({ numero, titulo }). */
export const etapaDeBloque = (n) => ETAPAS.find((e) => e.numero === getBloque(n)?.etapa) ?? null

/**
 * Estado del curso. `medir(p)` → { valor, meta } de una meta (con la práctica de su área).
 * Devuelve:
 *  - `bloques`: cada uno con sus `paradas` (índice `i` DENTRO del bloque, `estado`: 'hecha' | 'actual' |
 *    'bloqueada' (o 'abierta' en modo administrador) | 'opcional'), `hechas`, `total` (sin opcionales) y su
 *    `estado`: 'hecha' | 'ahora' | 'siguiente'.
 *  - `actual`: el siguiente paso del curso (con su `bloque`), o null si está todo hecho.
 *  - `hechas`, `total` y `areas` ({ acordes: { hechas, total }, … }): solo los pasos necesarios.
 *  - `etapas`: cada una con sus `bloques` (números), `hechas`, `total` y `estado`: 'hecha' | 'ahora' | 'siguiente' |
 *    'pronto' (aún sin bloques). `etapa` = el número de la etapa en la que vas.
 */
export function estadoCurso({ progreso, medir, admin = false }) {
  let actual = null
  const areas = Object.fromEntries(Object.keys(AREAS).map((a) => [a, { hechas: 0, total: 0 }]))
  const bloques = BLOQUES.map((b) => {
    const paradas = b.paradas.map((p, i) => {
      const ok = cumplidaParada(p, progreso, medir)
      const titulo = p.titulo ?? tituloLeccion(p.id)
      const acento = AREAS[p.area].acento
      if (p.opcional) return { ...p, i, titulo, acento, bloque: b.numero, cumplida: ok, hecha: ok, estado: ok ? 'hecha' : 'opcional' }
      const hecha = ok && !actual // lineal: nada cuenta después del primer paso sin cumplir
      const parada = { ...p, i, titulo, acento, bloque: b.numero, cumplida: ok, hecha }
      if (!hecha && !actual) actual = parada
      parada.estado = hecha ? 'hecha' : parada === actual ? 'actual' : admin ? 'abierta' : 'bloqueada'
      areas[p.area].total++
      if (hecha) areas[p.area].hechas++
      return parada
    })
    const necesarias = paradas.filter((p) => !p.opcional)
    const hechas = necesarias.filter((p) => p.hecha).length
    return { ...b, paradas, hechas, total: necesarias.length }
  })
  for (const b of bloques) b.estado = b.hechas === b.total ? 'hecha' : actual?.bloque === b.numero ? 'ahora' : 'siguiente'
  const hechas = bloques.reduce((t, b) => t + b.hechas, 0)
  const total = bloques.reduce((t, b) => t + b.total, 0)
  const etapas = ETAPAS.map((e) => {
    const suyos = bloques.filter((b) => b.etapa === e.numero)
    const h = suyos.reduce((t, b) => t + b.hechas, 0)
    const tot = suyos.reduce((t, b) => t + b.total, 0)
    const estado = !suyos.length ? 'pronto' : suyos.some((b) => b.estado === 'ahora') ? 'ahora' : h === tot ? 'hecha' : 'siguiente'
    return { ...e, bloques: suyos.map((b) => b.numero), hechas: h, total: tot, estado }
  })
  // La etapa en la que vas: la del paso actual o, con todo hecho, la última que tiene bloques.
  const etapa = actual ? getBloque(actual.bloque).etapa : Math.max(...BLOQUES.map((b) => b.etapa))
  return { bloques, actual, hechas, total, areas, etapas, etapa }
}
