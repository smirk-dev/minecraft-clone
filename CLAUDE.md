# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a 3D Minecraft-inspired game built with React, Three.js, and physics simulation. It features a first-person camera, block placement/removal with multiple textures, and physics-based movement and collision detection.

**Tech Stack:**
- **Frontend Framework:** React 18 with TypeScript
- **3D Rendering:** Three.js with React Three Fiber (R3F)
- **Physics:** Cannon-es (via @react-three/cannon)
- **State Management:** Zustand
- **Build Tool:** Vite
- **Linting:** ESLint with TypeScript support

## Development Commands

### Setup
```powershell
npm install
```

### Development Server
```powershell
npm run dev
```
Starts Vite dev server with hot module replacement. App runs at `http://localhost:5173`.

### Build for Production
```powershell
npm run build
```
Compiles TypeScript and bundles with Vite to `/dist`.

### Linting
```powershell
npm run lint
```
Runs ESLint on all files to check code quality and type safety.

### Preview Production Build
```powershell
npm run preview
```
Serves the production build locally for testing.

## Architecture

### Rendering Pipeline
The 3D world is rendered using React Three Fiber (R3F), which provides React components for Three.js. The `<Canvas>` component in `App.tsx` sets up the 3D scene with lighting and the basic ground plane.

### Physics & Collision
Cannon-es handles physics simulation. The player is a dynamic sphere (from `useSphere`), and placed blocks are static boxes (from `useBox`). Collision detection enables realistic movement and prevents passing through blocks.

### State Management (Zustand)
`useStore` (in `src/hooks/useStore.ts`) manages global game state:
- **cubes:** Array of placed blocks, each with position and texture type
- **texture:** Currently selected texture (for new block placement)
- **addCube/removeCube:** Functions to modify the world
- **setTexture:** Updates the active texture
- **saveWorld/resetWorld:** Local storage persistence

The store is small and focused—no UI state or intermediate computations are stored here.

### Input Handling
`useKeyboard` hook (in `src/hooks/useKeyboard.ts`) listens for keyboard events and tracks which keys are currently pressed. It maps:
- **WASD:** Movement directions
- **Space:** Jump flag
- **1-5:** Texture selection (dirt, grass, glass, wood, log)

The hook returns a state object; components that need input can subscribe to it.

### Component Structure

**Player** (`src/components/Player.tsx`)
- Implements first-person camera and physics body
- Uses Cannon's dynamic sphere for collision
- Reads keyboard input from `useKeyboard`
- On each frame (useFrame), reads player velocity and position, moves the camera to match, and applies movement forces based on input
- Jump mechanic checks if vertical velocity is near-zero before allowing another jump

**Cubes** (`src/components/Cubes.tsx`)
- Container component that iterates over all blocks in the store and renders each one
- Purely presentational—all logic is in individual `Cube` components and the store

**Cube** (`src/components/Cube.tsx`)
- Single block with click handlers for placement/removal
- Reads selected texture from `useStore` to apply color
- Click detection uses Three.js face indices to determine which face was clicked
- Adjacent block is placed on the clicked face (face index determines direction: +X, -X, +Y, -Y, +Z, -Z)
- Alt+click removes the block
- Hover effect grays out the block when hovered

**Textures** (`src/images/textures.ts`)
- Exports `useTextures` hook that loads external PNG placeholders for block textures
- Currently uses placehold.co for textures; can be replaced with actual image assets
- Applies `NearestFilter` for pixel-art aesthetic

## Key Patterns & Conventions

### R3F Patterns
- Use `useFrame` for per-frame updates (physics, camera sync)
- Use `useRef` for mutable state that doesn't trigger re-renders (positions, velocities)
- Use `useThree` to access the global Three.js context (camera, renderer, etc.)
- R3F components return JSX that maps to Three.js objects (e.g., `<mesh>`, `<boxGeometry>`, `<meshStandardMaterial>`)

### Zustand Patterns
- Store is a single flat object; no nested slices
- Actions are methods on the store that call `set()` to update state
- Selectors are passed to `useStore()` to extract only the needed state and prevent unnecessary re-renders

### Coordinate System
- Three.js uses Y as the vertical axis; Z is depth (into the screen initially)
- Blocks are 1×1×1 units at integer coordinates
- Ground plane is at Y = -1, player spawns at Y = 1

### Texture Types
String union: `'dirt' | 'grass' | 'glass' | 'wood' | 'log'`. The `textureColors` map in `Cube.tsx` defines appearance; the `useTextures` hook handles actual image assets.

## Persistence
`saveWorld()` and `resetWorld()` use localStorage under the key `'cubes'`. The game does not auto-save; you must call `saveWorld()` explicitly (e.g., via a UI button or before unload).

## Common Workflows

**Adding a new texture type:**
1. Add the type to the `Texture` union in `useStore.ts`
2. Add a color mapping in `textureColors` (Cube.tsx)
3. Add a texture image URL in `useTextures` (textures.ts)
4. Add a keyboard binding in `useKeyboard` (e.g., Digit6 for a new key)
5. Update README with the new control

**Tweaking physics:**
- Player movement speed: `multiplyScalar(4)` in Player.tsx
- Jump force: `4` in the jump condition in Player.tsx
- Player mass and type: parameters to `useSphere()` in Player.tsx
- Block physics: `type: 'Static'` in Cube.tsx keeps blocks unmovable

**Changing rendering:**
- Lighting: `<ambientLight>` and `<directionalLight>` in App.tsx
- Ground appearance: `<planeGeometry>` and `<meshStandardMaterial>` in App.tsx
- Block appearance: `<boxGeometry>` and `<meshStandardMaterial>` in Cube.tsx
