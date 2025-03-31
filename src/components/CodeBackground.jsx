// src/components/CodeBackground.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const CodeBackground = ({ particleCount = 200, depth = 20 }) => {
  const particlesRef = useRef();
  
  // Generate an array of Matrix-style characters
  const matrixChars = useMemo(() => {
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const result = [];
    for (let i = 0; i < chars.length; i++) {
      result.push(chars[i]);
    }
    return result;
  }, []);

  // Create particles with initial positions
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * 40 - 20;
      const y = Math.random() * 20 - 10;
      const z = Math.random() * -depth - 5;
      const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      const size = Math.random() * 0.3 + 0.1;
      const speed = Math.random() * 0.05 + 0.02;
      
      temp.push({ 
        position: [x, y, z], 
        char, 
        size, 
        speed,
        initialZ: z
      });
    }
    return temp;
  }, [particleCount, depth, matrixChars]);

  // Update particles on each frame
  useFrame(() => {
    if (!particlesRef.current) return;

    const children = particlesRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const particle = children[i];
      const data = particles[i];
      
      // Move particle forward (toward camera)
      particle.position.z += data.speed;
      
      // Reset position if particle reaches camera
      if (particle.position.z > 5) {
        particle.position.z = data.initialZ;
        
        // Randomly change character
        if (Math.random() > 0.9) {
          const newChar = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          if (particle.material && particle.material.userData) {
            particle.material.userData.char = newChar;
            // Need to update the shader if we were using custom text shaders
          }
        }
      }
    }
  });

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshBasicMaterial 
            color={new THREE.Color(0, 0.8, 0.3)} 
            transparent 
            opacity={0.6 + Math.random() * 0.4}
            userData={{ char: particle.char }}
          />
        </mesh>
      ))}
    </group>
  );
};

export default CodeBackground;
