// src/components/AudioSystem.jsx
import React, { useEffect, useRef, useState } from 'react';

// Audio System Component for handling game sounds and music
const AudioSystem = ({ musicEnabled = true, soundEnabled = true }) => {
  // Refs for audio elements
  const bgMusicRef = useRef(null);
  const explosionSoundRef = useRef(null);
  const laserSoundRef = useRef(null);
  const levelCompleteSoundRef = useRef(null);

  // State to track initialization
  const [initialized, setInitialized] = useState(false);

  // Initialize audio on first interaction
  const initAudio = () => {
    if (initialized) return;
    
    try {
      // Start background music if enabled
      if (musicEnabled && bgMusicRef.current) {
        bgMusicRef.current.volume = 0.4;
        bgMusicRef.current.loop = true;
        bgMusicRef.current.play().catch(e => console.warn("Background music autoplay prevented:", e));
      }
      
      setInitialized(true);
    } catch (error) {
      console.error("Audio initialization error:", error);
    }
  };

  // Setup event listeners for user interaction to enable audio
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      // Remove event listeners after initialization
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Create a global method to play sound effects
  useEffect(() => {
    if (!soundEnabled) return;

    // Add global sound functions
    window.playExplosion = () => {
      if (explosionSoundRef.current) {
        explosionSoundRef.current.currentTime = 0;
        explosionSoundRef.current.play().catch(e => console.warn("Sound play prevented:", e));
      }
    };

    window.playLaser = () => {
      if (laserSoundRef.current) {
        laserSoundRef.current.currentTime = 0;
        laserSoundRef.current.play().catch(e => console.warn("Sound play prevented:", e));
      }
    };

    window.playLevelComplete = () => {
      if (levelCompleteSoundRef.current) {
        levelCompleteSoundRef.current.currentTime = 0;
        levelCompleteSoundRef.current.play().catch(e => console.warn("Sound play prevented:", e));
      }
    };

    // Cleanup
    return () => {
      window.playExplosion = null;
      window.playLaser = null;
      window.playLevelComplete = null;
    };
  }, [soundEnabled]);

  return (
    <div style={{ display: 'none' }}>
      {/* Background Music */}
      {musicEnabled && (
        <audio ref={bgMusicRef} preload="auto">
          <source src="/audio/arcade-loop.mp3" type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      )}

      {/* Sound Effects */}
      {soundEnabled && (
        <>
          <audio ref={explosionSoundRef} preload="auto">
            <source src="/audio/explosion.mp3" type="audio/mp3" />
          </audio>
          <audio ref={laserSoundRef} preload="auto">
            <source src="/audio/laser.mp3" type="audio/mp3" />
          </audio>
          <audio ref={levelCompleteSoundRef} preload="auto">
            <source src="/audio/level-complete.mp3" type="audio/mp3" />
          </audio>
        </>
      )}
    </div>
  );
};

export default AudioSystem;
