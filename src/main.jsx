import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { defineCustomElements } from '@ionic/pwa-elements/loader'

// Inicializar elementos UI de Capacitor (ej: Cámara web)
defineCustomElements(window);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
