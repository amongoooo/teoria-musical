import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { elegirNivel, guardarAjustes } from '../progress/oido.js'
import {
  AJUSTES_ABSOLUTO,
  ajusteAbsoluto,
  getJuego,
  notasDelNivel,
  notasInicialesRapido,
  textoJuego,
} from '../theory/oido.js'
import { claro, labio, oscuro, tinta } from '../ui/color.js'
import { Candado, Check, Circulo8, Cronometro, Info, Oreja, Rayo } from '../ui/Iconos.jsx'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import Rich from './Rich.jsx'

/**
 * Arranque de un ejercicio del entrenamiento de oído (pedido del usuario; por ahora solo el oído absoluto):
 * título grande, ícono, descripción con la burbuja ⓘ que se despliega, modos de juego en bloques, y dos ruedas
 * verticales lado a lado —Nivel (el 1 abajo; en Rápido, el multiplicador) y Dificultad (1–5 = octavas)— con
 * puntitos al costado que se encienden (12 = las notas; 5 = las octavas). La página entera se tiñe según la
 * dificultad: azul, verde, amarillo, naranja y rojo. Al final, «Responder con» en dos bloques con dibujito.
 * Sin textos grises de instrucciones: se entiende por el movimiento y el color.
 */
export default function ArranqueOido({ modo, datos }) {
  const juego = modo.juegos ? getJuego(datos.ajustes.juego) : null
  // Rápido: la rueda de nivel es el multiplicador (1…10, todos disponibles); si no, el nivel de siempre.
  const rapido = Boolean(juego?.multiplicador)
  const mult = AJUSTES_ABSOLUTO.multiplicador
  const dif = AJUSTES_ABSOLUTO.octavas
  const rueda = rapido
    ? { total: mult.max, max: mult.max, valor: ajusteAbsoluto(datos.ajustes, 'multiplicador'), elegir: (n) => guardarAjustes(modo.id, { multiplicador: n }) }
    : { total: modo.niveles, max: datos.nivelMax, valor: datos.nivel, elegir: (n) => elegirNivel(modo.id, n) }
  // Lo que se ve en cada rueda mientras se desliza (los puntitos y el color lo siguen al instante).
  const [vista, setVista] = useState(rueda.valor)
  const [vistaDif, setVistaDif] = useState(ajusteAbsoluto(datos.ajustes, 'octavas'))
  const conPiano = datos.ajustes.respuesta !== 'botones'
  const notas = (rapido ? notasInicialesRapido(vista) : notasDelNivel(vista)).length
  const acento = colorDificultad(vistaDif)
  useFondoTenido(acento)

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

        {modo.juegos && (
          <motion.section variants={itemLista} layout="position" className="flex flex-col gap-3">
            <Titulo>Modo de juego</Titulo>
            <ModosJuego modo={modo} datos={datos} acento={acento} />
          </motion.section>
        )}

        <motion.section variants={itemLista} layout="position" className="grid grid-cols-2 gap-4" data-medidores>
          <Medidor id="nivel" titulo="Nivel" lado="izquierda" puntos={12} encendidos={notas} acento={acento}>
            <RuedaNivel
              key={rapido ? 'multiplicador' : 'nivel'}
              id="nivel"
              nombre="nivel"
              total={rueda.total}
              max={rueda.max}
              valor={rueda.valor}
              onVista={setVista}
              onElegir={rueda.elegir}
              acento={acento}
            />
          </Medidor>
          <Medidor id="dificultad" titulo="Dificultad" lado="derecha" puntos={dif.max} encendidos={vistaDif} acento={acento}>
            <RuedaNivel
              id="dificultad"
              nombre="dificultad"
              total={dif.max}
              max={dif.max}
              valor={ajusteAbsoluto(datos.ajustes, 'octavas')}
              onVista={setVistaDif}
              onElegir={(n) => guardarAjustes(modo.id, { octavas: n })}
              acento={acento}
            />
          </Medidor>
        </motion.section>

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

/** Color de cada dificultad (1 azul … 5 rojo; variables `--color-dificultad-N` de src/index.css). */
const colorDificultad = (n) => `var(--color-dificultad-${n})`

/**
 * La página entera (fondo de <html> y <body>) se tiñe con el color de la dificultad mientras se ve el arranque;
 * al salir vuelve al fondo de siempre. Fundido de 400 ms al cambiar.
 */
function useFondoTenido(color) {
  useEffect(() => {
    for (const el of [document.documentElement, document.body]) {
      el.style.transition = 'background-color 400ms ease-out'
      el.style.backgroundColor = `color-mix(in oklab, var(--color-fondo) 82%, ${color})`
    }
  }, [color])
  useEffect(
    () => () => {
      for (const el of [document.documentElement, document.body]) el.style.backgroundColor = ''
      setTimeout(() => {
        for (const el of [document.documentElement, document.body]) el.style.transition = ''
      }, 450)
    },
    [],
  )
}

/**
 * Columna de medidor: título y, debajo, la rueda con una columna de puntitos al costado (por fuera) que se
 * encienden de abajo arriba según lo que marca la rueda.
 */
function Medidor({ id, titulo, lado, puntos, encendidos, acento, children }) {
  const columna = <Puntitos total={puntos} encendidos={encendidos} acento={acento} />
  return (
    <div className="flex flex-col items-center gap-3">
      <h2 id={id} className="text-center font-juego text-xl font-semibold uppercase tracking-wide text-zinc-800">
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

/** Puntitos en columna (el primero abajo): los encendidos van del color del acento y dan un pop al encenderse. */
function Puntitos({ total, encendidos, acento }) {
  const grande = total <= 6
  return (
    <div
      className={`flex flex-col-reverse items-center justify-between ${grande ? 'py-6' : 'py-3'}`}
      role="img"
      aria-label={`${encendidos} de ${total}`}
      data-puntitos={total}
      data-encendidos={encendidos}
    >
      {Array.from({ length: total }, (_, i) => {
        const on = i < encendidos
        return (
          <motion.span
            key={i}
            initial={false}
            animate={on ? { scale: [1, 1.5, 1] } : { scale: 0.85 }}
            transition={{ duration: 0.3 }}
            className={`block rounded-full transition-colors duration-200 ${grande ? 'size-3.5' : 'size-2.5'}`}
            style={{ backgroundColor: on ? acento : 'var(--color-zinc-200)' }}
          />
        )
      })}
    </div>
  )
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
                  {/* Lo único que se ajusta de cada modo: cada cuántos aciertos (Rápido) o los segundos (Contrarreloj). */}
                  {actual.multiplicador && (
                    <Contador
                      clave="cadaAciertos"
                      valor={ajusteAbsoluto(datos.ajustes, 'cadaAciertos')}
                      onCambiar={(v) => guardarAjustes(modo.id, { cadaAciertos: v })}
                      unidad={<Check className="size-6" />}
                      etiqueta="aciertos para sumar notas"
                      acento={acento}
                    />
                  )}
                  {actual.segundos && (
                    <Contador
                      clave="segundos"
                      valor={ajusteAbsoluto(datos.ajustes, 'segundos')}
                      onCambiar={(v) => guardarAjustes(modo.id, { segundos: v })}
                      unidad={<span className="font-juego text-xl">s</span>}
                      etiqueta="segundos por nota"
                      acento={acento}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** − valor + con botones redondos de juego (los ajustes de los modos). En los límites, el botón se apaga. */
function Contador({ clave, valor, onCambiar, unidad, etiqueta, acento }) {
  const { min, max } = AJUSTES_ABSOLUTO[clave]
  const [dir, setDir] = useState(1)
  const cambiar = (d) => {
    setDir(d)
    onCambiar(Math.max(min, Math.min(max, valor + d)))
  }
  return (
    <div className="flex items-center gap-4" data-contador={clave}>
      <BotonRedondo onClick={() => cambiar(-1)} disabled={valor <= min} aria-label={`Menos ${etiqueta}`} acento={acento}>
        −
      </BotonRedondo>
      <span className="flex min-w-20 items-center justify-center gap-1" aria-live="polite" aria-label={`${valor} ${etiqueta}`}>
        <span className="grid overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.span
              key={valor}
              initial={{ y: dir * -18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: dir * 18, opacity: 0 }}
              transition={{ ...RESORTE.pulsar, opacity: { duration: 0.12 } }}
              className="col-start-1 row-start-1 font-juego text-4xl leading-none tabular-nums"
              data-valor={valor}
            >
              {valor}
            </motion.span>
          </AnimatePresence>
        </span>
        {unidad}
      </span>
      <BotonRedondo onClick={() => cambiar(1)} disabled={valor >= max} aria-label={`Más ${etiqueta}`} acento={acento}>
        +
      </BotonRedondo>
    </div>
  )
}

function BotonRedondo({ acento, children, ...props }) {
  return (
    <Pulsable
      className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-zinc-200 bg-white font-juego text-3xl leading-none transition-opacity duration-200 disabled:opacity-40"
      style={{ boxShadow: RELIEVE, color: tinta(acento) }}
      {...props}
    >
      {children}
    </Pulsable>
  )
}

// ---------------------------------------------------------------------------
// Rueda de nivel (vertical, el 1 abajo): se desliza con el dedo (lo sigue 1:1 tras una zona muerta corta), al soltar
// se asienta en el más cercano (con la inercia del gesto) y con goma en los extremos. Encima del último desbloqueado
// asoma el siguiente con candado (no se puede elegir). Tocar un nivel que se ve lo elige; flechas ↑ ↓ también.
// ---------------------------------------------------------------------------

const ALTO_ITEM = 68
const ZONA_MUERTA = 8
const INERCIA_MS = 160

function RuedaNivel({ id, nombre, total, max, valor, onVista, onElegir, acento }) {
  const ultimo = Math.max(0, Math.min(total, max) - 1) // índice del último que se puede elegir
  const vistos = Math.min(total, max + 1) // + el siguiente con candado
  const pos = useMotionValue(valor - 1)
  const anim = useRef(null)
  const gesto = useRef(null)
  const caja = useRef(null)
  const [actual, setActual] = useState(valor - 1)

  // Al montarse (p. ej. al pasar de nivel a multiplicador), la cajita toma el valor de esta rueda.
  useEffect(() => {
    onVista(valor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMotionValueEvent(pos, 'change', (v) => {
    const k = Math.max(0, Math.min(ultimo, Math.round(v)))
    setActual(k)
    onVista(k + 1)
  })

  const ir = (k) => {
    const destino = Math.max(0, Math.min(ultimo, k))
    anim.current?.stop()
    anim.current = animate(pos, destino, RESORTE.pantalla)
    if (destino + 1 !== valor) onElegir(destino + 1)
  }

  // Si el nivel cambia por fuera (p. ej. se desbloquea uno), la rueda va a él.
  useEffect(() => {
    if (gesto.current) return
    if (Math.round(pos.get()) !== valor - 1) {
      anim.current?.stop()
      anim.current = animate(pos, valor - 1, RESORTE.pantalla)
    }
  }, [valor, pos])

  const goma = (v) => {
    if (v > ultimo) return ultimo + 0.6 * (1 - 1 / (1 + (v - ultimo) * 0.9))
    if (v < 0) return -0.6 * (1 - 1 / (1 + -v * 0.9))
    return v
  }

  const abajo = (e) => {
    anim.current?.stop()
    gesto.current = { y0: e.clientY, p0: pos.get(), movido: false, muestras: [{ t: e.timeStamp, y: e.clientY }] }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const mueve = (e) => {
    const g = gesto.current
    if (!g) return
    const dy = e.clientY - g.y0
    if (!g.movido && Math.abs(dy) < ZONA_MUERTA) return
    if (!g.movido) {
      g.movido = true
      g.y0 += Math.sign(dy) * ZONA_MUERTA // desde aquí sigue al dedo 1:1, sin salto
    }
    g.muestras.push({ t: e.timeStamp, y: e.clientY })
    if (g.muestras.length > 6) g.muestras.shift()
    // Dedo hacia abajo = sube el nivel (los niveles altos están arriba).
    pos.set(goma(g.p0 + (e.clientY - g.y0) / ALTO_ITEM))
  }
  const suelta = (e) => {
    const g = gesto.current
    gesto.current = null
    if (!g) return
    if (!g.movido) {
      // Toque: elige el nivel que está bajo el dedo.
      const r = caja.current.getBoundingClientRect()
      const k = Math.round(pos.get() - (e.clientY - (r.top + r.height / 2)) / ALTO_ITEM)
      ir(k)
      return
    }
    const a = g.muestras[0]
    const b = g.muestras[g.muestras.length - 1]
    const v = b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0 // px/ms
    ir(Math.round(pos.get() + (v * INERCIA_MS) / ALTO_ITEM))
  }

  const tecla = (e) => {
    if (e.key === 'ArrowUp') ir(actual + 1)
    else if (e.key === 'ArrowDown') ir(actual - 1)
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={caja}
      role="slider"
      tabIndex={0}
      aria-labelledby={id}
      aria-orientation="vertical"
      aria-valuemin={1}
      aria-valuemax={ultimo + 1}
      aria-valuenow={actual + 1}
      data-rueda-nivel={nombre}
      data-posicion={actual + 1}
      onPointerDown={abajo}
      onPointerMove={mueve}
      onPointerUp={suelta}
      onPointerCancel={suelta}
      onKeyDown={tecla}
      className="relative h-56 w-28 shrink-0 cursor-grab touch-none select-none rounded-3xl border-2 border-zinc-200 bg-white outline-none focus-visible:ring-4 focus-visible:ring-sky-300 active:cursor-grabbing"
      style={{ boxShadow: RELIEVE }}
    >
      {/* Ranura del elegido: del color del modo, como el marcador de un selector de nivel. */}
      <div
        className="pointer-events-none absolute inset-x-1.5 top-1/2 rounded-2xl"
        style={{ height: ALTO_ITEM, marginTop: -ALTO_ITEM / 2, backgroundColor: claro(acento) }}
        aria-hidden
      />
      <div
        className="absolute inset-0 overflow-hidden rounded-[1.375rem]"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)',
        }}
      >
        {Array.from({ length: vistos }, (_, i) => (
          <ItemRueda key={i} i={i} pos={pos} bloqueado={i > ultimo} acento={acento} />
        ))}
      </div>
    </div>
  )
}

function ItemRueda({ i, pos, bloqueado, acento }) {
  const y = useTransform(pos, (p) => (p - i) * ALTO_ITEM)
  const distancia = useTransform(pos, (p) => Math.abs(p - i))
  const scale = useTransform(distancia, [0, 1, 2], [1, 0.72, 0.55])
  const opacity = useTransform(distancia, [0, 1, 2.2], [1, 0.45, 0])
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-1/2 grid place-items-center"
      style={{ height: ALTO_ITEM, marginTop: -ALTO_ITEM / 2, y, scale, opacity, color: tinta(acento) }}
      data-nivel={i + 1}
    >
      {bloqueado ? <Candado className="size-9 text-zinc-400" /> : <span className="font-juego text-5xl leading-none">{i + 1}</span>}
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
