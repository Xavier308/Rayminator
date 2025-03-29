// SOLUCIÓN PARA src/App.jsx
// Esta solución ajusta todo el juego bajando la cámara y los elementos

import React, { useState, Suspense } from 'react'; // Keep React import
import { Canvas } from '@react-three/fiber';
// import { Stats } from '@react-three/drei'; // Comentamos Stats para eliminar ventana FPS
import Game from './components/Game';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const [score, setScore] = useState(0);
  console.log("App component rendering"); // Debug Log

  return (
    <div className="app-container">
      <div className="score-container">Score: {score}</div>
      <div className="canvas-container">
        {/* Wrap Canvas content in ErrorBoundary */}
        <ErrorBoundary>
          <Canvas
            shadows
            camera={{ 
              position: [0, 0.5, 6], // CAMBIO PRINCIPAL: Bajamos la cámara de 2.5 a 0.5
              fov: 50 
            }}
            onCreated={() => console.log("Canvas Created")}
          >
            {/* <Stats /> */} {/* Comentamos Stats para quitar ventana FPS */}
            <color attach="background" args={['#282c34']} />
            <Suspense fallback={null}>
              <Game
                onScoreChange={(newScore) => setScore(newScore)}
              />
            </Suspense>
          </Canvas>
        </ErrorBoundary>
      </div>
      <div className="controls-help">Shoot: Press F or click on the robot | Aim: Mouse</div>
    </div>
  );
}

export default App;