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
/** Rótulo de la fila (MÓDULOS / PRÁCTICAS): una rueda vertical pequeña. */
const ROTULO = 48
const ROTULO_SEP = 26
/** Lo que asoma la fila de arriba o de abajo (px) y cómo se ven las vecinas. */
const ASOMA = 30
const VECINA = { escala: 0.88, opacidad: 0.4 }
const SEP_TARJETA = 14
/** Al subir el botón de módulos (gesto «elegir»), la tarjeta del centro sube con él y crece al poder soltar. */
const LEVANTA = { factor: 0.22, max: 26, crece: 0.05 }
const RELIEVE = '0 5px 0 var(--color-zinc-200)'

/**
 * «Módulos y prácticas» de una ruta o de un bloque del Curso completo (pedido del usuario): en lugar de las islas, dos
 * carruseles de lado con tarjetas grandes —los MÓDULOS que usa y sus PRÁCTICAS—, uno encima del otro. Deslizar de lado
 * pasa de tarjeta; deslizar de arriba abajo pasa de una fila a la otra (las mismas reglas de swipe de la app). Tocar la
 * tarjeta del centro la abre (una de al lado, la trae al centro). El botón de módulos (sobre la barra de puntitos)
 * también la abre si se desliza hacia arriba: `subir` (px que sube el botón) y `listo` (1 = soltar ahora la abre)
 * levantan la tarjeta del centro; `api.current.elegir()` la abre.
 *
 * `filas` = [{ id, titulo, items: [{ id, titulo, etiqueta, acento, numero | Icono, dato, avance?, hecho?, href }] }]
 */
export default function CarruselModulos({ filas: todas, subir, listo, api, onCerrar, onAlto }) {
  const filas = todas.filter((f) => f.items.length)
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
  const zona = Math.max(0, alto - ROTULO) // alto de las tarjetas (sin el rótulo)
  const altoTarjeta = Math.round(limitar(zona - 2 * ASOMA - 4, 252, 310))
  const tile = altoTarjeta >= 290 ? 104 : 88
  // La tarjeta deja ver un trozo de sus vecinas a los lados (el carrusel llega al borde de la pantalla).
  const anchoTarjeta = Math.round(Math.min(ancho - 96, 300))
  const sep = anchoTarjeta + SEP_TARJETA
  // La fila vecina asoma ASOMA px por arriba o por abajo (ya encogida).
  const sepFila = zona / 2 + (altoTarjeta * VECINA.escala) / 2 - ASOMA
  const X = ancho < 560 ? Math.max(100, ancho * DESLIZAR.umbralCelular) : DESLIZAR.umbralAncho
  const XV = Math.max(100, sepFila * 0.7)

  // Fila (vertical) y tarjeta de cada fila (de lado). Posiciones continuas: índice + progreso del gesto.
  const [fila, setFila] = useState(0)
  const filaRef = useRef(0)
  const baseV = useMotionValue(0)
  const [indices, setIndices] = useState(() => filas.map(() => 0))
  const idx = useRef(filas.map(() => 0))
  const baseH0 = useMotionValue(0)
  const baseH1 = useMotionValue(0)
  const baseH = [baseH0, baseH1]
  const levanta = useMotionValue(0) // 0 → 1 cuando soltar el botón ya la abriría (con resorte)

  const irFila = (k) => {
    if (k < 0 || k >= filas.length || k === filaRef.current) return
    filaRef.current = k
    setFila(k)
    animate(baseV, k, resorte)
  }
  const pasoFila = (dir) => {
    const a = filaRef.current
    const desfase = baseV.get() - a
    filaRef.current = a + dir
    setFila(a + dir)
    baseV.jump(a + dir + desfase)
    if (Math.abs(desfase) > 0.001) animate(baseV, a + dir, resorte)
  }
  const irA = (k, i) => {
    const n = filas[k].items.length
    if (i < 0 || i >= n || i === idx.current[k]) return
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

  // Gestos: arriba/abajo = fila (en todo el carrusel); de lado = tarjeta (solo la fila de ahora responde).
  const vertical = useDeslizar({ vertical: true, umbral: XV, onPaso: pasoFila, puede: (dir) => filaRef.current + dir >= 0 && filaRef.current + dir < filas.length, continuo: false })
  const lado0 = useDeslizar({ umbral: X, onPaso: pasoLado(0), puede: puedeLado(0) })
  const lado1 = useDeslizar({ umbral: X, onPaso: pasoLado(1), puede: puedeLado(1) })
  const lados = [lado0, lado1]
  const filasRef = useRef([])
  useRuedaMouse(ref, { conVertical: false, puede: puedeLado(fila), onPaso: (dir) => irA(filaRef.current, idx.current[filaRef.current] + dir) })

  const elegir = (item) => item?.href && navegar(item.href)
  const actualItem = () => filas[filaRef.current]?.items[idx.current[filaRef.current]]
  if (api) api.current = { elegir: () => elegir(actualItem()) }

  // Teclado (computadora): ← → tarjeta, ↑ ↓ fila, Enter la abre, Escape vuelve a las islas.
  const teclaRef = useRef(null)
  teclaRef.current = (e) => {
    if (document.querySelector('[role=dialog]') || e.target.closest?.('input, textarea')) return
    const k = filaRef.current
    if (e.key === 'ArrowRight') irA(k, idx.current[k] + 1)
    else if (e.key === 'ArrowLeft') irA(k, idx.current[k] - 1)
    else if (e.key === 'ArrowDown') irFila(k + 1)
    else if (e.key === 'ArrowUp') irFila(k - 1)
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

  // Todo se coloca a mano en cada fotograma (como el carrusel de módulos): sigue al dedo de forma continua.
  const tarjetas = useRef([[], []])
  const rotulos = useRef([])
  const actualizar = () => {
    if (!ancho) return
    const pV = baseV.get() + vertical.progreso.get()
    const pcV = limitar(pV, 0, filas.length - 1)
    const fueraV = pV - pcV
    if (ref.current) ref.current.dataset.posicionFila = pV.toFixed(3)
    filas.forEach((f, k) => {
      const el = filasRef.current[k]
      const d = k - pcV
      const a = Math.min(1, Math.abs(d))
      if (el) {
        el.style.transform = `translateY(${d * sepFila - fueraV * XV * 0.5}px) scale(${lerp(1, VECINA.escala, a)})`
        el.style.opacity = String(lerp(1, VECINA.opacidad, a))
        el.inert = Math.abs(d) > 0.5
      }
      const r = rotulos.current[k]
      if (r) {
        r.style.transform = `translateY(${d * ROTULO_SEP}px) scale(${lerp(1, 0.62, a)})`
        r.style.opacity = String(Math.max(0, lerp(1, 0.4, a) - Math.max(0, Math.abs(d) - 1)))
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
        // La del centro de la fila de ahora sube con el botón de módulos (gesto «elegir»).
        const centro = k === filaRef.current && i === idx.current[k]
        const sube = centro ? Math.min(LEVANTA.max, (subir?.get() ?? 0) * LEVANTA.factor) : 0
        const crece = centro ? levanta.get() * LEVANTA.crece : 0
        t.style.transform = `translateX(${dh * sep - fueraH * X}px) translateY(${-sube}px) scale(${lerp(1, VECINA.escala, ah) + crece})`
        t.style.opacity = String(lerp(1, 0.5, ah))
        t.style.visibility = Math.abs(dh) > 1.8 ? 'hidden' : 'visible'
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
      style={{ height: alto || 360, touchAction: 'none', marginInline: -20, width: 'calc(100% + 40px)' }}
      {...vertical.handlers}
    >
      {/* Rótulo de la fila: una rueda pequeña (el de la otra fila asoma arriba o abajo, más chico). */}
      <div aria-hidden className="relative" style={{ height: ROTULO }}>
        {filas.map((f, k) => (
          <span
            key={f.id}
            ref={(el) => (rotulos.current[k] = el)}
            className="absolute inset-x-0 top-1/2 -mt-4 text-center font-juego text-2xl uppercase leading-8 tracking-wide text-zinc-800"
          >
            {f.titulo}
          </span>
        ))}
      </div>
      <div
        className="relative"
        style={{
          height: zona,
          overflow: 'clip',
          maskImage: 'linear-gradient(to bottom, transparent, black 22px, black calc(100% - 22px), transparent)',
        }}
      >
        {ancho > 0 &&
          filas.map((f, k) => (
            <div
              key={f.id}
              ref={(el) => (filasRef.current[k] = el)}
              data-fila={f.id}
              aria-label={f.titulo}
              role="group"
              className="absolute inset-x-0"
              style={{ top: (zona - altoTarjeta) / 2, height: altoTarjeta }}
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
                      if (k !== filaRef.current) return irFila(k)
                      if (i !== idx.current[k]) return irA(k, i)
                      elegir(it)
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
      </div>
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
      className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-[1.75rem] border-2 bg-white px-4 py-4 text-center transition-colors duration-200"
      style={{ borderColor: centro ? tinta(it.acento) : 'var(--color-zinc-200)', boxShadow: RELIEVE }}
    >
      <span
        className="relative mb-2 grid shrink-0 place-items-center rounded-[1.75rem] font-titulo font-bold text-blanco"
        style={{ width: tile, height: tile, fontSize: tile * 0.42, backgroundColor: oscuro(it.acento), boxShadow: `0 7px 0 ${labio(it.acento)}` }}
        aria-hidden
      >
        {it.Icono ? <it.Icono className={tile >= 100 ? 'size-14' : 'size-12'} /> : it.numero}
        {it.hecho && <MarcaBien className="absolute -right-2 -top-2 size-8" aro="var(--color-white)" />}
      </span>
      <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: tinta(it.acento) }}>
        {it.etiqueta}
      </span>
      <span className="line-clamp-2 font-titulo text-xl font-bold leading-tight tracking-tight [text-wrap:balance]">{it.titulo}</span>
      {it.avance != null ? (
        <span className="flex w-full max-w-48 items-center gap-2">
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
