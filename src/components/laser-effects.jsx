import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Componente de rayo láser mejorado con efectos
export function EnhancedLaserBeam({ start, end, active, color = '#ff0000' }) {
    const laserRef = useRef();
    const glowRef = useRef();
    const particlesRef = useRef();
    const impactRef = useRef();
    
    const [particles, setParticles] = useState([]);
    const [impactParticles, setImpactParticles] = useState([]);
    const [laserOrigin, setLaserOrigin] = useState(new THREE.Vector3());
    
    // Calculate actual laser origin from robot's position
    useEffect(() => {
      if (start) {
        setLaserOrigin(start.clone());
      }
    }, [start]);
    
    // Rest of component code remains the same
    
    // Update this part in useFrame
    useFrame((state, delta) => {
      if (!active || !start || !end || !laserRef.current) return;
      
      // Update laser origin based on current robot position
      setLaserOrigin(start.clone());
      
      // Vector dirección
      const direction = new THREE.Vector3().subVectors(end, laserOrigin).normalize();
      
      // Distancia
      const distance = laserOrigin.distanceTo(end);
      
      // Punto medio para posicionar el cilindro del láser
      const midpoint = new THREE.Vector3().addVectors(
        laserOrigin,
        direction.clone().multiplyScalar(distance / 2)
      );
    
    // Actualizar posición y rotación del láser
    laserRef.current.position.copy(midpoint);
    laserRef.current.lookAt(end);
    laserRef.current.scale.set(0.05, 0.05, distance);
    
    // Actualizar el efecto de brillo
    if (glowRef.current) {
      glowRef.current.position.copy(midpoint);
      glowRef.current.lookAt(end);
      glowRef.current.scale.set(0.15, 0.15, distance * 0.8);
    }
    
    // Actualizar partículas a lo largo del rayo
    if (particlesRef.current) {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          // Mover partícula a lo largo del rayo
          const t = particle.id / prevParticles.length;
          const basePos = new THREE.Vector3().lerpVectors(start, end, t);
          
          // Aplicar velocidad y reducir vida
          particle.position.copy(basePos).add(
            particle.velocity.clone().multiplyScalar(state.clock.elapsedTime * 10)
          );
          particle.life -= delta * 2;
          
          // Renovar partículas muertas
          if (particle.life <= 0) {
            particle.life = 1.0;
            const newT = particle.id / prevParticles.length;
            particle.position.lerpVectors(start, end, newT);
            particle.velocity.set(
              (Math.random() - 0.5) * 0.02,
              (Math.random() - 0.5) * 0.02,
              (Math.random() - 0.5) * 0.02
            );
          }
          
          return particle;
        })
      );
    }
    
    // Actualizar partículas de impacto
    if (impactRef.current) {
      setImpactParticles(prevParticles => 
        prevParticles.map(particle => {
          // Aplicar velocidad y gravedad
          particle.position.copy(end).add(
            particle.velocity.clone().multiplyScalar(delta * 10)
          );
          particle.velocity.y -= delta * 0.01; // Gravedad
          particle.life -= delta * 1.5;
          
          // Renovar partículas muertas
          if (particle.life <= 0) {
            particle.life = 1.0;
            particle.position.copy(end);
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.1 + 0.05;
            particle.velocity.set(
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              Math.random() * 0.05 - 0.025
            );
          }
          
          return particle;
        })
      );
    }
  });

  // No renderizar nada si no está activo
  if (!active) return null;
  
  return (
    <group>
      {/* Rayo láser principal */}
      <mesh ref={laserRef}>
        <cylinderGeometry args={[1, 1, 1, 8, 1]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.7} 
        />
      </mesh>
      
      {/* Efecto de brillo alrededor del láser */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[1, 1, 1, 12, 1]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.3} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
      
      {/* Partículas a lo largo del láser */}
      <group ref={particlesRef}>
        {particles.map(particle => (
          <mesh 
            key={particle.id}
            position={particle.position}
            scale={[particle.size, particle.size, particle.size]}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={particle.life * 0.7}
              blending={THREE.AdditiveBlending} 
            />
          </mesh>
        ))}
      </group>
      
      {/* Partículas de impacto en el punto final */}
      <group ref={impactRef}>
        {impactParticles.map(particle => (
          <mesh 
            key={particle.id}
            position={particle.position}
            scale={[particle.size, particle.size, particle.size]}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={particle.life * 0.7}
              blending={THREE.AdditiveBlending} 
            />
          </mesh>
        ))}
      </group>
      
      {/* Destello en el punto de impacto */}
      <pointLight 
        position={end} 
        intensity={active ? 2 : 0} 
        distance={3} 
        color={color} 
      />
    </group>
  );
}

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
