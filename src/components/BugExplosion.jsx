// src/components/BugExplosion.jsx 
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Simplified and reliable explosion effect
export function BugExplosion({ position, onComplete }) {
  const [particles, setParticles] = useState([]);
  const explosionRef = useRef();
  const [life, setLife] = useState(1.0);
  
  // Create particles on mount
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      // Random directions using spherical coordinates
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.2 + 0.1;
      
      newParticles.push({
        id: i,
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(
          Math.sin(angle) * Math.cos(phi) * speed,
          Math.sin(angle) * Math.sin(phi) * speed,
          Math.cos(angle) * speed
        ),
        size: Math.random() * 0.2 + 0.1,
        life: 1.0
      });
    }
    setParticles(newParticles);
    
    // Call completion handler after animation finishes
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  // Update particles each frame
  useFrame((state, delta) => {
    // Reduce overall explosion lifetime
    setLife(prev => Math.max(0, prev - delta));
    
    // Update each particle
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        // Update position based on velocity
        const newPosition = particle.position.clone().add(
          particle.velocity.clone().multiplyScalar(delta * 5)
        );
        
        // Apply drag to slow particles over time
        const newVelocity = particle.velocity.clone().multiplyScalar(0.95);
        
        // Reduce particle lifetime
        const newLife = particle.life - delta * 1.5;
        
        return {
          ...particle,
          position: newPosition,
          velocity: newVelocity,
          life: newLife
        };
      }).filter(particle => particle.life > 0) // Remove dead particles
    );
  });
  
  // Convert position to Vector3 if it's an array
  const posVec = position instanceof THREE.Vector3 
    ? position 
    : new THREE.Vector3(...position);
  
  return (
    <group position={posVec} ref={explosionRef}>
      {/* Render each particle */}
      {particles.map(particle => (
        <mesh 
          key={particle.id}
          position={[
            particle.position.x,
            particle.position.y,
            particle.position.z
          ]}
          scale={[particle.size, particle.size, particle.size]}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial 
            color="#ff6600" 
            transparent 
            opacity={particle.life * 0.8}
            blending={THREE.AdditiveBlending} 
          />
        </mesh>
      ))}
      
      {/* Light effect */}
      <pointLight 
        intensity={life * 5} 
        distance={5} 
        color="#ff5500" 
        decay={2}
      />
    </group>
  );
}

export default BugExplosion;