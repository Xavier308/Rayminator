// src/components/DebugControls.jsx
// Crea este archivo nuevo para ayudar a posicionar todo correctamente
// This file is not implemented at the moment.

import React, { useState } from 'react';
import { useControls } from 'leva';

function DebugControls({ onPositionChange, onLaserChange }) {
  // Utiliza la librería leva para crear controles interactivos
  const robotValues = useControls('Robot Position', {
    x: { value: 0, min: -20, max: 20, step: 0.1 },
    y: { value: 10, min: -20, max: 20, step: 0.1 },
    z: { value: 0, min: -20, max: 20, step: 0.1 },
    rotationY: { value: Math.PI, min: 0, max: Math.PI * 2, step: 0.1 },
    scaleX: { value: 1, min: 0.1, max: 5, step: 0.1 },
    scaleY: { value: 1, min: 0.1, max: 5, step: 0.1 },
    scaleZ: { value: 1, min: 0.1, max: 5, step: 0.1 },
    modelY: { value: 0, min: -20, max: 20, step: 0.1 }
  });
  
  const laserValues = useControls('Laser Position', {
    x: { value: 0, min: -5, max: 5, step: 0.1 },
    y: { value: -5, min: -20, max: 20, step: 0.1 },
    z: { value: 0, min: -5, max: 5, step: 0.1 },
  });

  // Llamar a los callbacks cada vez que cambian los valores
  React.useEffect(() => {
    if (onPositionChange) {
      onPositionChange({
        position: [robotValues.x, robotValues.y, robotValues.z],
        rotation: robotValues.rotationY,
        scale: [robotValues.scaleX, robotValues.scaleY, robotValues.scaleZ],
        modelY: robotValues.modelY
      });
    }
  }, [robotValues, onPositionChange]);

  React.useEffect(() => {
    if (onLaserChange) {
      onLaserChange([laserValues.x, laserValues.y, laserValues.z]);
    }
  }, [laserValues, onLaserChange]);

  return null; // Este componente no renderiza nada visualmente
}

export default DebugControls;