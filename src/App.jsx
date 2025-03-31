// UPDATED src/App.jsx with Audio and Background
import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
// import { Stats } from '@react-three/drei'; // Commented out Stats to remove the FPS window
import Game from './components/Game';
import ErrorBoundary from './components/ErrorBoundary';
import AudioSystem from './components/AudioSystem';
import CodeBackground from './components/CodeBackground';
import './App.css';

function App() {
  const [score, setScore] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  console.log("App component rendering"); // Debug Log

  return (
    <div className="app-container">
      {/* Audio System */}
      <AudioSystem musicEnabled={audioEnabled} soundEnabled={audioEnabled} />
      
      {/* Audio Toggle Button */}
      <button 
        className="audio-toggle" 
        onClick={() => setAudioEnabled(!audioEnabled)}
        aria-label={audioEnabled ? "Mute Audio" : "Enable Audio"}
      >
        {audioEnabled ? "🔊" : "🔇"}
      </button>
      
      <div className="score-container">Score: {score}</div>
      <div className="canvas-container">
        {/* Wrap Canvas content in ErrorBoundary */}
        <ErrorBoundary>
          <Canvas
            shadows
            camera={{ 
              position: [0, 0.5, 6], // MAIN CHANGE: Lowered camera from 2.5 to 0.5
              fov: 50 
            }}
            onCreated={() => console.log("Canvas Created")}
          >
            {/* <Stats /> */} {/* Commented out Stats to remove the FPS window */}
            <color attach="background" args={['#101010']} /> {/* Darker background for code effect */}
            
            {/* Matrix Code Background */}
            <CodeBackground particleCount={200} depth={30} />
            
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
