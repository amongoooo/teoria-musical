import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { aplicarTema } from './progress/opciones.js'

aplicarTema() // por si index.html no pudo (p. ej. sin localStorage)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
