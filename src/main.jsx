// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Precarga de modelos con Drei (opcional pero recomendado para mejorar rendimiento)
import { useGLTF } from '@react-three/drei'
import robotModelUrl from '/models/rayminator.glb';  // Reemplaza con el nombre de tu archivo

// Precargar el modelo
useGLTF.preload(robotModelUrl)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
