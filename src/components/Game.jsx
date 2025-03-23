// src/components/Game.jsx
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  useGLTF, 
  Environment, 
  Stats,
  PerspectiveCamera,
  Text,
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import { EnhancedLaserBeam, BugExplosion } from './laser-effects';
import DebugControls from './DebugControls'; // Importa el componente de depuración

// Importar el modelo 3D
import robotModelUrl from '/models/rayminator.glb';


// Componente para los "bugs" o enemigos
function Bug({ position, onHit, id }) {
    const ref = useRef();
    const [hovered, setHovered] = useState(false);
    const [hit, setHit] = useState(false);
    const [showExplosion, setShowExplosion] = useState(false);
    
    // Animación de flotación
    useFrame((state) => {
      if (ref.current && !hit) {
        // Movimiento de flotación suave
        ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + id) * 0.1;
        // Rotación lenta
        ref.current.rotation.y += 0.01;
      }
    });
    
    // Efecto cuando es golpeado
    useEffect(() => {
      if (hit) {
        // Mostrar explosión
        setShowExplosion(true);
        
        // Desaparecer después de la animación
        const timeout = setTimeout(() => {
          onHit(id);
        }, 1000);
        
        return () => clearTimeout(timeout);
      }
    }, [hit, onHit, id]);
    
    // Calculamos un color aleatorio pero consistente para cada bug basado en su ID
    const bugColor = new THREE.Color().setHSL((id * 0.1) % 1, 0.8, 0.6);
    
    return (
      <>
        {/* Bug estilo insecto (visible si no ha sido golpeado) */}
        {!hit && (
          <group
            ref={ref}
            position={position}
            scale={hovered ? [1.2, 1.2, 1.2] : [1, 1, 1]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={() => setHit(true)}
          >
            {/* Cuerpo del bug */}
            <mesh>
              <capsuleGeometry args={[0.15, 0.3, 2, 8]} />
              <meshStandardMaterial 
                color={bugColor}
                emissive={bugColor}
                emissiveIntensity={hovered ? 0.5 : 0.2}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
            
            {/* Cabeza */}
            <mesh position={[0, 0.25, 0]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial 
                color={bugColor}
                emissive={bugColor}
                emissiveIntensity={hovered ? 0.5 : 0.2}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
            
            {/* Ojos */}
            <mesh position={[0.07, 0.3, 0.1]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[-0.07, 0.3, 0.1]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="black" />
            </mesh>
            
            {/* Patas */}
            {[...Array(3)].map((_, i) => (
              <group key={`left-leg-${i}`} position={[0.15, -0.05 + i * 0.15, 0]} rotation={[0, 0, Math.PI / 2 - 0.5]}>
                <mesh>
                  <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
                  <meshStandardMaterial color={bugColor} />
                </mesh>
              </group>
            ))}
            {[...Array(3)].map((_, i) => (
              <group key={`right-leg-${i}`} position={[-0.15, -0.05 + i * 0.15, 0]} rotation={[0, 0, -Math.PI / 2 + 0.5]}>
                <mesh>
                  <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
                  <meshStandardMaterial color={bugColor} />
                </mesh>
              </group>
            ))}
            
            {/* Antenas */}
            <group position={[0.08, 0.35, 0]} rotation={[0, 0, Math.PI / 4]}>
              <mesh>
                <cylinderGeometry args={[0.01, 0.01, 0.2, 8]} />
                <meshStandardMaterial color={bugColor} />
              </mesh>
            </group>
            <group position={[-0.08, 0.35, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <mesh>
                <cylinderGeometry args={[0.01, 0.01, 0.2, 8]} />
                <meshStandardMaterial color={bugColor} />
              </mesh>
            </group>
          </group>
        )}
        
        {/* Explosión cuando es golpeado */}
        {showExplosion && (
          <BugExplosion 
            position={position} 
            onComplete={() => setShowExplosion(false)} 
          />
        )}
      </>
    );
  }


// Componente para nuestro robot con posicionamiento debug
function Robot({ onShoot }) {
    const ref = useRef();
    const { camera, pointer, viewport } = useThree();
    const [shooting, setShooting] = useState(false);
    const [targetPoint, setTargetPoint] = useState(new THREE.Vector3());
    
    // Cargar el modelo 3D
    const { scene } = useGLTF(robotModelUrl);
    
    // Aplicar rotación para que mire hacia adelante
    scene.rotation.y = Math.PI;
    
    useFrame(() => {
      if (ref.current) {
        // Convertir coordenadas del puntero a coordenadas 3D
        const x = (pointer.x * viewport.width) / 2;
        const y = (pointer.y * viewport.height) / 2;
        const vector = new THREE.Vector3(x, y, 0);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));
        
        // Guardar el punto objetivo para el rayo láser
        setTargetPoint(pos);
        
        // Hacer que el robot mire hacia el cursor
        if (ref.current) {
          const targetRotation = Math.atan2(
            pos.x - ref.current.position.x,
            pos.z - ref.current.position.z
          ) + Math.PI;
          
          ref.current.rotation.y = THREE.MathUtils.lerp(
            ref.current.rotation.y,
            targetRotation,
            0.1
          );
        }
      }
    });
  
    // Función para disparar
    const handleShoot = () => {
      setShooting(true);
      if (onShoot) onShoot(targetPoint);
      setTimeout(() => setShooting(false), 200);
    };
  
    return (
      <group ref={ref} position={[0, 1, 0]} onClick={handleShoot}>
        <primitive object={scene} />
        
        {/* Rayo láser cuando se dispara */}
        <EnhancedLaserBeam 
          start={new THREE.Vector3(0, 1, 0).add(new THREE.Vector3().setFromMatrixPosition(ref.current?.matrixWorld || new THREE.Matrix4()))} 
          end={targetPoint} 
          active={shooting} 
          color="#ff0000"
        />
      </group>
    );
  }
  

// Componente principal del juego
function Game({ onScoreChange }) {
  const [bugs, setBugs] = useState([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  
  // Generar bugs aleatorios para el nivel actual
  useEffect(() => {
    const generateBugs = () => {
      const bugCount = 5 + level * 2; // Más bugs en niveles superiores
      const newBugs = [];
      
      for (let i = 0; i < bugCount; i++) {
        newBugs.push({
          id: i,
          position: [
            Math.random() * 8 - 4,        // X: -4 a 4
            Math.random() * 2 + 0.5,      // Y: 0.5 a 2.5
            Math.random() * 8 - 4         // Z: -4 a 4
          ]
        });
      }
      
      setBugs(newBugs);
    };
    
    generateBugs();
  }, [level]);
  
  // Actualizar la puntuación externa
  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(score);
    }
  }, [score, onScoreChange]);
  
  // Función para eliminar un bug cuando es golpeado
  const handleHitBug = (id) => {
    setBugs(prevBugs => prevBugs.filter(bug => bug.id !== id));
    setScore(prevScore => prevScore + 100 * level); // Más puntos en niveles superiores
  };
  
  // Comprobar si se ha completado el nivel
  useEffect(() => {
    if (bugs.length === 0 && score > 0) {
      // Subir de nivel después de un breve retraso
      const timer = setTimeout(() => {
        setLevel(prevLevel => prevLevel + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [bugs, score]);
  
  // Función para manejar el disparo del robot
  const handleShoot = (targetPoint) => {
    // Comprobar colisiones con bugs
    bugs.forEach(bug => {
      const bugPosition = new THREE.Vector3(...bug.position);
      const distance = targetPoint.distanceTo(bugPosition);
      
      // Si el disparo está lo suficientemente cerca del bug, se considera un hit
      if (distance < 0.5) {
        const bugElement = document.elementFromPoint(targetPoint.x, targetPoint.y);
        if (bugElement) {
          bugElement.click();
        }
      }
    });
  };
  
  return (
    <>
      {/* Información de nivel */}
      <Text
        position={[0, 3, 0]}
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
      
      {/* Entorno y luces */}
      <Environment preset="sunset" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      
      {/* Robot jugador */}
      <Robot position={[0, 0, 0]} onShoot={handleShoot} />
      
      {/* Bugs para disparar */}
      {bugs.map(bug => (
        <Bug 
          key={bug.id} 
          id={bug.id}
          position={bug.position} 
          onHit={handleHitBug} 
        />
      ))}
      
      {/* Plano base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#303030" />
      </mesh>
      
      {/* Efecto visual cuando el nivel está vacío */}
      {bugs.length === 0 && score > 0 && (
        <group>
          <Text
            position={[0, 1.5, 0]}
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
              position={[0, 1, 0]}
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
