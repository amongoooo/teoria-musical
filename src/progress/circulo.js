// Explorador del círculo de quintas (#/circulo): solo recuerda la última tonalidad vista (en este dispositivo).
const CLAVE = 'teoria-musical:circulo:v1'

/** Id de la última tonalidad vista ('C', 'Em'…); Do mayor si no hay. */
export function ultimaTonalidad() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE))?.tonalidad || 'C'
  } catch {
    return 'C'
  }
}

export function guardarTonalidad(tonalidad) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ tonalidad }))
  } catch {
    // Sin almacenamiento (modo privado): no pasa nada, empieza en Do mayor.
  }
}
