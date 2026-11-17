// Experiencia (XP) a la vista: el hook de la partida (cada acierto suma y se apunta en el libro), la píldora de la
// sesión con el «+N» que sube en cada acierto, el desglose (de dónde salió), la insignia del nivel de jugador en Inicio
// con su hoja, y la celebración al subir de nivel. Los números están en progress/xp.js.
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { AREAS_CONOCIMIENTO } from '../content/areas.js'
import { tiendaOido } from '../progress/oido.js'
import { useOpciones } from '../progress/opciones.js'
import { tiendaRitmo } from '../progress/ritmo.js'
import { tiendaVocab } from '../progress/vocabulario.js'
import {
  TITULOS,
  XP,
  bonoNuevo,
  calcularXP,
  cansado,
  factorCombo,
  marcarNivelVisto,
  nivelVisto,
  redondearPartes,
  sumarSegundos,
  sumarXP,
} from '../progress/xp.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import Hoja from '../ui/Hoja.jsx'
import { claro, tinta } from '../ui/color.js'
import { Candado, Check } from '../ui/Iconos.jsx'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO_PANEL } from '../ui/vidrio.js'
import { useXP } from './useXP.js'

/** Tiempo máximo que cuenta por respuesta para el cansancio (como el reloj de práctica). */
const MAX_SEGUNDOS = 25
/** Nombre y color de cada área de XP. */
export const AREA_XP = {
  ...Object.fromEntries(Object.entries(AREAS_CONOCIMIENTO).map(([id, a]) => [id, { nombre: a.nombre, color: a.acento }])),
  general: { nombre: 'Constancia y camino', color: 'var(--color-neutro)' },
}

const sumarPartes = (a, b) => {
  const r = { ...a }
  for (const [k, v] of Object.entries(b)) r[k] = (r[k] ?? 0) + v
  return r
}

/**
 * La XP de una partida (oído, ritmo, vocabulario). `fuente` = 'oido' | 'ritmo' | 'vocab' (para los bonos del día).
 *  - empezar(): al empezar la partida (desglose a 0, combo a 0).
 *  - apuntar({ bien, clave, area, base, extras, factores, metaCumplida }) en cada respuesta: suma el tiempo al
 *    cansancio, calcula la XP (con combo y cansancio), la anota en el libro, añade los bonos del día y devuelve la XP
 *    ganada. En modo administrador no da XP.
 *  - logro(nombre, xp, { area, guardar }): algo que sale en el desglose (con `guardar`, también va al libro; sin él es
 *    de la XP fija, que ya se cuenta sola: aprobar un nivel, por ejemplo).
 *  - total, partes (para el desglose) y ultimo ({ n, xp }: el «+N» que sube).
 */
export function useXPPartida(fuente) {
  const { admin } = useOpciones()
  const [sesion, setSesion] = useState({ total: 0, partes: {}, ultimo: null })
  const ref = useRef({ seguidos: 0, t: null, n: 0 })

  const anotar = (xp, partes) => {
    if (!xp) return
    ref.current.n += 1
    const ultimo = { n: ref.current.n, xp }
    setSesion((s) => ({ total: s.total + xp, partes: sumarPartes(s.partes, partes), ultimo }))
  }

  const empezar = () => {
    ref.current = { seguidos: 0, t: Date.now(), n: ref.current.n }
    setSesion({ total: 0, partes: {}, ultimo: null })
  }

  const logro = (nombre, xp, { area = 'general', guardar = false } = {}) => {
    if (admin || !xp) return 0
    if (guardar) sumarXP(area, xp)
    anotar(xp, { [nombre]: xp })
    return xp
  }

  const apuntar = ({ bien, clave, area, base, extras = [], factores = [], metaCumplida = false, racha = 0 }) => {
    const ahora = Date.now()
    const s = ref.current.t ? Math.min(MAX_SEGUNDOS, (ahora - ref.current.t) / 1000) : 5
    ref.current.t = ahora
    const antes = sumarSegundos(`${fuente}:${clave}`, s)
    if (admin) return 0
    ref.current.seguidos = bien ? ref.current.seguidos + 1 : 0
    let ganado = 0
    let partes = {}
    if (bien) {
      const todos = [...factores, { nombre: 'Combo', f: factorCombo(ref.current.seguidos) }]
      if (cansado(antes)) todos.push({ nombre: 'Cansancio', f: XP.cansancio.factor })
      const r = calcularXP({ base, extras, factores: todos })
      sumarXP(area, r.xp)
      ganado += r.xp
      partes = r.partes
    }
    // Constancia: los 5 minutos de hoy (+ la racha) y los tres entrenamientos el mismo día (una vez al día).
    if (metaCumplida && bonoNuevo(`meta:${fuente}`)) {
      sumarXP('general', XP.dia.meta)
      partes['5 minutos de hoy'] = XP.dia.meta
      ganado += XP.dia.meta
      const bonoRacha = Math.min(XP.dia.rachaMax, XP.dia.racha * racha)
      if (bonoRacha > 0) {
        sumarXP('general', bonoRacha)
        partes[`Racha de ${racha} ${racha === 1 ? 'día' : 'días'}`] = bonoRacha
        ganado += bonoRacha
      }
    }
    const tres = [tiendaOido, tiendaRitmo, tiendaVocab].every((t) => t.datosDeHoy().respuestas > 0)
    if (tres && bonoNuevo('tres')) {
      sumarXP('general', XP.dia.tres)
      partes['Los tres entrenamientos hoy'] = XP.dia.tres
      ganado += XP.dia.tres
    }
    anotar(ganado, partes)
    return ganado
  }

  return { ...sesion, empezar, apuntar, logro }
}

/** «+13»: sube desde la píldora y se desvanece (una vez por acierto). */
function Chispa({ ultimo, acento }) {
  return (
    // initial={false}: al volver a montarse (cada pregunta nueva) no repite el «+N» de la anterior.
    <AnimatePresence initial={false}>
      {ultimo && (
        <motion.span
          key={ultimo.n}
          data-chispa-xp={Math.round(ultimo.xp)}
          aria-hidden
          className="pointer-events-none absolute -top-1 right-2 font-juego text-lg font-semibold tabular-nums"
          style={{ color: tinta(acento) }}
          initial={{ y: 4, opacity: 0, scale: 0.8 }}
          animate={{ y: -26, opacity: [0, 1, 1, 0], scale: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut', opacity: { times: [0, 0.15, 0.6, 1], duration: 1.1 } }}
        >
          +{Math.round(ultimo.xp)}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/**
 * Píldora de la XP de la partida (en la fila de arriba del entrenador): «124 XP» en la tinta del área, con el «+N» que
 * sube en cada acierto. Tocarla abre el desglose.
 */
export function PildoraXP({ sesion, acento }) {
  const [abierta, setAbierta] = useState(false)
  const total = Math.round(sesion.total)
  return (
    <>
      <span className="relative shrink-0">
        <Pulsable
          onClick={() => setAbierta(true)}
          data-xp-sesion={total}
          aria-label={`${total} XP en esta partida: ver de dónde salió`}
          className="grid h-11 min-w-11 place-items-center rounded-full px-3 font-juego text-base font-semibold tabular-nums"
          style={{ backgroundColor: claro(acento), color: tinta(acento) }}
        >
          {total} XP
        </Pulsable>
        <Chispa ultimo={sesion.ultimo} acento={acento} />
      </span>
      <Hoja abierta={abierta} onCerrar={() => setAbierta(false)} etiqueta="Experiencia de la partida">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Esta partida</p>
          <h2 className="font-juego text-4xl font-semibold tabular-nums" style={{ color: tinta(acento) }}>
            +{total} XP
          </h2>
        </div>
        <DesgloseXP partes={sesion.partes} total={sesion.total} />
      </Hoja>
    </>
  )
}

/**
 * De dónde salió la XP: una fila por cosa (aciertos, dificultad, modo, combo, cansancio, logros…), con su valor en
 * `font-dato`; lo que resta, en gris con «−». Las partes redondeadas suman el total.
 */
export function DesgloseXP({ partes, total }) {
  const filas = redondearPartes(partes, total)
  if (!filas.length) return <p className="text-base text-zinc-500">Aún no hay XP en esta partida.</p>
  return (
    <ul className="flex flex-col divide-y divide-zinc-200 rounded-3xl border border-zinc-200 bg-white" data-desglose-xp>
      {filas.map((f) => (
        <li key={f.nombre} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2" data-parte-xp={f.nombre}>
          <span className="text-base text-zinc-700">{f.nombre}</span>
          <span className={`font-dato text-base font-medium tabular-nums ${f.xp < 0 ? 'text-zinc-500' : 'text-zinc-900'}`}>
            {f.xp < 0 ? `−${-f.xp}` : `+${f.xp}`}
          </span>
        </li>
      ))}
      <li className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
        <span className="text-base font-bold">Total</span>
        <span className="font-dato text-lg font-medium tabular-nums">+{Math.round(total)} XP</span>
      </li>
    </ul>
  )
}

/**
 * Tarjeta «+186 XP» del final (fin de partida, fin de lección): toda tocable; al tocarla se despliega el desglose (la
 * flechita ⌄ gira).
 */
export function TarjetaXP({ total, partes, acento, relieve = true }) {
  const [abierta, setAbierta] = useState(false)
  if (!(total > 0)) return null
  return (
    <div className="flex w-full flex-col gap-3">
      <Pulsable
        tipo="tarjeta"
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        data-tarjeta-xp={Math.round(total)}
        className="flex min-h-16 w-full items-center justify-between gap-3 rounded-3xl border-2 border-zinc-200 bg-white px-5 py-3"
        style={relieve ? { boxShadow: '0 5px 0 var(--color-zinc-200)' } : undefined}
      >
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Experiencia</span>
        <span className="flex items-center gap-2">
          <span className="font-juego text-3xl font-semibold tabular-nums" style={{ color: tinta(acento) }}>
            +{Math.round(total)} XP
          </span>
          <motion.span aria-hidden className="text-xl text-zinc-400" animate={{ rotate: abierta ? 180 : 0 }} transition={RESORTE.pulsar}>
            ⌄
          </motion.span>
        </span>
      </Pulsable>
      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={RESORTE.suave} className="text-left">
            <DesgloseXP partes={partes} total={total} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Anillo de avance del nivel con el número dentro (insignia de Inicio y hoja). */
function AnilloNivel({ nivel, avance, tam = 36, grosor = 4, clase = 'text-base' }) {
  const r = (tam - grosor) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: tam, height: tam }}>
      <svg width={tam} height={tam} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" strokeWidth={grosor} style={{ stroke: 'var(--color-zinc-200)' }} />
        <motion.circle
          cx={tam / 2}
          cy={tam / 2}
          r={r}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ stroke: 'var(--color-zinc-900)' }}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - avance) }}
          transition={RESORTE.suave}
        />
      </svg>
      <span className={`relative font-juego font-semibold tabular-nums ${clase}`}>{nivel}</span>
    </span>
  )
}

/**
 * Insignia del nivel de jugador (Inicio, arriba a la derecha): anillo con el nivel + el título. Abre la hoja con la
 * XP, el avance al siguiente nivel, la XP por área y los títulos.
 */
export function InsigniaNivel() {
  const xp = useXP()
  const [abierta, setAbierta] = useState(false)
  const { nivel, avance, titulo } = xp.nivel
  return (
    <>
      <Pulsable
        onClick={() => setAbierta(true)}
        data-insignia-nivel={nivel}
        aria-label={`Nivel ${nivel}, ${titulo}: ${xp.total} XP`}
        className="flex h-11 items-center gap-2 rounded-full border-2 border-zinc-200 bg-white pl-1 pr-3.5"
        style={{ boxShadow: '0 3px 0 var(--color-zinc-200)' }}
      >
        <AnilloNivel nivel={nivel} avance={avance} />
        <span className="font-juego text-base font-semibold">{titulo}</span>
      </Pulsable>
      <Hoja abierta={abierta} onCerrar={() => setAbierta(false)} etiqueta="Tu nivel">
        <PanelNivel xp={xp} />
      </Hoja>
    </>
  )
}

/** Lo de la hoja del nivel (también sirve en Configuración › Tu progreso). */
export function PanelNivel({ xp }) {
  const { nivel, avance, enNivel, paraSiguiente, titulo, siguienteTitulo } = xp.nivel
  const areas = Object.entries(xp.porArea).filter(([, v]) => v > 0)
  const suma = areas.reduce((s, [, v]) => s + v, 0)
  return (
    <div className="flex flex-col gap-5" data-panel-nivel={nivel}>
      <div className="flex items-center gap-4">
        <AnilloNivel nivel={nivel} avance={avance} tam={76} grosor={7} clase="text-3xl" />
        <div className="flex min-w-0 flex-col">
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Nivel {nivel}</p>
          <h2 className="font-juego text-3xl font-semibold uppercase leading-tight tracking-wide">{titulo}</h2>
          <p className="font-dato text-base font-medium tabular-nums text-zinc-500">
            {xp.total} XP · hoy +{xp.hoy}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <BarraProgreso valor={avance} color="var(--color-zinc-900)" alto="h-3" />
        <p className="font-dato text-sm font-medium tabular-nums text-zinc-500">
          {enNivel} / {paraSiguiente} XP para el nivel {nivel + 1}
        </p>
      </div>

      {suma > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="px-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">Por área</h3>
          <div className="flex h-3 overflow-hidden rounded-full bg-zinc-200" aria-hidden>
            {areas.map(([a, v]) => (
              <motion.span key={a} className="h-full" style={{ backgroundColor: AREA_XP[a].color }} initial={{ width: 0 }} animate={{ width: `${(v / suma) * 100}%` }} transition={RESORTE.suave} />
            ))}
          </div>
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-3xl border border-zinc-200 bg-white">
            {areas.map(([a, v]) => (
              <li key={a} className="flex min-h-12 items-center gap-3 px-4 py-2" data-xp-area={a}>
                <span className="size-3 shrink-0 rounded-[4px]" style={{ backgroundColor: AREA_XP[a].color }} aria-hidden />
                <span className="flex-1 text-base font-semibold" style={{ color: a === 'general' ? undefined : tinta(AREA_XP[a].color) }}>
                  {AREA_XP[a].nombre}
                </span>
                <span className="font-dato text-base font-medium tabular-nums">{v} XP</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="px-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">Títulos</h3>
        <ul className="flex flex-col divide-y divide-zinc-200 rounded-3xl border border-zinc-200 bg-white">
          {TITULOS.map((t) => {
            const tuyo = nivel >= t.desde
            const actual = t.nombre === titulo
            return (
              <li key={t.nombre} className="flex min-h-12 items-center gap-3 px-4 py-2" data-titulo={t.nombre} data-actual={actual || undefined}>
                <span className={`grid size-8 shrink-0 place-items-center rounded-full ${tuyo ? 'bg-bien-relleno text-blanco' : 'bg-zinc-100 text-zinc-400'}`}>
                  {tuyo ? <Check className="size-4" grosor={3} /> : <Candado className="size-4" />}
                </span>
                <span className={`flex-1 font-juego text-lg ${tuyo ? '' : 'text-zinc-500'} ${actual ? 'font-semibold' : ''}`}>{t.nombre}</span>
                <span className="font-dato text-sm font-medium tabular-nums text-zinc-500">Nivel {t.desde}</span>
              </li>
            )
          })}
        </ul>
        {siguienteTitulo && <p className="px-1 text-sm text-zinc-500">Siguiente título en el nivel {siguienteTitulo.desde}.</p>}
      </section>
    </div>
  )
}

/**
 * Celebración al subir de nivel de jugador (en toda la app): un panel de vidrio baja desde arriba con el nivel y el
 * título, y se va solo. La primera vez solo apunta el nivel que ya traías (no celebra lo de antes).
 */
export function CelebracionNivel() {
  const xp = useXP()
  const { nivel, titulo } = xp.nivel
  const [mostrar, setMostrar] = useState(null)
  useEffect(() => {
    const visto = nivelVisto()
    if (visto === null || nivel < visto) return marcarNivelVisto(nivel)
    if (nivel > visto) {
      marcarNivelVisto(nivel)
      const nuevoTitulo = TITULOS.some((t) => t.desde === nivel)
      setMostrar({ nivel, titulo, nuevoTitulo })
    }
  }, [nivel, titulo])
  useEffect(() => {
    if (!mostrar) return
    const t = setTimeout(() => setMostrar(null), 3200)
    return () => clearTimeout(t)
  }, [mostrar])
  return (
    <AnimatePresence>
      {mostrar && (
        <motion.div
          key={mostrar.nivel}
          role="status"
          data-subio-nivel={mostrar.nivel}
          className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 64px)' }}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={RESORTE.pantalla}
        >
          <div className={`pointer-events-auto flex items-center gap-3 rounded-3xl py-3 pl-3 pr-5 ${VIDRIO_PANEL}`} onClick={() => setMostrar(null)}>
            <motion.span
              className="grid size-14 place-items-center rounded-2xl bg-zinc-900 font-juego text-3xl font-semibold text-white"
              style={{ boxShadow: '0 5px 0 var(--color-zinc-400)' }}
              initial={{ scale: 0.4, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 12, delay: 0.1 }}
            >
              {mostrar.nivel}
            </motion.span>
            <div className="flex flex-col">
              {/* Sin «¡!»: en la fuente pixelada el «¡» parece una «i». */}
              <span className="font-juego text-2xl font-semibold uppercase tracking-wide">Nivel {mostrar.nivel}</span>
              <span className="text-base font-semibold text-zinc-600">{mostrar.nuevoTitulo ? `Nuevo título: ${mostrar.titulo}` : `Subiste de nivel · ${mostrar.titulo}`}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
