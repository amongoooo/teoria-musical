import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { getLeccion, getModulo } from '../content/index.js'
import { useRuta } from './rutaModulo.js'
import { useProgreso } from '../progress/progreso.js'
import { RESORTE } from '../ui/movimiento.js'
import { BotonInicio } from '../ui/Volver.jsx'
import { VIDRIO } from '../ui/vidrio.js'
import BotonOpciones from './Opciones.jsx'

/** Alto de la cabecera fija (fila de 44 px + márgenes + desvanecido), sin contar la zona segura de arriba. */
export const ALTO_CABECERA = 80
const FILA = 60 // borde de abajo de la fila (pt-4 + 44 px), por si aún no se puede medir la píldora

/**
 * Cabecera de las pantallas de Módulo: casita (Inicio) + barra de progreso por lecciones + Opciones.
 *  - Vive FUERA de la transición de páginas (App.jsx): al pasar de un módulo a otro se queda quieta;
 *    la barra cambia de color (fundido) y cada segmento se transforma con un resorte (si cambia el
 *    número de lecciones, los segmentos crecen o se encogen).
 *  - Es FIJA arriba y de VIDRIO (pedido del usuario): la casita, la barra (dentro de una píldora) y las
 *    Opciones flotan sobre la página, que pasa por detrás desenfocada. Cuando el título grande del módulo
 *    pasa por debajo, aparece en pequeño dentro de la píldora, bajo la barra (que sube para dejarle sitio).
 *  - La barra tiene un segmento por lección; cada uno se llena con el avance de esa lección
 *    (completada = lleno; a medias = paso / pasos).
 * La página de Módulo le deja su hueco arriba (`h-11`).
 */
export default function CabeceraModulo({ numero, ruta = null }) {
  const progreso = useProgreso()
  const deRuta = useRuta(ruta) // también para módulos (los hooks van siempre); solo se usa con `ruta`
  const modulo = ruta ? deRuta.modulo : getModulo(numero)
  const chico = useTituloEscondido(ruta ?? numero)
  if (!modulo) return null

  // Avance de una lección: completada = 1, a medias = paso / pasos.
  const avanceLeccion = (id) => {
    const p = progreso.lecciones[id]
    if (p?.completada) return 1
    const pasos = getLeccion(id)?.pasos.length
    return p?.paso > 0 && pasos ? p.paso / pasos : 0
  }
  // En una ruta, la barra es LISA, sin secciones (pedido del usuario): paradas hechas + el avance de la actual si
  // es una lección a medias, sobre el total. En un módulo, un segmento por lección.
  const paradas = ruta ? deRuta.estado.paradas : []
  const valores = ruta
    ? [paradas.reduce((t, p) => t + (p.hecha ? 1 : p.estado === 'actual' && p.tipo === 'leccion' ? avanceLeccion(p.id) : 0), 0) / Math.max(1, paradas.length)]
    : modulo.lecciones.map((l) => avanceLeccion(l.id))
  const hechas = ruta ? deRuta.estado.hechas : valores.filter((v) => v === 1).length
  const total = ruta ? paradas.length : valores.length

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 pb-5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 pt-4 sm:pt-6">
        <div className="pointer-events-auto shrink-0">
          <BotonInicio />
        </div>
        {/* flex-1 + basis-0 + min-w-0: la zona de la barra tiene un ancho fijo; los segmentos nuevos crecen
            DENTRO de ella (antes la ensanchaban un instante y empujaban la rueda de Opciones). */}
        <div data-pildora-cabecera className={`relative mx-auto flex h-11 min-w-0 max-w-xl flex-1 basis-0 flex-col justify-center rounded-full px-4 ${VIDRIO}`}>
          <motion.div animate={{ y: chico ? -8 : 0 }} transition={RESORTE.suave}>
            <BarraLecciones valores={valores} color={modulo.acento} aria-label={ruta ? `Ruta de ${modulo.titulo.toLowerCase()}: ${hechas} de ${total} paradas` : `Módulo ${modulo.numero}: ${hechas} de ${total} lecciones completadas`} />
          </motion.div>
          <AnimatePresence>
            {chico && (
              <motion.p
                key="titulo"
                className="absolute inset-x-4 bottom-0.5 truncate text-center text-sm font-semibold text-zinc-800"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ ...RESORTE.suave, opacity: { duration: 0.15 } }}
              >
                {modulo.titulo}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="pointer-events-auto shrink-0">
          <BotonOpciones />
        </div>
      </div>
    </div>
  )
}

// Escalonado de la barra de lecciones (pedido del usuario): al pasar de un módulo a otro, los segmentos se llenan uno
// tras otro de izquierda a derecha y se vacían de derecha a izquierda, como una sola barra.
const ESCALON = 0.11

/**
 * Barra de progreso dividida en segmentos (uno por lección), cada uno con su relleno 0–1.
 * El relleno y el color se animan; al cambiar el número de segmentos, entran y salen creciendo.
 * Primero se vacían (de derecha a izquierda) los que bajan y luego se llenan (de izquierda a derecha) los que suben.
 */
function BarraLecciones({ valores, color, ...props }) {
  const limpios = valores.map((v) => Math.max(0, Math.min(1, v)))
  const antes = useRef([])
  const previos = antes.current
  const bajan = limpios.map((v, i) => i).filter((i) => limpios[i] < (previos[i] ?? 0)).reverse()
  const suben = limpios.map((v, i) => i).filter((i) => limpios[i] > (previos[i] ?? 0))
  const primera = previos.length === 0 // al aparecer: espera un poco, como BarraProgreso
  const retraso = {}
  bajan.forEach((i, k) => (retraso[i] = k * ESCALON))
  suben.forEach((i, k) => (retraso[i] = (primera ? 0.15 : 0) + (bajan.length + k) * ESCALON))
  useEffect(() => {
    antes.current = limpios
  })
  return (
    <div className="flex h-2.5 w-full gap-1.5 overflow-hidden" role="img" {...props}>
      <AnimatePresence initial={false}>
        {limpios.map((v, i) => (
          <motion.div
            key={i}
            className="h-full min-w-0 overflow-hidden rounded-full bg-zinc-200"
            initial={{ flexGrow: 0, opacity: 0 }}
            animate={{ flexGrow: 1, opacity: 1 }}
            exit={{ flexGrow: 0, opacity: 0 }}
            transition={RESORTE.suave}
            style={{ flexBasis: 0 }}
          >
            <motion.div
              className="h-full rounded-full"
              data-segmento={i}
              initial={{ width: 0, backgroundColor: color }}
              animate={{ width: `${v * 100}%`, backgroundColor: color }}
              transition={{
                width: { ...RESORTE.pulsar, delay: retraso[i] ?? 0 },
                backgroundColor: { duration: 0.35, ease: 'easeOut' },
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/** true cuando el título grande del módulo ya pasó por debajo de la cabecera (se muestra en pequeño). */
function useTituloEscondido(numero) {
  const [escondido, setEscondido] = useState(false)
  useEffect(() => {
    let frame = 0
    // En cuanto el título grande toca la píldora, se ESCONDE (fundido corto) y aparece el chico dentro de la
    // píldora: nunca se ven los dos ni queda el grande a medias detrás del vidrio. «MÓDULO N», igual con
    // su propia línea. (Sin estados intermedios: si la página se queda quieta ahí, no hay «fantasma».)
    const revisar = () => {
      const h1 = document.querySelector('[data-titulo-modulo]')
      const bloque = h1?.parentElement
      if (!h1 || !bloque) return setEscondido(false)
      const lim = document.querySelector('[data-pildora-cabecera]')?.getBoundingClientRect().bottom ?? FILA
      let tapado = false
      // En los hijos (el bloque lo anima motion al entrar a la página).
      for (const hijo of bloque.children) {
        const esconder = hijo.getBoundingClientRect().top < lim - 2
        hijo.style.transition = 'opacity 180ms ease-out'
        hijo.style.opacity = esconder ? '0' : ''
        if (hijo === h1) tapado = esconder
      }
      setEscondido(tapado)
    }
    const alDesplazar = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(revisar)
    }
    // Al cambiar de módulo la página nueva tarda un instante en montarse.
    const t = setTimeout(revisar, 50)
    revisar()
    window.addEventListener('scroll', alDesplazar, { passive: true })
    window.addEventListener('resize', alDesplazar)
    return () => {
      clearTimeout(t)
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', alDesplazar)
      window.removeEventListener('resize', alDesplazar)
    }
  }, [numero])
  return escondido
}
