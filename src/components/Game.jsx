// src/components/Game.jsx - With calibrated laser and pointer position
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  useGLTF, 
  Environment, 
  PerspectiveCamera,
  Text,
  Float,
  Line
} from '@react-three/drei';
import * as THREE from 'three';
import { BugExplosion } from './BugExplosion';

// Import models
import robotModelUrl from '/models/rayminator.glb';
const beetleModelUrl = '/models/Purple_Beetle.glb';

// Preload models
useGLTF.preload(robotModelUrl);
useGLTF.preload(beetleModelUrl);

// Improved laser implementation with proper alignment
function CalibratedLaser({ start, end, active = true }) {
  // Convert input coordinates to Vector3
  const startV = Array.isArray(start) ? new THREE.Vector3(...start) : start;
  const endV = Array.isArray(end) ? new THREE.Vector3(...end) : end;
  
  // Create a continuous animation reference for the laser
  const pulseRef = useRef(0);
  
  // Pulse animation effect for the laser
  useFrame(({ clock }) => {
    pulseRef.current = Math.sin(clock.getElapsedTime() * 5) * 0.2 + 0.8;
  });
  
  // Don't render when explicitly set to inactive
  if (!active) return null;
  
  return (
    <group>
      {/* Start position marker - smaller with proper color */}
      <mesh position={startV.toArray()}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ffcc00" />
      </mesh>
      
      {/* Drei Line for the main laser beam */}
      <Line
        points={[startV.toArray(), endV.toArray()]}
        color="#ff0000"
        lineWidth={3}
      />
      
      {/* Secondary line for glow effect with animation */}
      <Line
        points={[startV.toArray(), endV.toArray()]}
        color="#ff6600"
        lineWidth={5}
        transparent={true}
        opacity={pulseRef.current * 0.5}
      />
      
      {/* End position indicator - smaller */}
      <mesh position={endV.toArray()}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* Subtle lights */}
      <pointLight position={startV.toArray()} intensity={1} distance={2} color="#ffcc00" />
      <pointLight position={endV.toArray()} intensity={2} distance={2} color="#ff3300" />
    </group>
  );
}

// Improved Bug component with better hit detection
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
          onClick={(e) => {
            console.log('Bug clicked!', { id, position: planarPosition });
            e.stopPropagation();
            setHit(true);
          }}
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

// Robot with improved laser aiming and persistence
function Robot({ onShoot }) {
  const robotRef = useRef();
  const { pointer, viewport, camera } = useThree();
  const [shooting, setShooting] = useState(false);
  const [enhancedLaser, setEnhancedLaser] = useState(false);
  
  // We need a stable reference to these vectors that won't change between renders
  const laserStart = useRef(new THREE.Vector3(0, 1, 0));
  const laserEnd = useRef(new THREE.Vector3(0, 0, -5));
  
  // Load robot model
  const { scene } = useGLTF(robotModelUrl);
  
  // Set up the model
  useEffect(() => {
    if (scene && robotRef.current) {
      const robotModel = scene.clone();
      
      robotRef.current.clear();
      robotRef.current.add(robotModel);
    }
  }, [scene]);
  
  // Set up keyboard listeners for testing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        handleShoot();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Improved pointer to world coordinate conversion
  const getWorldPosition = (pointer) => {
    // Convert from normalized device coordinates (-1 to +1) to world space
    // using ray casting from the camera to a fixed Z plane
    
    // Create a ray from the camera through the pointer position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);
    
    // Define a plane at Z=-5 where all the bugs are
    const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 5);
    
    // Find the intersection point
    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(targetPlane, intersectionPoint);
    
    return intersectionPoint;
  };
  
  // Update robot orientation and laser positions
  useFrame(() => {
    if (!robotRef.current) return;
    
    // Get the world position of the pointer using raycasting
    const targetPoint = getWorldPosition(pointer);
    
    // Update the end point of the laser
    laserEnd.current.copy(targetPoint);
    
    // Update the start position for the laser - this offset should match your robot model
    laserStart.current.set(0, 1, 0).applyMatrix4(robotRef.current.matrixWorld);
    
    // Calculate direction for robot rotation
    const direction = new THREE.Vector3().subVectors(
      targetPoint,
      robotRef.current.position
    );
    
    // Calculate horizontal angle (yaw)
    const horizontalAngle = Math.atan2(direction.x, direction.z);
    
    // Calculate vertical angle (pitch) with limits
    const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    const verticalAngle = Math.atan2(direction.y, horizontalDistance);
    const clampedVerticalAngle = THREE.MathUtils.clamp(
      verticalAngle,
      -Math.PI * 0.3,
      Math.PI * 0.3
    );
    
    // Apply rotation with smooth transitioning
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
  });
  
  // Shooting function without resetting the laser visibility
  const handleShoot = () => {
    console.log("SHOOTING!");
    
    // Enable the enhanced laser effect
    setEnhancedLaser(true);
    
    // Notify parent component
    if (onShoot) {
      onShoot(laserEnd.current.clone());
    }
    
    // Reset enhanced laser effect after a delay, but keep the regular laser visible
    setTimeout(() => {
      setEnhancedLaser(false);
    }, 500);
  };
  
  return (
    <group position={[0, 0, 0]}>
      {/* Robot model */}
      <group ref={robotRef} />
      
      {/* Large invisible clickable area */}
      <mesh 
        position={[0, 1, 0]} 
        onClick={(e) => {
          console.log("Robot clicked!");
          handleShoot();
          e.stopPropagation();
        }}
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial transparent opacity={0.0} />
      </mesh>
      
      {/* Two laser states - regular and enhanced */}
      <CalibratedLaser 
        start={laserStart.current} 
        end={laserEnd.current}
        active={true} // Always visible
      />
      
      {/* Enhanced/intense laser that only shows when shooting */}
      {enhancedLaser && (
        <group>
          {/* Extra bright flash effect */}
          <pointLight 
            position={laserEnd.current.toArray()} 
            intensity={10} 
            distance={5} 
            color="#ff0000" 
          />
          
          {/* Thicker laser beam during shooting */}
          <Line
            points={[laserStart.current.toArray(), laserEnd.current.toArray()]}
            color="#ff3300"
            lineWidth={10}
          />
        </group>
      )}
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
    console.log(`Bug ${id} hit and being removed!`);
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
  
  // Handle robot shooting with improved collision detection
  const handleShoot = (targetPoint) => {
    console.log("Game received shoot event at", targetPoint.toArray());
    
    // Use a slightly larger hit radius for better gameplay
    const hitRadius = 0.7;
    
    bugs.forEach(bug => {
      const bugPosition = new THREE.Vector3(...bug.position);
      const distance = targetPoint.distanceTo(bugPosition);
      
      if (distance < hitRadius) {
        console.log(`Hit bug ${bug.id}!`);
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
      {/* Instructions */}
      <Text
        position={[0, 4, -2]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.8}
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        Nivel {level} - Press F to shoot or click on the robot
      </Text>
      
      {/* Environment */}
      <Environment preset="sunset" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      
      {/* Reference grid to help with orientation */}
      <gridHelper args={[20, 20]} rotation={[Math.PI/2, 0, 0]} position={[0, 0, -5]} />
      
      {/* Camera setup */}
      <PerspectiveCamera
        makeDefault
        position={[0, 2, 5]}
        fov={50}
      />
      
      {/* Robot */}
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