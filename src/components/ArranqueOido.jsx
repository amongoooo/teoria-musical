import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { elegirNivel, guardarAjustes } from '../progress/oido.js'
import { useOpciones } from '../progress/opciones.js'
import {
  AJUSTES_ABSOLUTO,
  DIRECCIONES,
  OCTAVAS_POSIBLES,
  VIDAS_ESCALADA,
  VIDAS_INFINITAS,
  ajusteAbsoluto,
  octavasDe,
  getJuego,
  textoJuego,
  vidasDe,
} from '../theory/oido.js'
import { claro, labio, oscuro, tinta } from '../ui/color.js'
import { Candado, Check, Circulo8, Cronometro, Escalada, Info, Opciones as IconoOpciones, Oreja, Rayo } from '../ui/Iconos.jsx'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useRuedaMouse from '../ui/useRuedaMouse.js'
import Rich from './Rich.jsx'

/**
 * Arranque de un ejercicio del entrenamiento de oído (pedido del usuario; intervalos, acordes y oído absoluto):
 * título grande, ícono, descripción con la burbuja ⓘ que se despliega, modos de juego en bloques, y dos ruedas
 * verticales lado a lado —Nivel (el 1 abajo; en Rápido, el multiplicador) y Dificultad (1–5 = octavas)— con
 * puntitos al costado (los del Nivel los da `modo.puntosNivel`: las notas como un piano roll, los 12 intervalos o los
 * 3 niveles de acordes; 5 = las octavas). Los botones y controles toman el color de la dificultad (azul, verde,
 * amarillo, naranja, rojo); la página sigue clara u oscura. Al final, lo propio de cada modo: «Dirección»
 * (intervalos: subiendo, bajando, a la vez) o «Responder con» (oído absoluto).
 * Sin textos grises de instrucciones: se entiende por el movimiento y el color.
 */
export default function ArranqueOido({ modo, datos }) {
  const juego = modo.juegos ? getJuego(datos.ajustes.juego) : null
  // Modo administrador (pedido del usuario): todos los niveles desbloqueados.
  const { admin } = useOpciones()
  // Rápido: la rueda de nivel es el multiplicador (1…10, todos disponibles); si no, el nivel de siempre.
  const rapido = Boolean(juego?.multiplicador)
  const mult = AJUSTES_ABSOLUTO.multiplicador
  const dif = AJUSTES_ABSOLUTO.octavas
  const rueda = rapido
    ? { total: mult.max, max: mult.max, valor: ajusteAbsoluto(datos.ajustes, 'multiplicador'), elegir: (n) => guardarAjustes(modo.id, { multiplicador: n }) }
    : { total: modo.niveles, max: admin ? modo.niveles : datos.nivelMax, valor: datos.nivel, elegir: (n) => elegirNivel(modo.id, n, { libre: admin }) }
  // Lo que se ve en cada rueda mientras se desliza (los puntitos y el color lo siguen al instante).
  const [vista, setVista] = useState(rueda.valor)
  const [vistaDif, setVistaDif] = useState(ajusteAbsoluto(datos.ajustes, 'octavas'))
  const conPiano = datos.ajustes.respuesta !== 'botones'
  const direccion = datos.ajustes.direccion ?? 'sube'
  const minVidas = rapido ? VIDAS_ESCALADA : 1
  // Puntitos: los del Nivel los da el modo (oído absoluto: mini piano roll con las notas del nivel; intervalos: los 12
  // intervalos; acordes: sus niveles); la Dificultad, las octavas 2…6 (abajo la grave), que se encienden del centro a
  // los extremos (4, 5, 3, 6, 2).
  const puntos = modo.puntosNivel(vista, { rapido })
  const octavas = new Set(octavasDe(vistaDif))
  const encendidasOctavas = OCTAVAS_POSIBLES.map((o) => octavas.has(o))
  // Solo los botones y controles cambian de color con la dificultad (la página sigue clara u oscura).
  const acento = colorDificultad(vistaDif)

  // Configurar: cerrado al entrar. Si la dificultad cambia por fuera (Predeterminados), el color la sigue.
  const [abierto, setAbierto] = useState(false)
  const difGuardada = ajusteAbsoluto(datos.ajustes, 'octavas')
  useEffect(() => setVistaDif(difGuardada), [difGuardada])
  useEffect(() => setVista(rueda.valor), [rueda.valor])
  const vidasElegidas = vidasDe(datos.ajustes, rapido)
  const nivelPredeterminado = admin ? modo.niveles : datos.nivelMax
  const yaPredeterminado = (rapido || datos.nivel === nivelPredeterminado) && vidasElegidas === VIDAS_INFINITAS && difGuardada === 1
  const predeterminados = () => {
    if (!rapido && datos.nivel !== nivelPredeterminado) elegirNivel(modo.id, nivelPredeterminado, { libre: admin })
    guardarAjustes(modo.id, { vidas: VIDAS_INFINITAS, octavas: 1 })
  }
  const resumen = [
    juego && { id: 'juego', contenido: (() => { const I = ICONO_JUEGO[juego.id] ?? Circulo8; return <I className="size-5" /> })(), etiqueta: juego.nombre },
    { id: 'nivel', contenido: `${rapido ? '×' : 'Nv '}${rueda.valor}`, etiqueta: `Nivel ${rueda.valor}` },
    { id: 'vidas', contenido: formatoResumenVidas(vidasElegidas), etiqueta: vidasElegidas === VIDAS_INFINITAS ? 'Vidas infinitas' : vidasElegidas === VIDAS_ESCALADA ? 'Escalada' : `${vidasElegidas} vidas` },
    { id: 'dificultad', contenido: `Dif ${difGuardada}`, etiqueta: `Dificultad ${difGuardada}` },
  ].filter(Boolean)

  return (
    <LayoutGroup>
      <motion.div variants={lista} initial="oculta" animate="visible" className="flex flex-col gap-8">
        <motion.header variants={itemLista} layout="position" className="flex flex-col items-center gap-5 text-center">
          <h1 className="font-titulo text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">{modo.titulo}</h1>
          {/* Insignia del ejercicio: el mismo ícono, con relieve como las islas (pantalla de «iniciar nivel»). */}
          <motion.span
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
            className="grid size-24 place-items-center rounded-[1.75rem] text-blanco transition-[background-color,box-shadow] duration-300"
            style={{ backgroundColor: oscuro(acento), boxShadow: `0 7px 0 ${labio(acento)}` }}
            aria-hidden
          >
            <Oreja className="size-14" />
          </motion.span>
          <Descripcion texto={modo.descripcion} info={modo.info} />
        </motion.header>

        {/* Configurar (pedido del usuario): modo de juego, nivel, vidas y dificultad en un apartado que sale cerrado;
            cerrado muestra un resumen. Dentro, «Predeterminados» = nivel máximo desbloqueado, vidas ∞ y dificultad 1. */}
        <motion.section variants={itemLista} layout="position" className="flex flex-col gap-6" data-configurar={abierto ? 'abierto' : 'cerrado'}>
          <BotonConfigurar abierto={abierto} onClick={() => setAbierto((a) => !a)} acento={acento} resumen={resumen} />
          <AnimatePresence initial={false}>
            {abierto && (
              <motion.div
                key="configurar"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ ...RESORTE.suave, opacity: { duration: 0.2 } }}
                className="-mx-5 overflow-hidden px-5"
              >
                <div className="flex flex-col gap-8 pt-1 pb-3">
            {modo.juegos && (
              <motion.section layout="position" className="flex flex-col gap-3">
                <Titulo>Modo de juego</Titulo>
                <ModosJuego modo={modo} datos={datos} acento={acento} />
              </motion.section>
            )}

            {/* Nivel · Vidas · Dificultad: tres ruedas lado a lado (las de los lados con sus puntitos por fuera). */}
            <motion.section layout="position" className="flex items-start justify-center gap-2" data-medidores>
              <Medidor id="nivel" titulo="Nivel" lado="izquierda" encendidos={puntos.encendidos} etiquetas={puntos.etiquetas} negras={puntos.negras} acento={acento}>
                <Rueda
                  key={rapido ? 'multiplicador' : 'nivel'}
                  id="nivel"
                  nombre="nivel"
                  total={rueda.total}
                  max={rueda.max}
                  valor={rueda.valor}
                  onVista={setVista}
                  onElegir={rueda.elegir}
                  acento={acento}
                  className={ANCHO_RUEDA}
                />
              </Medidor>
              {/* Vidas (pedido del usuario): 1…20 y encima ∞; en Rápido, debajo del 1, la Escalada. */}
              <Medidor id="vidas" titulo="Vidas" acento={acento}>
                <Rueda
                  key={rapido ? 'vidas-rapido' : 'vidas'}
                  id="vidas"
                  nombre="vidas"
                  min={minVidas}
                  total={VIDAS_INFINITAS - minVidas + 1}
                  max={VIDAS_INFINITAS - minVidas + 1}
                  valor={vidasDe(datos.ajustes, rapido)}
                  onElegir={(n) => guardarAjustes(modo.id, { vidas: n })}
                  formato={formatoVidas}
                  acento={acento}
                  className={ANCHO_RUEDA}
                />
              </Medidor>
              {modo.dificultad && (
                <Medidor id="dificultad" titulo="Dificultad" lado="derecha" encendidos={encendidasOctavas} etiquetas={OCTAVAS_POSIBLES.map((o) => `octava ${o}`)} acento={acento}>
                  <Rueda
                    id="dificultad"
                    nombre="dificultad"
                    total={dif.max}
                    max={dif.max}
                    valor={ajusteAbsoluto(datos.ajustes, 'octavas')}
                    onVista={setVistaDif}
                    onElegir={(n) => guardarAjustes(modo.id, { octavas: n })}
                    acento={acento}
                    className={ANCHO_RUEDA}
                  />
                </Medidor>
              )}
            </motion.section>
                  <Pulsable
                    onClick={predeterminados}
                    disabled={yaPredeterminado}
                    data-predeterminados
                    className="mx-auto min-h-12 rounded-2xl border-2 border-zinc-200 bg-white px-6 font-juego text-lg font-semibold uppercase tracking-wide text-zinc-700 transition-opacity disabled:opacity-40"
                    style={{ boxShadow: RELIEVE }}
                  >
                    Predeterminados
                  </Pulsable>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {modo.direcciones && (
          <motion.section variants={itemLista} layout="position" className="flex flex-col gap-3">
            <Titulo id="direccion">Dirección</Titulo>
            <div role="radiogroup" aria-labelledby="direccion" className="grid grid-cols-3 gap-2">
              {DIRECCIONES.map(({ id, label }) => (
                <Bloque
                  key={id}
                  role="radio"
                  aria-checked={direccion === id}
                  activo={direccion === id}
                  acento={acento}
                  onClick={() => guardarAjustes(modo.id, { direccion: id })}
                  data-direccion={id}
                >
                  <DibujoDireccion direccion={id} className="h-11 w-18" />
                  <span className="font-juego text-base font-semibold leading-tight tracking-tight">{label}</span>
                </Bloque>
              ))}
            </div>
          </motion.section>
        )}

        {modo.piano && (
          <motion.section variants={itemLista} layout="position" className="flex flex-col gap-3">
            <Titulo id="responder-con">Responder con</Titulo>
            <div role="radiogroup" aria-labelledby="responder-con" className="grid grid-cols-2 gap-2">
              {[
                { id: 'piano', nombre: 'Piano', Dibujo: DibujoPiano },
                { id: 'botones', nombre: 'Botones', Dibujo: DibujoBotones },
              ].map(({ id, nombre, Dibujo }) => (
                <Bloque
                  key={id}
                  role="radio"
                  aria-checked={(id === 'piano') === conPiano}
                  activo={(id === 'piano') === conPiano}
                  acento={acento}
                  onClick={() => guardarAjustes(modo.id, { respuesta: id })}
                  data-responder={id}
                >
                  <Dibujo className="h-11 w-18" />
                  <span className="font-juego text-base font-semibold leading-tight tracking-tight">{nombre}</span>
                </Bloque>
              ))}
            </div>
          </motion.section>
        )}
      </motion.div>
    </LayoutGroup>
  )
}

/** Ancho de las tres ruedas verticales (caben lado a lado a 375 px con sus puntitos). */
const ANCHO_RUEDA = 'h-56 w-[5.5rem] shrink-0'

/** Cómo se ve cada valor de la rueda de Vidas: 21 = ∞; 0 (Rápido) = la Escalada (escalones que suben). */
function formatoVidas(v) {
  if (v === VIDAS_INFINITAS) return <span className="font-titulo text-5xl font-bold leading-none" aria-label="Infinitas">∞</span>
  if (v === VIDAS_ESCALADA) return <Escalada className="size-11" titulo="Escalada" />
  return null
}

/** Vidas en el resumen de Configurar: ♥ con el número o ∞, o los escalones de la Escalada. */
function formatoResumenVidas(v) {
  if (v === VIDAS_INFINITAS) return <span className="font-titulo text-lg font-bold leading-none">♥ ∞</span>
  if (v === VIDAS_ESCALADA) return <Escalada className="size-5" />
  return `♥ ${v}`
}

/**
 * Botón de Configurar: tarjeta con relieve, engranaje y «CONFIGURAR»; debajo, el resumen de lo elegido en fichas del
 * color de la dificultad. La flechita gira al abrir.
 */
function BotonConfigurar({ abierto, onClick, acento, resumen }) {
  return (
    <Pulsable
      tipo="tarjeta"
      onClick={onClick}
      aria-expanded={abierto}
      data-boton-configurar
      className="flex w-full flex-col gap-3 rounded-3xl border-2 border-zinc-200 bg-white px-4 py-3.5"
      style={{ boxShadow: RELIEVE }}
    >
      <span className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl" style={{ backgroundColor: claro(acento), color: tinta(acento) }} aria-hidden>
          <IconoOpciones className="size-6" />
        </span>
        <span className="flex-1 text-left font-juego text-xl font-semibold uppercase tracking-wide text-zinc-800">Configurar</span>
        <motion.span aria-hidden animate={{ rotate: abierto ? 90 : 0 }} transition={RESORTE.pulsar} className="text-2xl leading-none text-zinc-400">
          ›
        </motion.span>
      </span>
      <span className="flex flex-wrap gap-2">
        {resumen.map((r) => (
          <span
            key={r.id}
            aria-label={r.etiqueta}
            data-resumen={r.id}
            className="inline-flex min-h-8 items-center gap-1 rounded-full px-3 font-juego text-base"
            style={{ backgroundColor: claro(acento), color: tinta(acento) }}
          >
            {r.contenido}
          </span>
        ))}
      </span>
    </Pulsable>
  )
}

/** Color de cada dificultad (1 azul … 5 rojo; variables `--color-dificultad-N` de src/index.css). */
const colorDificultad = (n) => `var(--color-dificultad-${n})`

/**
 * Columna de medidor: título y, debajo, la rueda con una columna de puntitos al costado (por fuera). Los puntitos
 * son lo que suena: en el Nivel, las 12 notas como un piano roll (Do abajo); en la Dificultad, las octavas 2…6.
 */
function Medidor({ id, titulo, lado, encendidos, etiquetas, negras, acento, children }) {
  const columna = encendidos && <Puntitos encendidos={encendidos} etiquetas={etiquetas} negras={negras} acento={acento} />
  return (
    <div className="flex flex-col items-center gap-3">
      <h2 id={id} className="text-center font-juego text-base font-semibold uppercase tracking-wide text-zinc-800">
        {titulo}
      </h2>
      <div className="flex items-stretch gap-2.5">
        {lado === 'izquierda' && columna}
        {children}
        {lado === 'derecha' && columna}
      </div>
    </div>
  )
}

/**
 * Puntitos en columna (el primero abajo): los encendidos van del color del acento y dan un pop al encenderse.
 * Con `negras` (el piano roll del Nivel; pedido del usuario), los de las teclas negras van más oscuros que los de las
 * blancas, encendidos o apagados, para distinguirlas como en un teclado.
 */
function Puntitos({ encendidos, etiquetas, negras, acento }) {
  const total = encendidos.length
  const grande = total <= 6
  const cuantos = encendidos.filter(Boolean).length
  return (
    <div
      className={`flex flex-col-reverse items-center justify-between ${grande ? 'py-6' : 'py-3'}`}
      role="img"
      aria-label={etiquetas.filter((_, i) => encendidos[i]).join(', ')}
      data-puntitos={total}
      data-encendidos={cuantos}
      data-patron={encendidos.map((on) => (on ? 1 : 0)).join('')}
    >
      {encendidos.map((on, i) => (
        <motion.span
          key={i}
          data-negra={negras?.[i] || undefined}
          initial={false}
          animate={on ? { scale: [1, 1.5, 1] } : { scale: 0.85 }}
          transition={{ duration: 0.3 }}
          className={`block rounded-full transition-colors duration-200 ${grande ? 'size-3.5' : 'size-2.5'}`}
          style={{ backgroundColor: colorPuntito(on, negras?.[i], acento) }}
        />
      ))}
    </div>
  )
}

/** Color de un puntito: encendido = acento; apagado = gris; la tecla negra, más oscura en los dos casos. */
function colorPuntito(on, negra, acento) {
  const base = on ? acento : 'var(--color-zinc-200)'
  return negra ? `color-mix(in oklab, ${base} ${on ? 62 : 58}%, black)` : base
}

/**
 * Bloque de juego (modos, «Responder con»): tarjeta con relieve; el elegido se pinta del color del módulo con su
 * labio y texto blanco.
 */
function Bloque({ activo, acento, className = '', children, ...props }) {
  return (
    <Pulsable
      tipo="tarjeta"
      className={`flex min-h-26 flex-col items-center justify-center gap-2 rounded-3xl border-2 px-1 py-3 transition-[background-color,border-color,color,box-shadow] duration-200 ${
        activo ? 'border-transparent text-blanco' : 'border-zinc-200 bg-white text-zinc-700'
      } ${className}`}
      style={activo ? { backgroundColor: oscuro(acento), boxShadow: `0 5px 0 ${labio(acento)}` } : { boxShadow: RELIEVE }}
      {...props}
    >
      {children}
    </Pulsable>
  )
}

/** Título de sección con aire de videojuego (letra de juego, centrado). */
function Titulo({ id, children }) {
  return (
    <h2 id={id} className="text-center font-juego text-2xl font-semibold uppercase tracking-wide text-zinc-800">
      {children}
    </h2>
  )
}

/** Relieve sólido bajo bloques y tarjetas (como el labio de las islas): se ve «apretable», de juego. */
const RELIEVE = '0 5px 0 var(--color-zinc-200)'

// ---------------------------------------------------------------------------
// Descripción + burbuja ⓘ: cerrada es un círculo de oro con la «i»; al tocarla se despliega (el círculo se estira
// hasta ser la burbuja con el texto) y al tocarla otra vez se recoge.
// ---------------------------------------------------------------------------

function Descripcion({ texto, info }) {
  const [abierta, setAbierta] = useState(false)
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="text-xl leading-relaxed text-zinc-600">{texto}</p>
      {info &&
        (abierta ? (
          <Pulsable
            layoutId="burbuja-info"
            tipo="tarjeta"
            onClick={() => setAbierta(false)}
            aria-expanded
            aria-label="Ocultar información"
            data-info="abierta"
            className="flex w-full items-start gap-3 bg-fijate-suave px-4 py-3.5 text-left text-fijate-tinta"
            style={{ borderRadius: 22 }}
          >
            <motion.span layoutId="burbuja-info-i" className="grid pt-0.5">
              <Info className="size-6" />
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.2 }}
              className="flex-1 text-base leading-relaxed"
            >
              <Rich>{info}</Rich>
            </motion.span>
          </Pulsable>
        ) : (
          <Pulsable
            layoutId="burbuja-info"
            onClick={() => setAbierta(true)}
            aria-expanded={false}
            aria-label="Más información"
            data-info="cerrada"
            className="grid size-11 shrink-0 place-items-center bg-fijate-suave text-fijate-tinta"
            style={{ borderRadius: 22 }}
          >
            <motion.span layoutId="burbuja-info-i" className="grid">
              <Info className="size-6" />
            </motion.span>
          </Pulsable>
        ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modos de juego: bloques con ícono. Tocar uno lo elige y lo abre (su texto sale debajo, con un piquito que apunta a
// él); tocarlo otra vez lo cierra (sigue elegido).
// ---------------------------------------------------------------------------

const ICONO_JUEGO = { normal: Circulo8, rapido: Rayo, contrarreloj: Cronometro }

function ModosJuego({ modo, datos, acento }) {
  const actual = getJuego(datos.ajustes.juego)
  const [abierto, setAbierto] = useState(false)
  const n = modo.juegos.length
  const i = modo.juegos.findIndex((j) => j.id === actual.id)
  const centro = `${((i + 0.5) / n) * 100}%`

  const tocar = (j) => {
    if (j.id === actual.id) setAbierto((a) => !a)
    else {
      guardarAjustes(modo.id, { juego: j.id })
      setAbierto(true)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {modo.juegos.map((j) => {
          const Icono = ICONO_JUEGO[j.id] ?? Circulo8
          const activo = j.id === actual.id
          return (
            <Bloque
              key={j.id}
              activo={activo}
              acento={acento}
              onClick={() => tocar(j)}
              aria-pressed={activo}
              aria-expanded={activo ? abierto : undefined}
              data-juego={j.id}
            >
              <Icono className="size-8" />
              <span className="font-juego text-base font-semibold leading-tight tracking-tight">{j.nombre}</span>
            </Bloque>
          )
        })}
      </div>
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            key="texto"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={RESORTE.suave}
            style={{ transformOrigin: `${centro} 0%` }}
            className="relative pt-4"
            data-juego-texto={actual.id}
          >
            <motion.span
              aria-hidden
              className="absolute top-2.5 size-4 rounded-[4px]"
              initial={false}
              animate={{ left: centro }}
              transition={RESORTE.pulsar}
              style={{ x: '-50%', rotate: 45, backgroundColor: claro(acento) }}
            />
            <div className="relative overflow-hidden rounded-2xl px-4 py-4 text-center" style={{ backgroundColor: claro(acento), color: tinta(acento) }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={actual.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ ...RESORTE.suave, opacity: { duration: 0.15 } }}
                  className="flex flex-col items-center gap-3"
                >
                  <p className="text-lg font-medium leading-snug [&_strong]:font-bold [&_strong]:text-current">
                    <Rich>{textoJuego(actual.id, datos.ajustes)}</Rich>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Lo que se ajusta de cada modo (pedido del usuario: fuera del cuadro, que es solo texto, y debajo de él):
          cada cuántos aciertos (Rápido) o los segundos (Contrarreloj). Normal no tiene. */}
      <AnimatePresence mode="popLayout" initial={false}>
        {(actual.multiplicador || actual.segundos) && (
          <motion.div
            key={actual.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ ...RESORTE.suave, opacity: { duration: 0.15 } }}
            className="pt-4"
          >
            {actual.multiplicador ? (
              <AjusteRueda
                clave="cadaAciertos"
                valor={ajusteAbsoluto(datos.ajustes, 'cadaAciertos')}
                onCambiar={(v) => guardarAjustes(modo.id, { cadaAciertos: v })}
                unidad={<Check className="size-7" />}
                etiqueta="Aciertos para sumar notas"
                acento={acento}
              />
            ) : (
              <AjusteRueda
                clave="segundos"
                valor={ajusteAbsoluto(datos.ajustes, 'segundos')}
                onCambiar={(v) => guardarAjustes(modo.id, { segundos: v })}
                unidad={<span className="font-juego text-2xl">s</span>}
                etiqueta="Segundos por nota"
                acento={acento}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Ajuste de un modo (cada cuántos aciertos, segundos) en un carrusel horizontal, con su unidad al lado. */
function AjusteRueda({ clave, valor, onCambiar, unidad, etiqueta, acento }) {
  const { min, max } = AJUSTES_ABSOLUTO[clave]
  return (
    <div className="flex w-full items-center gap-3" style={{ color: tinta(acento) }} data-ajuste={clave}>
      <Rueda
        etiqueta={etiqueta}
        nombre={clave}
        eje="x"
        min={min}
        total={max - min + 1}
        max={max - min + 1}
        valor={valor}
        onElegir={onCambiar}
        acento={acento}
        className="h-16 min-w-0 flex-1"
      />
      <span className="shrink-0">{unidad}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rueda (carrusel de valores): vertical (Nivel y Dificultad: el 1 abajo, los altos arriba) u horizontal (ajustes de
// los modos: los altos a la derecha). Regla de la app (pedido del usuario): un carrusel NUNCA se queda entre dos
// valores, siempre gana uno: mientras se arrastra, salta al más cercano al dedo con RESORTE.pulsar (tras una zona
// muerta de 8 px); al soltar se asienta usando la inercia del gesto (RESORTE.pantalla). Más allá de los extremos,
// goma. En Nivel, encima del último desbloqueado asoma el siguiente con candado (no se puede elegir). Tocar un valor
// lo elige; flechas del teclado también.
// ---------------------------------------------------------------------------

const TAM_ITEM = { y: 68, x: 58 }
const ZONA_MUERTA = 8
const INERCIA_MS = 160

function Rueda({
  id,
  etiqueta,
  nombre,
  eje = 'y',
  min = 1,
  total,
  max,
  valor,
  onVista,
  onElegir,
  acento,
  formato,
  className = 'h-56 w-28 shrink-0',
}) {
  const vertical = eje === 'y'
  const T = TAM_ITEM[eje]
  const ultimo = Math.max(0, Math.min(total, max) - 1) // índice del último que se puede elegir
  const vistos = Math.min(total, max + 1) // + el siguiente con candado
  const pos = useMotionValue(valor - min)
  const anim = useRef(null)
  const gesto = useRef(null)
  const caja = useRef(null)
  const [actual, setActual] = useState(valor - min)

  // Al montarse (p. ej. al pasar de nivel a multiplicador), quien la usa toma su valor.
  useEffect(() => {
    onVista?.(valor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMotionValueEvent(pos, 'change', (v) => {
    const k = Math.max(0, Math.min(ultimo, Math.round(v)))
    setActual(k)
    onVista?.(k + min)
  })

  const llevar = (k, resorte) => {
    anim.current?.stop()
    anim.current = animate(pos, k, resorte)
  }
  const ir = (k) => {
    const destino = Math.max(0, Math.min(ultimo, k))
    llevar(destino, RESORTE.pantalla)
    if (destino + min !== valor) onElegir(destino + min)
  }

  // Si el valor cambia por fuera (p. ej. se desbloquea un nivel), la rueda va a él.
  useEffect(() => {
    if (gesto.current) return
    if (Math.round(pos.get()) !== valor - min) llevar(valor - min, RESORTE.pantalla)
  }, [valor, pos, min])

  const goma = (v) => {
    if (v > ultimo) return ultimo + 0.6 * (1 - 1 / (1 + (v - ultimo) * 0.9))
    if (v < 0) return -0.6 * (1 - 1 / (1 + -v * 0.9))
    return v
  }

  // Coordenada del dedo en el eje: en vertical, bajar el dedo sube el valor; en horizontal, ir a la izquierda.
  const coord = (e) => (vertical ? e.clientY : -e.clientX)

  const abajo = (e) => {
    anim.current?.stop()
    const c = coord(e)
    const k = Math.round(pos.get())
    gesto.current = { c0: c, p0: k, objetivo: k, movido: false, muestras: [{ t: e.timeStamp, c }] }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const mueve = (e) => {
    const g = gesto.current
    if (!g) return
    const c = coord(e)
    const d = c - g.c0
    if (!g.movido && Math.abs(d) < ZONA_MUERTA) return
    if (!g.movido) {
      g.movido = true
      g.c0 += Math.sign(d) * ZONA_MUERTA
    }
    g.muestras.push({ t: e.timeStamp, c })
    if (g.muestras.length > 6) g.muestras.shift()
    const crudo = g.p0 + (c - g.c0) / T
    if (crudo > ultimo || crudo < 0) {
      // Más allá de los extremos: goma (no hay otro valor con el que quedarse a medias).
      anim.current?.stop()
      g.objetivo = null
      pos.set(goma(crudo))
      return
    }
    // Siempre gana uno: salta al valor más cercano al dedo.
    const k = Math.round(crudo)
    if (k !== g.objetivo) {
      g.objetivo = k
      llevar(k, RESORTE.pulsar)
    }
  }
  const suelta = (e) => {
    const g = gesto.current
    gesto.current = null
    if (!g) return
    if (!g.movido) {
      // Toque: elige el valor que está bajo el dedo.
      const r = caja.current.getBoundingClientRect()
      const desde = vertical ? -(e.clientY - (r.top + r.height / 2)) : e.clientX - (r.left + r.width / 2)
      ir(Math.round(pos.get() + desde / T))
      return
    }
    const a = g.muestras[0]
    const b = g.muestras[g.muestras.length - 1]
    // Si el dedo se quedó quieto antes de soltar (> 80 ms sin moverse), no hay inercia: gana el valor que se ve.
    const quieto = e.timeStamp - b.t > 80
    const v = !quieto && b.t > a.t ? (b.c - a.c) / (b.t - a.t) : 0 // px/ms
    const base = g.objetivo ?? pos.get()
    ir(Math.round(base + (v * INERCIA_MS) / T))
  }

  // Computadora: la rueda del mouse la mueve un valor hacia donde va el scroll.
  useRuedaMouse(caja, {
    eje,
    puede: (dir) => actual + dir >= 0 && actual + dir <= ultimo,
    onPaso: (dir) => ir(actual + dir),
  })

  const tecla = (e) => {
    const sube = vertical ? 'ArrowUp' : 'ArrowRight'
    const baja = vertical ? 'ArrowDown' : 'ArrowLeft'
    if (e.key === sube) ir(actual + 1)
    else if (e.key === baja) ir(actual - 1)
    else return
    e.preventDefault()
  }

  const borde = vertical ? 'to bottom' : 'to right'
  const mascara = `linear-gradient(${borde}, transparent, black ${vertical ? 28 : 22}%, black ${vertical ? 72 : 78}%, transparent)`
  return (
    <div
      ref={caja}
      role="slider"
      tabIndex={0}
      aria-labelledby={id}
      aria-label={id ? undefined : etiqueta}
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-valuemin={min}
      aria-valuemax={ultimo + min}
      aria-valuenow={actual + min}
      data-rueda={nombre}
      data-posicion={actual + min}
      onPointerDown={abajo}
      onPointerMove={mueve}
      onPointerUp={suelta}
      onPointerCancel={suelta}
      onKeyDown={tecla}
      className={`relative cursor-grab touch-none select-none rounded-3xl border-2 border-zinc-200 bg-white outline-none focus-visible:ring-4 focus-visible:ring-sky-300 active:cursor-grabbing ${className}`}
      style={{ boxShadow: RELIEVE }}
    >
      {/* Ranura del elegido, del color de la dificultad. */}
      <div
        className={`pointer-events-none absolute rounded-2xl ${vertical ? 'inset-x-1.5 top-1/2' : 'inset-y-1.5 left-1/2'}`}
        style={vertical ? { height: T, marginTop: -T / 2, backgroundColor: claro(acento) } : { width: T, marginLeft: -T / 2, backgroundColor: claro(acento) }}
        aria-hidden
      />
      <div className="absolute inset-0 overflow-hidden rounded-[1.375rem]" style={{ maskImage: mascara, WebkitMaskImage: mascara }}>
        {Array.from({ length: vistos }, (_, i) => (
          <ItemRueda key={i} i={i} valor={i + min} pos={pos} vertical={vertical} bloqueado={i > ultimo} acento={acento} formato={formato} />
        ))}
      </div>
    </div>
  )
}

function ItemRueda({ i, valor, pos, vertical, bloqueado, acento, formato }) {
  const T = TAM_ITEM[vertical ? 'y' : 'x']
  const desplaza = useTransform(pos, (p) => (vertical ? (p - i) * T : (i - p) * T))
  const distancia = useTransform(pos, (p) => Math.abs(p - i))
  const scale = useTransform(distancia, [0, 1, 2], [1, 0.72, 0.55])
  const opacity = useTransform(distancia, [0, 1, 2.2], [1, 0.45, 0])
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute grid place-items-center ${vertical ? 'inset-x-0 top-1/2' : 'inset-y-0 left-1/2'}`}
      style={{
        ...(vertical ? { height: T, marginTop: -T / 2, y: desplaza } : { width: T, marginLeft: -T / 2, x: desplaza }),
        scale,
        opacity,
        color: tinta(acento),
      }}
      data-valor={valor}
    >
      {bloqueado ? (
        <Candado className="size-9 text-zinc-400" />
      ) : (
        (formato?.(valor) ?? <span className={`font-juego leading-none ${vertical ? 'text-5xl' : 'text-4xl'}`}>{valor}</span>)
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Dibujitos de «Responder con» (fijos: no cambian con el nivel; para eso está la cajita de notas).
// ---------------------------------------------------------------------------

function DibujoPiano({ className }) {
  return (
    <svg viewBox="0 0 72 44" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="68" height="40" rx="6" />
      <path d="M15.6 2v40M29.2 2v40M42.8 2v40M56.4 2v40" />
      <rect x="11" y="2" width="9" height="23" rx="2" fill="currentColor" />
      <rect x="24.6" y="2" width="9" height="23" rx="2" fill="currentColor" />
      <rect x="51.8" y="2" width="9" height="23" rx="2" fill="currentColor" />
    </svg>
  )
}

/**
 * Dibujito de cada dirección de un intervalo: dos notas como en un piano roll (pedido del usuario: bloques con
 * dibujito). Subiendo = la grave y luego la aguda; bajando = al revés; a la vez = una encima de la otra.
 */
const NOTAS_DIRECCION = {
  sube: [[4, 28], [40, 6]],
  baja: [[4, 6], [40, 28]],
  juntas: [[22, 6], [22, 28]],
}

function DibujoDireccion({ direccion, className }) {
  return (
    <svg viewBox="0 0 72 44" className={className} fill="currentColor" aria-hidden>
      {NOTAS_DIRECCION[direccion].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="28" height="10" rx="4" />
      ))}
    </svg>
  )
}

function DibujoBotones({ className }) {
  return (
    <svg viewBox="0 0 72 44" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="2" y="2" width="31" height="17" rx="6" />
      <rect x="39" y="2" width="31" height="17" rx="6" />
      <rect x="2" y="25" width="31" height="17" rx="6" />
      <rect x="39" y="25" width="31" height="17" rx="6" fill="currentColor" />
    </svg>
  )
}
