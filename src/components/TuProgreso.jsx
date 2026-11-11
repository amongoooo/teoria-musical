import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useOido } from '../progress/oido.js'
import { useOpciones } from '../progress/opciones.js'
import { useProgreso } from '../progress/progreso.js'
import { crearCodigo, leerCodigo, limpiarCodigo, linkDeCodigo } from '../progress/sincronizar.js'
import { navegar, rutas } from '../router.js'
import { RESORTE, SALTO, SUBE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import CodigoQR from './CodigoQR.jsx'

/** Con un link más largo que esto, el QR sale demasiado denso para escanearlo bien. */
const MAX_QR = 1400

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    // Respaldo (navegadores viejos o sin permiso).
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;opacity:0;top:0'
    document.body.appendChild(area)
    area.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    area.remove()
    return ok
  }
}

/**
 * Sección «Tu progreso» de Opciones: pasar el progreso a otro dispositivo sin servidor.
 * Copiar código · Compartir link (#/importar/CÓDIGO) · QR · pegar un código de otro dispositivo.
 */
export default function TuProgreso({ onCerrar }) {
  const progreso = useProgreso()
  const oido = useOido()
  const { tema } = useOpciones()
  const [codigo, setCodigo] = useState('')
  const [aviso, setAviso] = useState(null) // { id, texto }
  const [verQR, setVerQR] = useState(false)
  const [pegado, setPegado] = useState('')
  const [error, setError] = useState('')
  const reloj = useRef(null)

  useEffect(() => {
    let vivo = true
    crearCodigo().then((c) => vivo && setCodigo(c))
    return () => {
      vivo = false
    }
  }, [progreso, oido, tema])
  useEffect(() => () => clearTimeout(reloj.current), [])
  const refError = useRef(null)
  useEffect(() => {
    if (error) requestAnimationFrame(() => refError.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }, [error])

  const link = codigo ? linkDeCodigo(codigo) : ''

  const avisar = (id, texto) => {
    setAviso({ id, texto })
    clearTimeout(reloj.current)
    reloj.current = setTimeout(() => setAviso(null), 2200)
  }

  const copiarCodigo = async () => {
    if (!codigo) return
    avisar('codigo', (await copiar(codigo)) ? '¡Copiado!' : 'No se pudo')
  }

  const compartir = async () => {
    if (!link) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mi progreso · Teoría Musical', text: 'Abre este link para cargar mi progreso:', url: link })
        return
      } catch (e) {
        if (e?.name === 'AbortError') return
      }
    }
    avisar('link', (await copiar(link)) ? 'Link copiado' : 'No se pudo')
  }

  const cargar = async () => {
    const limpio = limpiarCodigo(pegado)
    if (!limpio) return
    try {
      await leerCodigo(limpio)
    } catch {
      setError('Ese código no es válido o está incompleto. Cópialo otra vez entero.')
      return
    }
    onCerrar?.()
    navegar(rutas.importar(limpio))
  }

  const acciones = [
    { id: 'codigo', nombre: 'Copiar código', Icono: IconoCopiar, onClick: copiarCodigo },
    { id: 'link', nombre: 'Compartir link', Icono: IconoCompartir, onClick: compartir },
    { id: 'qr', nombre: 'Código QR', Icono: IconoQR, onClick: () => setVerQR((v) => !v), activo: verQR },
  ]

  return (
    <section className="flex flex-col gap-3" aria-labelledby="opciones-progreso">
      <h3 id="opciones-progreso" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Tu progreso
      </h3>
      <p className="text-base text-zinc-600">
        Pásalo a otro teléfono o computadora, sin cuenta: lecciones, retos, entrenamiento de oído y apariencia.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {acciones.map(({ id, nombre, Icono, onClick, activo }) => {
          const hecho = aviso?.id === id
          return (
            <Pulsable
              key={id}
              tipo="tarjeta"
              onClick={onClick}
              disabled={!codigo}
              aria-expanded={id === 'qr' ? verQR : undefined}
              animate={hecho ? SALTO : { scale: 1 }}
              data-accion-progreso={id}
              className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center text-base leading-tight font-semibold transition-colors duration-200 disabled:opacity-50 ${
                activo ? 'bg-zinc-900 text-white' : hecho ? 'bg-emerald-50 text-emerald-900' : 'bg-zinc-100 text-zinc-800'
              }`}
            >
              {hecho ? <IconoCheck /> : <Icono />}
              <span aria-live="polite">{hecho ? aviso.texto : nombre}</span>
            </Pulsable>
          )
        })}
      </div>

      <AnimatePresence initial={false}>
        {verQR && link && (
          <motion.div key="qr" {...SUBE} exit={{ opacity: 0, y: 16 }} className="flex flex-col items-center gap-3 rounded-3xl border border-zinc-200 bg-white p-4">
            {link.length <= MAX_QR ? (
              <>
                <CodigoQR texto={link} etiqueta="Código QR con el link de tu progreso" className="w-full max-w-72" />
                <p className="text-center text-base text-zinc-600">Escanéalo con la cámara del otro teléfono y abre el link.</p>
              </>
            ) : (
              <p className="text-base text-zinc-600">
                Tu progreso ya es demasiado largo para un QR que se lea bien. Usa <strong>Compartir link</strong> o <strong>Copiar código</strong>.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <form
        className="flex flex-col gap-2 pt-2"
        onSubmit={(e) => {
          e.preventDefault()
          cargar()
        }}
      >
        <label htmlFor="codigo-progreso" className="text-base font-semibold text-zinc-800">
          ¿Tienes un código de otro dispositivo?
        </label>
        <div className="flex gap-2">
          <input
            id="codigo-progreso"
            value={pegado}
            onChange={(e) => {
              setPegado(e.target.value)
              setError('')
            }}
            placeholder="Pega el código o el link"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-12 min-w-0 flex-1 rounded-2xl border-2 border-zinc-200 bg-white px-4 text-base text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-900 focus:outline-none"
          />
          <Pulsable
            type="submit"
            disabled={!pegado.trim()}
            className="min-h-12 shrink-0 rounded-2xl bg-zinc-900 px-5 text-base font-semibold text-white disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            Cargar
          </Pulsable>
        </div>
        <AnimatePresence initial={false}>
          {error && (
            <motion.p ref={refError} key="error" {...SUBE} exit={{ opacity: 0 }} transition={RESORTE.suave} className="rounded-2xl bg-amber-50 px-4 py-3 text-base text-amber-900" role="alert">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </section>
  )
}

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

function IconoCopiar() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" {...trazo} aria-hidden>
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </svg>
  )
}

function IconoCompartir() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" {...trazo} aria-hidden>
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
      <path d="M8 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2" />
    </svg>
  )
}

function IconoQR() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" {...trazo} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3h-3zM20 14v.01M14 20v.01M17 20h4v-3" />
    </svg>
  )
}

function IconoCheck() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" {...trazo} strokeWidth={2.5} aria-hidden>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}
