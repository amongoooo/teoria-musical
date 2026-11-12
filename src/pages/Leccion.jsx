import { animate, motion, useAnimationControls, useReducedMotion, useTransform } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { initPiano, pararRitmo, releaseAll, toneStop } from '../audio/engine.js'
import Emparejar from '../components/exercises/Emparejar.jsx'
import EscuchaElige from '../components/exercises/EscuchaElige.jsx'
import ExploraFrecuencia from '../components/exercises/ExploraFrecuencia.jsx'
import PianoRollEjercicio from '../components/exercises/PianoRollEjercicio.jsx'
import Pulso from '../components/exercises/Pulso.jsx'
import RetoFL from '../components/exercises/RetoFL.jsx'
import TocaEnPiano from '../components/exercises/TocaEnPiano.jsx'
import PasoSiente from '../components/pasos/PasoSiente.jsx'
import PasoTexto from '../components/pasos/PasoTexto.jsx'
import Rich from '../components/Rich.jsx'
import { etiquetaPaso } from '../content/actividad.js'
import { getLeccion, getModulo, leccionDisponible } from '../content/index.js'
import { useOpciones } from '../progress/opciones.js'
import { completarLeccion, getLeccion as getProgresoLeccion, guardarPaso } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { RESORTE, SALTO, itemLista, lista } from '../ui/movimiento.js'
import { Bombilla, Cerrar, Check, ICONO_ACTIVIDAD } from '../ui/Iconos.jsx'
import Hoja from '../ui/Hoja.jsx'
import Pulsable from '../ui/Pulsable.jsx'
import useGestoBoton from '../ui/useGestoBoton.js'
import { VIDRIO, VIDRIO_BOTON } from '../ui/vidrio.js'

// Tipo de paso -> componente. Para un tipo nuevo: créalo y añádelo aquí.
const PASOS = {
  texto: PasoTexto,
  siente: PasoSiente,
  elegir: EscuchaElige,
  emparejar: Emparejar,
  tocar: TocaEnPiano,
  frecuencia: ExploraFrecuencia,
  reto: RetoFL,
  pianoroll: PianoRollEjercicio,
  pulso: Pulso,
}

/**
 * Visor de lecciones paso a paso.
 *
 * Cada paso recibe { paso, leccionId, setAccion, siguiente, completar }:
 *  - setAccion({ label, onClick, disabled, ayuda, feedback, avanza }) controla el botón
 *    grande de abajo. Solo dos palabras: «Comprobar» y «Siguiente». Si el paso no la usa, «Siguiente».
 *  - avanza: true cuando ese botón pasa al paso siguiente (el paso está resuelto): así el gesto del botón
 *    deja avanzar (tarjeta amarilla) sin modo administrador.
 *  - feedback: { tipo: 'bien' | 'mal', titulo, texto } aparece sobre el botón.
 *  - completar({ aciertos, total }) guarda la puntuación del paso.
 *  - siguiente() avanza al siguiente paso.
 */
export default function Leccion({ id, soloReto = false }) {
  const leccion = getLeccion(id)
  const [vuelta, setVuelta] = useState(0)
  if (!leccion) return <NoEncontrada id={id} />
  return <Visor key={vuelta} leccion={leccion} soloReto={soloReto} onRepetir={() => setVuelta((v) => v + 1)} />
}

/**
 * soloReto: abre directamente el paso «reto» (desde la isla de Retos del módulo); al continuar
 * vuelve al módulo sin tocar el progreso de la lección.
 */
function Visor({ leccion, soloReto, onRepetir }) {
  const modulo = getModulo(leccion.modulo)
  const total = leccion.pasos.length

  const [indice, setIndice] = useState(() => {
    const iReto = leccion.pasos.findIndex((p) => p.tipo === 'reto')
    if (soloReto && iReto >= 0) return iReto
    const p = getProgresoLeccion(leccion.id)
    return p && !p.completada && p.paso > 0 && p.paso < total ? p.paso : 0
  })
  const [terminado, setTerminado] = useState(false)
  const [accion, setAccion] = useState(null)
  const puntos = useRef({}) // índice de paso -> { aciertos, total }
  const { admin, gesto } = useOpciones() // admin: la barra de pasos abre «Ir al paso» y el gesto pasa sin responder
  const [verPasos, setVerPasos] = useState(false)
  // Hasta qué paso se ha llegado avanzando de verdad (los anteriores están resueltos): volver atrás no lo
  // borra y deja avanzar otra vez con el gesto. Empieza en el paso guardado.
  const [alcanzado, setAlcanzado] = useState(() => {
    const p = getProgresoLeccion(leccion.id)
    return p && !p.completada && p.paso > 0 && p.paso < total ? p.paso : 0
  })
  const [haciaAtras, setHaciaAtras] = useState(false) // el paso nuevo entra por la izquierda

  useEffect(() => {
    initPiano()
    return () => {
      releaseAll()
      toneStop()
      pararRitmo()
    }
  }, [])

  // siguiente/completar estables para que los pasos los usen en efectos.
  const estado = useRef({ indice, total, alcanzado })
  estado.current = { indice, total, alcanzado }

  const siguiente = useCallback(() => {
    const { indice: i, total: t, alcanzado: a } = estado.current
    if (soloReto) return navegar(rutas.modulo(leccion.modulo))
    setAccion(null)
    setHaciaAtras(false)
    window.scrollTo(0, 0)
    if (i < t - 1) {
      setIndice(i + 1)
      setAlcanzado(Math.max(a, i + 1))
      guardarPaso(leccion.id, Math.max(a, i + 1)) // tras volver atrás, no se pierde hasta dónde se llegó
    } else {
      const suma = Object.values(puntos.current).reduce(
        (acc, p) => ({ aciertos: acc.aciertos + p.aciertos, total: acc.total + p.total }),
        { aciertos: 0, total: 0 },
      )
      completarLeccion(leccion.id, suma)
      setTerminado(true)
    }
  }, [leccion.id, leccion.modulo, soloReto])

  const completar = useCallback((resultado) => {
    puntos.current[estado.current.indice] = resultado
  }, [])

  const salir = () => navegar(rutas.modulo(leccion.modulo))

  /** Saltar a otro paso (modo administrador o volver atrás con el gesto): no guarda el paso ni su puntuación. */
  const irA = useCallback((n) => {
    setVerPasos(false)
    setAccion(null)
    releaseAll()
    pararRitmo()
    window.scrollTo(0, 0)
    setHaciaAtras(n < estado.current.indice)
    setIndice(n)
  }, [])

  if (terminado) {
    return <Final leccion={leccion} modulo={modulo} puntos={puntos.current} onRepetir={onRepetir} />
  }

  const paso = leccion.pasos[indice]
  const Componente = PASOS[paso.tipo]
  const boton = accion ?? { label: 'Siguiente', onClick: siguiente, avanza: true }

  // El botón también pasa de paso con un gesto (deslizar o mantener un borde). Volver: siempre (salvo en el
  // primero). Avanzar: si el paso está resuelto (como «Siguiente»); en modo administrador, siempre. En los
  // extremos, gris. Saltar no guarda la puntuación del paso saltado; volver no borra el progreso.
  const resuelto = indice < alcanzado || (boton.avanza && !boton.disabled)
  const navegacion = soloReto
    ? null
    : {
        invertido: gesto === 'invertido',
        puede: (dir) => (dir < 0 ? indice > 0 : indice < total - 1 && (admin || resuelto)),
        ir: (dir) => {
          if (dir < 0) return irA(indice - 1)
          if (resuelto) return siguiente()
          irA(indice + 1) // modo administrador: sin responder
        },
      }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Cabecera de vidrio (como la de Módulo): ✕ en un círculo y la barra de pasos con el contador en una
          píldora; el paso pasa por detrás, desenfocado. */}
      <header className="pointer-events-none sticky top-0 z-10">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3 pb-2">
          <Pulsable
            onClick={salir}
            aria-label="Salir de la lección"
            className={`pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}
          >
            <Cerrar className="size-6" />
          </Pulsable>
          {/* En modo administrador la píldora es un botón que abre «Ir al paso». */}
          <BarraPasos admin={admin} onAbrir={() => setVerPasos(true)}>
            <div
              className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-200"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={indice}
              aria-label={`Paso ${indice + 1} de ${total}`}
            >
              <motion.div
                className="h-full rounded-full"
                initial={false}
                animate={{ width: `${(indice / total) * 100}%` }}
                transition={RESORTE.suave}
                style={{ backgroundColor: modulo?.acento ?? 'var(--color-zinc-900)' }}
              />
            </div>
            <span className="w-12 shrink-0 text-right font-dato text-sm tabular-nums text-zinc-600">
              {indice + 1}/{total}
            </span>
          </BarraPasos>
        </div>
      </header>

      {admin && (
        <Hoja abierta={verPasos} onCerrar={() => setVerPasos(false)} etiqueta="Ir al paso">
          <IrAlPaso pasos={leccion.pasos} indice={indice} onIr={irA} />
        </Hoja>
      )}

      {/* Cada paso entra desde la derecha con un resorte (como avanzar en iOS); al volver, desde la izquierda. */}
      <motion.main
        key={indice}
        initial={{ opacity: 0, x: haciaAtras ? -40 : 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...RESORTE.pantalla, opacity: { duration: 0.2 } }}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 pb-64 pt-4"
      >
        <Etiqueta paso={paso} indice={indice} />
        <h1 className="font-titulo text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{paso.titulo}</h1>
        {paso.intro && (
          <p className="text-lg leading-relaxed text-zinc-600">
            <Rich>{paso.intro}</Rich>
          </p>
        )}
        {Componente ? (
          <Componente
            paso={paso}
            leccionId={leccion.id}
            setAccion={setAccion}
            siguiente={siguiente}
            completar={completar}
          />
        ) : (
          <p className="text-fijate-tinta">Tipo de paso desconocido: {paso.tipo}</p>
        )}
      </motion.main>

      <BarraAccion accion={boton} navegacion={navegacion} />
    </div>
  )
}

/** Píldora de vidrio con la barra de pasos; en modo administrador es un botón (abre «Ir al paso»). */
function BarraPasos({ admin, onAbrir, children }) {
  const clase = `flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full pl-4 pr-3 ${VIDRIO}`
  if (!admin) return <div className={clase}>{children}</div>
  return (
    <Pulsable onClick={onAbrir} aria-label="Ir a otro paso (modo administrador)" aria-haspopup="dialog" className={`pointer-events-auto ${clase}`}>
      {children}
    </Pulsable>
  )
}

/** Hoja «Ir al paso» (modo administrador): anterior / siguiente y la lista de pasos con su tipo. */
function IrAlPaso({ pasos, indice, onIr }) {
  const total = pasos.length
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-titulo text-2xl font-bold tracking-tight">Ir al paso</h2>
        <p className="text-sm text-zinc-500">
          Modo administrador · paso <span className="font-dato tabular-nums">{indice + 1}/{total}</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Pulsable
          onClick={() => onIr(indice - 1)}
          disabled={indice === 0}
          className="min-h-12 rounded-2xl border-2 border-zinc-200 bg-white px-4 text-base font-semibold text-zinc-900 disabled:text-zinc-400"
        >
          ‹ Anterior
        </Pulsable>
        <Pulsable
          onClick={() => onIr(indice + 1)}
          disabled={indice === total - 1}
          className="min-h-12 rounded-2xl bg-zinc-900 px-4 text-base font-semibold text-white disabled:bg-zinc-300 disabled:text-zinc-500"
        >
          Siguiente ›
        </Pulsable>
      </div>
      <ol className="flex flex-col gap-2">
        {pasos.map((paso, i) => {
          const e = etiquetaPaso(paso, i)
          const tipo = e ? (e.ejercicio ? `${e.texto} · ${e.ejercicio}` : e.texto) : paso.tipo === 'siente' ? '¿Qué se siente?' : 'Explicación'
          const actual = i === indice
          return (
            <li key={i}>
              <Pulsable
                tipo="tarjeta"
                onClick={() => onIr(i)}
                aria-current={actual ? 'step' : undefined}
                data-foco={actual || undefined}
                className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left ${actual ? 'border-zinc-900 bg-white' : 'border-zinc-200 bg-white'}`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full font-dato text-sm font-medium tabular-nums ${actual ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                >
                  {i + 1}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-base font-semibold leading-snug text-zinc-900">{paso.titulo}</span>
                  <span className="text-sm text-zinc-500">{tipo}</span>
                </span>
              </Pulsable>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/**
 * Etiqueta del paso: ícono de su actividad + nombre del ejercicio (catálogo de INTERACCIONES.md),
 * p. ej. «Oído · Escuchar y elegir». Las explicaciones no llevan etiqueta.
 */
function Etiqueta({ paso, indice }) {
  const e = etiquetaPaso(paso, indice)
  if (!e) return null
  const Icono = ICONO_ACTIVIDAD[e.actividad]
  return (
    <p className="-mb-2 inline-flex items-center gap-1.5 self-start rounded-full bg-zinc-100 py-1 pr-3 pl-2.5 text-sm font-bold text-zinc-700">
      <Icono className="size-[18px]" />
      {e.ejercicio ? `${e.texto} · ${e.ejercicio}` : e.texto}
    </p>
  )
}

/**
 * Barra de abajo con el botón grande (también la usa el entrenamiento de oído). Materiales (pedido del usuario):
 * el PANEL es sólido (superficie) y el BOTÓN es de vidrio. Debajo del vidrio hay una tarjeta de color que aparece y
 * crece desde el centro con cada cambio, así parece que el vidrio cambia de color: gris claro = desactivado,
 * oscuro = listo, verde = acierto (con un SALTO al pasar de desactivado a listo). El mensaje de bien / fíjate va
 * sólido encima.
 *
 * `navegacion` (solo en las lecciones): el botón es también un control para pasar de paso (useGestoBoton):
 * deslizar sobre él saca una tarjeta amarilla (se puede) o gris (no se puede) desde el lado donde empieza el dedo,
 * con su flechita; mantener 1 s un borde lateral muestra la flechita de ese lado. Al soltar, pasa si era amarilla.
 * { puede(dir) → bool, ir(dir), invertido }.
 */
export function BarraAccion({ accion, navegacion = null }) {
  const { feedback } = accion
  const bien = feedback?.tipo === 'bien'
  const listo = !accion.disabled
  const color = !listo ? 'apagado' : bien ? 'bien' : 'listo'
  const salto = useAnimationControls()
  const antes = useRef(listo)
  useEffect(() => {
    if (listo && !antes.current) salto.start({ ...SALTO, transition: { duration: 0.35 } })
    antes.current = listo
  }, [listo, salto])

  const { gesto, x, opacidad, cubre, handlers } = useGestoBoton({
    puede: (dir) => Boolean(navegacion?.puede(dir)),
    ir: (dir) => navegacion?.ir(dir),
    invertido: navegacion?.invertido,
    activo: Boolean(navegacion),
  })
  const textoOpacidad = useTransform(cubre, [0, 1], [1, 0.35])

  return (
    <div data-barra-accion className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto flex max-w-2xl flex-col gap-2 rounded-[1.625rem] border border-zinc-200 bg-white p-2.5 shadow-[0_8px_28px_rgb(16_18_28/0.14)] dark:shadow-[0_8px_28px_rgb(0_0_0/0.5)]">
        {feedback && (
          <motion.div
            key={feedback.titulo + feedback.texto}
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={RESORTE.suave}
            className={`flex max-h-36 flex-col gap-0.5 overflow-y-auto rounded-2xl px-4 py-3 ${bien ? 'bg-bien-suave text-bien-tinta' : 'bg-fijate-suave text-fijate-tinta'}`}
          >
            <p className="flex items-center gap-2 text-base font-bold leading-snug">
              {bien ? <Check className="size-5" /> : <Bombilla className="size-5" />}
              {feedback.titulo}
            </p>
            {feedback.texto && (
              <p className="text-base leading-snug">
                <Rich>{feedback.texto}</Rich>
              </p>
            )}
          </motion.div>
        )}
        {accion.ayuda && <p className="px-2 pt-1 text-center text-sm font-medium text-zinc-600">{accion.ayuda}</p>}
        <motion.div animate={salto}>
          {/* Zona del gesto: recibe los toques aunque el botón esté desactivado (volver atrás siempre se puede). */}
          <div
            {...(navegacion ? handlers : {})}
            data-boton-accion
            data-color={color}
            data-gesto={gesto.modo ?? undefined}
            data-gesto-lado={gesto.modo ? (gesto.lado < 0 ? 'izquierda' : 'derecha') : undefined}
            data-gesto-puede={gesto.modo ? String(gesto.puede) : undefined}
            data-gesto-listo={gesto.modo ? String(gesto.listo) : undefined}
            className="relative select-none [-webkit-touch-callout:none]"
            style={{ touchAction: 'pan-y' }}
          >
            <Pulsable
              onClick={accion.onClick}
              disabled={accion.disabled}
              className={`relative isolate grid min-h-14 w-full place-items-center overflow-hidden rounded-2xl px-6 text-lg font-semibold ${accion.disabled ? 'pointer-events-none' : ''}`}
            >
              <TarjetaColor color={color} />
              {/* Tarjeta del gesto: debajo del vidrio, se desplaza con el dedo desde el lado donde empezó. Su borde de
                  delante es un degradado largo (FUNDIDO_GESTO px): tiñe el vidrio poco a poco, nunca una franja plana. */}
              <motion.span
                aria-hidden
                data-tarjeta-gesto
                className="absolute inset-x-0 -inset-y-3"
                style={{
                  x,
                  opacity: opacidad,
                  backgroundImage: `linear-gradient(to ${gesto.lado < 0 ? 'right' : 'left'}, ${gesto.puede ? 'var(--color-fijate)' : 'var(--color-zinc-400)'} calc(100% - ${FUNDIDO_GESTO}px), transparent)`,
                }}
              />
              <span aria-hidden className={`absolute inset-0 rounded-2xl ${VIDRIO_BOTON}`} />
              <motion.span
                className={`relative transition-colors duration-200 ${color === 'apagado' ? 'text-zinc-500' : color === 'bien' ? 'text-blanco' : 'text-white'}`}
                style={{ opacity: textoOpacidad }}
              >
                {accion.label}
              </motion.span>
            </Pulsable>
            <Flechita gesto={gesto} color={color} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const COLOR_BOTON = { apagado: 'var(--color-zinc-200)', listo: 'var(--color-zinc-900)', bien: 'var(--color-bien-relleno)' }
const FUNDIDO_GESTO = 96 // px del degradado del borde de delante de la tarjeta del gesto
// La tarjeta de color nueva es un óvalo con borde degradado (sólido hasta el 55 % del radio); a escala CUBRE ya tapa
// las esquinas del botón con la parte sólida (√2 / 0,55 ≈ 2,6).
const SOLIDO = 55
const CUBRE = 2.7

/**
 * La tarjeta de color bajo el vidrio del botón. Cada cambio de estado pone encima una tarjeta nueva: un óvalo con el
 * borde degradado (radial) que aparece en el centro y crece (RESORTE.tinte) hasta cubrir el botón, como un tinte que
 * se extiende por el vidrio; nunca un rectángulo plano. al terminar, las de debajo se quitan. Con reducir
 * movimiento, fundido. Sobresale 12 px por cada lado (el botón la recorta).
 */
function TarjetaColor({ color }) {
  const [capas, setCapas] = useState(() => [{ id: 0, color, nueva: false }])
  const ultimo = capas[capas.length - 1]
  if (ultimo.color !== color) setCapas((c) => [...c.slice(-2), { id: ultimo.id + 1, color, nueva: true }])
  // Cuando la de arriba ya cubre todo (termina su animación), las de debajo sobran. Respaldo: 1,5 s.
  const cubierta = useCallback((id) => setCapas((cs) => (cs.length > 1 && cs[cs.length - 1].id === id ? cs.slice(-1) : cs)), [])
  useEffect(() => {
    if (capas.length < 2) return
    const t = setTimeout(() => setCapas((cs) => cs.slice(-1)), 1500)
    return () => clearTimeout(t)
  }, [capas])
  return capas.map((c) =>
    c.nueva ? (
      <CapaTinte key={c.id} color={c.color} onCubre={() => cubierta(c.id)} />
    ) : (
      <span key={c.id} aria-hidden data-tarjeta-color={c.color} className="absolute -inset-3" style={{ backgroundColor: COLOR_BOTON[c.color] }} />
    ),
  )
}

/**
 * Una capa nueva del tinte: crece desde el centro con una animación imperativa al montarse (el `initial` de motion no
 * se aplica a lo que se monta dentro de la página, que está en un AnimatePresence con initial={false}).
 * Con reducir movimiento, solo se funde.
 */
function CapaTinte({ color, onCubre }) {
  const ref = useRef(null)
  const reducir = useReducedMotion()
  const alCubrir = useRef(onCubre)
  alCubrir.current = onCubre
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const a = reducir
      ? animate(el, { opacity: [0, 1] }, { duration: 0.2 })
      : animate(el, { scale: [0.12, CUBRE], opacity: [0, 1] }, { ...RESORTE.tinte, opacity: { duration: 0.12 } })
    let viva = true
    a.then(() => viva && alCubrir.current?.())
    return () => {
      viva = false
      a.stop()
    }
  }, [reducir])
  return (
    <span
      ref={ref}
      aria-hidden
      data-tarjeta-color={color}
      className="absolute -inset-3"
      style={{ backgroundImage: `radial-gradient(closest-side, ${COLOR_BOTON[color]} ${SOLIDO}%, transparent)`, transform: `scale(${reducir ? CUBRE : 0.12})`, opacity: 0 }}
    />
  )
}

/**
 * Flechita del gesto: solo el signo ‹ › (texto, como el resto de flechas de navegación), sin círculo, en el lado de
 * donde sale la tarjeta y APUNTANDO HACIA ESE BORDE (pedido del usuario): izquierda ‹, derecha ›. Del MISMO COLOR
 * QUE EL BOTÓN (pedido del usuario): verde si está en verde, oscuro si está listo, gris claro si está desactivado. Detrás, un brillo
 * radial ligero amarillo (se puede pasar) o gris (no) que da el contraste sin teñir una zona entera del botón. Crece un
 * poco cuando soltar ya pasaría («suelta para ir»); en la pulsación larga empieza más chica (modo 'carga') y termina
 * igual que en el deslizamiento. Va recortada al botón.
 */
function Flechita({ gesto: actual, color }) {
  const visible = actual.modo === 'carga' || actual.modo === 'desliza' || actual.modo === 'mantiene'
  // Al terminar, se desvanece donde estaba (sin saltar de lado ni de color).
  const ultimo = useRef(actual)
  if (actual.modo) ultimo.current = actual
  const gesto = ultimo.current
  const izquierda = gesto.lado < 0
  const tono = gesto.puede ? 'var(--color-fijate)' : 'var(--color-zinc-400)'
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
      <motion.span
        data-flechita={visible ? (gesto.puede ? 'amarilla' : 'gris') : undefined}
        className={`absolute inset-y-0 grid w-16 place-items-center pb-1 text-3xl leading-none font-bold transition-colors duration-200 ${izquierda ? 'left-0' : 'right-0'}`}
        style={{
          color: COLOR_BOTON[color],
          backgroundImage: `radial-gradient(closest-side, color-mix(in srgb, ${tono} 85%, transparent), color-mix(in srgb, ${tono} 35%, transparent) 55%, transparent)`,
        }}
        initial={false}
        animate={{ opacity: visible ? 1 : 0, scale: !visible ? 0.6 : gesto.modo === 'carga' ? 0.9 : gesto.listo ? 1.15 : 1 }}
        transition={{ ...RESORTE.pulsar, opacity: { duration: gesto.modo === 'carga' ? 0.25 : 0.12 } }}
      >
        {izquierda ? '‹' : '›'}
      </motion.span>
    </span>
  )
}

function Final({ leccion, modulo, puntos, onRepetir }) {
  const suma = Object.values(puntos).reduce(
    (acc, p) => ({ aciertos: acc.aciertos + p.aciertos, total: acc.total + p.total }),
    { aciertos: 0, total: 0 },
  )
  const lecciones = modulo?.lecciones ?? []
  const pos = lecciones.findIndex((l) => l.id === leccion.id)
  const proxima = lecciones[pos + 1]
  const proximaLista = proxima && leccionDisponible(proxima.id)

  return (
    <motion.main variants={lista} initial="oculta" animate="visible" className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-12">
      <motion.div variants={itemLista} className="flex flex-col items-center gap-3 text-center">
        <motion.div
          className="grid size-20 place-items-center rounded-full bg-bien-relleno text-blanco"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.1 }}
          aria-hidden
        >
          <Check className="size-10" grosor={3} />
        </motion.div>
        <h1 className="font-titulo text-3xl font-bold tracking-tight sm:text-4xl">¡Lección completada!</h1>
        <p className="text-lg text-zinc-500">
          {leccion.id} · {leccion.titulo}
        </p>
        {suma.total > 0 && (
          <p className="rounded-full bg-zinc-100 px-4 py-2 text-base font-medium text-zinc-700">
            {suma.aciertos} de {suma.total} a la primera
          </p>
        )}
      </motion.div>

      {leccion.resumen && (
        <motion.section variants={itemLista} className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-5">
          <h2 className="font-titulo text-xl font-bold">Lo que aprendiste</h2>
          <motion.ul variants={lista} className="flex flex-col gap-2 text-base leading-relaxed text-zinc-600">
            {leccion.resumen.map((r, i) => (
              <motion.li key={i} variants={itemLista} className="flex gap-2">
                <span aria-hidden className="text-zinc-400">•</span>
                <span>
                  <Rich>{r}</Rich>
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}

      <motion.div variants={itemLista} className="flex flex-col gap-3">
        {proximaLista ? (
          <Pulsable
            href={rutas.leccion(proxima.id)}
            className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 px-6 text-center text-lg font-semibold text-white"
          >
            Siguiente: {proxima.titulo}
          </Pulsable>
        ) : (
          proxima && (
            <p className="text-center text-base text-zinc-500">
              La lección {proxima.id} ({proxima.titulo}) llega pronto.
            </p>
          )
        )}
        <Pulsable
          href={rutas.modulo(leccion.modulo)}
          className={`grid min-h-14 place-items-center rounded-2xl px-6 text-lg font-semibold ${
            proximaLista ? 'border-2 border-zinc-200 bg-white text-zinc-800' : 'bg-zinc-900 text-white'
          }`}
        >
          Volver al módulo
        </Pulsable>
        <Pulsable
          onClick={() => {
            window.scrollTo(0, 0)
            onRepetir()
          }}
          className="min-h-12 rounded-2xl px-6 text-base font-medium text-zinc-500"
        >
          Repetir lección
        </Pulsable>
      </motion.div>
    </motion.main>
  )
}

function NoEncontrada({ id }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-16">
      <h1 className="font-titulo text-3xl font-bold">Lección {id}</h1>
      <p className="text-lg text-zinc-500">Esta lección todavía no está disponible.</p>
      <a href={rutas.inicio()} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
        Volver al inicio
      </a>
    </main>
  )
}
