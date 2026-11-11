import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { aplicarTema } from './progress/opciones.js'
import { registrarServiceWorker } from './pwa/registrar.js'

aplicarTema() // por si index.html no pudo (p. ej. sin localStorage)
registrarServiceWorker() // app instalable y sin internet

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
