import { motion } from 'motion/react'
import { useRef } from 'react'
import { BarraAccion } from '../pages/Leccion.jsx'
import { navegar } from '../router.js'
import { labio, oscuro, tinta } from '../ui/color.js'
import { Atras, Check } from '../ui/Iconos.jsx'
import { SALTO, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'

/** Relieve de tarjeta, como en el arranque del entrenador. */
const RELIEVE = { boxShadow: '0 5px 0 var(--color-zinc-200)' }

/**
 * Marcador de una partida (oído, ritmo): aciertos, mejor serie, de qué nivel a qué nivel y el tiempo.
 * `empezar(nivel, etiqueta)` al empezar; `apuntar(bien, nivel)` en cada respuesta; `resumen()` al acabar.
 */
export function useMarcador() {
  const ref = useRef(null)
  return useRef({
    empezar: (nivel, etiqueta = 'Nivel') => {
      ref.current = { inicio: Date.now(), respuestas: 0, aciertos: 0, serie: 0, mejorSerie: 0, desde: nivel, hasta: nivel, etiqueta }
    },
    apuntar: (bien, nivel) => {
      const m = ref.current
      if (!m) return
      m.respuestas += 1
      if (bien) m.aciertos += 1
      m.serie = bien ? m.serie + 1 : 0
      m.mejorSerie = Math.max(m.mejorSerie, m.serie)
      if (nivel != null) m.hasta = Math.max(m.hasta, nivel)
    },
    resumen: () => (ref.current ? { ...ref.current, segundos: Math.round((Date.now() - ref.current.inicio) / 1000) } : null),
  }).current
}

/**
 * Pantalla de fin de partida (pedido del usuario: al quedarse sin vidas): insignia del entrenamiento, «Fin de la
 * partida» y los datos en tarjetas con relieve, como el arranque. «Continuar» (botón flotante) vuelve al panel del
 * entrenamiento; «Jugar otra vez», al arranque.
 */
export default function FinPartida({ resumen, titulo, Icono, acento, volver, etiquetaVolver, onOtra }) {
  const subio = resumen.hasta > resumen.desde
  const datos = [
    { id: 'aciertos', nombre: 'Aciertos', valor: `${resumen.aciertos}/${resumen.respuestas}` },
    { id: 'nivel', nombre: resumen.etiqueta, valor: subio ? `${resumen.desde} → ${resumen.hasta}` : String(resumen.hasta) },
    { id: 'serie', nombre: 'Mejor serie', valor: String(resumen.mejorSerie) },
    { id: 'tiempo', nombre: 'Tiempo', valor: reloj(resumen.segundos) },
  ]
  return (
    <div className="flex min-h-dvh flex-col" data-fin-partida>
      <header className="pointer-events-none sticky top-0 z-10">
        <div className="mx-auto flex max-w-2xl px-4 pt-3 pb-2">
          <Pulsable href={volver} aria-label={etiquetaVolver} className={`pointer-events-auto grid size-11 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}>
            <Atras className="size-6" />
          </Pulsable>
        </div>
      </header>

      <motion.main variants={lista} initial="oculta" animate="visible" className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-5 pb-48 pt-2 text-center">
        <motion.span
          initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
          className="grid size-24 place-items-center rounded-[1.75rem] text-blanco"
          style={{ backgroundColor: oscuro(acento), boxShadow: `0 7px 0 ${labio(acento)}` }}
          aria-hidden
        >
          <Icono className="size-14" />
        </motion.span>
        <motion.div variants={itemLista} className="flex flex-col gap-1">
          <h1 className="font-juego text-4xl font-semibold uppercase tracking-wide">Fin de la partida</h1>
          <p className="text-xl text-zinc-600">{titulo}</p>
        </motion.div>

        <motion.div variants={itemLista} className="grid w-full grid-cols-2 gap-3">
          {datos.map((d, i) => (
            <div key={d.id} data-dato-fin={d.id} className="flex flex-col items-center gap-1 rounded-3xl border-2 border-zinc-200 bg-white px-3 py-4" style={RELIEVE}>
              <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{d.nombre}</span>
              <motion.span
                className="font-juego text-3xl font-semibold tabular-nums"
                style={{ color: tinta(acento) }}
                animate={SALTO}
                transition={{ duration: 0.35, delay: 0.35 + i * 0.08 }}
              >
                {d.valor}
              </motion.span>
            </div>
          ))}
        </motion.div>

        {subio && (
          <motion.p variants={itemLista} className="inline-flex items-center gap-2 rounded-full bg-bien-suave px-4 py-2 text-base font-semibold text-bien-tinta">
            <Check className="size-5" />
            ¡Subiste {resumen.etiqueta === 'Nivel' ? `al nivel ${resumen.hasta}` : `a ${resumen.hasta} notas`}!
          </motion.p>
        )}

        <motion.div variants={itemLista} className="w-full">
          <Pulsable
            onClick={onOtra}
            data-otra-partida
            className="min-h-14 w-full rounded-2xl border-2 border-zinc-200 bg-white font-juego text-xl uppercase tracking-wide text-zinc-800"
            style={RELIEVE}
          >
            Jugar otra vez
          </Pulsable>
        </motion.div>
      </motion.main>

      <BarraAccion accion={{ label: 'Continuar', onClick: () => navegar(volver), flotante: true }} />
    </div>
  )
}

function reloj(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

