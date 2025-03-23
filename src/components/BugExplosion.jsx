// src/components/BugExplosion.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Componente para la explosión cuando un bug es eliminado
export function BugExplosion({ position, onComplete }) {
  const [particles, setParticles] = useState([]);
  const explosionRef = useRef();
  const [life, setLife] = useState(1.0);
  
  // Crear partículas al inicio
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
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
    
    // Llamar a onComplete después de la duración de la explosión
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  // Actualizar partículas
  useFrame((state, delta) => {
    // Actualizar vida de la explosión
    setLife(prev => Math.max(0, prev - delta));
    
    // Actualizar partículas
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        // Actualizar posición
        particle.position.add(particle.velocity.clone().multiplyScalar(delta * 5));
        
        // Reducir velocidad (fricción)
        particle.velocity.multiplyScalar(0.95);
        
        // Reducir vida
        particle.life -= delta * 1.5;
        
        return particle;
      }).filter(particle => particle.life > 0)
    );
  });
  
  return (
    <group position={position} ref={explosionRef}>
      {/* Partículas */}
      {particles.map(particle => (
        <mesh 
          key={particle.id}
          position={particle.position}
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
      
      {/* Luz de la explosión */}
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