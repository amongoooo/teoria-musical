import { motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getModulo, moduloDisponible } from '../content/index.js'
import { navegar, rutas } from '../router.js'
import { DESLIZAR } from '../ui/movimiento.js'
import useDeslizar from '../ui/useDeslizar.js'
import useTirarAbajo from '../ui/useTirarAbajo.js'
import { Cuadrito } from './NavegadorModulos.jsx'

/**
 * Cambio de módulo con un gesto de página (skill de diseño, sección 3b «Swipe de página»):
 *  - Deslizar de lado (con el camino cerrado): a la izquierda → módulo siguiente; a la derecha → anterior.
 *  - Tirar «más abajo» del final de la página (celular): módulo siguiente.
 * Mismas reglas que el resto de swipes (zona muerta, resistencia fuerte hasta el 30 %, sigue al dedo y
 * pasa al 50 % sin soltar), pero con una X más larga (DESLIZAR.pagina) y sin gesto rápido ni avance
 * continuo: cambiar de página tiene que ser a propósito. Si el vecino no existe o aún no tiene
 * lecciones, resistencia tipo goma y el indicador dice «Próximamente».
 *
 * Devuelve { handlers, estilo, indicadores }: los handlers y el estilo (x / y) van en el <main> de la
 * página; los indicadores (portal) se pintan fuera, porque el <main> se transforma.
 */
export default function useCambioModulo(modulo, { activo }) {
  const ancho = useAncho()
  const X = ancho < 560 ? Math.max(160, ancho * DESLIZAR.pagina.umbralCelular) : DESLIZAR.pagina.umbralAncho
  const XV = DESLIZAR.pagina.umbralVertical
  const vecino = (dir) => getModulo(modulo.numero + dir)
  const puede = (dir) => {
    const m = vecino(dir)
    return Boolean(m && moduloDisponible(m))
  }

  // Al pasar, lo que se ve se congela (la página se va con su transición de salida).
  const saliendo = useRef(false)
  const pasar = (dir) => {
    if (saliendo.current) return
    saliendo.current = true
    navegar(rutas.modulo(modulo.numero + dir))
  }

  const lado = useDeslizar({
    activo,
    umbral: X,
    onPaso: pasar,
    puede: (dir) => !saliendo.current && puede(dir),
    rapido: false,
    continuo: false,
    veloz: [Infinity, Infinity],
  })
  const abajo = useTirarAbajo({ activo, umbral: XV, puede: () => puede(1), onPasar: () => pasar(1) })

  const px = useCongelado(lado.progreso, saliendo)
  const py = useCongelado(abajo, saliendo)
  const x = useTransform(px, (p) => -p * X)
  const y = useTransform(py, (p) => -p * XV)

  // Mientras se está en un módulo, el navegador no hace su propio rebote al final (lo hacemos nosotros).
  useEffect(() => {
    const html = document.documentElement
    const antes = html.style.overscrollBehaviorY
    html.style.overscrollBehaviorY = 'none'
    return () => {
      html.style.overscrollBehaviorY = antes
    }
  }, [])

  // Los gestos que empiezan en una hoja o en la barra de puntitos (portales) no son de la página.
  const { onPointerDown, ...resto } = lado.handlers
  const handlers = {
    ...resto,
    onPointerDown: (e) => {
      if (!e.currentTarget.contains(e.target) || e.target.closest('[data-sin-tirar]')) return
      onPointerDown(e)
    },
  }

  const indicadores = createPortal(
    <>
      <Asoma lado="derecha" progreso={px} modulo={vecino(1)} disponible={puede(1)} />
      <Asoma lado="izquierda" progreso={px} modulo={vecino(-1)} disponible={puede(-1)} />
      <Asoma lado="abajo" progreso={py} modulo={vecino(1)} disponible={puede(1)} />
    </>,
    document.body,
  )

  return { handlers, estilo: { x, y, touchAction: 'pan-y pinch-zoom' }, indicadores }
}

/** Copia de un MotionValue que deja de cambiar cuando `congelar.current` es true. */
function useCongelado(fuente, congelar) {
  const mv = useMotionValue(fuente.get())
  useEffect(() => fuente.on('change', (v) => !congelar.current && mv.set(v)), [fuente, mv, congelar])
  return mv
}

function useAncho() {
  const [ancho, setAncho] = useState(() => window.innerWidth)
  useEffect(() => {
    const onResize = () => setAncho(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return ancho
}

/**
 * Indicador del módulo al que se va: asoma por el borde según el progreso del gesto
 * (0 → escondido, 0,5 = el punto en que pasa → del todo dentro). Solo se ve si el gesto va hacia él.
 * Si el módulo aún no tiene lecciones, se ve entero con poco recorrido y dice «Próximamente».
 */
function Asoma({ lado, progreso, modulo, disponible }) {
  const signo = lado === 'izquierda' ? -1 : 1
  // Sin módulo disponible el gesto es una goma (apenas se mueve): el indicador «Próximamente» se ve antes.
  const lleno = disponible ? DESLIZAR.iman : 0.12
  const vis = useTransform(progreso, (p) => Math.max(0, Math.min(1, (p * signo) / lleno)))
  const desplazar = useTransform(vis, (v) => (1 - v) * 110)
  const escala = useTransform(vis, (v) => 0.7 + 0.3 * v)
  const yAbajo = useTransform(desplazar, (d) => `${d}%`)
  const xLado = useTransform(desplazar, (d) => `${d * signo}%`)
  if (!modulo) return null

  const texto = (
    <span className="flex flex-col items-center gap-0.5 text-center">
      <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{signo > 0 ? 'Siguiente' : 'Anterior'}</span>
      <span className="text-base font-bold leading-tight text-zinc-900">Módulo {modulo.numero}</span>
      {!disponible && <span className="text-sm font-semibold text-zinc-500">Próximamente</span>}
    </span>
  )

  if (lado === 'abajo') {
    return (
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center bg-fondo/90 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ opacity: vis, y: yAbajo }}
      >
        <div className="flex items-center gap-4">
          <motion.span style={{ scale: escala }}>
            <Cuadrito modulo={modulo} disponible={disponible} tam={56} />
          </motion.span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Siguiente</span>
            <span className="text-lg font-bold leading-tight text-zinc-900">Módulo {modulo.numero}</span>
            <span className="text-base text-zinc-600">{disponible ? modulo.titulo : 'Próximamente'}</span>
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none fixed top-1/2 z-20 flex w-28 -translate-y-1/2 flex-col items-center gap-2 rounded-3xl bg-fondo/90 py-3 ${signo > 0 ? 'right-1' : 'left-1'}`}
      style={{ opacity: vis, x: xLado }}
    >
      <motion.span style={{ scale: escala }}>
        <Cuadrito modulo={modulo} disponible={disponible} tam={56} />
      </motion.span>
      {texto}
    </motion.div>
  )
}
