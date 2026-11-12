import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useOido } from '../progress/oido.js'
import { useOpciones } from '../progress/opciones.js'
import { useProgreso } from '../progress/progreso.js'
import { crearCodigo, leerCodigo, limpiarCodigo, linkDeCodigo } from '../progress/sincronizar.js'
import { navegar, rutas } from '../router.js'
import { RESORTE, SALTO, SUBE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { Bombilla, Check } from '../ui/Iconos.jsx'
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

  const avisar = (id, texto, ok = true) => {
    setAviso({ id, texto, ok })
    clearTimeout(reloj.current)
    reloj.current = setTimeout(() => setAviso(null), 2200)
  }

  const copiarCodigo = async () => {
    if (!codigo) return
    const ok = await copiar(codigo)
    avisar('codigo', ok ? '¡Copiado!' : 'No se pudo', ok)
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
    const ok = await copiar(link)
    avisar('link', ok ? 'Link copiado' : 'No se pudo', ok)
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
    { id: 'codigo', nombre: 'Copiar código', onClick: copiarCodigo },
    { id: 'link', nombre: 'Compartir link', onClick: compartir },
    { id: 'qr', nombre: 'Código QR', onClick: () => setVerQR((v) => !v), activo: verQR },
  ]

  return (
    <section className="flex flex-col gap-2.5" aria-labelledby="opciones-progreso">
      <h3 id="opciones-progreso" className="px-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Tu progreso
      </h3>
      {/* Tarjeta como los grupos de Opciones (Grupo en Opciones.jsx). */}
      <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 p-4">
        <p className="text-sm leading-snug text-zinc-500">
          Pásalo a otro teléfono o computadora, sin cuenta: lecciones, retos, entrenamiento de oído y opciones.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {acciones.map(({ id, nombre, onClick, activo }) => {
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
                className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-center text-base leading-tight font-semibold transition-colors duration-200 disabled:opacity-50 ${
                  activo ? 'bg-zinc-900 text-white' : hecho && aviso.ok ? 'bg-bien-suave text-bien-tinta' : hecho ? 'bg-fijate-suave text-fijate-tinta' : 'bg-zinc-100 text-zinc-800'
                }`}
              >
                {hecho && aviso.ok && <Check className="size-6" />}
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
          className="flex flex-col gap-2 border-t border-zinc-200 pt-3"
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
              <motion.p ref={refError} key="error" {...SUBE} exit={{ opacity: 0 }} transition={RESORTE.suave} className="flex items-start gap-2 rounded-2xl bg-fijate-suave px-4 py-3 text-base text-fijate-tinta" role="alert">
                <Bombilla className="mt-0.5 size-5" />
                <span>{error}</span>
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </div>
    </section>
  )
}
