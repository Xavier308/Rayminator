// src/components/Game.jsx - v4 - Complete and Corrected File
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
import { BugExplosion } from './BugExplosion'; // Make sure the path is correct

// Model URLs
const robotModelUrl = '/models/rayminator.glb';
const beetleModelUrl = '/models/Purple_Beetle.glb';

// ==========================================================================
// === LaserBeam Component =================================================
// ==========================================================================
function LaserBeam({ start, end, active = true, shooting = false }) {
    // Basic props validation
    if (!active || !start || !end) return null;

    // Ensure start/end are valid Vector3
    const startV = useMemo(() => start instanceof THREE.Vector3 ? start : new THREE.Vector3(...(Array.isArray(start) ? start : [0,0,0])), [start]);
    const endV = useMemo(() => end instanceof THREE.Vector3 ? end : new THREE.Vector3(...(Array.isArray(end) ? end : [0,0,0])), [end]);

    // Additional validation for endV (avoid NaN/Infinity)
    if (!endV || !isFinite(endV.x) || !isFinite(endV.y) || !isFinite(endV.z)) {
        // console.warn("LaserBeam received invalid end vector"); // Optional log
        return null;
    }

    // Calculate points for the line
    const points = useMemo(() => [startV.toArray(), endV.toArray()], [startV, endV]);
    // Unique key for re-rendering
    const key = useMemo(() => points.flat().join(','), [points]);

    // Pulse effect
    const pulseRef = useRef(0);
    useFrame(({ clock }) => {
        pulseRef.current = Math.sin(clock.getElapsedTime() * (shooting ? 15 : 5)) * 0.2 + 0.8;
    });

    // Visual properties of the laser
    const mainLineWidth = shooting ? 6 : 3;
    const glowLineWidth = shooting ? 10 : 5;
    const glowOpacity = shooting ? pulseRef.current * 0.8 : pulseRef.current * 0.5;
    const mainColor = shooting ? "#ff3300" : "#ff0000";
    const glowColor = shooting ? "#ff6600" : "#ff6600";

    // Laser rendering
    return (
        <group>
            <Line points={points} color={mainColor} lineWidth={mainLineWidth} transparent={shooting} opacity={shooting ? 0.8 : 1.0} key={key}/>
            <Line points={points} color={glowColor} lineWidth={glowLineWidth} transparent={true} opacity={glowOpacity} key={'glow-' + key} />
            {/* Lights at the ends of the laser */}
            <pointLight position={startV.toArray()} intensity={shooting ? 2 : 0.5} distance={2} color="#ffcc00" />
            <pointLight position={endV.toArray()} intensity={shooting ? 5 : 1} distance={3} color="#ff3300" />
        </group>
    );
}

// ==========================================================================
// === Bug Component =======================================================
// ==========================================================================
function Bug({ bugData, onHit }) {
    const ref = useRef();
    const { id, position, hit, animationIndex } = bugData || {};

    // Initial data validation
    if (!id || !position || animationIndex === undefined) {
        console.error("Bug component received invalid bugData:", bugData);
        return null;
    }

    // Bug's internal state
    const [hovered, setHovered] = useState(false);
    const [isHit, setIsHit] = useState(hit); // Synchronized with 'hit' prop
    const [showExplosion, setShowExplosion] = useState(false);

    // GLTF model loading
    const { scene: bugModel, error: bugModelError } = useGLTF(beetleModelUrl);
    useEffect(() => {
        if (bugModelError) console.error(`Bug ${id}: Model Load Error`, bugModelError);
    }, [bugModelError, id]);

    // Bug's base position (memoized)
    const bugPosition = useMemo(() => new THREE.Vector3(position[0], position[1], position[2] ?? -5), [position]);

    // Effect to set up the 3D model once loaded
    useEffect(() => {
        if (bugModel && ref.current) {
            const clonedModel = bugModel.clone();
            clonedModel.scale.set(0.33, 0.33, 0.33); // Adjust scale
            ref.current.clear(); // Clear previous content
            ref.current.add(clonedModel); // Add model
            ref.current.position.copy(bugPosition); // Set initial position
            ref.current.visible = true; // Ensure visibility
        }
    }, [bugModel, bugPosition]); // Dependencies: model and base position

    // Hover effect (commented, add logic if desired)
    useEffect(() => {
        if (!ref.current || isHit || !bugModel) return;
        // Logic to change appearance on hover here...
        // console.log(`Bug ${id} Hover: ${hovered}`); // Optional log
    }, [hovered, isHit, bugModel, id]);

    // Bug movement animation
    useFrame((state, delta) => {
        if (ref.current && !isHit) { // Only animate if not hit
            try {
                const t = state.clock.elapsedTime;
                const i = animationIndex;
                const px = bugPosition.x, py = bugPosition.y;
                // Calculate new position and rotation
                ref.current.position.x = px + Math.sin(t * 1.5 + i * 0.5) * 0.15;
                ref.current.position.y = py + Math.cos(t * 2 + i * 1.0) * 0.15;
                ref.current.rotation.z = Math.sin(t * 1.2 + i * 0.8) * 0.1;
                ref.current.rotation.x = Math.cos(t * 1.0 + i * 0.6) * 0.05;
            } catch (e) {
                console.error(`Bug ${id} useFrame Error`, e);
            }
        }
    });

    // Effect to process when the bug is hit
    useEffect(() => {
        // Activates when the external 'hit' prop changes to true
        if (hit && !isHit) {
            console.log(`Bug ${id} detected hit=true. Starting hit process.`);
            setIsHit(true); // Updates internal state
            setShowExplosion(true); // Shows explosion
            if (ref.current) ref.current.visible = false; // Hides the model

            setTimeout(() => {
              console.log(`>>> Bug ${id}: Timeout finished. Calling onHit...`);
              if (onHit) {
                  onHit(id);
              }
          }, 1000); // Wait for explosion duration
          // Note: No cleanup here!
        }
    }, [hit, isHit, onHit, id]); // Correct dependencies

    // Conditional rendering of Bug and Explosion
    return (
        <>
            {/* Bug group (visible if not hit) */}
            {!isHit && (
                <group
                    ref={ref}
                    scale={hovered ? 1.1 : 1.0} // Simple hover effect
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                    onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
                    visible={true} // Model added in useEffect
                />
            )}
            {/* Explosion (visible if showExplosion is true) */}
            {showExplosion && (
                <BugExplosion
                    position={bugPosition.toArray()}
                    onComplete={() => setShowExplosion(false)} // Hides when finished
                />
            )}
        </>
    );
}

// ==========================================================================
// === Robot Component =====================================================
// ==========================================================================
function Robot({ onShoot }) {
    const robotGroupRef = useRef(); // Ref for the group containing the model
    const laserOriginRef = useRef(); // Ref for the Object3D that marks the laser's origin
    const { pointer, camera } = useThree(); // R3F hooks

    // Robot's State
    const [isShooting, setIsShooting] = useState(false); // Is visually shooting?
    const [laserStart, setLaserStart] = useState(() => new THREE.Vector3(0, 1, 0)); // Laser's starting point
    const [laserEnd, setLaserEnd] = useState(() => new THREE.Vector3(0, 1, -5)); // Laser's end point (target)
    const [modelLoaded, setModelLoaded] = useState(false); // Is the model loaded?

    // Robot's GLTF model loading
    const { scene: robotScene, error: robotModelError } = useGLTF(robotModelUrl);
    useEffect(() => {
        if (robotModelError) {
            console.error("ROBOT MODEL LOAD ERROR:", robotModelError);
        } else if (robotScene) {
            console.log("Robot model loaded.");
            setModelLoaded(true);
        }
    }, [robotScene, robotModelError]);

    // Setting up the model once loaded
    useEffect(() => {
        if (modelLoaded && robotScene && robotGroupRef.current) {
            const model = robotScene.clone(); // Clone to avoid modifying original
            robotGroupRef.current.clear(); // Clear group
            robotGroupRef.current.add(model); // Add model

            // Create and add helper for laser origin
            const helper = new THREE.Object3D();
            helper.position.set(0, 0.9, 0.4); // Adjust this position if needed
            robotGroupRef.current.add(helper);
            laserOriginRef.current = helper; // Save reference to helper

            // Update matrix and get initial laser position
            robotGroupRef.current.updateMatrixWorld(true);
            const startPos = new THREE.Vector3();
            helper.getWorldPosition(startPos);
            setLaserStart(startPos); // Set initial state
            console.log("Robot model setup complete.");
        }
    }, [modelLoaded, robotScene]);

    // Function to calculate intersection point on Z=-5 plane
    const getTargetWorldPosition = useCallback((pointerCoords, cam) => {
        if (!cam) return new THREE.Vector3(0, 1, -5); // Fallback
        try {
            const vec = new THREE.Vector3(pointerCoords.x, pointerCoords.y, 0.5); // Normalized coords
            vec.unproject(cam); // Project to 3D space
            const dir = vec.sub(cam.position).normalize(); // Direction from camera
            const dist = (-5 - cam.position.z) / dir.z; // Distance to Z=-5 plane

            // Calculation validation
            if (isNaN(dist) || Math.abs(dir.z) < 0.001 || dist <= 0 || dist > 100) {
                // Fallback if unstable: project in pointer direction
                const fbDir = new THREE.Vector3(pointerCoords.x, pointerCoords.y, -1).unproject(cam).sub(cam.position).normalize();
                return cam.position.clone().add(fbDir.multiplyScalar(10)); // Point at 10 units
            }

            // Calculate position on the plane
            const pos = cam.position.clone().add(dir.multiplyScalar(dist));
            // Limit X and Y coordinates
            pos.x = THREE.MathUtils.clamp(pos.x, -15, 15);
            pos.y = THREE.MathUtils.clamp(pos.y, -2, 10);
            pos.z = -5; // Ensure Z=-5
            return pos;
        } catch (e) {
            console.error("Error calculating target position:", e);
            return new THREE.Vector3(0, 1, -5); // Fallback on error
        }
    }, []); // No external dependencies

    // Animation loop (useFrame) for rotation and laser
    useFrame(() => {
        // Exit if not ready
        if (!robotGroupRef.current || !modelLoaded || !camera) return;

        try {
            // Calculate current target point based on pointer
            const target = getTargetWorldPosition(pointer, camera);

            // Calculate current laser starting point
            const start = new THREE.Vector3();
            if (laserOriginRef.current) {
                laserOriginRef.current.getWorldPosition(start);
            } else { // Fallback if helper is not ready
                robotGroupRef.current.getWorldPosition(start);
                start.y += 0.9;
            }

            // Update visual laser state if changed significantly
            if (target && isFinite(target.x)) { // Validate target
                if (target.distanceTo(laserEnd) > 0.01) {
                    setLaserEnd(target);
                }
            }
            if (start.distanceTo(laserStart) > 0.01) {
                setLaserStart(start);
            }

            // Calculate and apply smooth rotation (Lerp) of the robot
            const robotPos = robotGroupRef.current.position; // Assumes robot at [0,0,0]
            const direction = target.clone().sub(robotPos);
            const angleY = Math.atan2(direction.x, direction.z); // Y rotation
            const horizontalDist = Math.max(0.01, Math.sqrt(direction.x**2 + direction.z**2));
            const angleX = Math.atan2(-direction.y, horizontalDist); // X rotation
            const clampedAngleX = THREE.MathUtils.clamp(angleX, -Math.PI * 0.4, Math.PI * 0.4); // Limit X angle

            robotGroupRef.current.rotation.y = THREE.MathUtils.lerp(robotGroupRef.current.rotation.y, angleY, 0.1);
            robotGroupRef.current.rotation.x = THREE.MathUtils.lerp(robotGroupRef.current.rotation.x, clampedAngleX, 0.1);

        } catch (e) {
            console.error("Error in Robot useFrame:", e);
        }
    });

    // Internal function to handle shoot logic
    const internalHandleShoot = useCallback((overrideTarget = null) => {
      // Determine the end point to use (override or laserEnd state)
      const finalTarget = overrideTarget instanceof THREE.Vector3 && isFinite(overrideTarget.x)
                         ? overrideTarget
                         : (laserEnd instanceof THREE.Vector3 && isFinite(laserEnd.x) ? laserEnd.clone() : new THREE.Vector3(0, 1, -5)); // Fallback
    
      // Play laser sound if available
      if (window.playLaser) {
        window.playLaser();
      }
    
      // Call the onShoot function passed from Game
      if (typeof onShoot === 'function') {
        try { onShoot(finalTarget); } catch (e) { console.error("Error calling onShoot prop:", e); }
      } else { console.warn("onShoot prop is not a function!"); }
    
      // Activate visual shooting effect
      setIsShooting(true);
      setTimeout(() => setIsShooting(false), 150); // Visual effect duration
    }, [onShoot, laserEnd]); // Dependencies

    // Listener for 'F' key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault(); // Prevent default behavior (e.g., search)
                internalHandleShoot(); // Call WITHOUT override (uses laserEnd state)
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        // Cleanup when unmounting
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [internalHandleShoot]); // Correct dependency

    // Listener for click on invisible mesh
    const handleMeshClick = useCallback((event) => {
        event.stopPropagation(); // Stop propagation
        // Calculate the EXACT target point at the time of click
        const clickTargetPoint = getTargetWorldPosition(pointer, camera);
        // Call the shoot logic WITH the calculated point
        internalHandleShoot(clickTargetPoint);
    }, [internalHandleShoot, getTargetWorldPosition, pointer, camera]); // Necessary dependencies

    // Check before rendering
    if (!modelLoaded && !robotModelError) return null; // Waiting for model
    if (robotModelError) return <Text color="red">Robot Load Error</Text>; // Error

    // Robot JSX
    return (
        <group>
            {/* Group containing the model and helper */}
            <group ref={robotGroupRef} />

            {/* Large invisible mesh to make clicking easier */}
            <mesh position={[0, 1, 0]} onClick={handleMeshClick} visible={false}>
                <boxGeometry args={[3, 3, 3]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide}/>
            </mesh>

            {/* Visual laser component */}
            <LaserBeam start={laserStart} end={laserEnd} active={true} shooting={isShooting} />
        </group>
    );
}


// ==========================================================================
// === Main Game Component ============================================
// ==========================================================================
function Game({ onScoreChange }) {
    // Game State
    const [bugs, setBugs] = useState([]); // Array of active bugs (Source of truth!)
    const [score, setScore] = useState(0); // Current score
    const [level, setLevel] = useState(1); // Current level

    // --- Lifecycle Effects and State ---

    // Initial bug generation and when level changes
    useEffect(() => {
        const bugCount = 5 + level * 2; // Number of bugs based on level
        const newBugs = Array.from({ length: bugCount }, (_, i) => ({
            id: `${level}-${i}-${Math.random().toString(16).slice(2)}`, // Unique ID
            position: [
                Math.random() * 14 - 7,    // X: -7 to 7
                Math.random() * 1 + 2.0, // Y: 0.5 to 3.0
                -5                         // Z: Fixed at -5
            ],
            hit: false, // Initial state: not hit
        }));
        console.log(`Game: Generating ${newBugs.length} bugs for level ${level}`);
        setBugs(newBugs); // Set bug array in state
    }, [level]); // Executes only when 'level' changes

    // Notify score change to parent component (if exists)
    useEffect(() => {
        if (onScoreChange) {
            onScoreChange(score);
        }
    }, [score, onScoreChange]); // Executes when 'score' changes

    // Check if level is completed
    useEffect(() => {
      // Debug log for state in each check
      console.log(`--- Level Check --- Bugs State Length: ${bugs.length}, Score: ${score}, Level: ${level}`);

      // Condition: No bugs left (empty array) AND some score has been earned
      if (bugs.length === 0 && score > 0) {
        console.log(`%c>>> LEVEL ${level} COMPLETE! Setting timeout for level ${level + 1}`, 'color: green; font-weight: bold;');
        
        // Play level complete sound if available
        if (window.playLevelComplete) {
          window.playLevelComplete();
        }
        
        // Start timer to advance to next level
        const timerId = setTimeout(() => {
          console.log(`%c>>> Timeout Fired! Advancing to level ${level + 1}`, 'color: blue; font-weight: bold;');
          setLevel(prevLevel => prevLevel + 1); // Update level state
        }, 2500); // Wait 2.5 seconds

        // Cleanup function for timer
        return () => {
          console.log(`>>> Cleanup: Clearing level timer ${timerId} for level ${level}.`);
          clearTimeout(timerId);
        };
      }
      // If condition is not met, do nothing
    }, [bugs, score, level]); // Dependencies: 'bugs', 'score', and 'level' states

    // --- Callbacks ---

    // Callback to remove bug data (passed to Bug component)
    // FIXED! Uses functional form of setBugs.
    const handleBugRemoval = useCallback((idToRemove) => {
        setBugs(currentBugs => {
            console.log(`>>> handleBugRemoval ID: ${idToRemove}. Bugs BEFORE (in updater): ${currentBugs.length}`);
            const nextBugs = currentBugs.filter(bug => bug.id !== idToRemove);
            console.log(`>>> Setting bugs via handleBugRemoval. Bugs AFTER (in updater): ${nextBugs.length}`);
            return nextBugs;
        });
    }, []); // No longer needs dependencies because it uses functional form

    // Callback to handle shooting (passed to Robot component)
    // FIXED! Uses functional form of setBugs to mark hits.
    const handleShoot = useCallback((targetPoint) => {
        // Target point validation
        if (!(targetPoint instanceof THREE.Vector3) || !isFinite(targetPoint.x)) {
            console.error("Invalid target point received in handleShoot", targetPoint);
            return;
        }

        const hitRadius = 0.5; // Impact radius
        let hitOccurred = false;
        let hitCount = 0; // Counter for how many were hit in this shot

        // Update 'bugs' state using functional form
        setBugs(currentBugs => {
            const updatedBugs = currentBugs.map(bug => {
                // If already marked as 'hit', don't process it again
                if (bug.hit) return bug;

                const bugPos = new THREE.Vector3(bug.position[0], bug.position[1], bug.position[2] ?? -5);
                const distance = targetPoint.distanceTo(bugPos);

                if (distance < hitRadius) {
                    hitOccurred = true; // Mark that at least one hit occurred
                    hitCount++; // Increment counter
                    return { ...bug, hit: true }; // Return bug marked as hit
                }
                return bug; // Return bug unchanged
            });

            // If there was any hit, log and return updated array
            if (hitOccurred) {
                console.log(`>>> handleShoot: ${hitCount} hit(s) detected. Returning updated bugs array.`);
            }
            // Always return array (modified or not)
            return updatedBugs;
        });

        // Update score AFTER bugs state update, if there were hits
        if (hitOccurred) {
            setScore(prevScore => prevScore + 100 * level * hitCount); // Add points for each hit
        }

    }, [level]); // Depends on 'level' for scoring

    // --- Game Component Rendering ---
    return (
        <>
            {/* Scene Configuration */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.0} castShadow />
            <Environment preset="sunset" />

            {/* User Interface (Text) */}
            <Text
                position={[0, 3.8, -3]} // Text position
                fontSize={0.3}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.03}
                outlineColor="#000000"
            >
                {/* Shows current game information */}
                {/*Level: {level} | Score: {score} | Bugs Left: {bugs.filter(b => !b.hit).length}*/}
                {/*{'\n'}(Shoot: F / Click Robot Zone)*/}
            </Text>

            {/* Robot (with Suspense for loading) */}
            <Suspense fallback={<Text position={[0, 1, 0]} color="yellow" fontSize={0.2}>Loading Robot...</Text>}>
                <Robot onShoot={handleShoot} />
            </Suspense>

            {/* Bugs Rendering */}
            {/* Map directly over 'bugs' state */}
            {bugs.map((bug, index) => (
                <Bug
                    key={bug.id} // Unique key for React
                    bugData={{ ...bug, animationIndex: index }} // Pass data and index for animation
                    onHit={handleBugRemoval} // Pass callback to remove data
                />
            ))}

            {/* Level Completed Message (Conditional) */}
            {/* Shown if no bugs left and there's a score */}
            {bugs.length === 0 && score > 0 && (
                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                    <Text
                        position={[0, 2, 0]} // Message position -4
                        fontSize={0.6}
                        color="#FFD700" // Gold color
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.05}
                        outlineColor="#000000"
                        textAlign="center" // Center text
                    >
                        {`Level ${level} Cleared!`} {/* Shows current completed level */}
                        {'\n'}Loading Next...
                    </Text>
                </Float>
            )}
        </>
    );
}

// Export Game component as default
export default Game;
