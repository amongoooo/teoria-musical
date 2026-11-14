// CURSO COMPLETO (pedido del usuario; maqueta: https://claude.ai/artifact/7pwg9QVpih3UueHpwWQooH, cambios aprobados:
// https://claude.ai/artifact/K9mUUjKNofxBuLNV2QsoEZ). Las tres rutas a la par, en BLOQUES de 10–17 pasos hechos de
// paradas que ya existen en content/rutas.js (lecciones, metas de práctica, lo que se abre y los retos). Cada paso
// lleva su ÁREA (la ruta de la que sale: su color y la práctica con la que se mide). Lo hecho en módulos y rutas
// cuenta solo aquí. El curso es LINEAL, como las rutas: lo cumplido más adelante sale bloqueado hasta llegar.
// OPCIONALES (3.6 y 3.7): al final de su bloque, siempre abiertos; no cuentan para cerrar el bloque ni para el %.
// El curso crecerá: más bloques y, más adelante, «etapas» que los agrupen.
import { ARMONIA, LETRAS, RITMO } from './areas.js'
import { TRAMOS, cumplidaParada, tituloLeccion } from './rutas.js'

/** Las áreas del curso: una por ruta (su color y su práctica) y «las tres» para el reto final. */
export const AREAS = {
  acordes: { id: 'acordes', nombre: 'Armonía', ruta: 'acordes', practica: 'oido', acento: ARMONIA },
  ritmo: { id: 'ritmo', nombre: 'Ritmo', ruta: 'ritmo', practica: 'ritmo', acento: RITMO },
  letras: { id: 'letras', nombre: 'Letras', ruta: 'letras', practica: 'letras', acento: LETRAS },
  tres: { id: 'tres', nombre: 'Las tres', ruta: null, practica: null, acento: 'var(--color-neutro)' },
}
/** Las áreas que se cuentan por separado (el anillo y las filas de avance). */
export const ORDEN_AREAS = ['acordes', 'ritmo', 'letras']

/** Clave de una parada de los tramos, para buscarla: '2.1', 'seguir:2', 'vocab:noche', 'letra', 'abre:flow', 'reto:ruta-ritmo'. */
function clave(p) {
  if (p.tipo === 'leccion') return p.id
  if (p.tipo === 'meta') return p.modo ? `${p.modo}:${p.nivel}` : p.clave === 'vocab' ? `vocab:${p.tema}` : p.clave
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
const A = (c, e) => paso('acordes', c, e)
const R = (c, e) => paso('ritmo', c, e)
const L = (c, e) => paso('letras', c, e)

export const BLOQUES = [
  {
    numero: 1,
    titulo: 'Arrancar',
    meta: 'Analiza tu primera letra',
    descripcion: 'Las notas y el teclado, el pulso y el compás, y tu primera rima.',
    paradas: [A('1.1'), R('2.1'), L('L1'), A('1.2'), R('seguir:2'), A('1.3'), R('2.2'), L('vocab:noche'), A('1.4'), R('eco:3'), L('letra')],
  },
  {
    numero: 2,
    titulo: 'El idioma de la música',
    meta: 'Se abre el Flow',
    descripcion: 'Tonos e intervalos, la escala mayor y la menor, figuras y síncopa, esquemas y sílabas.',
    paradas: [
      A('3.1'), R('2.3'), L('L2'), A('3.2'), R('seguir:5'), L('L3'), A('intervalos:4'), A('3.3'), L('vocab:calle'), A('3.4'), R('2.4'), R('abre:flow'),
      A('3.6', { opcional: true }),
    ],
  },
  {
    numero: 3,
    titulo: 'Tu primera canción',
    meta: 'Tus tres retos en una canción',
    descripcion: 'El círculo de quintas, los acordes y sus inversiones, el swing, los multis y el flow: todo junto en una canción.',
    paradas: [
      A('3.5'), R('2.5'), L('L4'), A('abre:circulo'),
      A('4.1'), A('acordes:2'),
      L('abre:flow', { titulo: 'Flow en tus letras', texto: 'Tus versos sobre el beat, sílaba por sílaba: la pestaña Flow de cada letra.' }),
      A('4.2'), L('L5'), R('reto:ruta-ritmo'), A('4.3'), A('4.4'), A('acordes:3'), L('reto:ruta-letras'), A('4.5'), A('reto:ruta-acordes'),
      paso('tres', 'reto:curso-cancion', {
        tipo: 'reto',
        id: 'curso-cancion',
        titulo: 'Tus tres retos en una canción',
        texto: 'En FL Studio, junta en una sola canción tu progresión I–V–vi–IV, tu groove con swing y tus 8 versos con flow encima: 8 compases que suenen juntos.',
      }),
      A('3.7', { opcional: true }),
    ],
  },
]

export const getBloque = (n) => BLOQUES.find((b) => b.numero === Number(n)) ?? null

/**
 * Estado del curso. `medir(p)` → { valor, meta } de una meta (con la práctica de su área).
 * Devuelve:
 *  - `bloques`: cada uno con sus `paradas` (índice `i` DENTRO del bloque, `estado`: 'hecha' | 'actual' |
 *    'bloqueada' (o 'abierta' en modo administrador) | 'opcional'), `hechas`, `total` (sin opcionales) y su
 *    `estado`: 'hecha' | 'ahora' | 'siguiente'.
 *  - `actual`: el siguiente paso del curso (con su `bloque`), o null si está todo hecho.
 *  - `hechas`, `total` y `areas` ({ acordes: { hechas, total }, … }): solo los pasos necesarios.
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
  return { bloques, actual, hechas, total, areas }
}
