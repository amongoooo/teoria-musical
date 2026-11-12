// Modo administrador: se desbloquea en Opciones con un PIN y deja abrir todas las lecciones
// (estadoLeccion de content/index.js) y saltar entre los pasos de una lección (visor de Leccion.jsx).
// Se guarda en las opciones del dispositivo (`admin` en teoria-musical:opciones:v1); no viaja con «Tu progreso».
//
// En el código solo está la huella SHA-256 del PIN, no el PIN. Es un candado de comodidad, no de seguridad:
// todo corre en el navegador y el progreso está en localStorage.
import { setAdmin } from './opciones.js'

const HUELLA = '4aafc5c1978f22a03081422ff7dc31ce4193c1daecb1fb79e891db6bc1663297'

async function sha256(texto) {
  const datos = new TextEncoder().encode(texto)
  const hash = await crypto.subtle.digest('SHA-256', datos)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Comprueba el PIN y, si es correcto, activa el modo administrador. Devuelve si se activó. */
export async function desbloquearAdmin(pin) {
  const limpio = String(pin).replace(/\D/g, '')
  if (!limpio || !globalThis.crypto?.subtle) return false
  const ok = (await sha256(limpio)) === HUELLA
  if (ok) setAdmin(true)
  return ok
}

export function salirAdmin() {
  setAdmin(false)
}
