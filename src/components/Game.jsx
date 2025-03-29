// src/components/Game.jsx - v4 - Archivo Completo y Corregido
import React, { useRef, useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
    useGLTF,
    Environment,
    Text,
    Float,
    Line,
} from '@react-three/drei';
import * as THREE from 'three';
import { BugExplosion } from './BugExplosion'; // Asegúrate que la ruta sea correcta

// URLs de Modelos
const robotModelUrl = '/models/rayminator.glb';
const beetleModelUrl = '/models/Purple_Beetle.glb';

// ==========================================================================
// === Componente LaserBeam =================================================
// ==========================================================================
function LaserBeam({ start, end, active = true, shooting = false }) {
    // Validación básica de props
    if (!active || !start || !end) return null;

    // Asegurar que start/end sean Vector3 válidos
    const startV = useMemo(() => start instanceof THREE.Vector3 ? start : new THREE.Vector3(...(Array.isArray(start) ? start : [0,0,0])), [start]);
    const endV = useMemo(() => end instanceof THREE.Vector3 ? end : new THREE.Vector3(...(Array.isArray(end) ? end : [0,0,0])), [end]);

    // Validación adicional para endV (evitar NaN/Infinity)
    if (!endV || !isFinite(endV.x) || !isFinite(endV.y) || !isFinite(endV.z)) {
        // console.warn("LaserBeam received invalid end vector"); // Log opcional
        return null;
    }

    // Calcular puntos para la línea
    const points = useMemo(() => [startV.toArray(), endV.toArray()], [startV, endV]);
    // Clave única para re-renderizado
    const key = useMemo(() => points.flat().join(','), [points]);

    // Efecto de pulso
    const pulseRef = useRef(0);
    useFrame(({ clock }) => {
        pulseRef.current = Math.sin(clock.getElapsedTime() * (shooting ? 15 : 5)) * 0.2 + 0.8;
    });

    // Propiedades visuales del láser
    const mainLineWidth = shooting ? 6 : 3;
    const glowLineWidth = shooting ? 10 : 5;
    const glowOpacity = shooting ? pulseRef.current * 0.8 : pulseRef.current * 0.5;
    const mainColor = shooting ? "#ff3300" : "#ff0000";
    const glowColor = shooting ? "#ff6600" : "#ff6600";

    // Renderizado del láser
    return (
        <group>
            <Line points={points} color={mainColor} lineWidth={mainLineWidth} transparent={shooting} opacity={shooting ? 0.8 : 1.0} key={key}/>
            <Line points={points} color={glowColor} lineWidth={glowLineWidth} transparent={true} opacity={glowOpacity} key={'glow-' + key} />
            {/* Luces en los extremos del láser */}
            <pointLight position={startV.toArray()} intensity={shooting ? 2 : 0.5} distance={2} color="#ffcc00" />
            <pointLight position={endV.toArray()} intensity={shooting ? 5 : 1} distance={3} color="#ff3300" />
        </group>
    );
}

// ==========================================================================
// === Componente Bug =======================================================
// ==========================================================================
function Bug({ bugData, onHit }) {
    const ref = useRef();
    const { id, position, hit, animationIndex } = bugData || {};

    // Validación inicial de datos
    if (!id || !position || animationIndex === undefined) {
        console.error("Bug component received invalid bugData:", bugData);
        return null;
    }

    // Estado interno del Bug
    const [hovered, setHovered] = useState(false);
    const [isHit, setIsHit] = useState(hit); // Sincronizado con la prop 'hit'
    const [showExplosion, setShowExplosion] = useState(false);

    // Carga del modelo GLTF
    const { scene: bugModel, error: bugModelError } = useGLTF(beetleModelUrl);
    useEffect(() => {
        if (bugModelError) console.error(`Bug ${id}: Model Load Error`, bugModelError);
    }, [bugModelError, id]);

    // Posición base del bug (memoizada)
    const bugPosition = useMemo(() => new THREE.Vector3(position[0], position[1], position[2] ?? -5), [position]);

    // Efecto para configurar el modelo 3D una vez cargado
    useEffect(() => {
        if (bugModel && ref.current) {
            const clonedModel = bugModel.clone();
            clonedModel.scale.set(0.33, 0.33, 0.33); // Ajustar escala
            ref.current.clear(); // Limpiar contenido anterior
            ref.current.add(clonedModel); // Añadir modelo
            ref.current.position.copy(bugPosition); // Establecer posición inicial
            ref.current.visible = true; // Asegurar visibilidad
        }
    }, [bugModel, bugPosition]); // Dependencias: modelo y posición base

    // Efecto Hover (comentado, añadir lógica si se desea)
    useEffect(() => {
        if (!ref.current || isHit || !bugModel) return;
        // Lógica para cambiar apariencia en hover aquí...
        // console.log(`Bug ${id} Hover: ${hovered}`); // Log opcional
    }, [hovered, isHit, bugModel, id]);

    // Animación de movimiento del bug
    useFrame((state, delta) => {
        if (ref.current && !isHit) { // Solo animar si no está golpeado
            try {
                const t = state.clock.elapsedTime;
                const i = animationIndex;
                const px = bugPosition.x, py = bugPosition.y;
                // Calcular nueva posición y rotación
                ref.current.position.x = px + Math.sin(t * 1.5 + i * 0.5) * 0.15;
                ref.current.position.y = py + Math.cos(t * 2 + i * 1.0) * 0.15;
                ref.current.rotation.z = Math.sin(t * 1.2 + i * 0.8) * 0.1;
                ref.current.rotation.x = Math.cos(t * 1.0 + i * 0.6) * 0.05;
            } catch (e) {
                console.error(`Bug ${id} useFrame Error`, e);
            }
        }
    });

    // Efecto para procesar cuando el bug es golpeado
    useEffect(() => {
        // Se activa cuando la prop 'hit' externa cambia a true
        if (hit && !isHit) {
            console.log(`Bug ${id} detectó hit=true. Iniciando proceso de hit.`);
            setIsHit(true); // Actualiza estado interno
            setShowExplosion(true); // Muestra explosión
            if (ref.current) ref.current.visible = false; // Oculta el modelo

            setTimeout(() => {
              console.log(`>>> Bug ${id}: Timeout finished. Calling onHit...`);
              if (onHit) {
                  onHit(id);
              }
          }, 1000); // Wait for explosion duration
          // Note: No cleanup here!
        }
    }, [hit, isHit, onHit, id]); // Dependencias correctas

    // Renderizado condicional del Bug y la Explosión
    return (
        <>
            {/* Grupo del bug (visible si no está golpeado) */}
            {!isHit && (
                <group
                    ref={ref}
                    scale={hovered ? 1.1 : 1.0} // Efecto hover simple
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                    onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
                    visible={true} // Modelo se añade en useEffect
                />
            )}
            {/* Explosión (visible si showExplosion es true) */}
            {showExplosion && (
                <BugExplosion
                    position={bugPosition.toArray()}
                    onComplete={() => setShowExplosion(false)} // Oculta al terminar
                />
            )}
        </>
    );
}

// ==========================================================================
// === Componente Robot =====================================================
// ==========================================================================
function Robot({ onShoot }) {
    const robotGroupRef = useRef(); // Ref para el grupo que contiene el modelo
    const laserOriginRef = useRef(); // Ref para el Object3D que marca el origen del láser
    const { pointer, camera } = useThree(); // Hooks de R3F

    // Estado del Robot
    const [isShooting, setIsShooting] = useState(false); // ¿Está disparando visualmente?
    const [laserStart, setLaserStart] = useState(() => new THREE.Vector3(0, 1, 0)); // Punto de inicio del láser
    const [laserEnd, setLaserEnd] = useState(() => new THREE.Vector3(0, 1, -5)); // Punto final (objetivo) del láser
    const [modelLoaded, setModelLoaded] = useState(false); // ¿Se cargó el modelo?

    // Carga del modelo GLTF del robot
    const { scene: robotScene, error: robotModelError } = useGLTF(robotModelUrl);
    useEffect(() => {
        if (robotModelError) {
            console.error("ROBOT MODEL LOAD ERROR:", robotModelError);
        } else if (robotScene) {
            console.log("Robot model loaded.");
            setModelLoaded(true);
        }
    }, [robotScene, robotModelError]);

    // Configuración del modelo una vez cargado
    useEffect(() => {
        if (modelLoaded && robotScene && robotGroupRef.current) {
            const model = robotScene.clone(); // Clonar para evitar modificar original
            robotGroupRef.current.clear(); // Limpiar grupo
            robotGroupRef.current.add(model); // Añadir modelo

            // Crear y añadir helper para origen del láser
            const helper = new THREE.Object3D();
            helper.position.set(0, 0.9, 0.4); // Ajustar esta posición si es necesario
            robotGroupRef.current.add(helper);
            laserOriginRef.current = helper; // Guardar referencia al helper

            // Actualizar matriz y obtener posición inicial del láser
            robotGroupRef.current.updateMatrixWorld(true);
            const startPos = new THREE.Vector3();
            helper.getWorldPosition(startPos);
            setLaserStart(startPos); // Establecer estado inicial
            console.log("Robot model setup complete.");
        }
    }, [modelLoaded, robotScene]);

    // Función para calcular el punto de intersección en el plano Z=-5
    const getTargetWorldPosition = useCallback((pointerCoords, cam) => {
        if (!cam) return new THREE.Vector3(0, 1, -5); // Fallback
        try {
            const vec = new THREE.Vector3(pointerCoords.x, pointerCoords.y, 0.5); // Coords normalizadas
            vec.unproject(cam); // Proyectar al espacio 3D
            const dir = vec.sub(cam.position).normalize(); // Dirección desde la cámara
            const dist = (-5 - cam.position.z) / dir.z; // Distancia al plano Z=-5

            // Validación del cálculo
            if (isNaN(dist) || Math.abs(dir.z) < 0.001 || dist <= 0 || dist > 100) {
                // Fallback si es inestable: proyectar en dirección del puntero
                const fbDir = new THREE.Vector3(pointerCoords.x, pointerCoords.y, -1).unproject(cam).sub(cam.position).normalize();
                return cam.position.clone().add(fbDir.multiplyScalar(10)); // Punto a 10 unidades
            }

            // Calcular posición en el plano
            const pos = cam.position.clone().add(dir.multiplyScalar(dist));
            // Limitar coordenadas X e Y
            pos.x = THREE.MathUtils.clamp(pos.x, -15, 15);
            pos.y = THREE.MathUtils.clamp(pos.y, -2, 10);
            pos.z = -5; // Asegurar Z=-5
            return pos;
        } catch (e) {
            console.error("Error calculating target position:", e);
            return new THREE.Vector3(0, 1, -5); // Fallback en error
        }
    }, []); // Sin dependencias externas

    // Bucle de animación (useFrame) para rotación y láser
    useFrame(() => {
        // Salir si no está listo
        if (!robotGroupRef.current || !modelLoaded || !camera) return;

        try {
            // Calcular punto objetivo actual basado en el puntero
            const target = getTargetWorldPosition(pointer, camera);

            // Calcular punto de inicio actual del láser
            const start = new THREE.Vector3();
            if (laserOriginRef.current) {
                laserOriginRef.current.getWorldPosition(start);
            } else { // Fallback si el helper no está listo
                robotGroupRef.current.getWorldPosition(start);
                start.y += 0.9;
            }

            // Actualizar estado del láser visual si cambió significativamente
            if (target && isFinite(target.x)) { // Validar target
                if (target.distanceTo(laserEnd) > 0.01) {
                    setLaserEnd(target);
                }
            }
            if (start.distanceTo(laserStart) > 0.01) {
                setLaserStart(start);
            }

            // Calcular y aplicar rotación suave (Lerp) del robot
            const robotPos = robotGroupRef.current.position; // Asume robot en [0,0,0]
            const direction = target.clone().sub(robotPos);
            const angleY = Math.atan2(direction.x, direction.z); // Rotación Y
            const horizontalDist = Math.max(0.01, Math.sqrt(direction.x**2 + direction.z**2));
            const angleX = Math.atan2(-direction.y, horizontalDist); // Rotación X
            const clampedAngleX = THREE.MathUtils.clamp(angleX, -Math.PI * 0.4, Math.PI * 0.4); // Limitar ángulo X

            robotGroupRef.current.rotation.y = THREE.MathUtils.lerp(robotGroupRef.current.rotation.y, angleY, 0.1);
            robotGroupRef.current.rotation.x = THREE.MathUtils.lerp(robotGroupRef.current.rotation.x, clampedAngleX, 0.1);

        } catch (e) {
            console.error("Error in Robot useFrame:", e);
        }
    });

    // Función interna para manejar la lógica del disparo
    const internalHandleShoot = useCallback((overrideTarget = null) => {
        // Determina el punto final a usar (override o estado laserEnd)
        const finalTarget = overrideTarget instanceof THREE.Vector3 && isFinite(overrideTarget.x)
                           ? overrideTarget
                           : (laserEnd instanceof THREE.Vector3 && isFinite(laserEnd.x) ? laserEnd.clone() : new THREE.Vector3(0, 1, -5)); // Fallback

        // Llama a la función onShoot pasada desde Game
        if (typeof onShoot === 'function') {
            try { onShoot(finalTarget); } catch (e) { console.error("Error calling onShoot prop:", e); }
        } else { console.warn("onShoot prop is not a function!"); }

        // Activa el efecto visual del disparo
        setIsShooting(true);
        setTimeout(() => setIsShooting(false), 150); // Duración del efecto visual
    }, [onShoot, laserEnd]); // Dependencias

    // Listener para la tecla 'F'
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault(); // Evitar comportamiento por defecto (ej: buscar)
                internalHandleShoot(); // Llama SIN override (usa el estado laserEnd)
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        // Limpieza al desmontar
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [internalHandleShoot]); // Dependencia correcta

    // Listener para el clic en la malla invisible
    const handleMeshClick = useCallback((event) => {
        event.stopPropagation(); // Detener propagación
        // Calcula el punto objetivo EXACTO en el momento del clic
        const clickTargetPoint = getTargetWorldPosition(pointer, camera);
        // Llama a la lógica de disparo CON el punto calculado
        internalHandleShoot(clickTargetPoint);
    }, [internalHandleShoot, getTargetWorldPosition, pointer, camera]); // Dependencias necesarias

    // Comprobación antes de renderizar
    if (!modelLoaded && !robotModelError) return null; // Esperando modelo
    if (robotModelError) return <Text color="red">Robot Load Error</Text>; // Error

    // JSX del Robot
    return (
        <group>
            {/* Grupo que contiene el modelo y el helper */}
            <group ref={robotGroupRef} />

            {/* Malla invisible grande para facilitar el clic */}
            <mesh position={[0, 1, 0]} onClick={handleMeshClick} visible={false}>
                <boxGeometry args={[3, 3, 3]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide}/>
            </mesh>

            {/* Componente visual del láser */}
            <LaserBeam start={laserStart} end={laserEnd} active={true} shooting={isShooting} />
        </group>
    );
}


// ==========================================================================
// === Componente Principal Game ============================================
// ==========================================================================
function Game({ onScoreChange }) {
    // Estado del Juego
    const [bugs, setBugs] = useState([]); // Array de bugs activos (¡Fuente de verdad!)
    const [score, setScore] = useState(0); // Puntuación actual
    const [level, setLevel] = useState(1); // Nivel actual

    // --- Efectos del Ciclo de Vida y Estado ---

    // Generación inicial de bugs y cuando cambia el nivel
    useEffect(() => {
        const bugCount = 5 + level * 2; // Número de bugs según el nivel
        const newBugs = Array.from({ length: bugCount }, (_, i) => ({
            id: `${level}-${i}-${Math.random().toString(16).slice(2)}`, // ID único
            position: [
                Math.random() * 14 - 7,    // X: -7 a 7
                Math.random() * 1 + 2.0, // Y: 0.5 a 3.0
                -5                         // Z: Fijo en -5
            ],
            hit: false, // Estado inicial: no golpeado
        }));
        console.log(`Game: Generando ${newBugs.length} bugs para nivel ${level}`);
        setBugs(newBugs); // Establece el array de bugs en el estado
    }, [level]); // Se ejecuta solo cuando 'level' cambia

    // Notificar cambio de puntuación al componente padre (si existe)
    useEffect(() => {
        if (onScoreChange) {
            onScoreChange(score);
        }
    }, [score, onScoreChange]); // Se ejecuta cuando 'score' cambia

    // Comprobar si el nivel está completado
    useEffect(() => {
        // Log para depurar el estado en cada comprobación
        console.log(`--- Level Check --- Bugs State Length: ${bugs.length}, Score: ${score}, Level: ${level}`);

        // Condición: No quedan bugs (array vacío) Y ya se ha puntuado algo
        if (bugs.length === 0 && score > 0) {
            console.log(`%c>>> LEVEL ${level} COMPLETE! Setting timeout for level ${level + 1}`, 'color: green; font-weight: bold;');
            // Iniciar temporizador para pasar al siguiente nivel
            const timerId = setTimeout(() => {
                console.log(`%c>>> Timeout Fired! Advancing to level ${level + 1}`, 'color: blue; font-weight: bold;');
                setLevel(prevLevel => prevLevel + 1); // Actualiza el estado del nivel
            }, 2500); // Espera 2.5 segundos

            // Función de limpieza para el temporizador
            return () => {
                console.log(`>>> Cleanup: Clearing level timer ${timerId} for level ${level}.`);
                clearTimeout(timerId);
             };
        }
        // Si la condición no se cumple, no se hace nada
    }, [bugs, score, level]); // Dependencias: el estado 'bugs', 'score', y 'level'

    // --- Callbacks ---

    // Callback para eliminar los datos de un bug (pasado al componente Bug)
    // ¡CORREGIDO! Usa la forma funcional de setBugs.
    const handleBugRemoval = useCallback((idToRemove) => {
        setBugs(currentBugs => {
            console.log(`>>> handleBugRemoval ID: ${idToRemove}. Bugs ANTES (en updater): ${currentBugs.length}`);
            const nextBugs = currentBugs.filter(bug => bug.id !== idToRemove);
            console.log(`>>> Setting bugs via handleBugRemoval. Bugs DESPUÉS (en updater): ${nextBugs.length}`);
            return nextBugs;
        });
    }, []); // Ya no necesita dependencias porque usa la forma funcional

    // Callback para manejar el disparo (pasado al componente Robot)
    // ¡CORREGIDO! Usa la forma funcional de setBugs para marcar hits.
    const handleShoot = useCallback((targetPoint) => {
        // Validación del punto objetivo
        if (!(targetPoint instanceof THREE.Vector3) || !isFinite(targetPoint.x)) {
            console.error("Invalid target point received in handleShoot", targetPoint);
            return;
        }

        const hitRadius = 0.5; // Radio de impacto
        let hitOccurred = false;
        let hitCount = 0; // Contador de cuántos se golpearon en este disparo

        // Actualiza el estado 'bugs' usando la forma funcional
        setBugs(currentBugs => {
            const updatedBugs = currentBugs.map(bug => {
                // Si ya está marcado como 'hit', no lo proceses de nuevo
                if (bug.hit) return bug;

                const bugPos = new THREE.Vector3(bug.position[0], bug.position[1], bug.position[2] ?? -5);
                const distance = targetPoint.distanceTo(bugPos);

                if (distance < hitRadius) {
                    hitOccurred = true; // Marca que hubo al menos un hit
                    hitCount++; // Incrementa el contador
                    return { ...bug, hit: true }; // Devuelve el bug marcado como golpeado
                }
                return bug; // Devuelve el bug sin cambios
            });

            // Si hubo algún hit, loguea y devuelve el array actualizado
            if (hitOccurred) {
                console.log(`>>> handleShoot: ${hitCount} hit(s) detected. Returning updated bugs array.`);
            }
            // Siempre devuelve el array (modificado o no)
            return updatedBugs;
        });

        // Actualiza la puntuación DESPUÉS de la actualización de estado de bugs, si hubo hits
        if (hitOccurred) {
            setScore(prevScore => prevScore + 100 * level * hitCount); // Suma puntos por cada hit
        }

    }, [level]); // Depende de 'level' para la puntuación

    // --- Renderizado del Componente Game ---
    return (
        <>
            {/* Configuración de la Escena */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.0} castShadow />
            <Environment preset="sunset" />

            {/* Interfaz de Usuario (Texto) */}
            <Text
                position={[0, 3.8, -3]} // Posición del texto
                fontSize={0.3}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.03}
                outlineColor="#000000"
            >
                {/* Muestra información actual del juego */}
                {/*Level: {level} | Score: {score} | Bugs Left: {bugs.filter(b => !b.hit).length}*/}
                {/*{'\n'}(Shoot: F / Click Robot Zone)*/}
            </Text>

            {/* Robot (con Suspense para carga) */}
            <Suspense fallback={<Text position={[0, 1, 0]} color="yellow" fontSize={0.2}>Loading Robot...</Text>}>
                <Robot onShoot={handleShoot} />
            </Suspense>

            {/* Renderizado de los Bugs */}
            {/* Mapea directamente sobre el estado 'bugs' */}
            {bugs.map((bug, index) => (
                <Bug
                    key={bug.id} // Clave única para React
                    bugData={{ ...bug, animationIndex: index }} // Pasa datos y el índice para animación
                    onHit={handleBugRemoval} // Pasa el callback para eliminar datos
                />
            ))}

            {/* Mensaje de Nivel Completado (Condicional) */}
            {/* Se muestra si no quedan bugs y hay puntuación */}
            {bugs.length === 0 && score > 0 && (
                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                    <Text
                        position={[0, 2, 0]} // Posición del mensaje -4
                        fontSize={0.6}
                        color="#FFD700" // Color dorado
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.05}
                        outlineColor="#000000"
                        textAlign="center" // Centrar texto
                    >
                        {`Level ${level} Cleared!`} {/* Muestra el nivel actual completado */}
                        {'\n'}Loading Next...
                    </Text>
                </Float>
            )}
        </>
    );
}

// Exportar el componente Game como default
export default Game;