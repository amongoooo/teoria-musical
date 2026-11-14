import { motion } from 'motion/react'
import { BarraAccion } from '../pages/Leccion.jsx'
import { navegar } from '../router.js'
import { soltarMeta } from '../progress/metaGuiada.js'
import { labio, tinta } from '../ui/color.js'
import { Check } from '../ui/Iconos.jsx'
import { itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'

/**
 * «¡META CUMPLIDA!» (pedido del usuario: las prácticas abiertas desde una ruta o un bloque no deben dejar jugar
 * infinito). Cuando la meta guiada (progress/metaGuiada.js) se cumple, App.jsx cambia el entrenador por esta pantalla:
 * insignia verde con ✓, la meta y «Continuar» (vuelve a la ruta o al bloque, que ya la marca como hecha). «Seguir
 * practicando» deja la práctica abierta, ya sin meta.
 */
export default function MetaCumplida({ guia, acento }) {
  const volver = () => {
    soltarMeta()
    navegar(guia.volver)
  }
  return (
    <div className="flex min-h-dvh flex-col" data-meta-cumplida={guia.parada.titulo}>
      <motion.main variants={lista} initial="oculta" animate="visible" className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-5 pb-48 pt-12 text-center">
        <motion.span
          initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
          className="grid size-24 place-items-center rounded-[1.75rem] bg-bien-relleno text-blanco"
          style={{ boxShadow: `0 7px 0 ${labio('var(--color-bien)')}` }}
          aria-hidden
        >
          <Check className="size-14" grosor={3} />
        </motion.span>
        <motion.div variants={itemLista} className="flex flex-col gap-2">
          <h1 className="font-juego text-4xl font-semibold uppercase tracking-wide">¡Meta cumplida!</h1>
          <p className="font-titulo text-2xl font-bold leading-tight" style={{ color: tinta(acento) }}>
            {guia.parada.titulo}
          </p>
        </motion.div>
        <motion.div variants={itemLista} className="w-full">
          <Pulsable
            onClick={soltarMeta}
            data-seguir-practicando
            className="min-h-14 w-full rounded-2xl border-2 border-zinc-200 bg-white text-lg font-semibold text-zinc-800"
            style={{ boxShadow: '0 5px 0 var(--color-zinc-200)' }}
          >
            Seguir practicando
          </Pulsable>
        </motion.div>
      </motion.main>
      <BarraAccion accion={{ label: 'Continuar', onClick: volver, flotante: true }} />
    </div>
  )
}

/** Color de la pantalla según la práctica (como el entrenador): ritmo, letras u oído (melodía). */
export const acentoPractica = (practica) =>
  practica === 'ritmo' ? 'var(--color-ritmo)' : practica === 'letras' ? 'var(--color-letras)' : 'var(--color-melodia)'
