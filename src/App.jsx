// src/App.jsx 
import React, { useState, Suspense } from 'react'; // Keep React import
import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import Game from './components/Game';
import ErrorBoundary from './components/ErrorBoundary'; // Import the boundary
import './App.css';

// Loader component (optional, if needed)
function Loader() { /* ... */ }

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
            camera={{ position: [0, 2.5, 6], fov: 50 }}
            onCreated={() => console.log("Canvas Created")} // Debug Log
          >
            <Stats />
            {/* Set a background color for the canvas itself */}
            <color attach="background" args={['#282c34']} />
            <Suspense fallback={null}> {/* Ensure Suspense wraps Game */}
              <Game
                onScoreChange={(newScore) => setScore(newScore)}
              />
            </Suspense>
          </Canvas>
        </ErrorBoundary>
      </div>
      <div className="controls-help">Dispara: Tecla F o click en robot | Apunta: Mouse</div>
    </div>
  );
}

export default App;