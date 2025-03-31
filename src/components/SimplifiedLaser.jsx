// src/components/SimplifiedLaser.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function SimplifiedLaser({ start, end, active }) {
  const ref = useRef();
  
  useFrame(() => {
    if (!ref.current || !active) return;
    
    // Ensure we have Vector3 objects
    const startVec = start instanceof THREE.Vector3 ? start : new THREE.Vector3(...start);
    const endVec = end instanceof THREE.Vector3 ? end : new THREE.Vector3(...end);
    
    // Calculate direction and distance
    const direction = new THREE.Vector3().subVectors(endVec, startVec);
    const distance = direction.length();
    
    // Position in the middle, point in the right direction, and scale to the right length
    ref.current.position.copy(startVec);
    ref.current.lookAt(endVec);
    ref.current.scale.z = distance;
  });
  
  if (!active) return null;
  
  return (
    <group ref={ref}>
      {/* Core laser beam - super bright red */}
      <mesh position={[0, 0, distance / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} rotateX={Math.PI / 2} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* Light at start point */}
      <pointLight intensity={5} distance={3} color="#ff0000" />
      
      {/* Light at end point */}
      <pointLight position={[0, 0, distance]} intensity={8} distance={3} color="#ff0000" />
    </group>
  );
}

export default SimplifiedLaser;
