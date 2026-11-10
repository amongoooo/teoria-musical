import { motion } from 'motion/react'
import { RESORTE } from '../../ui/movimiento.js'

/** Puntos de progreso de las rondas de un ejercicio (hecha / actual / pendiente). */
export default function Rondas({ total, actual, hecha = false }) {
  if (total < 2) return null
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={actual + (hecha ? 1 : 0)} aria-label={`Ronda ${actual + 1} de ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const estado = i < actual || (i === actual && hecha) ? 'hecha' : i === actual ? 'actual' : 'pendiente'
        return (
          <motion.span
            key={i}
            initial={false}
            animate={{ scaleY: estado === 'actual' ? 1.4 : 1 }}
            transition={RESORTE.pulsar}
            className={`h-2 flex-1 rounded-full transition-colors duration-200 ${
              estado === 'hecha' ? 'bg-zinc-800' : estado === 'actual' ? 'bg-zinc-400' : 'bg-zinc-200'
            }`}
          />
        )
      })}
    </div>
  )
}
