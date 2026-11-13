import { animate, motion, useAnimationControls, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { initPiano, pararRitmo, releaseAll, toneStop } from '../audio/engine.js'
import Emparejar from '../components/exercises/Emparejar.jsx'
import EligeEnCirculo from '../components/exercises/EligeEnCirculo.jsx'
import EscuchaElige from '../components/exercises/EscuchaElige.jsx'
import ExploraFrecuencia from '../components/exercises/ExploraFrecuencia.jsx'
import PianoRollEjercicio from '../components/exercises/PianoRollEjercicio.jsx'
import Pulso from '../components/exercises/Pulso.jsx'
import RetoFL from '../components/exercises/RetoFL.jsx'
import TocaEnPiano from '../components/exercises/TocaEnPiano.jsx'
import PasoSiente from '../components/pasos/PasoSiente.jsx'
import MarcaPalabras from '../components/exercises/MarcaPalabras.jsx'
import FlowEjercicio from '../components/exercises/FlowEjercicio.jsx'
import PasoTexto from '../components/pasos/PasoTexto.jsx'
import Rich from '../components/Rich.jsx'
import { etiquetaPaso } from '../content/actividad.js'
import { acentoLeccion, getLeccion, getModulo, leccionDisponible } from '../content/index.js'
import { RUTAS } from '../content/rutas.js'
import { useOpciones } from '../progress/opciones.js'
import { completarLeccion, getLeccion as getProgresoLeccion, guardarPaso } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import { RESORTE, SALTO, itemLista, lista } from '../ui/movimiento.js'
import { Bombilla, Cerrar, Check, ICONO_ACTIVIDAD } from '../ui/Iconos.jsx'
import Hoja from '../ui/Hoja.jsx'
import Pulsable from '../ui/Pulsable.jsx'
import useGestoBoton from '../ui/useGestoBoton.js'
import { REFLEJO_BOTON, VIDRIO, VIDRIO_BOTON } from '../ui/vidrio.js'

// Tipo de paso -> componente. Para un tipo nuevo: créalo y añádelo aquí.
/** Pasos que nunca muestran retroalimentación (el recuadro del foquito): su botón flota solo, sin panel. */
const SIN_INFORMACION = new Set(['texto', 'siente', 'reto'])

const PASOS = {
  texto: PasoTexto,
  siente: PasoSiente,
  elegir: EscuchaElige,
  emparejar: Emparejar,
  circulo: EligeEnCirculo,
  tocar: TocaEnPiano,
  frecuencia: ExploraFrecuencia,
  reto: RetoFL,
  pianoroll: PianoRollEjercicio,
  pulso: Pulso,
  marcar: MarcaPalabras,
  flow: FlowEjercicio,
}

/**
 * Visor de lecciones paso a paso.
 *
 * Cada paso recibe { paso, leccionId, setAccion, siguiente, completar }:
 *  - setAccion({ label, onClick, disabled, ayuda, feedback, avanza }) controla el botón
 *    grande de abajo. Solo «Comprobar» y «Continuar» (el gesto añade «Atrás»). Si el paso no la usa, «Continuar».
 *  - avanza: true cuando ese botón pasa al paso siguiente (el paso está resuelto): así el gesto del botón
 *    deja avanzar (tarjeta amarilla) sin modo administrador.
 *  - feedback: { tipo: 'bien' | 'mal', titulo, texto } aparece sobre el botón.
 *  - flotante: true cuando el botón nunca tendrá retroalimentación ni ayuda: va solo, sin el panel de debajo.
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
  const acento = acentoLeccion(leccion.id)
  // A dónde se vuelve: al módulo o, si la lección vive en una ruta, a la ruta.
  const volver = leccion.ruta ? rutas.ruta(leccion.ruta) : rutas.modulo(leccion.modulo)
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
    if (soloReto) return navegar(volver)
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
  }, [leccion.id, volver, soloReto])

  const completar = useCallback((resultado) => {
    puntos.current[estado.current.indice] = resultado
  }, [])

  const salir = () => navegar(volver)

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
  const boton = accion ?? { label: 'Continuar', onClick: siguiente, avanza: true, flotante: SIN_INFORMACION.has(paso.tipo) }

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
                style={{ backgroundColor: acento ?? 'var(--color-zinc-900)' }}
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
 * el PANEL es sólido (superficie) y el BOTÓN es de vidrio. Debajo del vidrio hay un tinte de color que se extiende con
 * cada cambio, así parece que el vidrio cambia de color: gris claro = desactivado, oscuro = listo, verde = acierto
 * (con un SALTO al pasar de desactivado a listo). El mensaje de bien / fíjate va sólido encima.
 *
 * `navegacion` (solo en las lecciones): el botón es también un control para pasar de paso (useGestoBoton): al
 * deslizar sobre él (o mantener 0,5 s un borde) entra la flechita desde ese borde, con un brillo negro (atrás) o
 * verde (siguiente), y la palabra del centro gira como un carrusel a «Atrás» o «Continuar». Al soltar en «suelta
 * para ir», pasa y el color del paso nuevo se extiende desde ese lado. { puede(dir) → bool, ir(dir), invertido }.
 */
export function BarraAccion({ accion, navegacion = null }) {
  const { feedback } = accion
  // Sin retroalimentación posible (explicaciones, «Empezar»…): solo el botón de vidrio, flotando, sin el panel
  // (pedido del usuario). Su color es un poco translúcido y desenfoca lo de detrás: se nota que es vidrio.
  const flotante = Boolean(accion.flotante) && !feedback && !accion.ayuda
  const { vidrio: material } = useOpciones()
  // Siempre translúcido (pedido del usuario: «como el de Empezar»): el botón flota debajo de la tarjeta de información,
  // así siempre hay algo detrás que se ve. En «Opaco», sólido.
  const translucido = material !== 'opaco'
  // Presionado (pedido del usuario): el botón se vuelve mate —color opaco, sin dejar ver lo de detrás y sin brillo—.
  const [presionado, setPresionado] = useState(false)
  const bien = feedback?.tipo === 'bien'
  const listo = !accion.disabled
  const color = !listo ? 'apagado' : bien ? 'bien' : 'listo'
  const salto = useAnimationControls()
  const antes = useRef(listo)
  useEffect(() => {
    if (listo && !antes.current) salto.start({ ...SALTO, transition: { duration: 0.35 } })
    antes.current = listo
  }, [listo, salto])

  // Lado desde el que se pasó de paso con el gesto: el color del paso nuevo se extiende desde ahí (un momento).
  const origen = useRef(null)
  const { gesto: actual, cubre, dedoX, dedoY, handlers } = useGestoBoton({
    puede: (dir) => Boolean(navegacion?.puede(dir)),
    ir: (dir, lado) => {
      origen.current = { lado, hasta: performance.now() + 600 }
      navegacion?.ir(dir)
    },
    invertido: navegacion?.invertido,
    activo: Boolean(navegacion),
  })
  // El último gesto, para que todo se vaya donde estaba (sin saltar de lado ni de color) mientras vuelve.
  const ultimo = useRef(actual)
  if (actual.modo) ultimo.current = actual
  const gesto = ultimo.current
  const visible = actual.modo === 'carga' || actual.modo === 'desliza' || actual.modo === 'mantiene'
  // Mientras se jala, solo entra la flechita. Al llegar a «suelta para ir» (y si se puede pasar), TODO A LA VEZ y con
  // el mismo resorte (pedido del usuario): la palabra gira (Rotulo), el color del botón se vuelve transparente y queda
  // el vidrio gris claro de «desactivado» (el texto pasa a oscuro) y aparece el brillo. `fase`: 0…1.
  const reducir = useReducedMotion()
  const activa = visible && gesto.puede && gesto.listo ? 1 : 0
  const fase = useMotionValue(activa)
  useEffect(() => {
    if (reducir) return fase.set(activa)
    const a = animate(fase, activa, RESORTE.pulsar)
    return () => a.stop()
  }, [activa, fase, reducir])
  // Si la palabra no cambia (el botón ya dice «Continuar», verde o negro, y se va al siguiente), la tarjeta conserva su
  // color y el brillo es blanco (el del texto del botón).
  const misma = PALABRA[gesto.dir] === accion.label
  const mismaRef = useRef(misma)
  mismaRef.current = misma
  const opTarjeta = useTransform(fase, (f) => (mismaRef.current ? 1 : 1 - f))
  const mezcla = useTransform(fase, (f) => (mismaRef.current ? 0 : f * 100))

  // En computadora (pedido del usuario): Enter presiona el botón (Comprobar / Continuar), salvo escribiendo en un campo
  // o con una hoja abierta. Se toma aunque el foco esté en una opción, para no volver a tocarla.
  const accionRef = useRef(accion)
  accionRef.current = accion
  useEffect(() => {
    const alTeclado = (e) => {
      if (e.key !== 'Enter' || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const t = e.target
      if (t?.closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
      if (document.querySelector('[role="dialog"]')) return
      const a = accionRef.current
      e.preventDefault()
      if (!a.disabled && a.onClick) a.onClick()
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
  }, [])

  return (
    <div data-barra-accion className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div
        data-panel={flotante ? 'flotante' : 'panel'}
        className="relative mx-auto flex max-w-2xl flex-col gap-2 p-2.5"
      >
        {/* La información (pista y retroalimentación) va en su tarjeta sólida (superficie); el botón de vidrio flota
            debajo, aparte (pedido del usuario: translúcido como «Empezar»). */}
        {!flotante && (
          <motion.div
            data-tarjeta-info
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={RESORTE.suave}
            className="pointer-events-auto relative flex flex-col gap-2 rounded-[1.625rem] border border-zinc-200 bg-white p-2 shadow-[0_8px_28px_rgb(16_18_28/0.14)] dark:shadow-[0_8px_28px_rgb(0_0_0/0.5)]"
          >
        {feedback && (
          <motion.div
            key={feedback.titulo + feedback.texto}
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={RESORTE.suave}
            className={`relative flex max-h-36 flex-col gap-0.5 overflow-y-auto rounded-2xl px-4 py-3 ${bien ? 'bg-bien-suave text-bien-tinta' : 'bg-fijate-suave text-fijate-tinta'}`}
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
        {accion.ayuda && <p className="relative px-2 py-1 text-center text-sm font-medium text-zinc-600">{accion.ayuda}</p>}
          </motion.div>
        )}
        <motion.div animate={salto} className="pointer-events-auto relative">
          {/* Zona del gesto: recibe los toques aunque el botón esté desactivado (volver atrás siempre se puede). */}
          <div
            {...(navegacion ? handlers : {})}
            data-boton-accion
            data-color={color}
            data-gesto={actual.modo ?? undefined}
            data-gesto-lado={actual.modo ? (actual.lado < 0 ? 'izquierda' : 'derecha') : undefined}
            data-gesto-puede={actual.modo ? String(actual.puede) : undefined}
            data-gesto-listo={actual.modo ? String(actual.listo) : undefined}
            className="relative select-none rounded-2xl shadow-[0_8px_24px_rgb(16_18_28/0.20)] [-webkit-touch-callout:none] dark:shadow-[0_8px_24px_rgb(0_0_0/0.55)]"
            style={{ touchAction: 'pan-y' }}
          >
            <Pulsable
              onClick={accion.onClick}
              disabled={accion.disabled}
              onTapStart={() => setPresionado(true)}
              onTap={() => setPresionado(false)}
              onTapCancel={() => setPresionado(false)}
              data-presionado={presionado || undefined}
              className={`relative isolate grid min-h-14 w-full place-items-center overflow-hidden rounded-2xl px-6 text-lg font-semibold ${accion.disabled ? 'pointer-events-none' : ''}`}
            >
              {/* Todo va DENTRO del botón: al presionarlo se encoge junto con él y nada se sale. */}
              {/* Debajo, el vidrio claro de «desactivado»: con el gesto, el color se desvanece y queda este. */}
              {/* Flotando (sin panel), el vidrio deja ver lo que pasa por detrás: poco desenfoque y más saturación y contraste
                  (pedido del usuario: que se resalte lo de detrás con el mismo color y opacidad). */}
              {translucido && <span aria-hidden data-desenfoque className="absolute inset-0 backdrop-blur-[5px] backdrop-saturate-[2.6] backdrop-contrast-[1.6]" />}
              <motion.span
                aria-hidden
                data-translucido={translucido || undefined}
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: translucido && !presionado ? OPACIDAD_FLOTANTE : 1 }}
                transition={{ duration: presionado ? 0.08 : 0.25 }}
              >
                <span aria-hidden className="absolute -inset-3 bg-zinc-200" />
                <motion.span aria-hidden data-tarjeta className="absolute inset-0" style={{ opacity: opTarjeta }}>
                  <TarjetaColor color={color} origen={origen} />
                </motion.span>
              </motion.span>
              <Brillo gesto={gesto} activa={activa} fase={fase} dedoX={dedoX} dedoY={dedoY} tono={misma ? TEXTO_BOTON[color] : tonoGesto(gesto)} />
              <span
                aria-hidden
                className={`absolute inset-0 rounded-2xl transition-opacity ${presionado ? 'opacity-25 duration-75' : 'duration-300'} ${VIDRIO_BOTON}`}
              />
              <span aria-hidden data-reflejo className={`${REFLEJO_BOTON} transition-opacity ${presionado ? 'opacity-0 duration-75' : 'duration-300'}`} />
              <Rotulo label={accion.label} gesto={gesto} mezcla={mezcla} base={TEXTO_BOTON[color]} />
              <Flechita gesto={gesto} visible={visible} cubre={cubre} invertido={Boolean(navegacion?.invertido)} color={colorFlecha(gesto, activa, misma, color)} />
            </Pulsable>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/** Opacidad del color del botón cuando flota sin panel: deja ver (desenfocado) lo que pasa por detrás. */
const OPACIDAD_FLOTANTE = 0.76
const TEXTO_BOTON = { apagado: 'var(--color-zinc-500)', listo: 'var(--color-white)', bien: 'var(--color-blanco)' }
const COLOR_BOTON = { apagado: 'var(--color-zinc-200)', listo: 'var(--color-zinc-900)', bien: 'var(--color-bien-relleno)' }
// El tinte nuevo es un óvalo con borde degradado (sólido hasta el 55 % del radio). Desde el centro, a escala CUBRE la
// parte sólida ya tapa las esquinas (√2 / 0,55 ≈ 2,6); desde un lado (óvalo el doble de ancho centrado en ese borde),
// a escala CUBRE_LADO.
const SOLIDO = 55
const CUBRE = 2.7
const CUBRE_LADO = 2.6
const PALABRA = { 1: 'Continuar', '-1': 'Atrás' } // palabra del gesto según la dirección del paso
const SIGUE_DEDO = { x: 0.12, max: 28, y: 0.4, maxY: 12 } // cuánto sigue el brillo al dedo
// Óvalo vertical del brillo (llena la esquina): mide `ancho` × `alto` px, centrado `dentro` px hacia dentro del borde.
const BRILLO_ESQUINA = { ancho: 96, alto: 124, dentro: 6 }
const SIGUE_ESQUINA = { x: 0.35, y: 0.15, maxY: 5 } // sigue al dedo menos que el horizontal
const ANCHO_BRILLO = 240 // px del brillo de la flechita (centrado en el borde: se ve la mitad, ~120 px)
const CARRUSEL = 150 // px que se desplazan las palabras del carrusel (más que una palabra: nunca se enciman)

/**
 * La tarjeta de color bajo el vidrio del botón. Cada cambio de estado pone encima un tinte nuevo (CapaTinte): un óvalo
 * con el borde degradado (radial) que crece (RESORTE.tinte) hasta cubrir el botón; nunca un rectángulo plano. Nace en
 * el centro o, si se acaba de pasar de paso con el gesto, en el lado de la flechita. Al terminar, las de debajo se
 * quitan (respaldo: 1,5 s). Con reducir movimiento, fundido. Sobresale 12 px arriba y abajo (el botón la recorta).
 */
function TarjetaColor({ color, origen }) {
  const [capas, setCapas] = useState(() => [{ id: 0, color, nueva: false, desde: 0 }])
  const ultimo = capas[capas.length - 1]
  if (ultimo.color !== color) {
    const o = origen.current
    const desde = o && performance.now() < o.hasta ? o.lado : 0
    setCapas((c) => [...c.slice(-2), { id: ultimo.id + 1, color, nueva: true, desde }])
  }
  const cubierta = useCallback((id) => setCapas((cs) => (cs.length > 1 && cs[cs.length - 1].id === id ? cs.slice(-1) : cs)), [])
  useEffect(() => {
    if (capas.length < 2) return
    const t = setTimeout(() => setCapas((cs) => cs.slice(-1)), 1500)
    return () => clearTimeout(t)
  }, [capas])
  return capas.map((c) =>
    c.nueva ? (
      <CapaTinte key={c.id} color={c.color} desde={c.desde} onCubre={() => cubierta(c.id)} />
    ) : (
      <span key={c.id} aria-hidden data-tarjeta-color={c.color} className="absolute -inset-3" style={{ backgroundColor: COLOR_BOTON[c.color] }} />
    ),
  )
}

/**
 * Una capa nueva del tinte: crece con una animación imperativa al montarse (el `initial` de motion no se aplica a lo
 * que se monta dentro de la página, que está en un AnimatePresence con initial={false}). `desde`: 0 = el centro;
 * −1 / +1 = el borde izquierdo / derecho (el óvalo mide el doble de ancho y se centra en ese borde).
 * Con reducir movimiento, solo se funde.
 */
function CapaTinte({ color, desde, onCubre }) {
  const ref = useRef(null)
  const reducir = useReducedMotion()
  const alCubrir = useRef(onCubre)
  alCubrir.current = onCubre
  const fin = desde ? CUBRE_LADO : CUBRE
  const inicio = desde ? 0.06 : 0.12
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const a = reducir
      ? animate(el, { opacity: [0, 1] }, { duration: 0.2 })
      : animate(el, { scale: [inicio, fin], opacity: [0, 1] }, { ...RESORTE.tinte, opacity: { duration: 0.12 } })
    let viva = true
    a.then(() => viva && alCubrir.current?.())
    return () => {
      viva = false
      a.stop()
    }
  }, [reducir, inicio, fin])
  const caja = desde < 0 ? { left: '-100%', width: '200%' } : desde > 0 ? { left: 0, width: '200%' } : { left: '-0.75rem', right: '-0.75rem' }
  return (
    <span
      ref={ref}
      aria-hidden
      data-tarjeta-color={color}
      data-tinte-desde={desde < 0 ? 'izquierda' : desde > 0 ? 'derecha' : 'centro'}
      className="absolute -inset-y-3"
      style={{ ...caja, backgroundImage: `radial-gradient(closest-side, ${COLOR_BOTON[color]} ${SOLIDO}%, transparent)`, transform: `scale(${reducir ? fin : inicio})`, opacity: 0 }}
    />
  )
}

/**
 * Palabra del botón con carrusel (pedido del usuario): mientras se desliza (o se mantiene un borde) y se puede pasar,
 * al llegar a «suelta para ir» la palabra de siempre se va hacia donde va el dedo y entra «Atrás» o «Continuar» desde
 * el lado de la flechita; si el dedo vuelve, regresa la de siempre. Nunca se queda entre dos: siempre gana una. Al
 * pasar, sigue girando: la palabra del paso nuevo entra por el lado del gesto. Su color va del de siempre al oscuro
 * (`zinc-900`) según el botón se vuelve transparente (`mezcla`, 0…100).
 */
function Rotulo({ label, gesto, mezcla, base }) {
  const g = useRef(gesto)
  g.current = gesto
  const reducir = useReducedMotion()
  // Siempre gana una palabra (pedido del usuario: nunca a medias entre dos): la del gesto gana en cuanto soltar ya
  // pasaría («suelta para ir»); antes, la de siempre. El cambio va con RESORTE.pulsar. Si no se puede pasar, o si ya
  // dice esa palabra, no cambia.
  const gana = gesto.puede && gesto.listo && PALABRA[gesto.dir] !== label ? 1 : 0
  const pos = useMotionValue(gana)
  useEffect(() => {
    if (reducir) return pos.set(gana)
    const a = animate(pos, gana, RESORTE.pulsar)
    return () => a.stop()
  }, [gana, pos, reducir])
  // Al pasar ('pasa'), el carrusel no rebobina: la palabra sigue saliendo hacia donde iba el dedo y la del paso nuevo
  // entra por el lado del gesto.
  const sentido = () => (g.current.lado || 1) * (g.current.modo === 'pasa' ? -1 : 1)
  const xLabel = useTransform(pos, (p) => -sentido() * p * CARRUSEL)
  const opLabel = useTransform(pos, (p) => 1 - p)
  const xPalabra = useTransform(pos, (p) => sentido() * (1 - p) * CARRUSEL)
  const palabra = PALABRA[gesto.dir] ?? null
  return (
    <motion.span
      className="relative grid place-items-center transition-colors duration-200"
      style={{ '--mezcla': mezcla, color: `color-mix(in srgb, var(--color-zinc-900) calc(var(--mezcla, 0) * 1%), ${base})` }}
    >
      <motion.span data-rotulo className="col-start-1 row-start-1" style={{ x: xLabel, opacity: opLabel }}>
        {label}
      </motion.span>
      {palabra && (
        <motion.span aria-hidden data-palabra={palabra} data-gana={gana || undefined} className="col-start-1 row-start-1" style={{ x: xPalabra, opacity: pos }}>
          {palabra}
        </motion.span>
      )}
    </motion.span>
  )
}

/**
 * Color de la flechita: mientras se jala (sin brillo), el del texto del botón (se lee sobre su color; atenuado si no se
 * puede pasar). Con el brillo: si la palabra no cambia (brillo blanco), el color del botón; si cambia (botón
 * transparente con brillo verde o negro), clara sobre el brillo.
 */
function colorFlecha(gesto, activa, misma, color) {
  if (!gesto.puede) return `color-mix(in srgb, ${TEXTO_BOTON[color]} 60%, transparent)`
  if (!activa) return TEXTO_BOTON[color]
  if (misma) return COLOR_BOTON[color]
  return gesto.dir > 0 ? 'var(--color-blanco)' : 'var(--color-white)'
}

/** Tono del gesto: verde = siguiente, oscuro (negro; en tema oscuro se invierte, como el botón listo) = atrás, gris = no se puede. */
const tonoGesto = (gesto) => (!gesto.puede ? 'var(--color-zinc-400)' : gesto.dir > 0 ? 'var(--color-bien-relleno)' : 'var(--color-zinc-900)')

/**
 * Brillo de la flechita (pedido del usuario): aparece SOLO al llegar a «suelta para ir», a la vez que cambian la
 * palabra y el color (`fase`), entrando desde el borde. Va DEBAJO del vidrio y son DOS óvalos del mismo tono
 * (verde = siguiente, negro = atrás; en tema oscuro se invierte, como el botón listo):
 *  - uno HORIZONTAL ancho, centrado en el borde, que se desvanece hacia el centro y SIGUE UN POCO AL DEDO
 *    (SIGUE_DEDO: un 12 % de la distancia en x, máx. 28 px; un 40 % de su y, máx. 12 px);
 *  - uno VERTICAL en el borde, casi hasta las esquinas, que se mueve MENOS con el dedo (SIGUE_ESQUINA): así la
 *    esquina del botón se ve llena aunque el dedo suba o baje mucho (con uno solo se notaba el óvalo chato).
 */
function Brillo({ gesto, activa, fase, dedoX, dedoY, tono }) {
  const g = useRef(gesto)
  g.current = gesto
  const ref = useRef(null)
  // Cuánto se acerca al dedo (px hacia dentro desde el borde) y cuánto sale de detrás del borde según la fase.
  const sigueX = (dx, factor) => {
    const lado = g.current.lado || 1
    const ancho = ref.current?.offsetWidth ?? 320 // el del botón
    const desdeBorde = Math.max(0, lado < 0 ? dx : ancho - dx)
    return -lado * Math.min(SIGUE_DEDO.max, desdeBorde * SIGUE_DEDO.x) * factor
  }
  const fuera = (f, px) => (g.current.lado || 1) * px * (1 - f)
  const limita = (v, m) => Math.max(-m, Math.min(m, v))
  const xH = useTransform([fase, dedoX], ([f, dx]) => sigueX(dx, 1) + fuera(f, ANCHO_BRILLO / 3))
  const yH = useTransform(dedoY, (dy) => limita(dy * SIGUE_DEDO.y, SIGUE_DEDO.maxY))
  const xV = useTransform([fase, dedoX], ([f, dx]) => sigueX(dx, SIGUE_ESQUINA.x) + fuera(f, BRILLO_ESQUINA.ancho / 2))
  const yV = useTransform(dedoY, (dy) => limita(dy * SIGUE_ESQUINA.y, SIGUE_ESQUINA.maxY))
  const izquierda = gesto.lado < 0
  const borde = izquierda ? 'left' : 'right'
  return (
    <motion.span
      ref={ref}
      aria-hidden
      data-brillo={activa ? (tono.includes('bien') ? 'verde' : tono.includes('zinc-900') ? 'negro' : 'blanco') : undefined}
      className="pointer-events-none absolute inset-0"
      style={{ opacity: fase }}
    >
      <motion.span
        data-brillo-horizontal
        className="absolute top-1/2 -mt-14 h-28"
        style={{
          width: ANCHO_BRILLO,
          [borde]: -ANCHO_BRILLO / 2,
          x: xH,
          y: yH,
          backgroundImage: `radial-gradient(closest-side, ${tono}, color-mix(in srgb, ${tono} 70%, transparent) 35%, color-mix(in srgb, ${tono} 25%, transparent) 68%, transparent)`,
        }}
      />
      <motion.span
        data-brillo-vertical
        className="absolute top-1/2"
        style={{
          width: BRILLO_ESQUINA.ancho,
          height: BRILLO_ESQUINA.alto,
          marginTop: -BRILLO_ESQUINA.alto / 2,
          [borde]: -BRILLO_ESQUINA.ancho / 2 + BRILLO_ESQUINA.dentro,
          x: xV,
          y: yV,
          backgroundImage: `radial-gradient(closest-side, ${tono}, ${tono} 45%, color-mix(in srgb, ${tono} 45%, transparent) 72%, transparent)`,
        }}
      />
    </motion.span>
  )
}

/**
 * Flechita del gesto (pedido del usuario): solo el signo ‹ › en texto, sin círculo; su color lo da `colorFlecha`. ENTRA DESDE EL BORDE del que se jala siguiendo el avance y, al
 * llegar a «suelta para ir», da un REBOTE (RESORTE.rebote) para que quede claro que ya se puede soltar. Por defecto
 * apunta hacia el borde donde empieza (izquierda ‹, derecha ›); con «Invertir el gesto», al revés.
 */
function Flechita({ gesto, visible, cubre, invertido, color }) {
  const g = useRef(gesto)
  g.current = gesto
  // Entrada: desde fuera del botón hasta su sitio. Si no se puede pasar el avance es corto (goma): entra antes.
  const x = useTransform(cubre, (c) => {
    const e = Math.min(1, g.current.puede ? c : c * 5)
    return (g.current.lado || 1) * 56 * (1 - e) * (1 - e)
  })
  const izquierda = gesto.lado < 0
  const signo = izquierda !== invertido ? '‹' : '›'
  return (
    <motion.span
      aria-hidden
      data-flechita={visible ? (!gesto.puede ? 'gris' : gesto.dir > 0 ? 'siguiente' : 'atras') : undefined}
      data-signo={visible ? signo : undefined}
      className={`pointer-events-none absolute inset-y-0 grid w-16 place-items-center pb-1 text-3xl leading-none font-bold transition-colors duration-150 ${izquierda ? 'left-0' : 'right-0'}`}
      style={{ x, color }}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, scale: visible && gesto.listo ? 1.25 : 1 }}
      transition={{ ...(visible && gesto.listo ? RESORTE.rebote : RESORTE.pulsar), opacity: { duration: 0.15 } }}
    >
      {signo}
    </motion.span>
  )
}

function Final({ leccion, modulo, puntos, onRepetir }) {
  const suma = Object.values(puntos).reduce(
    (acc, p) => ({ aciertos: acc.aciertos + p.aciertos, total: acc.total + p.total }),
    { aciertos: 0, total: 0 },
  )
  // La siguiente lección del módulo. En una ruta no: entre lección y lección hay metas de práctica, así que el
  // botón principal es «Volver a la ruta» (allí la isla siguiente ya está abierta).
  const ruta = leccion.ruta ? RUTAS[leccion.ruta] : null
  const lecciones = ruta ? [] : (modulo?.lecciones ?? [])
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
          href={ruta ? rutas.ruta(ruta.id) : rutas.modulo(leccion.modulo)}
          className={`grid min-h-14 place-items-center rounded-2xl px-6 text-lg font-semibold ${
            proximaLista ? 'border-2 border-zinc-200 bg-white text-zinc-800' : 'bg-zinc-900 text-white'
          }`}
        >
          {ruta ? 'Volver a la ruta' : 'Volver al módulo'}
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
