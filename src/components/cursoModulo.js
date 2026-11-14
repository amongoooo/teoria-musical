// El CURSO COMPLETO presentado como módulos (como las rutas en rutaModulo.js): cada BLOQUE se abre como un camino de
// islas (CaminoLecciones con `ruta`), con la misma cabecera, deslizar entre bloques y cuadritos. La diferencia: cada
// isla lleva el color de SU área (acordes M4, ritmo M2, letras M6; el reto de las tres en neutro).
import { AREAS, BLOQUES, estadoCurso, getBloque } from '../content/curso.js'
import { HERRAMIENTAS } from '../content/rutas.js'
import { useOpciones } from '../progress/opciones.js'
import { useProgreso } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { Metronomo, Oreja, Pluma, Trofeo } from '../ui/Iconos.jsx'
import { ICONOS_ABRE, PRACTICAS, useMedirMetas } from './rutaModulo.js'

/** Ícono de cada área (el de su práctica). */
export const ICONO_AREA = { acordes: Oreja, ritmo: Metronomo, letras: Pluma, tres: Trofeo }

/** Color del curso: el neutro (insignias de los bloques). */
export const ACENTO_CURSO = 'var(--color-neutro)'

/** El «módulo» de un bloque (sin estado): lo que necesitan la cabecera, los cuadritos y el deslizar. */
export function moduloDeBloque(n) {
  const b = getBloque(n)
  if (!b) return null
  return {
    esRuta: true,
    esBloque: true,
    id: `bloque-${b.numero}`,
    numero: b.numero,
    href: rutas.bloque(b.numero),
    nombre: `Bloque ${b.numero}`,
    subtitulo: b.titulo,
    etiqueta: 'Bloque',
    titulo: b.titulo,
    descripcion: b.descripcion,
    acento: ACENTO_CURSO,
    lecciones: [],
    disponible: true,
    // Entre bloques no hay vuelta (van en orden): después del último, «Próximamente».
    vecino: (dir) => moduloDeBloque(b.numero + dir) ?? (dir > 0 ? { ...proximo(b.numero + 1) } : null),
  }
}

/** El bloque que aún no existe (para el indicador «Próximamente» al deslizar después del último). */
const proximo = (numero) => ({ esRuta: true, esBloque: true, numero, nombre: `Bloque ${numero}`, titulo: 'Próximamente', acento: ACENTO_CURSO, disponible: false })

/** El curso con su estado (se vuelve a pintar al cambiar el progreso o una práctica). */
export function useCurso() {
  const progreso = useProgreso()
  const { admin } = useOpciones()
  const medidor = useMedirMetas()
  const meta = (p) => medidor.meta(p, AREAS[p.area].practica)
  const estado = estadoCurso({ progreso, medir: meta, admin })
  for (const b of estado.bloques) for (const p of b.paradas) p.Icono = (p.tipo === 'abre' && ICONOS_ABRE[p.herramienta]) || ICONO_AREA[p.area]
  return { estado, meta, progreso }
}

/**
 * Qué hacer con un paso del curso desde fuera de su bloque (tarjeta «Sigue aquí», «Tus rutas»): la acción y su texto.
 * Lección → Empezar / Continuar; práctica → Practicar (con la dificultad recomendada); se abre → la lección que la abre;
 * reto → su bloque.
 */
export function accionPaso(p, { progreso, meta }) {
  if (!p) return null
  if (p.tipo === 'leccion') {
    const empezada = progreso.lecciones[p.id]?.paso > 0
    return { texto: empezada ? 'Continuar' : 'Empezar', ir: () => navegar(rutas.leccion(p.id)) }
  }
  if (p.tipo === 'meta') return { texto: 'Practicar', ir: () => meta(p).ir() }
  if (p.tipo === 'abre') return { texto: 'Empezar', ir: () => navegar(rutas.leccion(HERRAMIENTAS[p.herramienta].leccion)) }
  return { texto: 'Ver el reto', ir: () => navegar(rutas.bloque(p.bloque)) }
}

/** Datos de un bloque para el camino de islas (la `ruta` de CaminoLecciones). */
export function rutaDeBloque(curso, numero, onVerBloques) {
  const b = curso.estado.bloques.find((x) => x.numero === Number(numero))
  const fuera = curso.estado.actual && curso.estado.actual.bloque !== b.numero ? curso.estado.actual : null
  return {
    estado: { paradas: b.paradas, tramos: [], hechas: b.hechas, total: b.total },
    meta: curso.meta,
    nivelMax: () => 0,
    enlaceMeta: (modo) => PRACTICAS.oido.enlace(modo),
    Icono: null,
    iconosAbre: ICONOS_ABRE,
    onVerModulos: onVerBloques,
    textoVerModulos: 'Ver todos los bloques',
    // Lo que va «antes» cuando el siguiente paso del curso está en otro bloque.
    siguienteFuera: fuera && { titulo: fuera.titulo, ir: () => navegar(rutas.bloque(fuera.bloque)) },
    bloque: b,
  }
}

export { BLOQUES }
