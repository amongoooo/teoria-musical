import { motion } from 'motion/react'
import BotonNovedades from '../components/Novedades.jsx'
import BotonOpciones from '../components/Opciones.jsx'
import { BotonCurso, TarjetaHoy } from '../components/Tarjetas.jsx'
import { useCurso } from '../components/cursoModulo.js'
import { rutas } from '../router.js'
import { itemLista, lista } from '../ui/movimiento.js'
import { SigueAqui } from './Curso.jsx'

/**
 * INICIO más corto (fase 3 del rediseño; maqueta aprobada: https://claude.ai/artifact/6EWwNQ4puh3mtiT1T8Pfne):
 * logo y nombre en una línea, «Sigue aquí» (el siguiente paso del Curso completo, un solo botón grande), «Hoy» (racha
 * y minutos de las prácticas; lleva a Practicar) y el Curso completo. Rutas y módulos viven en Aprender, las prácticas en
 * Practicar y las herramientas en Herramientas (la barra de pestañas de abajo: components/BarraPestanas.jsx).
 */
export default function Inicio() {
  const curso = useCurso()
  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 pt-4 pb-36 sm:pt-8"
    >
      <motion.header variants={itemLista} className="flex items-center justify-between gap-3">
        <BotonNovedades />
        <BotonOpciones />
      </motion.header>
      <motion.div variants={itemLista} className="-mt-2 flex items-center justify-center gap-3">
        {/* Insignia del juego: el ícono de la app, entra con rebote. */}
        <motion.img
          src={`${import.meta.env.BASE_URL}iconos/icono.svg`}
          alt=""
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
          className="size-14 rounded-2xl"
          style={{ boxShadow: '0 4px 0 var(--color-zinc-300)' }}
        />
        <h1 className="font-titulo text-4xl font-extrabold leading-none tracking-tight">Teoría Musical</h1>
      </motion.div>

      <motion.div variants={itemLista}>
        <SigueAqui curso={curso} />
      </motion.div>
      <motion.div variants={itemLista}>
        <TarjetaHoy href={rutas.practicar()} />
      </motion.div>
      <motion.div variants={itemLista}>
        <BotonCurso />
      </motion.div>
    </motion.main>
  )
}
