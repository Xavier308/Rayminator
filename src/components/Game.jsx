// src/components/Game.jsx - Versión final sin piso y con láser ultra visible
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { updateCssLaser } from '../utils/laserUtils';
import { 
  useGLTF, 
  Environment, 
  PerspectiveCamera,
  Text,
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import { BugExplosion } from './laser-effects';


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

// Componente para láser extremadamente simple pero visible
function UltraVisibleLaser({ start, end, active }) {
  if (!active) return null;
  
  // Asegurar que sean Vector3
  const startVec = start instanceof THREE.Vector3 ? start : new THREE.Vector3(...start);
  const endVec = end instanceof THREE.Vector3 ? end : new THREE.Vector3(...end);
  
  // Dirección y distancia
  const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize();
  const distance = startVec.distanceTo(endVec);
  
  // Crear un material sólido
  const laserMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0000, 
    transparent: false
  });
  
  return (
    <group>
      {/* Láser como una línea directa */}
      <line>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attachObject={['attributes', 'position']}
            count={2}
            array={new Float32Array([
              startVec.x, startVec.y, startVec.z,
              endVec.x, endVec.y, endVec.z
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color="#ff0000" linewidth={10} />
      </line>
      
      {/* Cilindro sólido como refuerzo */}
      <mesh position={[(startVec.x + endVec.x) / 2, (startVec.y + endVec.y) / 2, (startVec.z + endVec.z) / 2]}>
        <cylinderGeometry 
          args={[0.1, 0.1, distance, 8]} 
          rotation={[Math.PI / 2, 0, 0]}
        />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* Punto de origen */}
      <mesh position={[startVec.x, startVec.y, startVec.z]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
      
      {/* Punto de destino */}
      <mesh position={[endVec.x, endVec.y, endVec.z]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
}

// Componente Robot modificado con más logs
function Robot({ onShoot }) {
  const robotRef = useRef();
  const { camera, pointer, viewport } = useThree();
  const [shooting, setShooting] = useState(false);
  const laserStartRef = useRef(new THREE.Vector3(0, 1, 0));
  const laserEndRef = useRef(new THREE.Vector3(0, 1, -5));
  
  // Cargar el modelo 3D
  const { scene } = useGLTF(robotModelUrl);
  
  useEffect(() => {
    if (scene) {
      scene.rotation.y = 0;
    }
  }, [scene]);
  
  useFrame(() => {
    if (!robotRef.current) return;
    
    // Coordenadas del cursor normalizadas
    const normalizedX = pointer.x; // -1 a 1
    const normalizedY = pointer.y; // -1 a 1
    
    // Convertir a coordenadas de mundo
    const worldX = normalizedX * 7; // Escala para el rango de vista
    const worldY = normalizedY * 4; // Escala para el rango de vista
    
    // Punto final del láser a profundidad fija
    const targetPoint = new THREE.Vector3(worldX, worldY, -5);
    laserEndRef.current = targetPoint;
    
    // Calcular dirección para la rotación
    const directionVector = new THREE.Vector3().subVectors(
      targetPoint,
      robotRef.current.position
    );
    
    // Ángulos de rotación
    const horizontalAngle = Math.atan2(directionVector.x, directionVector.z);
    
    // Ángulo vertical con restricciones
    const verticalDistance = directionVector.y;
    const horizontalDistance = Math.sqrt(
      directionVector.x * directionVector.x + 
      directionVector.z * directionVector.z
    );
    const verticalAngle = Math.atan2(verticalDistance, horizontalDistance);
    
    // Limitar ángulos
    const clampedVerticalAngle = THREE.MathUtils.clamp(
      verticalAngle,
      -Math.PI * 0.3,
      Math.PI * 0.3
    );
    
    // Aplicar rotaciones
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
    
    // Actualizar punto de inicio del láser
    const laserOrigin = new THREE.Vector3(0, 1, 0);
    laserOrigin.applyMatrix4(robotRef.current.matrixWorld);
    laserStartRef.current = laserOrigin;
    
    // Actualizar el láser CSS si está disparando
    if (shooting) {
      updateCssLaser(laserStartRef.current, laserEndRef.current, camera, true);
    }
  });
  
  // Función para disparar
  const handleShoot = () => {
    console.log("¡Disparando!", {
      start: {
        x: laserStartRef.current.x,
        y: laserStartRef.current.y,
        z: laserStartRef.current.z
      },
      end: {
        x: laserEndRef.current.x,
        y: laserEndRef.current.y,
        z: laserEndRef.current.z
      }
    });
    
    setShooting(true);
    
    if (onShoot) {
      onShoot(laserEndRef.current);
    }
    
    // Crear un láser CSS directamente como prueba
    try {
      const start = document.querySelector("#start-marker") || document.createElement("div");
      const end = document.querySelector("#end-marker") || document.createElement("div");
      const line = document.querySelector("#test-line") || document.createElement("div");
      
      if (!document.querySelector("#start-marker")) {
        start.id = "start-marker";
        start.style.position = "absolute";
        start.style.width = "10px";
        start.style.height = "10px";
        start.style.backgroundColor = "yellow";
        start.style.borderRadius = "50%";
        start.style.zIndex = "1000";
        document.body.appendChild(start);
      }
      
      if (!document.querySelector("#end-marker")) {
        end.id = "end-marker";
        end.style.position = "absolute";
        end.style.width = "10px";
        end.style.height = "10px";
        end.style.backgroundColor = "red";
        end.style.borderRadius = "50%";
        end.style.zIndex = "1000";
        document.body.appendChild(end);
      }
      
      if (!document.querySelector("#test-line")) {
        line.id = "test-line";
        line.style.position = "absolute";
        line.style.backgroundColor = "red";
        line.style.height = "5px";
        line.style.transformOrigin = "0 0";
        line.style.zIndex = "999";
        document.body.appendChild(line);
      }
      
      // Convertir posiciones 3D a coordenadas de pantalla
      const startScreen = worldToScreen(laserStartRef.current, camera);
      const endScreen = worldToScreen(laserEndRef.current, camera);
      
      // Posicionar marcadores
      start.style.left = `${startScreen.x - 5}px`;
      start.style.top = `${startScreen.y - 5}px`;
      
      end.style.left = `${endScreen.x - 5}px`;
      end.style.top = `${endScreen.y - 5}px`;
      
      // Calcular línea
      const dx = endScreen.x - startScreen.x;
      const dy = endScreen.y - startScreen.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      // Posicionar línea
      line.style.width = `${distance}px`;
      line.style.left = `${startScreen.x}px`;
      line.style.top = `${startScreen.y}px`;
      line.style.transform = `rotate(${angle}rad)`;
      
      console.log("Elementos de prueba creados y posicionados", {
        startPos: startScreen,
        endPos: endScreen,
        distance,
        angle: angle * (180/Math.PI)
      });
    } catch (error) {
      console.error("Error al crear elementos de prueba:", error);
    }
    
    // Actualizar el láser CSS
    setTimeout(() => {
      setShooting(false);
      updateCssLaser(laserStartRef.current, laserEndRef.current, camera, false);
    }, 2000); // Más tiempo para ver el láser
  };
  
  return (
    <group 
      ref={robotRef} 
      position={[0, 0, 0]} 
      onClick={handleShoot}
    >
      {/* Modelo 3D del robot */}
      <primitive object={scene} />
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
        // Alternativa: buscar bug por ID y marcarlo como golpeado
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