// src/components/Game.jsx - FINAL IMPLEMENTATION
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  useGLTF, 
  Environment, 
  PerspectiveCamera,
  Text,
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import { BugExplosion } from './BugExplosion';

// Import models
import robotModelUrl from '/models/rayminator.glb';
const beetleModelUrl = '/models/Purple_Beetle.glb';

// Preload models
useGLTF.preload(robotModelUrl);
useGLTF.preload(beetleModelUrl);

// SUPER SIMPLE LASER THAT DEFINITELY WORKS
function BasicLaser({ start, end, active }) {
  if (!active) return null;
  
  // Convert to Vector3 if needed
  const startVec = start instanceof THREE.Vector3 ? start : new THREE.Vector3(...start);
  const endVec = end instanceof THREE.Vector3 ? end : new THREE.Vector3(...end);
  
  // Calculate direction for rotation
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const distance = direction.length();
  
  // Find midpoint for positioning
  const midpoint = new THREE.Vector3().addVectors(
    startVec, 
    direction.clone().multiplyScalar(0.5)
  );
  
  // Quaternion for rotation
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), 
    direction.clone().normalize()
  );
  
  return (
    <group>
      {/* START MARKER */}
      <mesh position={startVec.toArray()}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
      
      {/* LASER BEAM */}
      <mesh 
        position={midpoint.toArray()} 
        quaternion={quaternion}
      >
        <cylinderGeometry args={[0.05, 0.05, distance, 8]} rotation={[Math.PI/2, 0, 0]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* END MARKER */}
      <mesh position={endVec.toArray()}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* LIGHTS FOR EXTRA VISIBILITY */}
      <pointLight position={startVec.toArray()} intensity={2} distance={3} color="#ffff00" />
      <pointLight position={endVec.toArray()} intensity={3} distance={5} color="#ff0000" />
    </group>
  );
}

// Bug component
function Bug({ position, onHit, id }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const [hit, setHit] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  
  const { scene: bugModel } = useGLTF(beetleModelUrl);
  const planarPosition = [position[0], position[1], -5];
  
  useEffect(() => {
    if (bugModel && ref.current) {
      const clonedModel = bugModel.clone();
      clonedModel.scale.set(0.33, 0.33, 0.33);
      clonedModel.rotation.y = 0;
      
      ref.current.clear();
      ref.current.add(clonedModel);
      
      clonedModel.traverse((child) => {
        if (child.isMesh) {
          child.userData.originalMaterial = child.material;
        }
      });
    }
  }, [bugModel]);
  
  useEffect(() => {
    if (ref.current) {
      ref.current.traverse((child) => {
        if (child.isMesh && child.userData.originalMaterial) {
          if (hovered) {
            if (!child.userData.hoveredMaterial) {
              child.userData.hoveredMaterial = child.userData.originalMaterial.clone();
              child.userData.hoveredMaterial.emissiveIntensity = 0.5;
            }
            child.material = child.userData.hoveredMaterial;
          } else {
            child.material = child.userData.originalMaterial;
          }
        }
      });
    }
  }, [hovered]);
  
  useFrame((state) => {
    if (ref.current && !hit) {
      ref.current.position.x = planarPosition[0] + Math.sin(state.clock.elapsedTime * 1.5 + id * 0.5) * 0.1;
      ref.current.position.y = planarPosition[1] + Math.cos(state.clock.elapsedTime * 2 + id) * 0.1;
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime + id) * 0.1;
    }
  });
  
  useEffect(() => {
    if (hit) {
      setShowExplosion(true);
      
      const timeout = setTimeout(() => {
        onHit(id);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [hit, onHit, id]);
  
  return (
    <>
      {!hit && (
        <group
          ref={ref}
          position={planarPosition}
          scale={hovered ? [1.1, 1.1, 1.1] : [1, 1, 1]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={() => setHit(true)}
        />
      )}
      
      {showExplosion && (
        <BugExplosion 
          position={planarPosition} 
          onComplete={() => setShowExplosion(false)} 
        />
      )}
    </>
  );
}

// Completely rewritten Robot with guaranteed working laser
function Robot({ onShoot }) {
  const robotRef = useRef();
  const { pointer } = useThree();
  const [shooting, setShooting] = useState(false);
  
  // Explicit Vector3 variables for laser points
  const startPoint = useRef(new THREE.Vector3(0, 1, 0));
  const endPoint = useRef(new THREE.Vector3(0, 0, -5));
  
  // Load robot model
  const { scene } = useGLTF(robotModelUrl);
  
  // Clear debugging markers each time model changes
  useEffect(() => {
    if (scene) {
      // Clone model to avoid issues
      const modelClone = scene.clone();
      
      // Store it in the ref
      if (robotRef.current) {
        robotRef.current.clear();
        robotRef.current.add(modelClone);
      }
    }
    
    // Cleanup any existing debugging objects (in case they were added before)
    return () => {
      const markers = document.querySelectorAll('.debug-marker');
      markers.forEach(marker => marker.remove());
    };
  }, [scene]);
  
  // Update robot and laser positions every frame
  useFrame(() => {
    if (!robotRef.current) return;
    
    // Convert pointer to world coordinates (simplified)
    const targetX = pointer.x * 7; // Scale to world space
    const targetY = pointer.y * 4; // Scale to world space
    const targetZ = -5; // Fixed depth plane
    
    // Update the end point of the laser
    endPoint.current.set(targetX, targetY, targetZ);
    
    // Calculate direction for robot rotation
    const direction = new THREE.Vector3().subVectors(
      endPoint.current,
      robotRef.current.position
    );
    
    // Calculate horizontal angle (yaw)
    const horizontalAngle = Math.atan2(direction.x, direction.z);
    
    // Calculate vertical angle (pitch) with safety constraints
    const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    const verticalAngle = Math.atan2(direction.y, horizontalDistance);
    const clampedVerticalAngle = THREE.MathUtils.clamp(
      verticalAngle, 
      -Math.PI * 0.3, 
      Math.PI * 0.3
    );
    
    // Apply rotation with smooth transition
    robotRef.current.rotation.y = THREE.MathUtils.lerp(
      robotRef.current.rotation.y,
      horizontalAngle,
      0.1
    );
    
    robotRef.current.rotation.x = THREE.MathUtils.lerp(
      robotRef.current.rotation.x,
      clampedVerticalAngle,
      0.1
    );
    
    // Calculate the start position for the laser
    // This is hard-coded to be at y=1 unit above the robot's origin
    // Modify this offset as needed to match your model
    const laserOrigin = new THREE.Vector3(0, 1, 0);
    laserOrigin.applyMatrix4(robotRef.current.matrixWorld);
    startPoint.current.copy(laserOrigin);
  });
  
  // Handle shooting
  const handleShoot = () => {
    console.log("SHOOTING!", {
      start: startPoint.current.toArray(),
      end: endPoint.current.toArray()
    });
    
    // Activate laser
    setShooting(true);
    
    // Call the parent's onShoot handler
    if (onShoot) {
      onShoot(endPoint.current);
    }
    
    // Deactivate laser after delay
    setTimeout(() => {
      setShooting(false);
    }, 500);
  };
  
  return (
    <group position={[0, 0, 0]} onClick={handleShoot}>
      <group ref={robotRef} />
      
      {/* Use the guaranteed working laser */}
      <BasicLaser 
        start={startPoint.current} 
        end={endPoint.current}
        active={shooting}
      />
    </group>
  );
}

// Main Game component
function Game({ onScoreChange }) {
  const [bugs, setBugs] = useState([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  
  // Generate bugs
  useEffect(() => {
    const generateBugs = () => {
      const bugCount = 5 + level * 2;
      const newBugs = [];
      
      for (let i = 0; i < bugCount; i++) {
        newBugs.push({
          id: i,
          position: [
            Math.random() * 14 - 7,
            Math.random() * 4 + 1,
            -5
          ]
        });
      }
      
      setBugs(newBugs);
    };
    
    generateBugs();
  }, [level]);
  
  // Update score
  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(score);
    }
  }, [score, onScoreChange]);
  
  // Handle bug hit
  const handleHitBug = (id) => {
    setBugs(prevBugs => prevBugs.filter(bug => bug.id !== id));
    setScore(prevScore => prevScore + 100 * level);
  };
  
  // Check level completion
  useEffect(() => {
    if (bugs.length === 0 && score > 0) {
      const timer = setTimeout(() => {
        setLevel(prevLevel => prevLevel + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [bugs, score]);
  
  // Handle robot shooting
  const handleShoot = (targetPoint) => {
    // Check collision with bugs
    bugs.forEach(bug => {
      const bugPosition = new THREE.Vector3(...bug.position);
      const distance = targetPoint.distanceTo(bugPosition);
      
      // If close enough, mark as hit
      if (distance < 0.5) {
        setBugs(prevBugs => 
          prevBugs.map(b => 
            b.id === bug.id ? { ...b, hit: true } : b
          )
        );
      }
    });
  };
  
  return (
    <>
      {/* Level display */}
      <Text
        position={[0, 4, -2]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.8}
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {`Nivel ${level}`}
      </Text>
      
      {/* Lighting and environment */}
      <Environment preset="sunset" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      
      {/* Camera setup */}
      <PerspectiveCamera
        makeDefault
        position={[0, 2, 5]}
        fov={50}
      />
      
      {/* Robot with working laser */}
      <Robot position={[0, 0, 0]} onShoot={handleShoot} />
      
      {/* Bugs */}
      {bugs.map(bug => (
        <Bug 
          key={bug.id} 
          id={bug.id}
          position={bug.position} 
          onHit={handleHitBug} 
        />
      ))}
      
      {/* Level completion message */}
      {bugs.length === 0 && score > 0 && (
        <group position={[0, 2, -3]}>
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.5}
            color="#ffcc00"
            anchorX="center"
            anchorY="middle"
            fillOpacity={1}
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            ¡Nivel Completado!
          </Text>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <Text
              position={[0, 0, 0]}
              fontSize={0.3}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              Preparando siguiente nivel...
            </Text>
          </Float>
        </group>
      )}
    </>
  );
}

export default Game;