import { motion } from 'motion/react'
import { AREAS, ORDEN_AREAS } from '../content/curso.js'
import { RESORTE } from '../ui/movimiento.js'

/**
 * Barra APILADA del Curso completo (pedido del usuario): lo hecho de cada área, una detrás de otra, en su color
 * (Melodía, Armonía, Ritmo, Letras y, al final, el reto de todo junto en neutro), sobre el total. Cada tramo crece con
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

/**
 * Barra del Curso completo POR BLOQUES (pedido del usuario, 2026-11-17: «el avance de los bloques y no de las rutas»):
 * un segmento por bloque, tan ancho como sus pasos, que se llena con lo hecho de ese bloque. Hecho = verde; el de
 * ahora, del color del área del paso en el que vas; los demás, en neutro. Los segmentos se llenan uno tras otro.
 */
export function BarraBloques({ bloques, actual = null, alto = 'h-2.5', fondo = 'bg-zinc-200', retraso = 0.2, className = '', ...props }) {
  return (
    <div className={`flex w-full gap-1 ${alto} ${className}`} role="img" {...props}>
      {bloques.map((b, k) => {
        const color = b.estado === 'hecha' ? 'var(--color-bien)' : b.estado === 'ahora' && actual ? actual.acento : 'var(--color-neutro)'
        return (
          <span key={b.numero} className={`block h-full min-w-0 overflow-hidden rounded-full ${fondo}`} style={{ flexGrow: b.total, flexBasis: 0 }}>
            <motion.span
              data-segmento-bloque={b.numero}
              className="block h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${b.total ? (b.hechas / b.total) * 100 : 0}%` }}
              transition={{ ...RESORTE.suave, delay: retraso + k * 0.1 }}
            />
          </span>
        )
      })}
    </div>
  )
}
