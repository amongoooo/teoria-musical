// Íconos de la app: SVG propios, 24 × 24, trazo de 2 px con puntas redondeadas (como Figtree).
//
// Son los MÍNIMOS (ver la skill de diseño, sección «Íconos»). Un ícono = un significado en toda la app;
// no se añade uno nuevo sin quitar otro. Siempre con texto al lado (o `aria-label` en el botón).
//  - Qué te pide el paso:  Oreja (oído) · Teclas (practicar) · Trofeo (reto en FL)
//  - Cómo va (con su color): Check (bien, verde) · Bombilla (fíjate, oro) · Candado (bloqueado, gris)
//  - Controles de siempre:  Reproducir · Bocina (escuchar otra vez) · Cerrar · Inicio · Opciones
// Los módulos NO llevan ícono: se reconocen por su color y su número.

function Icono({ className = 'size-6', grosor = 2, children, titulo }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={titulo ? undefined : true}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
    >
      {children}
    </svg>
  )
}

/** Oído: «esto se responde de oído». */
export function Oreja(props) {
  return (
    <Icono {...props}>
      <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 3.2-3 4.2-3 7.3a3 3 0 0 1-5.8 1" />
      <path d="M9.8 10a2.2 2.2 0 0 1 4.4 0c0 1.3-1.1 1.8-1.7 2.6" />
    </Icono>
  )
}

/** Practicar: teclado, Piano Roll, ritmo (algo que se hace con las manos). */
export function Teclas(props) {
  return (
    <Icono {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M9 13v6M15 13v6" />
      <path d="M7.5 5v8h3V5M13.5 5v8h3V5" fill="currentColor" />
    </Icono>
  )
}

/** Reto en FL Studio (también la isla de Retos y la tarjeta de retos). */
export function Trofeo(props) {
  return (
    <Icono {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4" />
    </Icono>
  )
}

/** Bien / hecho: siempre en verde (`text-bien-tinta`, o blanco sobre `bg-bien-relleno`). */
export function Check({ grosor = 2.6, ...props }) {
  return (
    <Icono grosor={grosor} {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Icono>
  )
}

/** Fíjate / pista: siempre en oro (`text-fijate-tinta`). */
export function Bombilla(props) {
  return (
    <Icono {...props}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" />
    </Icono>
  )
}

/** Bloqueado: siempre en gris. */
export function Candado(props) {
  return (
    <Icono {...props}>
      <rect x="5" y="11" width="14" height="9.5" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icono>
  )
}

/** Reproducir (relleno). */
export function Reproducir(props) {
  return (
    <Icono {...props}>
      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
    </Icono>
  )
}

/** Bocina: «escuchar otra vez» (botón sin texto, con `aria-label`; pedido del usuario en el entrenador de oído). */
export function Bocina(props) {
  return (
    <Icono {...props}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.5 6.5a7.8 7.8 0 0 1 0 11" />
    </Icono>
  )
}

/** Cerrar (✕). */
export function Cerrar({ grosor = 2.4, ...props }) {
  return (
    <Icono grosor={grosor} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icono>
  )
}

/** Inicio (casita). */
export function Inicio(props) {
  return (
    <Icono {...props}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6.5 9v11h11V9" />
    </Icono>
  )
}

/** Opciones (engranaje). */
export function Opciones(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </Icono>
  )
}

/** Ícono de cada actividad (ver src/content/actividad.js). */
export const ICONO_ACTIVIDAD = { oido: Oreja, practicar: Teclas, reto: Trofeo }

/**
 * Marca de «hecho»: ✓ blanco en un círculo verde. Para poner sobre cualquier fondo (también sobre el
 * color de un módulo), así el verde siempre significa «bien / hecho». `aro` = color del anillo que la separa.
 */
export function MarcaBien({ className = 'size-6', aro }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-bien-relleno text-blanco ${className}`}
      style={aro ? { boxShadow: `0 0 0 2.5px ${aro}` } : undefined}
    >
      <Check className="size-[68%]" grosor={3} />
    </span>
  )
}
