// src/components/Game.jsx - Implementación completa con modelo Purple_Beetle
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  useGLTF, 
  Environment, 
  PerspectiveCamera,
  Text,
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import { EnhancedLaserBeam, BugExplosion } from './laser-effects';

// Importar modelos 3D
import robotModelUrl from '/models/rayminator.glb';
const beetleModelUrl = '/models/Purple_Beetle.glb';

// Precargar modelos
useGLTF.preload(robotModelUrl);
useGLTF.preload(beetleModelUrl);

// Componente Bug mejorado con modelo personalizado
function Bug({ position, onHit, id }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const [hit, setHit] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  
  // Cargar el modelo 3D del bug personalizado
  const { scene: bugModel } = useGLTF(beetleModelUrl);
  
  // Aseguramos que la posición esté en un plano vertical (Z constante)
  const planarPosition = [position[0], position[1], -5]; // Z fijo en -5 (distancia del plano)
  
  // Configurar el modelo al montar el componente
  useEffect(() => {
    if (bugModel && ref.current) {
      // Clonar el modelo para evitar problemas de referencia
      const clonedModel = bugModel.clone();
      
      // Ajustar escala (reducir a 1/3 del tamaño original)
      clonedModel.scale.set(0.33, 0.33, 0.33);
      
      // Rotar para que mire hacia la cámara
      //clonedModel.rotation.y = Math.PI;
      clonedModel.rotation.y = 0
      
      // Agregar modelo al grupo
      ref.current.clear(); // Limpiar cualquier contenido existente
      ref.current.add(clonedModel);
      
      // Si queremos añadir un efecto de hover, lo hacemos atravesando el modelo
      clonedModel.traverse((child) => {
        if (child.isMesh) {
          // Guardar material original
          child.userData.originalMaterial = child.material;
        }
      });
    }
  }, [bugModel]);
  
  // Efecto de hover
  useEffect(() => {
    if (ref.current) {
      ref.current.traverse((child) => {
        if (child.isMesh && child.userData.originalMaterial) {
          if (hovered) {
            // Clonar para no afectar a otros bugs
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
  
  // Animación de flotación (en el plano vertical XY)
  useFrame((state) => {
    if (ref.current && !hit) {
      // Movimiento de flotación suave en el plano XY
      ref.current.position.x = planarPosition[0] + Math.sin(state.clock.elapsedTime * 1.5 + id * 0.5) * 0.1;
      ref.current.position.y = planarPosition[1] + Math.cos(state.clock.elapsedTime * 2 + id) * 0.1;
      
      // Rotación lenta alrededor del eje Z para dar vida
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime + id) * 0.1;
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
  
  return (
    <>
      {/* Grupo principal para el bug (visible si no ha sido golpeado) */}
      {!hit && (
        <group
          ref={ref}
          position={planarPosition}
          scale={hovered ? [1.1, 1.1, 1.1] : [1, 1, 1]} // Efecto de hover sutil
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={() => setHit(true)}
        >
          {/* El modelo 3D se añade dinámicamente en useEffect */}
        </group>
      )}
      
      {/* Explosión cuando es golpeado */}
      {showExplosion && (
        <BugExplosion 
          position={planarPosition} 
          onComplete={() => setShowExplosion(false)} 
        />
      )}
    </>
  );
}

// Robot con rotación 3D
function Robot({ onShoot }) {
  const ref = useRef();
  const { camera, pointer, viewport } = useThree();
  const [shooting, setShooting] = useState(false);
  const [targetPoint, setTargetPoint] = useState(new THREE.Vector3());
  
  // Posición fija frente a la cámara
  const robotPosition = [0, 0, 0]; // Centrado en la parte inferior de la pantalla
  
  // Cargar el modelo 3D
  const { scene } = useGLTF(robotModelUrl);
  
  // Aplicar rotación inicial para que mire hacia la cámara
  scene.rotation.y = 0;
  
  useFrame(() => {
    if (ref.current) {
      // Convertir coordenadas del puntero a un punto en el espacio 3D
      // que esté en el plano vertical donde están los bugs
      const x = (pointer.x * viewport.width) / 2;
      const y = (pointer.y * viewport.height) / 2;
      const vector = new THREE.Vector3(x, y, 0);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      
      // Plano vertical donde están los bugs (Z = -5)
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 5);
      const raycaster = new THREE.Raycaster(camera.position, dir);
      const intersectionPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectionPoint);
      
      // Guardar el punto para el láser
      setTargetPoint(intersectionPoint);
      
      // Vector desde el robot al punto del cursor
      const directionVector = new THREE.Vector3().subVectors(
        intersectionPoint,
        new THREE.Vector3(robotPosition[0], robotPosition[1], robotPosition[2])
      );
      
      // Calcular ángulos de rotación
      // Para horizontal (eje Y), usamos el ángulo en el plano XZ
      const horizontalAngle = Math.atan2(directionVector.x, directionVector.z);
      
      // Para vertical (eje X), usamos el ángulo en el plano vertical
      const verticalDistance = directionVector.y;
      const horizontalDistance = Math.sqrt(
        directionVector.x * directionVector.x + 
        directionVector.z * directionVector.z
      );
      const verticalAngle = Math.atan2(verticalDistance, horizontalDistance);
      
      // Factor de proximidad (objetos más cercanos = ángulo más pronunciado)
      const distanceToTarget = directionVector.length();
      const proximityFactor = Math.max(0.5, 2 / distanceToTarget);
      const adjustedVerticalAngle = verticalAngle * proximityFactor;
      
      // Límites anatómicos
      const clampedVerticalAngle = THREE.MathUtils.clamp(
        adjustedVerticalAngle,
        -Math.PI * 0.3, // -54 grados
        Math.PI * 0.3   // 54 grados
      );
      
      // Aplicar rotaciones con suavizado
      ref.current.rotation.y = THREE.MathUtils.lerp(
        ref.current.rotation.y,
        horizontalAngle,
        0.1
      );
      
      ref.current.rotation.x = THREE.MathUtils.lerp(
        ref.current.rotation.x,
        clampedVerticalAngle,
        0.1
      );
    }
  });

  // Función para disparar
  const handleShoot = () => {
    setShooting(true);
    if (onShoot) onShoot(targetPoint);
    setTimeout(() => setShooting(false), 200);
  };

  return (
    <group ref={ref} position={robotPosition} onClick={handleShoot}>
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
  
  // Generar bugs aleatorios en el plano vertical XY
  useEffect(() => {
    const generateBugs = () => {
      const bugCount = 5 + level * 2; // Más bugs en niveles superiores
      const newBugs = [];
      
      for (let i = 0; i < bugCount; i++) {
        // Generamos posiciones en X e Y (plano vertical frente a la cámara)
        newBugs.push({
          id: i,
          position: [
            Math.random() * 14 - 7,      // X: -7 a 7 (ancho de pantalla)
            Math.random() * 4 + 1,       // Y: 1 a 5 (altura desde el suelo)
            -5                          // Z: fijo en -5 (distancia del plano)
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
        // Intentar hacer clic en el bug (si está bajo el cursor)
        const { viewport } = useThree();
        const bugElement = document.elementFromPoint(
          (targetPoint.x / (viewport.width / 2)) * window.innerWidth / 2 + window.innerWidth / 2,
          (-targetPoint.y / (viewport.height / 2)) * window.innerHeight / 2 + window.innerHeight / 2
        );
        if (bugElement) {
          bugElement.click();
        } else {
          // Alternativa: buscar bug por ID y marcarlo como golpeado
          setBugs(prevBugs => 
            prevBugs.map(b => 
              b.id === bug.id ? { ...b, hit: true } : b
            )
          );
        }
      }
    });
  };
  
  // Acceder a viewport para cálculos de coordenadas
  const { viewport } = useThree();
  
  return (
    <>
      {/* Información de nivel */}
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
      
      {/* Entorno y luces */}
      <Environment preset="sunset" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      
      {/* Establecer la cámara frontal */}
      <PerspectiveCamera
        makeDefault
        position={[0, 2, 5]} // Posición de la cámara frontal
        fov={50}
      />
      
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
      
      {/* Plano o suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#303030" />
      </mesh>
      
      {/* Fondo para los bugs (plano vertical) */}
      <mesh position={[0, 2, -8]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      
      {/* Paredes laterales para mejor contexto espacial */}
      <mesh position={[-10, 2, -3]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#252538" />
      </mesh>
      
      <mesh position={[10, 2, -3]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#252538" />
      </mesh>
      
      {/* Efecto visual cuando el nivel está vacío */}
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