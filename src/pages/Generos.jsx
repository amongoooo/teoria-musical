import { motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { pararProgramado } from '../audio/engine.js'
import { reproducir } from '../audio/sonido.js'
import BotonSonido, { IconoPlay } from '../components/BotonSonido.jsx'
import ChannelRack from '../components/ChannelRack.jsx'
import Rich from '../components/Rich.jsx'
import { codigoLeccion } from '../content/index.js'
import { cuentaGeneros, dominado, marcarPrueba, pasoPrueba, usarGeneros } from '../progress/generos.js'
import { useOpciones } from '../progress/opciones.js'
import { useProgreso } from '../progress/progreso.js'
import { tiendaRitmo } from '../progress/ritmo.js'
import { navegar, rutas } from '../router.js'
import {
  PARA_PASAR,
  RONDAS_RECONOCE,
  TRONCOS,
  estadoGenero,
  filasDeGenero,
  generoAbierto,
  nivelesDe,
  nombreCorto,
  opcionesReconoce,
  patronDePartida,
  rondasReconoce,
  seAbrenCon,
} from '../theory/generos.js'
import { GENEROS, PASOS, avisoRack, cambiosPatron, comparar, marcasRack, normalizar, sonidoGenero } from '../theory/rack.js'
import { Atras, Bombilla, Candado, Check } from '../ui/Iconos.jsx'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'
import { BarraAccion } from './Leccion.jsx'

const ACENTO = 'var(--color-produccion)'
/** Cuánto dura el contorno de oro de lo que cambió (ms). */
const DURA_CAMBIO = 1300
/** Id del «modo» en las estadísticas del ritmo (racha y minutos del día; no tiene niveles). */
const MODO = 'generos'

// Lo que se recuerda mientras la app está abierta: el tronco y el género elegidos (al volver de una prueba) y el
// género que se acaba de dominar (para el destello en oro de sus hijos).
const recuerdo = { tronco: 'pop', sel: 'pop', recien: null }

/**
 * ÁRBOL DE GÉNEROS (#/generos; Entrenar › Ritmo, se abre con la P1.2; propuesta aprobada:
 * https://claude.ai/artifact/DMYBitpKtAtAoQ6fx8yfqE). Un tronco a la vez (Pop · Boom bap · House · Dembow), del tronco
 * hacia abajo; cada género se DOMINA con tres pruebas (Escúchalo en la ficha, Reconócelo y Prográmalo en
 * #/generos/ID/reconoce | programa) y al dominarlo se abren sus hijos.
 */
export default function Generos({ id = null }) {
  const [genero, prueba] = String(id ?? '').split('/')
  if (GENEROS[genero] && prueba === 'reconoce') return <Reconocelo id={genero} />
  if (GENEROS[genero] && prueba === 'programa') return <Programalo id={genero} />
  return <Arbol />
}

/** Estado de cada género (con el progreso, el modo administrador y lo dominado). */
function useEstados() {
  const datos = usarGeneros()
  const progreso = useProgreso()
  const { admin } = useOpciones()
  return useMemo(() => {
    const domina = (x) => dominado(x, datos)
    const ctx = { domina, progreso, admin }
    const estados = Object.fromEntries(Object.keys(GENEROS).map((x) => [x, estadoGenero(x, ctx)]))
    return { datos, estados, ctx }
  }, [datos, progreso, admin])
}

// ---------------------------------------------------------------------------
// El árbol
// ---------------------------------------------------------------------------

function Arbol() {
  const { datos, estados, ctx } = useEstados()
  const [tronco, setTronco] = useState(recuerdo.tronco)
  const [sel, setSel] = useState(GENEROS[recuerdo.sel]?.tronco === recuerdo.tronco ? recuerdo.sel : recuerdo.tronco)
  // Recién abiertos (destello en oro) y el aviso de «¡Dominado!».
  const [recien, setRecien] = useState(() => recuerdo.recien?.abiertos ?? [])
  const [logro, setLogro] = useState(() => recuerdo.recien)
  useEffect(() => {
    recuerdo.recien = null
  }, [])
  useEffect(() => {
    recuerdo.tronco = tronco
    recuerdo.sel = sel
  }, [tronco, sel])

  const { total, dominados } = cuentaGeneros(datos)

  const elegirTronco = (t) => {
    setTronco(t)
    setSel(t)
    setLogro(null)
  }
  const alDominar = (x, abiertos) => {
    setRecien(abiertos)
    setLogro({ id: x, abiertos })
  }

  return (
    <motion.main variants={lista} initial="oculta" animate="visible" className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-5 px-4 pt-4 pb-16 sm:px-5 sm:pt-8" data-arbol-generos>
      <motion.header variants={itemLista} className="flex items-center gap-3">
        <Pulsable href={rutas.practicar('ritmo')} aria-label="Volver a Entrenar" className={`grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}>
          <Atras className="size-6" />
        </Pulsable>
        <div className="flex min-w-0 flex-col">
          <h1 className="font-titulo text-3xl font-bold leading-tight tracking-tight">Árbol de géneros</h1>
          <span className="font-dato text-sm font-medium tabular-nums text-zinc-500" data-dominados={dominados}>
            {dominados}/{total} dominados
          </span>
        </div>
      </motion.header>

      <motion.div variants={itemLista}>
        <SelectorTronco actual={tronco} onCambiar={elegirTronco} estados={estados} />
      </motion.div>

      <motion.section variants={itemLista} className="flex flex-col gap-5 rounded-[1.75rem] border border-zinc-200 bg-white px-2 pt-5 pb-4" aria-label={`Tronco ${GENEROS[tronco].nombre}`}>
        <Ramas key={`ramas-${tronco}`} tronco={tronco} estados={estados} datos={datos} sel={sel} onElegir={(x) => (setSel(x), setLogro(null))} recien={recien} />
        <Ficha key={`ficha-${sel}`} id={sel} estado={estados[sel]} estados={estados} datos={datos} ctx={ctx} onDominar={alDominar} logro={logro?.id === sel ? logro : null} />
      </motion.section>
    </motion.main>
  )
}

/** Pop · Boom bap · House · Dembow: control segmentado de superficie (la marca blanca se desliza con un resorte). */
function SelectorTronco({ actual, onCambiar, estados }) {
  return (
    <div role="tablist" aria-label="Troncos" className="grid grid-cols-4 gap-1 rounded-full bg-zinc-100 p-1">
      {TRONCOS.map((t) => {
        const activo = t === actual
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={activo}
            data-tronco={t}
            onClick={() => !activo && onCambiar(t)}
            className={`relative flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-1 text-base font-semibold leading-tight transition-colors ${activo ? 'text-zinc-900' : 'text-zinc-600'}`}
            style={{ touchAction: 'manipulation' }}
          >
            {activo && <motion.span layoutId="marca-tronco" className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-zinc-300" transition={RESORTE.pulsar} />}
            <span className="relative">{GENEROS[t].nombre}</span>
            {/* Tronco dominado: ✓ verde pequeño en la esquina (no le quita sitio al nombre). */}
            {estados[t] === 'dominado' && (
              <span className="absolute -top-2 -right-1 grid size-[1.125rem] place-items-center rounded-full bg-bien-relleno text-blanco ring-2 ring-zinc-100" data-tronco-dominado>
                <Check className="size-3" grosor={3.2} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Las ramas de un tronco: filas de nodos unidas por líneas (verdes desde un padre dominado). */
function Ramas({ tronco, estados, datos, sel, onElegir, recien }) {
  const niveles = nivelesDe(tronco)
  const caja = useRef(null)
  const [lineas, setLineas] = useState([])

  // Las líneas se miden después de pintar (y al cambiar el tamaño): del borde de abajo del padre al de arriba del hijo.
  useLayoutEffect(() => {
    const el = caja.current
    if (!el) return
    const medir = () => {
      const r = el.getBoundingClientRect()
      const bola = (x) => el.querySelector(`[data-genero="${x}"] [data-bola]`)?.getBoundingClientRect()
      // La línea sale de debajo del NOMBRE del padre (no lo cruza) y llega a la bola del hijo.
      const nodo = (x) => el.querySelector(`[data-genero="${x}"]`)?.getBoundingClientRect()
      const fuera = []
      for (const fila of niveles.slice(1))
        for (const h of fila)
          for (const p of GENEROS[h].padres ?? []) {
            const b = bola(h)
            if (!b) continue
            const x2 = b.left + b.width / 2 - r.left
            const y2 = b.top - r.top - 2
            const a = GENEROS[p].tronco === tronco ? nodo(p) : null
            if (a) {
              const x1 = a.left + a.width / 2 - r.left
              const y1 = a.bottom - r.top + 3
              const m = (y1 + y2) / 2
              fuera.push({ id: `${p}-${h}`, d: `M${x1} ${y1} C${x1} ${m} ${x2} ${m} ${x2} ${y2}`, vivo: estados[p] === 'dominado', otro: false })
            } else {
              // Padre de otro tronco (moombahton ← house): línea punteada que entra desde la esquina.
              fuera.push({ id: `${p}-${h}`, d: `M${r.width - 4} 4 C${r.width - 4} ${y2 / 2} ${x2} ${y2 / 2} ${x2} ${y2}`, vivo: estados[p] === 'dominado', otro: true })
            }
          }
      setLineas(fuera)
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [tronco, estados]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={caja} className="relative flex flex-col gap-9" data-ramas={tronco}>
      <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
        {lineas.map((l) => (
          <path
            key={l.id}
            d={l.d}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={l.otro ? '4 6' : undefined}
            data-linea={l.id}
            data-viva={l.vivo || undefined}
            style={{ stroke: l.vivo ? 'var(--color-bien)' : 'var(--color-zinc-300)', transition: 'stroke 300ms' }}
          />
        ))}
      </svg>
      {niveles.map((fila, k) => (
        <div key={k} className="relative flex justify-center gap-1.5">
          {fila.map((x) => (
            <Nodo key={x} id={x} estado={estados[x]} bits={datos.pruebas[x] ?? 0} sel={x === sel} nuevo={recien.includes(x)} onClick={() => onElegir(x)} />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Un género del árbol: la «bola» y su nombre. Dominado = verde con ✓; abierto = contorno coral con su BPM y tres
 * puntitos (las pruebas); bloqueado = gris con candado; necesita una lección = punteado con su código. Elegido =
 * anillo oscuro y un poco más grande. Recién abierto = destello en oro.
 */
function Nodo({ id, estado, bits, sel, nuevo, onClick }) {
  const g = GENEROS[id]
  const reducir = useReducedMotion()
  const dos = (g.padres?.length ?? 0) > 1
  const etiquetaEstado = { dominado: 'dominado', abierto: 'abierto', bloqueado: 'bloqueado', leccion: `se abre con la ${codigoLeccion(g.leccion ?? '')}` }[estado]
  return (
    <Pulsable
      onClick={onClick}
      data-genero={id}
      data-estado={estado}
      data-sel={sel || undefined}
      aria-pressed={sel}
      aria-label={`${g.nombre}: ${etiquetaEstado}`}
      className="flex w-[5.25rem] min-w-0 flex-col items-center gap-1.5"
    >
      <motion.span
        data-bola
        className={`relative grid size-14 place-items-center rounded-[1.125rem] ${
          estado === 'dominado'
            ? 'bg-bien-relleno text-blanco'
            : estado === 'abierto'
              ? 'border-[3px] bg-white'
              : estado === 'leccion'
                ? 'border-2 border-dashed border-zinc-300 bg-white text-zinc-500'
                : 'bg-zinc-100 text-zinc-500'
        } ${sel ? 'ring-[3px] ring-zinc-900 ring-offset-2 ring-offset-white' : ''}`}
        style={estado === 'abierto' ? { borderColor: ACENTO } : undefined}
        initial={false}
        animate={nuevo && !reducir ? { scale: [0.6, 1.15, 1], boxShadow: ['0 0 0 0px var(--color-fijate)', '0 0 0 10px transparent', '0 0 0 0px transparent'] } : { scale: sel ? 1.08 : 1 }}
        transition={nuevo ? { duration: 1.1, ease: 'easeOut' } : RESORTE.pulsar}
      >
        {estado === 'dominado' && <Check className="size-7" />}
        {estado === 'bloqueado' && <Candado className="size-6" />}
        {estado === 'leccion' && <span className="font-dato text-sm font-medium">{codigoLeccion(g.leccion)}</span>}
        {estado === 'abierto' && (
          <>
            <span className="-mt-2 font-dato text-sm font-medium tabular-nums text-zinc-700">{g.bpm}</span>
            <span className="absolute bottom-2 flex gap-1" aria-hidden>
              {[1, 2, 4].map((b) => (
                <span key={b} className={`size-2 rounded-full ${bits & b ? 'bg-bien' : 'bg-zinc-200'}`} />
              ))}
            </span>
          </>
        )}
        {dos && (
          <span className="absolute -top-2 -right-2 rounded-full bg-fijate px-1.5 font-dato text-xs font-medium leading-5 text-negro" aria-hidden>
            2
          </span>
        )}
      </motion.span>
      <span className={`line-clamp-2 text-center text-sm font-bold leading-tight ${estado === 'bloqueado' || estado === 'leccion' ? 'text-zinc-500' : 'text-zinc-900'}`}>{nombreCorto(id)}</span>
    </Pulsable>
  )
}

// ---------------------------------------------------------------------------
// La ficha del género elegido (y la prueba «Escúchalo»)
// ---------------------------------------------------------------------------

const NOMBRES_PRUEBA = [
  { id: 'escucha', nombre: 'Escúchalo', meta: 'una vuelta' },
  { id: 'reconoce', nombre: 'Reconócelo', meta: `${PARA_PASAR} de ${RONDAS_RECONOCE}` },
  { id: 'programa', nombre: 'Prográmalo', meta: 'de oído' },
]

function Ficha({ id, estado, estados, datos, ctx, onDominar, logro }) {
  const g = GENEROS[id]
  const abierto = generoAbierto(estado)
  const padres = g.padres ?? []

  const escuchado = () => {
    if (!abierto || pasoPrueba(id, 'escucha', datos)) return
    const abiertos = pasar(id, 'escucha', ctx)
    if (abiertos) onDominar(id, abiertos)
  }

  return (
    <div className="flex flex-col gap-4 border-t border-zinc-200 px-2 pt-4" data-ficha={id}>
      <div className="flex flex-col gap-0.5">
        <h2 className="font-titulo text-2xl font-bold leading-tight tracking-tight">{g.nombre}</h2>
        <p className="font-dato text-sm font-medium text-zinc-500">
          {g.rango}
          {padres.length ? ` · hijo de ${padres.map((p) => GENEROS[p].nombre).join(' y ')}` : ' · tronco'}
        </p>
      </div>
      <p className="flex items-start gap-2.5 text-base leading-snug text-zinc-700" data-cambio-texto>
        <Bombilla className="mt-0.5 size-5 shrink-0 text-fijate-tinta" />
        <span>
          <Rich>{g.cambio}</Rich>
        </span>
      </p>

      <RackTransforma id={id} onEscuchado={escuchado} />

      {logro && (
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={RESORTE.suave} className="flex items-start gap-2.5 rounded-2xl bg-bien-suave px-4 py-3 text-base font-semibold leading-snug text-bien-tinta" data-logro>
          <Check className="mt-0.5 size-5 shrink-0" />
          <span>
            ¡{g.nombre} dominado!
            {logro.abiertos.length ? ` Se abre${logro.abiertos.length > 1 ? 'n' : ''}: ${lista2(logro.abiertos.map((x) => GENEROS[x].nombre))}.` : ''}
          </span>
        </motion.p>
      )}

      {abierto ? (
        <div className="grid grid-cols-3 gap-2" role="list" aria-label="Pruebas para dominarlo">
          {NOMBRES_PRUEBA.map((p) => {
            const ok = pasoPrueba(id, p.id, datos)
            const contenido = (
              <>
                <span className="flex items-center gap-1 text-base font-bold leading-tight">
                  {ok && <Check className="size-4 shrink-0" />}
                  {p.nombre}
                </span>
                <span className={`text-sm leading-tight ${ok ? 'text-bien-tinta' : 'text-zinc-500'}`}>{p.meta}</span>
              </>
            )
            const clase = `flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-2 text-center ${ok ? 'bg-bien-suave text-bien-tinta' : 'bg-zinc-100 text-zinc-900'}`
            return (
              <div key={p.id} role="listitem" data-prueba={p.id} data-ok={ok || undefined}>
                {p.id === 'escucha' ? (
                  <div className={clase}>{contenido}</div>
                ) : (
                  <Pulsable href={`#/generos/${id}/${p.id}`} className={`${clase} border-2 ${ok ? 'border-transparent' : 'border-zinc-200 bg-white'}`}>
                    {contenido}
                  </Pulsable>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="flex items-center gap-2.5 rounded-2xl bg-zinc-100 px-4 py-3 text-base font-semibold text-zinc-600" data-aviso-bloqueo>
          <Candado className="size-5 shrink-0" />
          {estado === 'leccion'
            ? `Se abre con la ${codigoLeccion(g.leccion)}.`
            : g.abre
              ? `Se abre con la ${codigoLeccion(g.abre)}.`
              : `Domina ${lista2(padres.filter((p) => estados[p] !== 'dominado').map((p) => GENEROS[p].nombre))} para abrirlo.`}
        </p>
      )}
    </div>
  )
}

const lista2 = (nombres) => (nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : nombres[0] ?? '')

/**
 * Marca una prueba. Si con ella el género queda dominado, devuelve los géneros que se abren (lista, quizá vacía); si
 * no, null. `ctx` = { progreso, admin } (lo dominado se lee ya con la prueba nueva).
 */
function pasar(id, prueba, ctx) {
  if (!marcarPrueba(id, prueba)) return null
  return seAbrenCon(id, { ...ctx, domina: (x) => dominado(x) })
}

/**
 * El rack de la ficha: empieza con el PADRE y, al reproducir, tras un compás se transforma en el hijo (lo que cambia,
 * en oro, y el tempo nuevo). Un compás entero del hijo = «Escúchalo» cumplida. En un tronco, suena él directo.
 */
function RackTransforma({ id, onEscuchado }) {
  const g = GENEROS[id]
  const padre = g.padres?.[0] ?? null
  const filas = useMemo(() => filasDeGenero(id), [id])
  const [fase, setFase] = useState(padre ? 'padre' : 'hijo')
  const [marcas, setMarcas] = useState(null)
  const cuenta = useRef(0)
  const faseRef = useRef(fase)
  faseRef.current = fase
  const avisar = useRef(onEscuchado)
  avisar.current = onEscuchado
  const borrar = useRef(0)
  useEffect(() => () => clearTimeout(borrar.current), [])

  const actual = fase === 'padre' ? GENEROS[padre] : g
  const patron = useMemo(() => normalizar(actual.patron, filas), [actual, filas])

  const alPaso = useCallback(() => {
    cuenta.current += 1
    if (cuenta.current < PASOS) return
    cuenta.current = 0
    if (faseRef.current === 'padre') {
      const c = cambiosPatron(GENEROS[padre].patron, g.patron, filas)
      setMarcas(Object.fromEntries(Object.keys(c).map((k) => [k, 'cambio'])))
      clearTimeout(borrar.current)
      borrar.current = setTimeout(() => setMarcas(null), DURA_CAMBIO)
      setFase('hijo')
    } else avisar.current?.()
  }, [padre, g, filas])

  return (
    <div className="flex flex-col gap-2" data-rack-genero={id} data-fase={fase}>
      {padre && (
        <p className="flex items-center gap-2 text-base font-semibold" aria-live="polite">
          <span className={fase === 'padre' ? 'text-zinc-900' : 'text-zinc-500'}>{GENEROS[padre].nombre}</span>
          <span className="text-zinc-400" aria-hidden>
            →
          </span>
          <span className={fase === 'hijo' ? 'text-zinc-900' : 'text-zinc-500'} style={fase === 'hijo' ? { color: 'var(--color-produccion-tinta)' } : undefined}>
            {g.nombre}
          </span>
        </p>
      )}
      <ChannelRack filas={filas} patron={patron} bpm={actual.bpm} swing={actual.swing ?? (g.swing != null ? 0 : null)} color={ACENTO} marcas={marcas} alPaso={alPaso} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pruebas: cabecera común
// ---------------------------------------------------------------------------

function CabeceraPrueba({ id, titulo, children }) {
  return (
    <header className="flex items-center gap-3">
      <Pulsable href={rutas.generos()} aria-label="Volver al árbol" className={`grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}>
        <Atras className="size-6" />
      </Pulsable>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{titulo}</span>
        <h1 className="font-titulo text-3xl font-bold leading-tight tracking-tight">{GENEROS[id].nombre}</h1>
      </div>
      {children}
    </header>
  )
}

/** La prueba no se puede si el género no está abierto (URL directa): vuelve al árbol. */
function useAbierto(id) {
  const { estados, ctx } = useEstados()
  const abierto = generoAbierto(estados[id])
  useEffect(() => {
    if (!abierto) navegar(rutas.generos())
  }, [abierto])
  return { abierto, ctx }
}

/** Al volver al árbol tras dominar: el tronco y el género elegidos y el destello de los hijos. */
function volverAlArbol(id, dominadoAhora) {
  recuerdo.tronco = GENEROS[id].tronco
  recuerdo.sel = id
  if (dominadoAhora) recuerdo.recien = { id, abiertos: dominadoAhora }
  navegar(rutas.generos())
}

// ---------------------------------------------------------------------------
// Reconócelo: 5 rondas, ¿cuál es? (4 de 5 para pasar)
// ---------------------------------------------------------------------------

function Reconocelo({ id }) {
  const { abierto, ctx } = useAbierto(id)
  const [rondas, setRondas] = useState(() => rondasReconoce(id))
  const opciones = useMemo(() => opcionesReconoce(id), [id])
  const [i, setI] = useState(0)
  const [elegido, setElegido] = useState(null)
  const [aciertos, setAciertos] = useState([])
  const [oido, setOido] = useState(false)
  const [sonando, setSonando] = useState(false)
  const [fin, setFin] = useState(null) // null | { pasa, abiertos }
  useEffect(() => {
    tiendaRitmo.empezarSesion()
    return () => pararProgramado()
  }, [])

  const ronda = rondas[i]
  // Para las pruebas de Playwright (solo en desarrollo): cuál suena.
  if (import.meta.env.DEV) window.__rondaGenero = ronda
  const tocar = (cual = ronda) => {
    setOido(true)
    setSonando(true)
    reproducir(sonidoGenero(cual, { compases: 2 }), { alParar: () => setSonando(false) })
  }
  const responder = (x) => {
    if (elegido || !oido) return
    const bien = x === ronda
    setElegido(x)
    setAciertos((a) => [...a, bien])
    tiendaRitmo.registrarRespuesta(MODO, { item: id, elemento: ronda, bien, sinNivel: true })
  }
  const siguiente = () => {
    if (i + 1 < rondas.length) {
      setI(i + 1)
      setElegido(null)
      tocar(rondas[i + 1])
      return
    }
    const n = aciertos.filter(Boolean).length
    const pasa = n >= PARA_PASAR
    const abiertos = pasa ? pasar(id, 'reconoce', ctx) : null
    setFin({ pasa, n, abiertos })
    pararProgramado()
  }
  const otraVez = () => {
    const nuevas = rondasReconoce(id)
    setRondas(nuevas)
    setI(0)
    setElegido(null)
    setAciertos([])
    setFin(null)
    tocar(nuevas[0])
  }

  if (!abierto) return null

  let accion
  if (fin) accion = fin.pasa ? { label: 'Continuar', onClick: () => volverAlArbol(id, fin.abiertos), feedback: { tipo: 'bien', titulo: '¡Lo reconoces!', texto: `${fin.n} de ${RONDAS_RECONOCE}.` } } : { label: 'Continuar', onClick: otraVez, feedback: { tipo: 'mal', titulo: 'Casi.', texto: `${fin.n} de ${RONDAS_RECONOCE}: te faltan ${PARA_PASAR - fin.n} para pasar. Otra vez.` } }
  else if (!elegido) accion = { label: 'Continuar', disabled: true, onClick: () => {}, ayuda: oido ? '¿Cuál es?' : 'Escucha y elige' }
  else {
    const bien = elegido === ronda
    accion = {
      label: 'Continuar',
      onClick: siguiente,
      feedback: bien
        ? { tipo: 'bien', titulo: '¡Eso es!', texto: GENEROS[ronda].cambio }
        : { tipo: 'mal', titulo: `Era ${GENEROS[ronda].nombre}.`, texto: GENEROS[ronda].cambio },
    }
  }

  return (
    <div className="flex min-h-dvh flex-col" data-prueba-reconoce={id}>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 pt-4 pb-72 sm:pt-8">
        <CabeceraPrueba id={id} titulo="Reconócelo" />
        <ol className="flex gap-2" aria-label={`Ronda ${Math.min(i + 1, RONDAS_RECONOCE)} de ${RONDAS_RECONOCE}`}>
          {rondas.map((_, k) => {
            const r = aciertos[k]
            return (
              <li
                key={k}
                data-ronda={k}
                data-bien={r === true || undefined}
                data-mal={r === false || undefined}
                className={`grid h-3 flex-1 place-items-center rounded-full transition-colors duration-200 ${r === true ? 'bg-bien' : r === false ? 'bg-fijate' : k === i && !fin ? 'bg-zinc-400' : 'bg-zinc-200'}`}
              />
            )
          })}
        </ol>

        {fin ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={RESORTE.suave} className="flex flex-col items-center gap-2 py-6" data-fin-reconoce={fin.pasa ? 'pasa' : 'otra'}>
            <span className={`grid size-20 place-items-center rounded-full ${fin.pasa ? 'bg-bien-relleno text-blanco' : 'bg-fijate-suave text-fijate-tinta'}`}>
              {fin.pasa ? <Check className="size-10" /> : <Bombilla className="size-10" />}
            </span>
            <span className="font-dato text-4xl font-medium tabular-nums">
              {fin.n}/{RONDAS_RECONOCE}
            </span>
          </motion.div>
        ) : (
          <>
            <Pulsable
              onClick={() => tocar()}
              data-escuchar
              aria-pressed={sonando}
              className={`flex min-h-16 w-full items-center justify-center gap-3 rounded-3xl border-2 text-lg font-semibold transition-colors duration-200 ${sonando ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-zinc-200 bg-white text-zinc-900'}`}
            >
              <IconoPlay sonando={sonando} />
              {oido ? 'Escuchar otra vez' : 'Escuchar'}
            </Pulsable>
            <div className="grid grid-cols-2 gap-3" role="group" aria-label="¿Cuál es?">
              {opciones.map((x) => {
                const esta = x === elegido
                const correcta = elegido && x === ronda
                const tachada = esta && x !== ronda
                return (
                  <Pulsable
                    key={x}
                    onClick={() => responder(x)}
                    disabled={!oido || Boolean(elegido)}
                    data-opcion={x}
                    data-correcta={correcta || undefined}
                    className={`relative flex min-h-16 items-center justify-center gap-1.5 rounded-2xl border-2 px-2 text-lg font-semibold transition-[opacity,background-color,border-color] duration-200 ${
                      correcta ? 'border-bien-relleno bg-bien-relleno text-blanco' : tachada ? 'border-fijate bg-fijate-suave text-fijate-tinta line-through' : 'border-zinc-200 bg-white text-zinc-900'
                    } ${!oido ? 'opacity-50' : ''}`}
                  >
                    {correcta && <Check className="size-5" />}
                    {GENEROS[x].nombre}
                  </Pulsable>
                )
              })}
            </div>
          </>
        )}
      </main>
      <BarraAccion accion={accion} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Prográmalo: de oído, desde el patrón del padre (dos intentos)
// ---------------------------------------------------------------------------

function Programalo({ id }) {
  const { abierto, ctx } = useAbierto(id)
  const g = GENEROS[id]
  const filas = useMemo(() => filasDeGenero(id), [id])
  const meta = useMemo(() => normalizar(g.patron, filas), [g, filas])
  const inicio = useMemo(() => normalizar(patronDePartida(id), filas), [id, filas])
  const original = useMemo(() => sonidoGenero(id, { compases: 2, etiqueta: 'Escuchar el original' }), [id])
  const [patron, setPatron] = useState(inicio)
  const [mudas, setMudas] = useState([])
  const [intentos, setIntentos] = useState(0)
  const [resultado, setResultado] = useState(null) // null | { ok, faltan, sobran, texto, rojo }
  const [abiertos, setAbiertos] = useState(null)
  useEffect(() => tiendaRitmo.empezarSesion(), [])

  if (!abierto) return null

  const terminado = resultado?.ok || resultado?.rojo
  const cambiar = (p) => {
    setPatron(p)
    if (resultado && !resultado.ok) setResultado(null)
  }
  const comprobar = () => {
    const r = comparar(patron, meta, filas)
    const total = intentos + 1
    setIntentos(total)
    tiendaRitmo.registrarRespuesta(MODO, { item: id, bien: r.ok, sinNivel: true })
    if (r.ok) {
      setResultado(r)
      setAbiertos(pasar(id, 'programa', ctx))
    } else if (total >= 2) {
      setResultado({ ...r, rojo: true })
      setPatron(meta)
    } else setResultado({ ...r, texto: avisoRack(r, filas, meta, patron) })
  }

  const igual = comparar(patron, inicio, filas).ok
  let accion
  if (resultado?.ok) accion = { label: 'Continuar', onClick: () => volverAlArbol(id, abiertos), feedback: { tipo: 'bien', titulo: '¡Así suena!', texto: g.cambio } }
  else if (resultado?.rojo)
    accion = {
      label: 'Continuar',
      onClick: () => volverAlArbol(id, null),
      feedback: { tipo: 'error', titulo: 'Así queda.', texto: `${Object.keys(resultado.faltan).length + Object.keys(resultado.distintos ?? {}).length ? 'Con borde rojo, lo que faltaba. ' : ''}Vuelve a intentarlo cuando quieras.` },
    }
  else if (resultado) accion = { label: 'Comprobar', onClick: comprobar, feedback: { tipo: 'mal', titulo: 'Casi.', texto: resultado.texto } }
  else accion = { label: 'Comprobar', onClick: comprobar, disabled: igual, ayuda: igual ? (g.padres ? `Empieza desde ${GENEROS[g.padres[0]].nombre}` : 'Toca los pasos para encenderlos') : null }

  const marcas = marcasRack(resultado)
  // El pincel, si el género o su padre llevan rolls o suaves (drill, jersey club, dubstep: P1.3).
  const pinceles = Boolean(meta.tipo || inicio.tipo)

  return (
    <div className="flex min-h-dvh flex-col" data-prueba-programa={id}>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pt-4 pb-72 sm:px-5 sm:pt-8">
        <CabeceraPrueba id={id} titulo="Prográmalo" />
        <BotonSonido sonido={original} etiqueta="Escuchar el original" className="w-full" />
        <ChannelRack
          filas={filas}
          patron={patron}
          onCambio={terminado ? undefined : cambiar}
          mudas={mudas}
          onMudas={setMudas}
          bpm={g.bpm}
          swing={g.swing ?? null}
          color={ACENTO}
          marcas={marcas}
          pinceles={pinceles}
        />
      </main>
      <BarraAccion accion={accion} />
    </div>
  )
}

