import * as THREE from 'three';

// Convierte coordenadas 3D a coordenadas de pantalla
export function worldToScreen(worldPosition, camera, renderer) {
    const vector = new THREE.Vector3().copy(worldPosition);
    vector.project(camera);
    
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;
    
    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf
    };
  }
  
  // Actualiza la visualización del láser CSS
  export function updateCssLaser(startPos, endPos, camera, isActive = false) {
    // Obtener elemento del DOM
    const laserBeam = document.getElementById('laser-beam');
    const laserImpact = document.getElementById('laser-impact');
    
    if (!laserBeam || !laserImpact) return;
    
    // Convertir posiciones 3D a coordenadas de pantalla
    const startScreen = worldToScreen(startPos, camera);
    const endScreen = worldToScreen(endPos, camera);
    
    // Calcular distancia y ángulo
    const dx = endScreen.x - startScreen.x;
    const dy = endScreen.y - startScreen.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Actualizar posición y rotación del láser
    laserBeam.style.width = `${distance}px`;
    laserBeam.style.height = '4px';
    laserBeam.style.left = `${startScreen.x}px`;
    laserBeam.style.top = `${startScreen.y}px`;
    laserBeam.style.transform = `rotate(${angle}rad)`;
    
    // Actualizar posición del punto de impacto
    laserImpact.style.left = `${endScreen.x}px`;
    laserImpact.style.top = `${endScreen.y}px`;
    
    // Activar o desactivar visibilidad
    if (isActive) {
      laserBeam.classList.add('active');
      laserImpact.classList.add('active');
    } else {
      laserBeam.classList.remove('active');
      laserImpact.classList.remove('active');
    }
  }
