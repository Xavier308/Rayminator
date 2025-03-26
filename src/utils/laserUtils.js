import * as THREE from 'three';

// Convierte coordenadas 3D a coordenadas de pantalla
export function worldToScreen(worldPosition, camera) {
  try {
    if (!worldPosition || !camera) {
      console.error("worldToScreen: posición o cámara invalida", {worldPosition, camera});
      return {x: 0, y: 0};
    }
    
    const vector = new THREE.Vector3();
    
    // Copia la posición si es un Vector3, o crea uno nuevo si es un array
    if (worldPosition instanceof THREE.Vector3) {
      vector.copy(worldPosition);
    } else if (Array.isArray(worldPosition) && worldPosition.length >= 3) {
      vector.set(worldPosition[0], worldPosition[1], worldPosition[2]);
    } else {
      console.error("worldToScreen: formato de posición inválido", worldPosition);
      return {x: 0, y: 0};
    }
    
    // Proyectar al espacio de pantalla
    vector.project(camera);
    
    // Convertir a coordenadas de pantalla
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;
    
    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf
    };
  } catch (error) {
    console.error("Error en worldToScreen:", error);
    return {x: 0, y: 0};
  }
}

// Actualiza la visualización del láser CSS con más logs de debugging
export function updateCssLaser(startPos, endPos, camera, isActive = false) {
  try {
    console.log("updateCssLaser llamado", {
      startPos: startPos instanceof THREE.Vector3 ? 
        {x: startPos.x, y: startPos.y, z: startPos.z} : 
        startPos,
      endPos: endPos instanceof THREE.Vector3 ? 
        {x: endPos.x, y: endPos.y, z: endPos.z} : 
        endPos,
      isActive
    });
    
    // Obtener elemento del DOM
    const laserBeam = document.getElementById('laser-beam');
    const laserImpact = document.getElementById('laser-impact');
    
    if (!laserBeam || !laserImpact) {
      console.error("No se encontraron elementos del láser", {
        laserBeam: !!laserBeam,
        laserImpact: !!laserImpact
      });
      return;
    }
    
    // Convertir posiciones 3D a coordenadas de pantalla
    const startScreen = worldToScreen(startPos, camera);
    const endScreen = worldToScreen(endPos, camera);
    
    console.log("Coordenadas de pantalla calculadas", {startScreen, endScreen});
    
    // Calcular distancia y ángulo
    const dx = endScreen.x - startScreen.x;
    const dy = endScreen.y - startScreen.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    console.log("Geometría del láser calculada", {distance, angle: angle * (180/Math.PI)});
    
    // Actualizar posición y rotación del láser
    laserBeam.style.width = `${distance}px`;
    laserBeam.style.left = `${startScreen.x}px`;
    laserBeam.style.top = `${startScreen.y}px`;
    laserBeam.style.transform = `rotate(${angle}rad)`;
    
    // Actualizar posición del punto de impacto
    laserImpact.style.left = `${endScreen.x}px`;
    laserImpact.style.top = `${endScreen.y}px`;
    
    // Activar o desactivar visibilidad
    if (isActive) {
      laserBeam.style.opacity = "1"; // Usar estilo directo en lugar de clase
      laserImpact.style.opacity = "1";
      console.log("Láser activado");
    } else {
      laserBeam.style.opacity = "0";
      laserImpact.style.opacity = "0";
      console.log("Láser desactivado");
    }
  } catch (error) {
    console.error("Error en updateCssLaser:", error);
  }
}
