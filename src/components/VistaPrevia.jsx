import { MotionContext, PresenceContext, motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { claro, oscuro, tinta } from '../ui/color.js'
import { Check, Oreja } from '../ui/Iconos.jsx'

/**
 * VISTA PREVIA de un ejercicio (pestaña Entrenar; pedido del usuario: «una pequeña preview de cómo se juega»): una
 * escena mínima que se repite en bucle: lo que suena (celeste), el dedo que responde (círculo que se hunde) y el
 * acierto (verde con ✓). Solo se mueve mientras está en pantalla; con «reducir movimiento» o `quieta` se queda en el
 * último cuadro (la respuesta ya puesta). Solo opacidad y transform.
 */

/** Segundos por vuelta. */
const VUELTA = 4.2
/** Cuadro que se ve quieto (fracción de la vuelta). */
const QUIETO = 0.84

/**
 * Props de motion para algo que se ve entre `de` y `hasta` (fracciones de la vuelta). Con `pop`, entra creciendo.
 * Quieto: visible si lo está en el cuadro QUIETO.
 */
function fase(activo, de, hasta = 0.9, { pop = false, escala = 0.6 } = {}) {
  if (!activo) {
    const visto = de <= QUIETO && hasta > QUIETO
    return { initial: false, animate: { opacity: visto ? 1 : 0, scale: 1 }, transition: { duration: 0 } }
  }
  const sube = Math.min(de + 0.05, hasta)
  const baja = Math.min(hasta + 0.05, 0.99)
  return {
    initial: { opacity: 0 },
    animate: { opacity: [0, 0, 1, 1, 0, 0], ...(pop ? { scale: [escala, escala, 1, 1, 1, escala] } : {}) },
    transition: { duration: VUELTA, times: [0, de, sube, hasta, baja, 1], repeat: Infinity, ease: 'easeOut' },
  }
}

/** El dedo que toca: círculo que aparece, se hunde un instante y se va. */
function Dedo({ activo, en, className = '' }) {
  const props = activo
    ? {
        initial: { opacity: 0 },
        animate: { opacity: [0, 0, 0.9, 0.9, 0, 0], scale: [1.5, 1.5, 1, 0.82, 0.82, 1.5] },
        transition: { duration: VUELTA, times: [0, Math.max(0.01, en - 0.07), en - 0.02, en + 0.03, en + 0.09, 1], repeat: Infinity, ease: 'easeOut' },
      }
    : { initial: false, animate: { opacity: 0 } }
  return (
    <motion.span
      aria-hidden
      data-dedo
      className={`pointer-events-none absolute z-10 size-7 rounded-full border-[3px] border-blanco bg-zinc-900/35 shadow-[0_2px_8px_rgb(0_0_0/0.25)] ${className}`}
      {...props}
    />
  )
}

/** Capa verde con ✓ (acierto) sobre una pieza, desde `de`. */
function Acierto({ activo, de, redondo = 'rounded-xl', chico = false, children = null }) {
  return (
    <motion.span aria-hidden className={`absolute inset-0 flex items-center justify-center gap-1.5 bg-bien-relleno text-blanco ${redondo}`} {...fase(activo, de, 0.9)}>
      <Check className={children ? 'size-4 shrink-0' : chico ? 'size-3' : 'size-5'} />
      {children}
    </motion.span>
  )
}

/** Capa celeste: «suena». */
function Suena({ activo, de, hasta, redondo = 'rounded-lg' }) {
  return <motion.span aria-hidden className={`absolute inset-0 bg-sky-500 ${redondo}`} {...fase(activo, de, hasta)} />
}

export default function VistaPrevia({ tipo, acento, quieta = false }) {
  const ref = useRef(null)
  const enVista = useInView(ref, { margin: '-8% 0px' })
  const reducir = useReducedMotion()
  const activo = !quieta && enVista && !reducir
  const Escena = ESCENAS[tipo]
  // Un ejemplo distinto en cada vuelta (pedido del usuario: «ejemplos variados»). La escena se vuelve a montar con
  // `key`, así su animación empieza de cero junto con el ejemplo nuevo (el cambio cae cuando todo está apagado).
  const [vuelta, setVuelta] = useState(0)
  useEffect(() => {
    if (!activo) return
    const t = setInterval(() => setVuelta((v) => v + 1), VUELTA * 1000)
    return () => clearInterval(t)
  }, [activo])
  return (
    <div
      ref={ref}
      aria-hidden
      data-vista-previa={tipo}
      data-animada={activo ? 'si' : 'no'}
      data-vuelta={vuelta}
      className="relative h-36 overflow-hidden rounded-[1.25rem] p-3"
      style={{ backgroundColor: claro(acento) }}
    >
      {/* Contextos limpios: la escena que se monta de nuevo en cada vuelta no hereda las variantes de la lista ni el
          `initial={false}` de la página (con ellos, motion no arrancaba sus animaciones al volver a montarla). */}
      <PresenceContext.Provider value={null}>
        <MotionContext.Provider value={SIN_VARIANTES}>
          {Escena && <Escena key={vuelta} activo={activo} acento={acento} n={vuelta} />}
        </MotionContext.Provider>
      </PresenceContext.Provider>
    </div>
  )
}

const SIN_VARIANTES = {}

/** El ejemplo `n` de una lista (da la vuelta). */
const cual = (lista, n) => lista[n % lista.length]

// ---------------------------------------------------------------------------
// Escenas
// ---------------------------------------------------------------------------

/** Dos respuestas apiladas; la `bien` se toca en `en` y se pone verde. */
function Respuestas({ activo, opciones, bien, en, titulo = false }) {
  const tres = opciones.length > 2
  return (
    <div className={`flex w-[42%] shrink-0 flex-col justify-center ${tres ? 'gap-1.5' : 'gap-2'}`}>
      {opciones.map((o, i) => (
        <span
          key={o}
          className={`relative grid place-items-center rounded-xl border-2 border-zinc-200 bg-white text-zinc-800 ${tres ? 'h-9' : 'h-11'} ${
            titulo ? 'font-titulo text-lg font-extrabold' : 'font-dato text-base font-medium'
          }`}
        >
          {o}
          {i === bien && (
            <>
              <Acierto activo={activo} de={en + 0.04} redondo="rounded-[0.6rem]">
                {o}
              </Acierto>
              <Dedo activo={activo} en={en} className="left-1/2 top-1/2 -ml-3.5 -mt-3.5" />
            </>
          )}
        </span>
      ))}
    </div>
  )
}

/** Intervalos: suenan dos notas, una tras otra, en el piano; se elige su distancia. Una distinta en cada vuelta. */
const INTERVALOS = [
  { notas: [0, 7], opciones: ['3.ª M', '5.ª J'], bien: 1 },
  { notas: [2, 4], opciones: ['2.ª M', '6.ª m'], bien: 0 },
  { notas: [4, 9], opciones: ['3.ª m', '4.ª J'], bien: 1 },
  { notas: [9, 12], opciones: ['3.ª m', '7.ª M'], bien: 0 },
  { notas: [2, 11], opciones: ['4.ª J', '6.ª M'], bien: 1 },
  { notas: [7, 0], opciones: ['5.ª J', '2.ª m'], bien: 0 },
  { notas: [0, 12], opciones: ['5.ª J', '8.ª J'], bien: 1 },
]

function Intervalos({ activo, n }) {
  const v = cual(INTERVALOS, n)
  return (
    <ConPiano
      activo={activo}
      suenan={[
        { st: v.notas[0], de: 0.06, hasta: 0.2 },
        { st: v.notas[1], de: 0.24, hasta: 0.4 },
      ]}
    >
      <Respuestas activo={activo} opciones={v.opciones} bien={v.bien} en={0.48} />
    </ConPiano>
  )
}

/**
 * Mini piano (pedido del usuario: las previas de Intervalos, Acordes, Funciones y Oído absoluto con el MISMO piano):
 * siempre 10 teclas blancas desde Do (Do a Mi de la octava de arriba) y del mismo tamaño. `suenan` = semitonos (0 = Do)
 * que se encienden en celeste, cada uno con `{ st, de, hasta }` o todos juntos (números, con `de` y `hasta`);
 * `tocada` = la tecla que toca el dedo en `en` y se pone verde.
 */
const BLANCAS = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16]
const NEGRAS = [1, 3, 6, 8, 10, 13, 15]
function MiniPiano({ activo, suenan = [], de = 0.06, hasta = 0.4, tocada = null, en = 0.56 }) {
  const blancas = BLANCAS.length
  const ultima = BLANCAS[blancas - 1]
  const ancho = 100 / blancas
  const luces = suenan.map((x) => (typeof x === 'number' ? { st: x, de, hasta } : x))
  const capas = (st, negra) => (
    <>
      {luces
        .filter((l) => l.st === st)
        .map((l, k) => (
          <Suena key={k} activo={activo} de={l.de} hasta={l.hasta} redondo="rounded-b-md" />
        ))}
      {tocada === st && (
        <>
          <Acierto activo={activo} de={en + 0.04} redondo="rounded-b-md" chico={negra} />
          <Dedo activo={activo} en={en} className={`left-1/2 -ml-3.5 ${negra ? 'bottom-1' : 'bottom-2'}`} />
        </>
      )}
    </>
  )
  return (
    <div className="tema-claro relative h-full flex-1 overflow-hidden rounded-xl border-2 border-zinc-300 bg-white" data-mini-piano>
      <div className="flex h-full">
        {BLANCAS.slice(0, blancas).map((st) => (
          <span key={st} data-tecla={st} className="relative h-full flex-1 border-r border-zinc-200 last:border-r-0">
            {capas(st, false)}
          </span>
        ))}
      </div>
      {NEGRAS.filter((st) => st < ultima).map((st) => {
        const abajo = BLANCAS.indexOf(st - 1)
        return (
          <span
            key={st}
            data-tecla={st}
            className="absolute top-0 h-[58%] rounded-b-md bg-zinc-800"
            style={{ left: `${(abajo + 1) * ancho - ancho * 0.31}%`, width: `${ancho * 0.62}%` }}
          >
            {capas(st, true)}
          </span>
        )
      })}
    </div>
  )
}

/** El formato de las escenas con piano: el piano a la izquierda (siempre igual) y, a la derecha, lo que se responde. */
function ConPiano({ activo, suenan, de, hasta, tocada, en, children }) {
  return (
    <div className="flex h-full gap-3">
      <MiniPiano activo={activo} suenan={suenan} de={de} hasta={hasta} tocada={tocada} en={en} />
      {children}
    </div>
  )
}

/** Acordes: suenan tres teclas a la vez y se elige mayor o menor. Un acorde distinto en cada vuelta. */
const ACORDES = [
  { notas: [0, 4, 7], bien: 0 }, // C
  { notas: [2, 5, 9], bien: 1 }, // Dm
  { notas: [5, 9, 12], bien: 0 }, // F
  { notas: [4, 7, 11], bien: 1 }, // Em
  { notas: [2, 6, 9], bien: 0 }, // D
  { notas: [0, 3, 7], bien: 1 }, // Cm
  { notas: [4, 8, 11], bien: 0 }, // E
  { notas: [9, 12, 16], bien: 1 }, // Am
]

function Acordes({ activo, n }) {
  const v = cual(ACORDES, n)
  return (
    <ConPiano activo={activo} suenan={v.notas} de={0.08} hasta={0.42}>
      <Respuestas activo={activo} opciones={['Mayor', 'Menor']} bien={v.bien} en={0.46} />
    </ConPiano>
  )
}

/** Funciones (en Do mayor): suena primero Do (la casa) y luego un acorde; se elige si es T, S o D. Uno por vuelta. */
const FUNCIONES = [
  { notas: [7, 11, 14], bien: 2 }, // G → D
  { notas: [5, 9, 12], bien: 1 }, // F → S
  { notas: [9, 12, 16], bien: 0 }, // Am → T
  { notas: [2, 5, 9], bien: 1 }, // Dm → S
  { notas: [4, 7, 11], bien: 0 }, // Em → T
  { notas: [11, 14, 5], bien: 2 }, // B° → D
]
const CASA = [0, 4, 7]

function Funciones({ activo, n }) {
  const v = cual(FUNCIONES, n)
  return (
    <ConPiano
      activo={activo}
      suenan={[...CASA.map((st) => ({ st, de: 0.04, hasta: 0.18 })), ...v.notas.map((st) => ({ st, de: 0.24, hasta: 0.42 }))]}
    >
      <Respuestas activo={activo} opciones={['T', 'S', 'D']} bien={v.bien} en={0.48} titulo />
    </ConPiano>
  )
}

/** Oído absoluto: suena una nota (oreja que late) y se toca su tecla; luego sale su nombre. Una nota por vuelta. */
const ABSOLUTO = [9, 2, 6, 11, 4, 13, 7, 10, 16, 3, 0, 8, 14, 5, 1]
const NOMBRES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si']

function Absoluto({ activo, acento, n }) {
  const nota = cual(ABSOLUTO, n)
  const late = activo
    ? { animate: { scale: [1, 1, 1.18, 1, 1.18, 1, 1] }, transition: { duration: VUELTA, times: [0, 0.05, 0.12, 0.19, 0.26, 0.33, 1], repeat: Infinity } }
    : { animate: { scale: 1 } }
  return (
    <ConPiano activo={activo} tocada={nota} en={0.5}>
      <div className="flex w-[42%] shrink-0 flex-col items-center justify-center gap-2">
        <motion.span className="grid size-14 place-items-center rounded-full text-blanco" style={{ backgroundColor: oscuro(acento) }} {...late}>
          <Oreja className="size-8" />
        </motion.span>
        <motion.span className="font-titulo text-lg font-extrabold text-bien-tinta" {...fase(activo, 0.56, 0.9, { pop: true })}>
          {NOMBRES[nota % 12]}
        </motion.span>
      </div>
    </ConPiano>
  )
}

const CUENTA = ['1', 'y', '2', 'y', '3', 'y', '4', 'y']

/** Seguir: la cuenta avanza (celeste) y se tocan los golpes con aro (verde); el pad se ilumina con cada toque. */
const SEGUIR = [
  [0, 3, 4, 6],
  [0, 2, 4, 6],
  [0, 3, 6],
  [1, 2, 5, 7],
  [0, 4, 5, 7],
  [0, 1, 4, 6],
]

function Seguir({ activo, acento, n }) {
  const golpes = cual(SEGUIR, n)
  const t = (i) => 0.06 + i * 0.085
  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="grid grid-cols-8 gap-1">
        {CUENTA.map((c, i) => (
          <span
            key={i}
            className={`relative grid h-9 place-items-center rounded-lg border-2 bg-white font-dato font-medium ${i % 2 ? 'text-sm text-zinc-500' : 'text-base text-zinc-800'}`}
            style={{ borderColor: golpes.includes(i) ? oscuro(acento) : 'var(--color-zinc-200)' }}
          >
            <Suena activo={activo} de={t(i)} hasta={t(i) + 0.075} />
            <span className="relative">{c}</span>
            {golpes.includes(i) && <Acierto activo={activo} de={t(i) + 0.03} redondo="rounded-md" />}
          </span>
        ))}
      </div>
      <Pad activo={activo} acento={acento} toques={golpes.map((i) => t(i) + 0.02)} />
    </div>
  )
}

/** Pad de goma pequeño (marco oscuro), que se ilumina en cada toque, con el dedo encima. */
function Pad({ activo, acento, toques, children }) {
  return (
    <div className="relative flex-1 rounded-2xl p-1.5" style={{ backgroundColor: '#17181f' }}>
      <div className="relative grid h-full place-items-center overflow-hidden rounded-xl" style={{ background: 'radial-gradient(circle at 50% 35%, #f1eee8, #d5d0c6)', color: '#2b2c34' }}>
        {toques.map((en, k) => (
          <motion.span key={k} className="absolute inset-0" style={{ background: `radial-gradient(circle, color-mix(in oklab, ${acento} 60%, transparent), transparent 75%)` }} {...fase(activo, en, en + 0.04)} />
        ))}
        {children}
      </div>
      {toques.map((en, k) => (
        <Dedo key={k} activo={activo} en={en} className="left-1/2 top-1/2 -ml-3.5 -mt-3.5" />
      ))}
    </div>
  )
}

/** Eco: arriba suena un compás (celeste); abajo lo repites (verde). */
const ECO = [
  [0, 1, 3],
  [0, 2, 3],
  [0, 2],
  [1, 3],
  [0, 1, 2],
  [0, 3],
]

function Eco({ activo, acento, n }) {
  const golpes = cual(ECO, n)
  const fila = (etiqueta, desde, bien) => (
    <div className="flex items-center gap-2">
      <span className="grid w-9 shrink-0 place-items-center" style={{ color: tinta(acento) }}>
        {etiqueta}
      </span>
      <div className="grid flex-1 grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="relative grid h-9 place-items-center rounded-lg border-2 bg-white font-dato text-base font-medium text-zinc-800"
            style={{ borderColor: golpes.includes(i) ? oscuro(acento) : 'var(--color-zinc-200)' }}
          >
            {!bien && golpes.includes(i) && <Suena activo={activo} de={desde + i * 0.09} hasta={desde + i * 0.09 + 0.07} />}
            <span className="relative">{i + 1}</span>
            {bien && golpes.includes(i) && (
              <>
                <Acierto activo={activo} de={desde + i * 0.09} redondo="rounded-md" />
                <Dedo activo={activo} en={desde + i * 0.09 - 0.01} className="left-1/2 top-1/2 -ml-3.5 -mt-3.5" />
              </>
            )}
          </span>
        ))}
      </div>
    </div>
  )
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {fila(<Oreja className="size-6" />, 0.06, false)}
      {fila(<span className="font-juego text-base uppercase">Tú</span>, 0.48, true)}
    </div>
  )
}

/** Cuaderno: cuatro versos y su rima se pinta. Un esquema distinto en cada vuelta (ABAB, AABB, ABBA). */
const CUADERNOS = [
  [['noche', 1], ['calle', 2], ['coche', 1], ['valle', 2]],
  [['luna', 1], ['cuna', 1], ['mar', 2], ['lugar', 2]],
  [['cielo', 1], ['fuego', 2], ['juego', 2], ['suelo', 1]],
  [['barrio', 1], ['esquina', 2], ['diario', 1], ['camina', 2]],
]
const ANCHOS = ['w-[46%]', 'w-[34%]', 'w-[40%]', 'w-[30%]']

function Cuaderno({ activo, n }) {
  const versos = cual(CUADERNOS, n).map(([palabra, rima], i) => ({ ancho: ANCHOS[i], palabra, rima }))
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 rounded-xl bg-white px-3">
      {versos.map((v, i) => {
        const de = 0.12 + i * 0.14
        return (
          <div key={i} className="flex h-6 items-center gap-2">
            <span className={`h-2 rounded-full bg-zinc-200 ${v.ancho}`} />
            <span className="relative rounded-md px-1 text-base font-semibold leading-6 text-zinc-800">
              <motion.span aria-hidden className="absolute inset-0 rounded-md" style={{ backgroundColor: `var(--color-rima-${v.rima}-suave)` }} {...fase(activo, de, 0.9)} />
              <span className="relative">{v.palabra}</span>
            </span>
            <motion.span
              className="ml-auto font-dato text-base font-medium"
              style={{ color: `var(--color-rima-${v.rima}-tinta)` }}
              {...fase(activo, de + 0.03, 0.9, { pop: true })}
            >
              {v.rima === 1 ? 'A' : 'B'}
            </motion.span>
          </div>
        )
      })}
    </div>
  )
}

/** Vocabulario: una palabra y dos significados; se toca el bueno. Una palabra distinta en cada vuelta (del vocabulario). */
const VOCABULARIO = [
  { palabra: 'Madrugada', opciones: ['Primeras horas del día', 'Una calle sin salida'], bien: 0 },
  { palabra: 'Esquina', opciones: ['Dinero suelto', 'Donde se juntan dos calles'], bien: 1 },
  { palabra: 'Anhelo', opciones: ['Deseo muy fuerte de algo', 'Sombra débil'], bien: 0 },
  { palabra: 'Feria', opciones: ['Oscuridad profunda', 'Dinero suelto, el cambio'], bien: 1 },
  { palabra: 'Penumbra', opciones: ['Sombra débil', 'Parte de una ciudad'], bien: 0 },
]

function Vocabulario({ activo, acento, n }) {
  const v = cual(VOCABULARIO, n)
  return (
    <div className="flex h-full flex-col gap-2">
      <span className="text-center font-titulo text-2xl font-extrabold leading-tight" style={{ color: tinta(acento) }}>
        {v.palabra}
      </span>
      {v.opciones.map((t, i) => (
        <span key={t} className="relative flex h-9 items-center rounded-xl border-2 border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800">
          {t}
          {i === v.bien && (
            <>
              <motion.span aria-hidden className="absolute inset-0 flex items-center gap-2 rounded-[0.6rem] bg-bien-relleno px-3 text-blanco" {...fase(activo, 0.48, 0.9)}>
                <Check className="size-4" /> {t}
              </motion.span>
              <Dedo activo={activo} en={0.44} className="right-6 top-1/2 -mt-3.5" />
            </>
          )}
        </span>
      ))}
    </div>
  )
}

const ESCENAS = {
  intervalos: Intervalos,
  acordes: Acordes,
  funciones: Funciones,
  absoluto: Absoluto,
  seguir: Seguir,
  eco: Eco,
  cuaderno: Cuaderno,
  vocabulario: Vocabulario,
}
