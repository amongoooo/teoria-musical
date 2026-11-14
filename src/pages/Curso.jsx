import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import BarraCurso from '../components/BarraCurso.jsx'
import CaminoLecciones from '../components/CaminoLecciones.jsx'
import useCambioModulo from '../components/CambioModulo.jsx'
import { Cuadrito } from '../components/NavegadorModulos.jsx'
import { ACENTO_CURSO, ICONO_AREA, accionPaso, moduloDeBloque, rutaDeBloque, useCurso } from '../components/cursoModulo.js'
import { useCarruselModulos, useModulosYPracticas, useRuta } from '../components/rutaModulo.js'
import { AREAS, ORDEN_AREAS, getBloque } from '../content/curso.js'
import { navegar, rutas } from '../router.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { labio, oscuro, tinta } from '../ui/color.js'
import { Candado, Check, MarcaBien, Trofeo } from '../ui/Iconos.jsx'
import { DESLIZAR, RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useDeslizar from '../ui/useDeslizar.js'
import useRuedaMouse from '../ui/useRuedaMouse.js'

/** Relieve sólido bajo tarjetas (como el labio de las islas). */
const RELIEVE = '0 5px 0 var(--color-zinc-200)'
/** Rutas en «Tus rutas» (pedido del usuario: Acordes, Ritmo, Letras). */
const RUTAS_CURSO = ['acordes', 'ritmo', 'letras']

/**
 * CURSO COMPLETO (#/curso; maqueta: https://claude.ai/artifact/7pwg9QVpih3UueHpwWQooH, cambios aprobados:
 * https://claude.ai/artifact/K9mUUjKNofxBuLNV2QsoEZ): las tres rutas a la par, en bloques. De arriba abajo: título y
 * tarjeta de avance (%, barra apilada y una fila por área), «Sigue aquí» (el siguiente paso, del color de su ruta),
 * «Tu camino» (carrusel de bloques con las reglas de swipe de la app) y «Tus rutas». La cabecera fija (casita · barra
 * del curso en tres colores · engrane) vive en App.jsx, como la de los módulos.
 * Con `bloque` (#/curso/bloque/2), ese bloque abierto como CAMINO DE ISLAS, igual que una ruta.
 */
export default function Curso({ bloque = null }) {
  if (bloque != null) {
    if (!getBloque(bloque)) {
      return (
        <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-16">
          <p className="text-lg text-zinc-500">Este bloque llega pronto.</p>
          <Pulsable href={rutas.curso()} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
            Ver el curso
          </Pulsable>
        </main>
      )
    }
    return <PaginaBloque key={bloque} numero={Number(bloque)} />
  }
  return <Resumen />
}

// ---------------------------------------------------------------------------
// Un bloque abierto: camino de islas (como una ruta), cada isla del color de su área.
// ---------------------------------------------------------------------------

function PaginaBloque({ numero }) {
  const curso = useCurso()
  const modulo = moduloDeBloque(numero)
  const [isla, setIsla] = useState(null)
  const [tira, setTira] = useState(null)
  const bloque = curso.estado.bloques.find((x) => x.numero === numero)
  // «Módulos y prácticas» del bloque (botón de vidrio sobre la barra de puntitos): los módulos que usan sus pasos y
  // las prácticas de sus metas.
  const filas = useModulosYPracticas(bloque.paradas, (p) => AREAS[p.area].practica)
  const carrusel = useCarruselModulos(filas)
  const cambio = useCambioModulo(modulo, { isla: carrusel.abierto ? { inicio: false, fin: false } : isla, tira })
  const ruta = { ...rutaDeBloque(curso, numero, () => navegar(rutas.curso())), onVerModulos: carrusel.onTocar, onInsigniaVer: () => navegar(rutas.curso()), carrusel }
  const b = ruta.bloque
  return (
    <>
      <motion.main
        variants={lista}
        initial="oculta"
        animate="visible"
        className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-5 pt-4 pb-28 sm:pt-6"
        style={cambio.estilo}
        {...cambio.handlers}
        data-pagina-bloque={numero}
      >
        <div aria-hidden className="h-11 shrink-0" />
        <motion.header variants={itemLista} className="flex flex-col items-center gap-2 text-center">
          <span className="font-dato text-sm font-medium uppercase tracking-wider text-zinc-500">
            Bloque {numero} · {b.hechas}/{b.total}
          </span>
          <h1 data-titulo-modulo className="font-titulo text-4xl font-extrabold leading-tight tracking-tight [text-wrap:balance] sm:text-6xl">
            {b.titulo}
          </h1>
        </motion.header>
        <motion.section
          variants={itemLista}
          aria-label="Pasos del bloque"
          className="py-2 sm:py-6"
          style={{ marginInline: 'min(0px, calc(50% - min(50vw - 20px, 700px)))' }}
        >
          <CaminoLecciones modulo={modulo} progreso={curso.progreso} onAbierta={setIsla} onTira={setTira} ruta={ruta} />
        </motion.section>
      </motion.main>
      {cambio.indicadores}
    </>
  )
}

// ---------------------------------------------------------------------------
// El resumen del curso.
// ---------------------------------------------------------------------------

function Resumen() {
  const curso = useCurso()
  const { estado } = curso
  const porcentaje = Math.round((estado.hechas / estado.total) * 100)
  return (
    <motion.main variants={lista} initial="oculta" animate="visible" className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-9 px-5 pt-4 pb-14 sm:pt-6" data-pagina-curso>
      {/* Hueco de la cabecera fija (App.jsx). */}
      <div aria-hidden className="-mb-3 h-11 shrink-0" />

      <motion.section variants={itemLista} className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <span className="font-juego text-base uppercase tracking-wide text-zinc-500">Todo el curso</span>
          <h1 data-titulo-modulo className="font-titulo text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
            Curso completo
          </h1>
        </header>
        <TarjetaAvance estado={estado} porcentaje={porcentaje} />
      </motion.section>

      <motion.div variants={itemLista}>
        <SigueAqui curso={curso} />
      </motion.div>

      <motion.section variants={itemLista} className="flex flex-col gap-3" aria-label="Tu camino">
        <Titulo>Tu camino</Titulo>
        <CarruselBloques curso={curso} />
      </motion.section>

      <motion.section variants={itemLista} className="flex flex-col gap-3">
        <Titulo>Tus rutas</Titulo>
        <div className="flex flex-col gap-3">
          {RUTAS_CURSO.map((id) => (
            <TarjetaRuta key={id} id={id} />
          ))}
        </div>
      </motion.section>
    </motion.main>
  )
}

function Titulo({ children }) {
  return <h2 className="text-center font-juego text-2xl font-semibold uppercase tracking-wide text-zinc-800">{children}</h2>
}

/** % grande, «x de 40», la barra apilada y una fila por área (cuadrito con su ícono, nombre, mini barra y x/y). */
function TarjetaAvance({ estado, porcentaje }) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border-2 border-zinc-200 bg-white p-5" style={{ boxShadow: RELIEVE }} data-avance-curso>
      <div className="flex items-end justify-between gap-3">
        <span className="font-titulo text-6xl font-extrabold leading-[0.9] tracking-tight tabular-nums" data-porcentaje>
          {porcentaje}
          <span className="text-3xl">%</span>
        </span>
        <span className="pb-1 font-dato text-base font-medium tabular-nums text-zinc-500">
          {estado.hechas} de {estado.total}
        </span>
      </div>
      <BarraCurso areas={estado.areas} total={estado.total} alto="h-3" fondo="bg-zinc-100" aria-label={`${estado.hechas} de ${estado.total} pasos`} />
      <ul className="flex flex-col gap-3">
        {ORDEN_AREAS.map((a) => {
          const area = AREAS[a]
          const { hechas, total } = estado.areas[a]
          const Icono = ICONO_AREA[a]
          return (
            <li key={a} className="flex items-center gap-3" data-area={a}>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl text-blanco" style={{ backgroundColor: oscuro(area.acento) }} aria-hidden>
                <Icono className="size-5" />
              </span>
              <span className="w-20 shrink-0 text-base font-semibold">{area.nombre}</span>
              <BarraProgreso valor={hechas / total} color={area.acento} fondo="bg-zinc-100" alto="h-1.5" className="flex-1" aria-hidden />
              <span className="w-12 shrink-0 text-right font-dato text-sm font-medium tabular-nums" style={{ color: tinta(area.acento) }}>
                {hechas}/{total}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Nombre del tipo de un paso («Acordes · Lección»). */
const tipoPaso = (p) => `${AREAS[p.area].nombre} · ${{ leccion: 'Lección', meta: 'Práctica', abre: 'Se abre', reto: 'Reto en FL' }[p.tipo]}`

/** El siguiente paso del curso, del color de su ruta, con el botón de su tipo (Empezar / Continuar / Practicar…). */
export function SigueAqui({ curso }) {
  const p = curso.estado.actual
  if (!p) {
    const ultimo = curso.estado.bloques[curso.estado.bloques.length - 1]
    return (
      <Pulsable
        href={rutas.bloque(ultimo.numero)}
        tipo="tarjeta"
        data-sigue-aqui="hecho"
        className="flex flex-col gap-3 rounded-[1.75rem] p-5 text-blanco"
        style={{ backgroundColor: 'var(--color-bien-relleno)', boxShadow: `0 7px 0 ${labio('var(--color-bien)')}` }}
      >
        <span className="flex items-center gap-2 font-juego text-base uppercase tracking-wide text-blanco/90">
          <Check className="size-5" /> Todo hecho
        </span>
        <span className="font-titulo text-2xl font-bold leading-tight">Terminaste los bloques que hay. Llegan más con los próximos módulos.</span>
      </Pulsable>
    )
  }
  const acento = p.acento
  const accion = accionPaso(p, curso)
  const Icono = p.Icono
  return (
    <Pulsable
      onClick={accion.ir}
      tipo="tarjeta"
      aria-label={`${accion.texto}: ${p.titulo}`}
      data-sigue-aqui={p.tipo === 'leccion' ? p.id : p.titulo}
      className="flex w-full flex-col gap-4 rounded-[1.75rem] p-5 text-left text-blanco"
      style={{ backgroundColor: oscuro(acento), boxShadow: `0 7px 0 ${labio(acento)}` }}
    >
      <span className="font-juego text-base uppercase tracking-wide text-blanco/85">Sigue aquí · Bloque {p.bloque}</span>
      <span className="flex items-center gap-4">
        <span className={`grid size-14 shrink-0 place-items-center bg-blanco/15 font-titulo text-xl font-bold ${p.tipo === 'abre' ? 'rounded-2xl' : 'rounded-full'}`} aria-hidden>
          {p.tipo === 'leccion' ? p.id : p.tipo === 'reto' ? <Trofeo className="size-7" /> : Icono && <Icono className="size-7" />}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-juego text-base uppercase tracking-wide text-blanco/85">{tipoPaso(p)}</span>
          <span className="font-titulo text-2xl font-bold leading-tight">{p.titulo}</span>
        </span>
      </span>
      <span
        className="grid min-h-14 place-items-center rounded-2xl bg-blanco font-juego text-2xl font-semibold uppercase tracking-wide"
        // El color de relleno (no la tinta): sobre el blanco fijo se lee igual en claro y en oscuro.
        style={{ color: oscuro(acento), boxShadow: '0 5px 0 rgb(0 0 0 / 0.22)' }}
      >
        {accion.texto}
      </span>
    </Pulsable>
  )
}

// ---------------------------------------------------------------------------
// «Tu camino»: carrusel de bloques (reglas de swipe de la app: useDeslizar, imán, siempre una tarjeta al centro).
// ---------------------------------------------------------------------------

const lerp = (a, b, t) => a + (b - a) * t
const limitar = (v, a, b) => Math.min(b, Math.max(a, v))

function CarruselBloques({ curso }) {
  const { bloques } = curso.estado
  const n = bloques.length + 1 // + la tarjeta «Próximamente»
  const ref = useRef(null)
  const [ancho, setAncho] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    const medir = () => setAncho(el.clientWidth)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Abre centrado en el bloque actual (o en el último si todo está hecho).
  const ahora = bloques.findIndex((b) => b.estado === 'ahora')
  const inicial = ahora >= 0 ? ahora : bloques.length - 1
  const [indice, setIndice] = useState(inicial)
  const idx = useRef(inicial)
  const base = useMotionValue(inicial)
  const reducir = useReducedMotion()
  const resorte = reducir ? { duration: 0 } : RESORTE.pantalla
  const X = ancho < 560 ? Math.max(100, ancho * DESLIZAR.umbralCelular) : DESLIZAR.umbralAncho
  const irA = (i) => {
    if (i < 0 || i >= n || i === idx.current) return
    idx.current = i
    setIndice(i)
    animate(base, i, resorte)
  }
  const paso = (dir) => {
    const a = idx.current
    const desfase = base.get() - a
    idx.current = a + dir
    setIndice(a + dir)
    base.jump(a + dir + desfase)
    if (Math.abs(desfase) > 0.001) animate(base, a + dir, resorte)
  }
  const puede = (dir) => idx.current + dir >= 0 && idx.current + dir < n
  const gesto = useDeslizar({ umbral: X, onPaso: paso, puede })
  useRuedaMouse(ref, { puede, conVertical: false, onPaso: (dir) => irA(idx.current + dir) })

  const tarjetas = useRef([])
  const anchoTarjeta = Math.min(ancho - 112, 280) // más chica: se ven las de al lado
  const actualizar = () => {
    const p = base.get() + gesto.progreso.get()
    const pc = limitar(p, 0, n - 1)
    const fuera = p - pc
    const sep = anchoTarjeta + 12
    if (ref.current) ref.current.dataset.posicion = p.toFixed(3)
    tarjetas.current.forEach((el, i) => {
      if (!el) return
      const d = i - pc
      const a = Math.min(1, Math.abs(d))
      el.style.transform = `translateX(${d * sep - fuera * X}px) scale(${lerp(1, 0.9, a)})`
      el.style.opacity = String(lerp(1, 0.5, a))
      el.style.visibility = Math.abs(d) > 1.8 ? 'hidden' : 'visible'
    })
  }
  const actualizarRef = useRef(actualizar)
  actualizarRef.current = actualizar
  useLayoutEffect(() => actualizar())
  useEffect(() => {
    const quitar = [base, gesto.progreso].map((mv) => mv.on('change', () => actualizarRef.current()))
    return () => quitar.forEach((q) => q())
  }, [base, gesto.progreso])

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={ref}
        data-carrusel-bloques
        className="relative -mx-5 h-[9.75rem] select-none overflow-hidden"
        style={{ touchAction: 'pan-y' }}
        {...gesto.handlers}
      >
        {ancho > 0 &&
          [...bloques, null].map((b, i) => (
            <div
              key={b ? b.numero : 'pronto'}
              ref={(el) => (tarjetas.current[i] = el)}
              className="absolute top-2 bottom-4"
              style={{ left: (ancho - anchoTarjeta) / 2, width: anchoTarjeta }}
            >
              {b ? (
                <TarjetaBloque bloque={b} actual={curso.estado.actual} />
              ) : (
                <TarjetaPronto numero={bloques.length + 1} centro={i === indice} onTocar={() => irA(i)} />
              )}
            </div>
          ))}
      </div>
      {/* Un puntito por bloque: tocar = ir a ese bloque. */}
      <div className="flex justify-center" role="group" aria-label="Bloques">
        {[...bloques, null].map((b, i) => (
          <button
            key={b ? b.numero : 'pronto'}
            type="button"
            data-punto-bloque={i}
            onClick={() => irA(i)}
            aria-label={b ? `Bloque ${b.numero}: ${b.titulo}` : 'Próximamente'}
            aria-current={i === indice ? 'true' : undefined}
            className="grid h-11 w-9 place-items-center"
          >
            <motion.span
              className="block h-2.5 rounded-full"
              animate={{ width: i === indice ? 26 : 10, backgroundColor: i === indice ? 'var(--color-zinc-700)' : 'var(--color-zinc-300)' }}
              transition={RESORTE.pulsar}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Tarjeta de un bloque (pedido del usuario: solo «Bloque N», su título más chico y debajo la barra de progreso). Tocarla
 * entra directo al bloque (también una de al lado). La de ahora lleva borde oscuro; hecha, la barra verde y ✓.
 */
function TarjetaBloque({ bloque: b, actual }) {
  const ahora = b.estado === 'ahora'
  const hecha = b.estado === 'hecha'
  const acento = hecha ? 'var(--color-bien)' : ahora ? actual.acento : ACENTO_CURSO
  return (
    <Pulsable
      tipo="tarjeta"
      href={rutas.bloque(b.numero)}
      draggable={false}
      className="flex h-full w-full flex-col justify-between gap-2 rounded-[1.75rem] border-2 bg-white px-5 py-4 text-left"
      style={{ borderColor: ahora ? 'var(--color-zinc-900)' : 'var(--color-zinc-200)', boxShadow: RELIEVE }}
      data-tarjeta-bloque={b.numero}
      data-ver-bloque={b.numero}
      data-estado={b.estado}
      aria-label={`Bloque ${b.numero}: ${b.titulo}, ${b.hechas} de ${b.total} pasos`}
    >
      <span className="flex items-center gap-2">
        <span className="font-juego text-base uppercase tracking-wide" style={{ color: ahora ? tinta(acento) : hecha ? 'var(--color-bien-tinta)' : 'var(--color-zinc-500)' }}>
          Bloque {b.numero}
        </span>
        {hecha && <MarcaBien className="size-5" />}
      </span>
      <h3 className="line-clamp-2 font-titulo text-lg font-bold leading-tight tracking-tight [text-wrap:balance]">{b.titulo}</h3>
      <span className="flex items-center gap-3">
        <BarraProgreso valor={b.hechas / b.total} color={acento} fondo="bg-zinc-100" alto="h-2" className="flex-1" aria-hidden />
        <span className="font-dato text-sm font-medium tabular-nums text-zinc-500">
          {b.hechas}/{b.total}
        </span>
      </span>
    </Pulsable>
  )
}

/** Al final del carrusel: lo que aún no existe, punteado y con candado (en lugar de la barra). */
function TarjetaPronto({ numero, centro, onTocar }) {
  return (
    <Pulsable
      tipo="tarjeta"
      onClick={centro ? undefined : onTocar}
      className="flex h-full w-full flex-col justify-between gap-2 rounded-[1.75rem] border-2 border-dashed border-zinc-300 px-5 py-4 text-left"
      data-tarjeta-bloque="pronto"
      aria-label={`Bloque ${numero}: próximamente`}
    >
      <span className="font-juego text-base uppercase tracking-wide text-zinc-500">Bloque {numero}</span>
      <h3 className="font-titulo text-lg font-bold leading-tight tracking-tight text-zinc-500">Próximamente</h3>
      <span className="flex items-center gap-3 text-zinc-500">
        <span className="h-2 flex-1 rounded-full border-2 border-dashed border-zinc-300" />
        <Candado className="size-5" />
      </span>
    </Pulsable>
  )
}

// ---------------------------------------------------------------------------
// «Tus rutas»: cada ruta con su avance y «Sigue: …».
// ---------------------------------------------------------------------------

function TarjetaRuta({ id }) {
  const { ruta, modulo, estado } = useRuta(id)
  const sigue = estado.actual >= 0 ? estado.paradas[estado.actual] : null
  return (
    <Pulsable
      href={rutas.ruta(id)}
      tipo="tarjeta"
      data-tarjeta-ruta={id}
      aria-label={`${ruta.titulo}: ${estado.hechas} de ${estado.total}`}
      className="flex items-center gap-4 rounded-3xl border-2 border-zinc-200 bg-white p-3 pr-4 text-left"
      style={{ boxShadow: RELIEVE }}
    >
      <Cuadrito modulo={modulo} tam={56} hecho={estado.hechas === estado.total} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-titulo text-lg font-bold">{ruta.nombre}</span>
          <span className="font-juego text-base tabular-nums" style={{ color: tinta(modulo.acento) }}>
            {estado.hechas}/{estado.total}
          </span>
        </span>
        <span className="truncate text-sm text-zinc-500">
          {sigue ? (
            <>
              Sigue: <b className="font-semibold text-zinc-700">{sigue.tipo === 'leccion' ? `${sigue.id} ${sigue.titulo}` : sigue.titulo}</b>
            </>
          ) : (
            '¡Ruta completa!'
          )}
        </span>
        <BarraProgreso valor={estado.hechas / estado.total} color={modulo.acento} fondo="bg-zinc-100" alto="h-1.5" aria-hidden />
      </span>
    </Pulsable>
  )
}
