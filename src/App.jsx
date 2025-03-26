// src/App.jsx
import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import Game from './components/Game'
import './App.css'

// Componente para mostrar durante la carga
function Loader() {
  return (
    <div className="loader">
      <div className="spinner"></div>
      <p>Cargando robot...</p>
    </div>
  )
}

function App() {
  const [score, setScore] = useState(0);

  return (
    <div className="app-container">
      <div className="score-container">
        Score: {score}
      </div>
      
      <div className="canvas-container">
        <Canvas
          shadows
          camera={{ position: [0, 2, 5], fov: 50 }}
        >
          <Stats />
          <Suspense fallback={null}>
            <Game 
              onScoreChange={(newScore) => setScore(newScore)} 
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Laser overlay con estilos inline para asegurar visibilidad */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 999  // Valor muy alto para asegurar que esté por encima de todo
        }}
      >
        <div 
          id="laser-beam" 
          style={{
            position: 'absolute',
            backgroundColor: '#ff0000',
            transformOrigin: '0 0',
            opacity: 0,
            height: '6px',  // Línea más gruesa
            boxShadow: '0 0 10px #ff0000',
            borderRadius: '3px',
            transition: 'opacity 0.1s'
          }}
        ></div>
        <div 
          id="laser-impact" 
          style={{
            position: 'absolute',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,0,0,1) 0%, rgba(255,165,0,0.7) 50%, rgba(255,255,0,0) 100%)',
            transform: 'translate(-50%, -50%)',
            opacity: 0,
            transition: 'opacity 0.1s'
          }}
        ></div>
      </div>
    </div>
  );
}

export default App
