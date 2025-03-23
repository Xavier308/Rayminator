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
        <div className="laser-overlay">
          <div id="laser-beam" className="laser-beam"></div>
          <div id="laser-impact" className="laser-impact"></div>
        </div>
    </div>
  )
}

export default App
