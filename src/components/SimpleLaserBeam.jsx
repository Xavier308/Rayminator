// src/components/SimpleLaserBeam.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Versión simplificada del rayo láser con efectos muy visibles
export function SimpleLaserBeam({ start, end, active, color = '#ff3300' }) {
  const laserRef = useRef();
  const glowRef = useRef();
  const impactRef = useRef();
  
  // Animación y actualización de la posición
  useFrame(() => {
    if (!active || !laserRef.current) return;
    
    // Convertir a Vector3 si son arrays
    const startVec = start instanceof THREE.Vector3 ? start : new THREE.Vector3(...start);
    const endVec = end instanceof THREE.Vector3 ? end : new THREE.Vector3(...end);
    
    // Calcular dirección y distancia
    const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize();
    const distance = startVec.distanceTo(endVec);
    
    // Punto medio
    const midpoint = new THREE.Vector3().addVectors(
      startVec,
      direction.clone().multiplyScalar(distance / 2)
    );
    
    // Actualizar posición y escala del láser principal
    laserRef.current.position.copy(midpoint);
    laserRef.current.lookAt(endVec);
    laserRef.current.scale.set(0.1, 0.1, distance); // Hacemos el láser más grueso
    
    // Actualizar resplandor
    if (glowRef.current) {
      glowRef.current.position.copy(midpoint);
      glowRef.current.lookAt(endVec);
      glowRef.current.scale.set(0.3, 0.3, distance); // Resplandor más grande
    }
    
    // Actualizar efecto de impacto
    if (impactRef.current) {
      impactRef.current.position.copy(endVec);
      // Animación pulsante para el impacto
      impactRef.current.scale.setScalar(0.3 + Math.sin(Date.now() * 0.01) * 0.1);
    }
  });
  
  // No renderizar nada si no está activo
  if (!active) return null;
  
  return (
    <group>
      {/* Rayo láser principal - más grueso y brillante */}
      <mesh ref={laserRef}>
        <cylinderGeometry args={[1, 1, 1, 16, 1]} />
        <meshBasicMaterial 
          color={color} 
          transparent={false} // Sin transparencia para más visibilidad
        />
      </mesh>
      
      {/* Efecto de brillo exterior */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[1, 1, 1, 16, 1]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.6} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
      
      {/* Efecto visual en el punto de impacto */}
      <mesh ref={impactRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.8}
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
      
      {/* Luces para dar más visibilidad */}
      <pointLight 
        position={end instanceof THREE.Vector3 ? [end.x, end.y, end.z] : end} 
        intensity={5} 
        distance={4} 
        color={color} 
      />
      
      {/* Luz adicional en el punto de inicio */}
      <pointLight 
        position={start instanceof THREE.Vector3 ? [start.x, start.y, start.z] : start} 
        intensity={2} 
        distance={2} 
        color={color} 
      />
    </group>
  );
}

export default SimpleLaserBeam;