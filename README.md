# Rayminator

A 3D browser-based game where programmers can relieve stress by shooting laser beams at bugs - literally!

## Overview

Rayminator is a first-person shooter game created specifically for programmers to relieve stress. Control a robot that eliminates bugs (beetles) floating in front of you - a fun metaphor for squashing coding bugs! The robot follows your cursor with smooth, natural movements and uses a laser beam to destroy those pesky bugs, giving coders a satisfying way to unwind after debugging sessions.

## Features

- **Cursor Tracking System**: The robot aims precisely using raycasting.
- **Anatomical Robot Rotation**: Natural movement similar to a human, with rotation angle limits.
- **Proximity Factor**: More pronounced rotation angles when aiming at nearby objects for realism.
- **Collision System**: Detects when a shot hits an enemy.
- **Visual Effects**: Laser beams with particle effects and explosions when eliminating enemies.
- **Level System**: Progressive difficulty with more enemies as you advance.

## Technologies

- React as the base framework
- Vite for development environment
- Three.js as the 3D rendering engine
- React Three Fiber (R3F) for integrating Three.js with React
- React Three Drei for useful 3D components

## Installation

1. Clone the repository
2. Install dependencies:
```
npm install three @react-three/fiber @react-three/drei
```
3. Start the development server:
```
npm run dev
```

## Project Structure

- **App.jsx**: Root component containing the 3D Canvas and score state management.
- **Game.jsx**: Manages core game logic, including enemy generation and collisions.
- **Robot.jsx**: Controls the main character, including cursor following and shooting mechanics.
- **Bug.jsx**: Handles enemies, including floating animations and hit effects.
- **laser-effects.jsx**: Implements visual effects for laser beams and explosions.

## Controls

- Move your mouse to aim
- Click to shoot lasers at the beetles

## Future Improvements

- Sound effects and music
- Different types of enemies
- Power-ups and laser upgrades
- More elaborate scoring system
- Screen effects like bloom for improved visuals

---

Happy bug hunting! When your code gives you bugs, Rayminator gives you lasers.