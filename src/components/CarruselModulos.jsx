import { animate, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { navegar } from '../router.js'
import { claro, labio, oscuro, tinta } from '../ui/color.js'
import { MarcaBien } from '../ui/Iconos.jsx'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { DESLIZAR, RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useDeslizar from '../ui/useDeslizar.js'
import useRuedaMouse from '../ui/useRuedaMouse.js'

const lerp = (a, b, t) => a + (b - a) * t
const limitar = (v, a, b) => Math.min(b, Math.max(a, v))

/** Alto de la barra de puntitos con el botón de encima (CaminoLecciones: BARRA_ALTO + BOTON_RUTA). */
const BARRA = 164
/** Rótulo de la fila de arriba (MÓDULOS / PRÁCTICAS). */
const ROTULO = 40
/**
 * La otra fila va ABAJO, chiquita y desenfocada, como las cartas en la mano (pedido del usuario): `escala` de la mano,
 * `desenfoque` (px antes de encoger) y cómo se abren en abanico sus cartas (`giro` grados y `baja` px por carta).
 */
const MANO = { escala: 0.36, desenfoque: 7, opacidad: 0.85, giro: 8, baja: 26 }
/** Vecinas de lado: más chicas y por DETRÁS de la del centro, a `junto` × ancho (así se ve su símbolo). */
const VECINA = { escala: 0.82, junto: 0.8 }
/** Al subir el botón de módulos (gesto «elegir»), la tarjeta del centro sube con él y crece al poder soltar. */
const LEVANTA = { factor: 0.22, max: 26, crece: 0.05 }
const RELIEVE = '0 5px 0 var(--color-zinc-200)'

/** Distancia (0…1) de la fila `k` a la posición continua `p` en un mazo de `n` filas que da la vuelta. */
const distanciaFila = (k, p, n) => {
  if (n < 2) return 0
  const d = (((k - p) % n) + n) % n
  return Math.min(1, Math.min(d, n - d))
}

/**
 * «Módulos y prácticas» de una ruta o de un bloque del Curso completo (pedido del usuario): en lugar de las islas, las
 * filas de los MÓDULOS que usa y de sus PRÁCTICAS, como un juego de cartas: la fila elegida va arriba en grande (un
 * carrusel de lado, las vecinas más chicas y detrás, con su símbolo a la vista) y la otra espera ABAJO, chiquita,
 * desenfocada y en abanico, como las cartas en la mano. Deslizar de lado pasa de tarjeta; deslizar hacia arriba o hacia
 * abajo saca la fila de abajo (la elegida baja a la mano y cada fila guarda su tarjeta). Tocar la tarjeta del centro la
 * abre (una de al lado, la trae al centro; la mano, la saca). El botón de módulos (sobre la barra de puntitos) también la
 * abre si se desliza hacia arriba: `subir` (px que sube el botón) y `listo` (1 = soltar ahora la abre) levantan la
 * tarjeta del centro; `api.current.elegir()` la abre. La barra de puntitos sigue al carrusel: `onSel({ fila, indice })`
 * dice qué se ve y `api.current.irA(i)` / `cambiarFila()` la mueven desde la barra.
 *
 * `filas` = [{ id, titulo, items: [{ id, titulo, etiqueta, acento, numero | Icono, dato, avance?, hecho?, grupo?, href }] }]
 */
export default function CarruselModulos({ filas: todas, subir, listo, api, onCerrar, onAlto, onSel }) {
  const filas = todas.filter((f) => f.items.length)
  const n = filas.length
  const ref = useRef(null)
  const [medida, setMedida] = useState({ ancho: 0, alto: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    const medir = () => {
      const top = el.getBoundingClientRect().top + window.scrollY
      const alto = Math.round(limitar(window.innerHeight - top - BARRA - 8, 330, 560))
      setMedida({ ancho: el.clientWidth, alto })
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    window.addEventListener('resize', medir)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', medir)
    }
  }, [])
  useEffect(() => onAlto?.(medida.alto), [medida.alto]) // eslint-disable-line react-hooks/exhaustive-deps

  const reducir = useReducedMotion()
  const resorte = reducir ? { duration: 0 } : RESORTE.pantalla
  const { ancho, alto } = medida
  // Arriba: rótulo + tarjeta grande; abajo: la mano (la otra fila encogida) con su rótulo pequeño.
  const conMano = n > 1
  const altoTarjeta = Math.round(limitar((alto - ROTULO - 8 - (conMano ? 30 : 0)) / (1 + (conMano ? MANO.escala : 0)), 200, 270))
  const anchoTarjeta = Math.round(limitar(altoTarjeta * 0.8, 180, Math.min(224, ancho - 120)))
  const tile = altoTarjeta >= 250 ? 84 : 68
  const sep = anchoTarjeta * VECINA.junto
  const yArriba = ROTULO + 4 // borde de arriba de la fila grande
  const yMano = alto - 6 - altoTarjeta * MANO.escala // borde de arriba de la mano
  const X = ancho < 560 ? Math.max(100, ancho * DESLIZAR.umbralCelular) : DESLIZAR.umbralAncho
  const XV = Math.max(100, (yMano - yArriba) * 0.6)

  // Fila (vertical, en un mazo que da la vuelta) y tarjeta de cada fila (de lado). Posiciones continuas.
  const [fila, setFila] = useState(0)
  const filaRef = useRef(0)
  const absV = useRef(0) // posición vertical sin dar la vuelta (entero)
  const baseV = useMotionValue(0)
  const [indices, setIndices] = useState(() => filas.map(() => 0))
  const idx = useRef(filas.map(() => 0))
  const baseH0 = useMotionValue(0)
  const baseH1 = useMotionValue(0)
  const baseH = [baseH0, baseH1]
  const levanta = useMotionValue(0) // 0 → 1 cuando soltar el botón ya la abriría (con resorte)
  const modulo = (v) => ((v % n) + n) % n

  /** Saca la fila de abajo (hacia arriba o hacia abajo, siempre sale la que espera en la mano). */
  const cambiarFila = (dir = 1) => {
    if (n < 2) return
    absV.current += dir
    filaRef.current = modulo(absV.current)
    setFila(filaRef.current)
    animate(baseV, absV.current, resorte)
  }
  const irFila = (k) => k !== filaRef.current && cambiarFila(1)
  const pasoFila = (dir) => {
    const a = absV.current
    const desfase = baseV.get() - a
    absV.current = a + dir
    filaRef.current = modulo(a + dir)
    setFila(filaRef.current)
    baseV.jump(a + dir + desfase)
    if (Math.abs(desfase) > 0.001) animate(baseV, a + dir, resorte)
  }
  const irA = (k, i) => {
    const total = filas[k].items.length
    if (i < 0 || i >= total || i === idx.current[k]) return
    idx.current[k] = i
    setIndices([...idx.current])
    animate(baseH[k], i, resorte)
  }
  const pasoLado = (k) => (dir) => {
    const a = idx.current[k]
    const desfase = baseH[k].get() - a
    idx.current[k] = a + dir
    setIndices([...idx.current])
    baseH[k].jump(a + dir + desfase)
    if (Math.abs(desfase) > 0.001) animate(baseH[k], a + dir, resorte)
  }
  const puedeLado = (k) => (dir) => k === filaRef.current && idx.current[k] + dir >= 0 && idx.current[k] + dir < filas[k].items.length

  // Gestos: arriba/abajo = sacar la fila de la mano (en todo el carrusel); de lado = tarjeta (solo la fila de arriba).
  const vertical = useDeslizar({ vertical: true, umbral: XV, onPaso: pasoFila, puede: () => n > 1, continuo: false })
  const lado0 = useDeslizar({ umbral: X, onPaso: pasoLado(0), puede: puedeLado(0) })
  const lado1 = useDeslizar({ umbral: X, onPaso: pasoLado(1), puede: puedeLado(1) })
  const lados = [lado0, lado1]
  const filasRef = useRef([])
  useRuedaMouse(ref, { conVertical: false, puede: puedeLado(fila), onPaso: (dir) => irA(filaRef.current, idx.current[filaRef.current] + dir) })

  const elegir = (item) => item?.href && navegar(item.href)
  const actualItem = () => filas[filaRef.current]?.items[idx.current[filaRef.current]]
  if (api) api.current = { elegir: () => elegir(actualItem()), irA: (i) => irA(filaRef.current, i), cambiarFila }
  // Qué se ve (fila y tarjeta del centro): para la barra de puntitos.
  const indiceActual = indices[fila] ?? 0
  useEffect(() => onSel?.({ fila, indice: indiceActual }), [fila, indiceActual]) // eslint-disable-line react-hooks/exhaustive-deps

  // Teclado (computadora): ← → tarjeta, ↑ ↓ saca la fila de abajo, Enter la abre, Escape vuelve a las islas.
  const teclaRef = useRef(null)
  teclaRef.current = (e) => {
    if (document.querySelector('[role=dialog]') || e.target.closest?.('input, textarea')) return
    const k = filaRef.current
    if (e.key === 'ArrowRight') irA(k, idx.current[k] + 1)
    else if (e.key === 'ArrowLeft') irA(k, idx.current[k] - 1)
    else if (e.key === 'ArrowDown') cambiarFila(1)
    else if (e.key === 'ArrowUp') cambiarFila(-1)
    else if (e.key === 'Enter') elegir(actualItem())
    else if (e.key === 'Escape') onCerrar?.()
    else return
    e.preventDefault()
  }
  useEffect(() => {
    const t = (e) => teclaRef.current(e)
    document.addEventListener('keydown', t)
    return () => document.removeEventListener('keydown', t)
  }, [])

  // Todo se coloca a mano en cada fotograma: sigue al dedo de forma continua.
  const tarjetas = useRef([[], []])
  const rotulos = useRef([])
  const actualizar = () => {
    if (!ancho) return
    const pV = baseV.get() + vertical.progreso.get()
    if (ref.current) ref.current.dataset.posicionFila = pV.toFixed(3)
    filas.forEach((f, k) => {
      const el = filasRef.current[k]
      // a = 0: la fila de arriba en grande; a = 1: en la mano (abajo, chiquita, desenfocada y en abanico).
      const a = distanciaFila(k, pV, n)
      if (el) {
        el.style.transform = `translateY(${lerp(yArriba, yMano, a)}px) scale(${lerp(1, MANO.escala, a)})`
        el.style.opacity = String(lerp(1, MANO.opacidad, a))
        el.style.filter = a > 0.02 && !reducir ? `blur(${(a * MANO.desenfoque).toFixed(2)}px)` : ''
        el.style.zIndex = a < 0.5 ? '2' : '1' // la que sale pasa por delante
        if (a > 0.5) el.dataset.mano = ''
        else delete el.dataset.mano
      }
      const r = rotulos.current[k]
      if (r) {
        r.style.transform = `translateY(${lerp(0, yMano - 26, a)}px) scale(${lerp(1, 0.62, a)})`
        r.style.opacity = String(lerp(1, 0.7, a))
      }
      const pH = baseH[k].get() + lados[k].progreso.get()
      const pcH = limitar(pH, 0, f.items.length - 1)
      const fueraH = pH - pcH
      if (el) el.dataset.posicion = pH.toFixed(3)
      f.items.forEach((_, i) => {
        const t = tarjetas.current[k][i]
        if (!t) return
        const dh = i - pcH
        const ah = Math.min(1, Math.abs(dh))
        // La del centro de la fila de arriba sube con el botón de módulos (gesto «elegir»).
        const centro = k === filaRef.current && i === idx.current[k]
        const sube = centro ? Math.min(LEVANTA.max, (subir?.get() ?? 0) * LEVANTA.factor) : 0
        const crece = centro ? levanta.get() * LEVANTA.crece : 0
        // En la mano, las cartas se abren en abanico (giran y bajan hacia las orillas).
        const giro = a * dh * MANO.giro
        const baja = a * dh * dh * MANO.baja
        t.style.transform = `translateX(${dh * sep - fueraH * X}px) translateY(${baja - sube}px) rotate(${giro}deg) scale(${lerp(1, VECINA.escala, ah) + crece})`
        t.style.zIndex = String(20 - Math.round(Math.abs(dh) * 4))
        const lejos = Math.abs(dh) - 1 // las de más allá de la vecina se desvanecen
        t.style.opacity = String(limitar(1 - lejos, 0, 1))
        t.style.visibility = Math.abs(dh) > 1.98 ? 'hidden' : 'visible'
        if (centro && levanta.get() > 0.5) t.dataset.listo = ''
        else delete t.dataset.listo
      })
    })
  }
  const actualizarRef = useRef(actualizar)
  actualizarRef.current = actualizar
  useLayoutEffect(() => actualizar())
  useEffect(() => {
    const mvs = [baseV, vertical.progreso, baseH0, baseH1, lado0.progreso, lado1.progreso, levanta, subir].filter(Boolean)
    const quitar = mvs.map((mv) => mv.on('change', () => actualizarRef.current()))
    return () => quitar.forEach((q) => q())
  }, [baseV, vertical.progreso, baseH0, baseH1, lado0.progreso, lado1.progreso, levanta, subir])
  useEffect(() => {
    if (!listo) return
    return listo.on('change', (v) => animate(levanta, v, reducir ? { duration: 0 } : RESORTE.pulsar))
  }, [listo, levanta, reducir])

  return (
    <div
      ref={ref}
      data-carrusel-modulos
      data-fila-actual={filas[fila]?.id}
      className="relative select-none"
      style={{ height: alto || 360, touchAction: 'none', marginInline: -20, width: 'calc(100% + 40px)', overflow: 'clip' }}
      {...vertical.handlers}
    >
      {/* Rótulo de cada fila: arriba en grande el de la elegida; el de la mano, chiquito sobre ella. */}
      {filas.map((f, k) => (
        <span
          key={f.id}
          aria-hidden
          ref={(el) => (rotulos.current[k] = el)}
          className="absolute inset-x-0 top-1 text-center font-juego text-2xl uppercase leading-8 tracking-wide text-zinc-800"
          style={{ transformOrigin: '50% 0' }}
        >
          {f.titulo}
        </span>
      ))}
      {ancho > 0 &&
        filas.map((f, k) => (
          <div
            key={f.id}
            ref={(el) => (filasRef.current[k] = el)}
            data-fila={f.id}
            aria-label={f.titulo}
            role="group"
            className="absolute inset-x-0 top-0"
            style={{ height: altoTarjeta, transformOrigin: '50% 0' }}
            {...lados[k].handlers}
          >
            {f.items.map((it, i) => (
              <div
                key={it.id}
                ref={(el) => (tarjetas.current[k][i] = el)}
                className="absolute top-0"
                style={{ left: (ancho - anchoTarjeta) / 2, width: anchoTarjeta, height: altoTarjeta }}
              >
                <Tarjeta
                  item={it}
                  tile={tile}
                  centro={k === fila && i === indices[k]}
                  onClick={() => {
                    if (k !== filaRef.current) return irFila(k) // tocar la mano: sale esa fila
                    if (i !== idx.current[k]) return irA(k, i)
                    elegir(it)
                  }}
                />
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}

/** Tarjeta grande de un módulo o de una práctica: cuadrito con su número o su ícono, qué es, título y cómo vas. */
function Tarjeta({ item: it, tile, centro, onClick }) {
  return (
    <Pulsable
      tipo="tarjeta"
      onClick={onClick}
      data-tarjeta-modulo={it.id}
      data-centro={centro ? '' : undefined}
      aria-label={`${it.etiqueta}: ${it.titulo}`}
      className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-[1.75rem] border-2 bg-white px-3 py-3 text-center transition-colors duration-200"
      style={{ borderColor: centro ? tinta(it.acento) : 'var(--color-zinc-200)', boxShadow: RELIEVE }}
    >
      <span
        className="relative mb-1.5 grid shrink-0 place-items-center rounded-[1.75rem] font-titulo font-bold text-blanco"
        style={{ width: tile, height: tile, fontSize: tile * 0.42, backgroundColor: oscuro(it.acento), boxShadow: `0 7px 0 ${labio(it.acento)}` }}
        aria-hidden
      >
        {it.Icono ? <it.Icono className={tile >= 84 ? 'size-12' : 'size-10'} /> : it.numero}
        {it.hecho && <MarcaBien className="absolute -right-2 -top-2 size-8" aro="var(--color-white)" />}
      </span>
      <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: tinta(it.acento) }}>
        {it.etiqueta}
      </span>
      <span className="line-clamp-2 font-titulo text-lg font-bold leading-tight tracking-tight [text-wrap:balance]">{it.titulo}</span>
      {it.avance != null ? (
        <span className="flex w-full max-w-40 items-center gap-2">
          <BarraProgreso valor={it.avance} color={it.acento} fondo="bg-zinc-100" alto="h-1.5" className="flex-1" alAparecer={false} />
          <span className="font-dato text-sm font-medium tabular-nums text-zinc-500">{it.dato}</span>
        </span>
      ) : (
        <span className="rounded-full px-3 py-0.5 font-juego text-lg" style={{ backgroundColor: claro(it.acento), color: tinta(it.acento) }}>
          {it.dato}
        </span>
      )}
    </Pulsable>
  )
}
