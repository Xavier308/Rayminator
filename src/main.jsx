// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Keep this for base resets IF NEEDED

// Precarga de modelos con Drei
import { useGLTF } from '@react-three/drei';
import robotModelUrl from '/models/rayminator.glb';
import beetleModelUrl from '/models/Purple_Beetle.glb'; // Add beetle path

// Preload models
useGLTF.preload(robotModelUrl);
useGLTF.preload(beetleModelUrl); // PRELOAD THE BEETLE

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> // <-- Temporarily comment out
    <App />
  // </React.StrictMode> // <-- Temporarily comment out
);