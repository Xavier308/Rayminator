// src/components/VisualLaserEffect.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// A completely visual-focused laser implementation with maximum visibility
export function VisualLaserEffect({ start, end, active }) {
  const laserRef = useRef();
  const glowRef = useRef();
  const impactRef = useRef();
  const startSphereRef = useRef();
  
  // Blinking state for extra attention
  const [blinkState, setBlinkState] = useState(1);
  
  // Setup blinking effect when active
  useEffect(() => {
    if (!active) return;
    
    const blinkInterval = setInterval(() => {
      setBlinkState(prev => (prev === 1 ? 0.8 : 1));
    }, 50);
    
    return () => clearInterval(blinkInterval);
  }, [active]);
  
  // Update positions and effects
  useFrame(() => {
    if (!active || !laserRef.current) return;
    
    // Ensure we have Vector3 objects
    const startVec = start instanceof THREE.Vector3 ? start : new THREE.Vector3(...start);
    const endVec = end instanceof THREE.Vector3 ? end : new THREE.Vector3(...end);
    
    // Get direction and distance
    const direction = new THREE.Vector3().subVectors(endVec, startVec);
    const distance = direction.length();
    
    // Calculate midpoint for positioning
    const midpoint = new THREE.Vector3().addVectors(
      startVec,
      direction.clone().multiplyScalar(0.5)
    );
    
    // Update main laser beam
    if (laserRef.current) {
      laserRef.current.position.copy(midpoint);
      laserRef.current.lookAt(endVec);
      laserRef.current.scale.set(0.1, 0.1, distance);
    }
    
    // Update glow effect
    if (glowRef.current) {
      glowRef.current.position.copy(midpoint);
      glowRef.current.lookAt(endVec);
      glowRef.current.scale.set(0.2 * blinkState, 0.2 * blinkState, distance);
    }
    
    // Update impact effect
    if (impactRef.current) {
      impactRef.current.position.copy(endVec);
      impactRef.current.scale.setScalar(0.2 * blinkState);
    }
    
    // Update start sphere
    if (startSphereRef.current) {
      startSphereRef.current.position.copy(startVec);
    }
  });
  
  // Don't render anything when not active
  if (!active) return null;
  
  return (
    <group>
      {/* Main laser beam - super bright and solid */}
      <mesh ref={laserRef}>
        <cylinderGeometry args={[1, 1, 1, 16, 1]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* Outer glow for the laser */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[1, 1, 1, 16, 1]} />
        <meshBasicMaterial 
          color="#ff3300" 
          transparent 
          opacity={0.7} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
      
      {/* Impact effect at the end point */}
      <mesh ref={impactRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color="#ffff00" 
          transparent 
          opacity={0.8}
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
      
      {/* Bright sphere at the start position */}
      <mesh ref={startSphereRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
      
      {/* Extra lights for visibility */}
      <pointLight 
        position={end instanceof THREE.Vector3 ? end : new THREE.Vector3(...end)} 
        intensity={5} 
        distance={5} 
        color="#ff3300" 
      />
      
      <pointLight 
        position={start instanceof THREE.Vector3 ? start : new THREE.Vector3(...start)} 
        intensity={3} 
        distance={3} 
        color="#ffff00" 
      />
    </group>
  );
}

export default VisualLaserEffect;
