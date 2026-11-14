import { motion } from 'motion/react'
import { AREAS, ORDEN_AREAS } from '../content/curso.js'
import { RESORTE } from '../ui/movimiento.js'

/**
 * Barra APILADA del Curso completo (pedido del usuario): lo hecho de cada área, una detrás de otra, en su color
 * (Armonía M4, Ritmo M2, Letras M6 y, al final, el reto de las tres en neutro), sobre el total. Cada tramo crece con
 * un resorte (uno tras otro). `areas` = { acordes: { hechas }, … }, `total` = pasos necesarios.
 */
export default function BarraCurso({ areas, total, alto = 'h-2.5', fondo = 'bg-zinc-200', retraso = 0.2, className = '', ...props }) {
  const orden = [...ORDEN_AREAS, 'tres']
  return (
    <div className={`flex w-full gap-0.5 overflow-hidden rounded-full ${alto} ${fondo} ${className}`} role="img" {...props}>
      {orden.map((a, k) => {
        const v = total ? (areas[a]?.hechas ?? 0) / total : 0
        return (
          <motion.span
            key={a}
            data-tramo-curso={a}
            className="block h-full shrink-0 first:rounded-l-full"
            style={{ backgroundColor: AREAS[a].acento }}
            initial={{ width: 0 }}
            animate={{ width: `${v * 100}%` }}
            transition={{ ...RESORTE.suave, delay: retraso + k * 0.08 }}
          />
        )
      })}
    </div>
  )
}
