import { motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getModulo, moduloDisponible } from '../content/index.js'
import { navegar, rutas } from '../router.js'
import { tinta } from '../ui/color.js'
import { DESLIZAR, RESORTE } from '../ui/movimiento.js'
import useDeslizar from '../ui/useDeslizar.js'
import useTirarBordes from '../ui/useTirarBordes.js'
import { ALTO_CABECERA } from './CabeceraModulo.jsx'
import { Cuadrito } from './NavegadorModulos.jsx'
import { VIDRIO_PANEL } from '../ui/vidrio.js'

/**
 * Cambio de módulo con un gesto de página (skill de diseño, sección 3b «Swipe de página»):
 *  - Deslizar de lado (con el camino cerrado): a la izquierda → módulo siguiente; a la derecha → anterior.
 *  - Tirar «más abajo» del final de la página (celular): módulo siguiente.
 *  - Tirar hacia abajo estando arriba del todo: módulo anterior, solo si el dedo se apoyó por debajo del
 *    título del módulo; sobre el título o más arriba, el navegador recarga la página (zona de recarga).
 * Reglas de los swipes (zona muerta, resistencia fuerte hasta el 30 %, sigue al dedo) con una X más larga
 * (DESLIZAR.pagina), sin gesto rápido ni avance continuo y **soltar para pasar**: pasado el 50 % el
 * indicador dice «Suelta para ir» y la página solo cambia al soltar el dedo ahí; si el dedo vuelve atrás
 * antes de soltar, no pasa nada. Cambiar de página tiene que ser a propósito. Si el vecino no existe o aún no tiene
 * lecciones, resistencia tipo goma y el indicador dice «Próximamente».
 *
 * En pantallas anchas con más islas de las que caben (`tira` = { inicio, fin }), el camino cerrado se arrastra de lado:
 * el gesto de lado solo cambia de módulo desde los extremos de la tira.
 *
 * Con una isla abierta (`isla` = { inicio, fin }), solo hacia fuera desde los extremos del camino: desde la
 * primera isla (la insignia) al módulo anterior y desde la última (Retos) al siguiente; el resto de gestos
 * son del camino (que a su vez ignora esos, ver `acepta` en useDeslizar).
 *
 * Devuelve { handlers, estilo, indicadores }: los handlers y el estilo (x / y) van en el <main> de la
 * página; los indicadores (portal) se pintan fuera, porque el <main> se transforma.
 */
export default function useCambioModulo(modulo, { isla = null, tira = null } = {}) {
  const acepta = (dir) => !isla || (dir < 0 ? isla.inicio : isla.fin)
  // Camino cerrado que se arrastra de lado (`tira` = { inicio, fin }, pantallas anchas): el gesto de lado es de la
  // tira salvo hacia fuera desde sus extremos. (Tirar desde arriba o desde abajo no cambia.)
  const aceptaLado = (dir) => acepta(dir) && (isla || !tira || (dir < 0 ? tira.inicio : tira.fin))
  const ancho = useAncho()
  const X = ancho < 560 ? Math.max(160, ancho * DESLIZAR.pagina.umbralCelular) : DESLIZAR.pagina.umbralAncho
  const XV = DESLIZAR.pagina.umbralVertical
  // Una ruta (rutaModulo.js) trae su propio `vecino` (la ruta de al lado) y `disponible`.
  const vecino = (dir) => (modulo.vecino ? modulo.vecino(dir) : getModulo(modulo.numero + dir))
  const puede = (dir) => {
    const m = vecino(dir)
    return Boolean(m && (m.esRuta ? m.disponible : moduloDisponible(m)))
  }

  // Al pasar, lo que se ve se congela (la página se va con su transición de salida).
  const saliendo = useRef(false)
  const [seVa, setSeVa] = useState(false) // al pasar, los indicadores se desvanecen (la página nueva ya entra)
  const pasar = (dir) => {
    if (saliendo.current) return
    saliendo.current = true
    setSeVa(true)
    const m = vecino(dir)
    navegar(m.esRuta ? rutas.ruta(m.id) : rutas.modulo(modulo.numero + dir))
  }

  const lado = useDeslizar({
    activo: true,
    acepta: aceptaLado,
    umbral: X,
    onPaso: pasar,
    puede: (dir) => !saliendo.current && puede(dir),
    rapido: false,
    continuo: false,
    veloz: [Infinity, Infinity],
    soltarParaPasar: true,
  })
  const bordes = useTirarBordes({
    activo: true,
    rebote: !isla, // con una isla abierta, sin rebote del navegador (la barra de puntitos no se mueve)
    acepta,
    umbral: XV,
    puede: (dir) => !saliendo.current && puede(dir),
    onPasar: pasar,
    // Zona de recarga: del borde de arriba de la pantalla hasta el final del título del módulo.
    limiteRecarga: () => {
      const r = document.querySelector('[data-titulo-modulo]')?.getBoundingClientRect()
      return r ? r.bottom : window.innerHeight * DESLIZAR.pagina.recarga
    },
  })

  const px = useCongelado(lado.progreso, saliendo)
  const py = useCongelado(bordes.progreso, saliendo)
  const x = useTransform(px, (p) => -p * X)
  const y = useTransform(py, (p) => -p * XV)

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
    // Capa del tamaño de la pantalla que RECORTA a los indicadores: escondidos fuera del borde derecho,
    // en el celular ensanchaban la pantalla (y la cabecera fija empujaba la rueda de Opciones).
    <motion.div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" animate={{ opacity: seVa ? 0 : 1 }} transition={{ duration: 0.15 }}>
      <Asoma lado="derecha" progreso={px} listo={lado.listo} modulo={vecino(1)} disponible={puede(1)} />
      <Asoma lado="izquierda" progreso={px} listo={lado.listo} modulo={vecino(-1)} disponible={puede(-1)} />
      <Asoma lado="abajo" progreso={py} listo={bordes.listo} modulo={vecino(1)} disponible={puede(1)} />
      <Asoma lado="arriba" progreso={py} listo={bordes.listo} modulo={vecino(-1)} disponible={puede(-1)} />
    </motion.div>,
    document.body,
  )

  return { handlers, estilo: { x, y, touchAction: 'pan-y pinch-zoom' }, indicadores }
}

/** Espacio bajo el indicador de abajo: la barra de puntitos (46 px + su margen de abajo, 16 px o la zona segura) + 14 px
 * (lo que la barra puede flotar con el dedo). */
const SOBRE_BARRA = 'calc(max(env(safe-area-inset-bottom), 16px) + 46px + 14px)'

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
function Asoma({ lado, progreso, listo: listoMV, modulo, disponible }) {
  const signo = lado === 'izquierda' || lado === 'arriba' ? -1 : 1
  // «Suelta para ir»: el gesto ya pasó el punto y, si se suelta ahora, cambia de módulo.
  const [listo, setListo] = useState(false)
  useMotionValueEvent(listoMV, 'change', (l) => setListo(l === signo))
  // Sin módulo disponible el gesto es una goma (apenas se mueve): el indicador «Próximamente» se ve antes.
  const lleno = disponible ? DESLIZAR.iman : 0.12
  const vis = useTransform(progreso, (p) => Math.max(0, Math.min(1, (p * signo) / lleno)))
  const desplazar = useTransform(vis, (v) => (1 - v) * 110)
  const escala = useTransform(vis, (v) => 0.7 + 0.3 * v)
  const yVertical = useTransform(desplazar, (d) => `${d * signo}%`)
  const xLado = useTransform(desplazar, (d) => `${d * signo}%`)
  if (!modulo) return null

  const encabezado = (
    <span
      className={`text-sm font-semibold uppercase tracking-wider transition-colors duration-150 ${listo ? '' : 'text-zinc-500'}`}
      style={listo ? { color: tinta(modulo.acento) } : undefined}
    >
      {listo ? 'Suelta para ir' : signo > 0 ? 'Siguiente' : 'Anterior'}
    </span>
  )
  // El cuadrito crece un poco (resorte) cuando ya se puede soltar.
  const cuadrito = (
    <motion.span style={{ scale: escala }}>
      <motion.span className="block" animate={{ scale: listo ? 1.12 : 1 }} transition={RESORTE.pulsar}>
        <Cuadrito modulo={modulo} disponible={disponible} tam={56} />
      </motion.span>
    </motion.span>
  )

  if (lado === 'abajo' || lado === 'arriba') {
    return (
      <motion.div
        aria-hidden
        // El de arriba sale por DEBAJO de la cabecera fija (que va encima, con su desvanecido).
        className={`pointer-events-none absolute inset-x-0 flex justify-center px-3 ${
          signo > 0 ? 'bottom-0 pt-3' : 'pt-2 pb-3'
        }`}
        // El de abajo queda POR ENCIMA de la barra de puntitos (pedido del usuario: la barra lo tapaba): sale de
        // detrás de ella y se para encima (SOBRE_BARRA = alto de la barra + su margen + aire).
        style={{
          y: yVertical,
          ...(signo < 0 ? { top: `calc(${ALTO_CABECERA - 20}px + env(safe-area-inset-top))` } : { paddingBottom: SOBRE_BARRA }),
        }}
      >
        {/* La opacidad va en el propio panel de vidrio: en un antecesor, el desenfoque dejaría de ver lo de detrás. */}
        <motion.div className={`flex items-center gap-4 rounded-3xl py-3 pr-6 pl-3 ${VIDRIO_PANEL}`} style={{ opacity: vis }}>
          {cuadrito}
          <span className="flex flex-col">
            {encabezado}
            <span className="text-lg font-bold leading-tight text-zinc-900">{modulo.esRuta ? `Ruta de ${modulo.titulo.toLowerCase()}` : `Módulo ${modulo.numero}`}</span>
            <span className="text-base text-zinc-600">{disponible ? (modulo.esRuta ? modulo.descripcion : modulo.titulo) : 'Próximamente'}</span>
          </span>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute top-1/2 flex w-32 -translate-y-1/2 flex-col items-center gap-2 rounded-3xl py-3 ${VIDRIO_PANEL} ${signo > 0 ? 'right-1' : 'left-1'}`}
      style={{ opacity: vis, x: xLado }}
    >
      {cuadrito}
      <span className="flex flex-col items-center gap-0.5 text-center">
        {encabezado}
        <span className="text-base font-bold leading-tight text-zinc-900">{modulo.esRuta ? modulo.titulo : `Módulo ${modulo.numero}`}</span>
        {!disponible && <span className="text-sm font-semibold text-zinc-500">Próximamente</span>}
      </span>
    </motion.div>
  )
}
