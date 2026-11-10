import { motion } from 'motion/react'
import { useState } from 'react'
import CaminoLecciones from '../components/CaminoLecciones.jsx'
import useCambioModulo from '../components/CambioModulo.jsx'
import { getModulo } from '../content/index.js'
import { useProgreso } from '../progress/progreso.js'
import { rutas } from '../router.js'
import { tinta } from '../ui/color.js'
import { itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'

export default function Modulo({ numero }) {
  const modulo = getModulo(numero)
  if (!modulo) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-16">
        <p className="text-lg text-zinc-500">Este módulo no existe.</p>
        <Pulsable href={rutas.inicio()} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
          Volver al inicio
        </Pulsable>
      </main>
    )
  }

  return <PaginaModulo modulo={modulo} />
}

function PaginaModulo({ modulo }) {
  const progreso = useProgreso()
  // Con una isla abierta, el swipe lateral es del camino; con el camino cerrado, cambia de módulo.
  const [islaAbierta, setIslaAbierta] = useState(false)
  const cambio = useCambioModulo(modulo, { activo: !islaAbierta })

  return (
    <>
      <motion.main
        variants={lista}
        initial="oculta"
        animate="visible"
        className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-5 pt-4 pb-28 sm:pt-6"
        style={cambio.estilo}
        {...cambio.handlers}
      >
        {/* Hueco de la cabecera (casita + barra de progreso): vive en App.jsx y se queda quieta entre módulos. */}
        <div aria-hidden className="h-11 shrink-0" />

        <motion.header variants={itemLista} className="flex flex-col items-center gap-2 text-center">
          <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: tinta(modulo.acento) }}>
            Módulo {modulo.numero}
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">{modulo.titulo}</h1>
        </motion.header>

        <motion.section variants={itemLista} aria-label="Lecciones del módulo" className="py-2 sm:py-6">
          <CaminoLecciones modulo={modulo} progreso={progreso} onAbierta={setIslaAbierta} />
        </motion.section>
      </motion.main>
      {cambio.indicadores}
    </>
  )
}
