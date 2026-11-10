import { AnimatePresence, motion } from 'motion/react'
import { getModulo } from '../content/index.js'
import { useProgreso } from '../progress/progreso.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { BotonInicio } from '../ui/Volver.jsx'

/**
 * Cabecera de las pantallas de Módulo: casita (Inicio) + barra de progreso del módulo + «hechas/total».
 * Vive FUERA de la transición de páginas (App.jsx), así que al pasar de un módulo a otro se queda
 * quieta: la barra solo cambia de color (fundido) y su valor se transforma con un resorte. Va en
 * posición absoluta arriba; la página de Módulo le deja su hueco (`ALTO_CABECERA`).
 */
export default function CabeceraModulo({ numero }) {
  const modulo = getModulo(numero)
  const progreso = useProgreso()
  if (!modulo) return null
  const hechas = modulo.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
  const total = modulo.lecciones.length
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 pt-4 sm:pt-6">
        <div className="pointer-events-auto">
          <BotonInicio />
        </div>
        <div className="mx-auto flex w-full max-w-xl items-center gap-3">
          <BarraProgreso valor={total ? hechas / total : 0} color={modulo.acento} className="flex-1" aria-label={`Módulo ${modulo.numero}: ${hechas} de ${total} lecciones completadas`} />
          <span className="relative grid text-sm tabular-nums text-zinc-500">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span key={`${modulo.numero}:${hechas}/${total}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                {hechas}/{total}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
      </div>
    </div>
  )
}
