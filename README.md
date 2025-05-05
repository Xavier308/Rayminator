# Rayminator

![Rayminator Game Banner](https://github.com/Xavier308/Assets/raw/main/Rayminator/rayminator_promo.png)

A 3D browser-based game where programmers can relieve stress by shooting laser beams at bugs - literally!

## Overview

Rayminator is a first-person shooter game created specifically for programmers to relieve stress. Control a robot that eliminates bugs (beetles) floating in front of you - a fun metaphor for squashing coding bugs! The robot follows your cursor with smooth, natural movements and uses a laser beam to destroy those pesky bugs, giving coders a satisfying way to unwind after debugging sessions.

![Rayminator Robot](https://github.com/Xavier308/Assets/raw/main/Rayminator/rayminator_game.png)

## Features

- **Cursor Tracking System**: The robot aims precisely using raycasting.
- **Anatomical Robot Rotation**: Natural movement similar to a human, with rotation angle limits.
- **Proximity Factor**: More pronounced rotation angles when aiming at nearby objects for realism.
- **Collision System**: Detects when a shot hits an enemy.
- **Visual Effects**: Laser beams with particle effects and explosions when eliminating enemies.
- **Level System**: Progressive difficulty with more enemies as you advance.
- **Audio Experience**: Background cyberpunk music and sound effects for laser shots, explosions, and level completion.
- **Matrix-Style Background**: Code-themed visual background for the perfect programming atmosphere.

## Technologies

- React as the base framework
- Vite for development environment
- Three.js as the 3D rendering engine
- React Three Fiber (R3F) for integrating Three.js with React
- React Three Drei for useful 3D components

## Credits

- Created by [Xavier J. Cruz](https://github.com/Xavier308)
- 3D models created using [Meshy.ai](https://meshy.ai)
- Audio files sourced from [Freesound.org](https://freesound.org) under appropriate licenses
- Background music: "Arcade Music Loop" by joshuaempyre
- Sound effects: "Laser Shot" by Bubaproducer, "Explosion" by combine2005, and "Level Complete" by jivatma07

## Game Directory Structure

```
Rayminator-game
├── index.html
├── models
│   ├── Purple_Beetle.glb  # Bug 3D model
│   └── rayminator.glb     # Robot 3D model
├── public
│   ├── audio              # Music & sound effects
│   │   ├── arcade-loop.mp3
│   │   ├── explosion.mp3
│   │   ├── laser.mp3
│   │   └── level-complete.mp3
│   └── vite.svg
└── src
    ├── App.css
    ├── App.jsx
    │
    ├── components
    │   ├── AudioSystem.jsx
    │   ├── BugExplosion.jsx
    │   ├── CodeBackground.jsx
    │   ├── ErrorBoundary.jsx
    │   ├── Game.jsx                # Principal file
    │   ├── SimplifiedLaser.jsx
    │   └── VisualLaserEffect.jsx
    ├── index.css
    ├── main.jsx
```

## Installation

1. Clone the repository
```
git clone https://github.com/Xavier308/Rayminator.git
```
2. Install dependencies:
```
npm install
```
3. Start the development server:
```
npm run dev
```
## ⚠️ Compatibility Note

This project **requires React 19 or higher** due to internal dependencies in:

- `@react-three/fiber`
- `@react-three/drei`
- and internal logic relying on features from React 19's reconciler

Using React 18 or lower will break the game rendering.

Make sure your `package.json` includes:

```json
"react": "^19.0.0",
"react-dom": "^19.0.0"
```

## Project Structure

- **App.jsx**: Root component containing the 3D Canvas, audio system, and score state management.
- **Game.jsx**: Manages core game logic, including enemy generation and collisions.
- **AudioSystem.jsx**: Controls background music and sound effects.
- **CodeBackground.jsx**: Creates the Matrix-style falling code visual effect.
- **BugExplosion.jsx**: Handles particle effects and sound for bug destruction.
- **SimplifiedLaser.jsx**: Implements visual effects for laser beams.

## Controls

- Move your mouse to aim
- Click or press F to shoot lasers at the beetles
- Toggle audio on/off using the sound button in the top-right corner

## Future Improvements

- Different types of enemies
- Power-ups and laser upgrades
- More elaborate scoring system
- Screen effects like bloom for improved visuals
- Localization support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Happy bug hunting! When your code gives you bugs, Rayminator gives you lasers.