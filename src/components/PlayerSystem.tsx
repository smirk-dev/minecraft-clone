import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  GRAVITY, JUMP_VELOCITY, PLAYER_EYE, PLAYER_HEIGHT, PLAYER_RADIUS,
  REACH, SPRINT_SPEED, WALK_SPEED, DAY_LENGTH_SECONDS,
} from '../config/constants';
import { BLOCK, BLOCKS, isSolid } from '../engine/blocks';
import { moveAndCollide, blockOverlapsAABB } from '../engine/physics';
import { voxelRaycast } from '../engine/raycast';
import { surfaceHeightAt } from '../engine/terrain';
import { useStore } from '../hooks/useStore';
import { useKeyboard } from '../hooks/useKeyboard';
import { runtime } from '../game/runtime';
import { audio } from '../game/audio';

const HALF = { x: PLAYER_RADIUS, y: PLAYER_HEIGHT / 2, z: PLAYER_RADIUS };

export function PlayerSystem() {
  const { camera, gl } = useThree();
  const phase = useStore((s) => s.phase);
  const world = useStore((s) => s.world);
  const mode = useStore((s) => s.mode);
  const slots = useStore((s) => s.slots);
  const selectedHotbar = useStore((s) => s.selectedHotbar);
  const setSelectedHotbar = useStore((s) => s.setSelectedHotbar);
  const setPhase = useStore((s) => s.setPhase);
  const pickupItem = useStore((s) => s.pickupItem);
  const consumeFromHotbar = useStore((s) => s.consumeFromHotbar);
  const sensitivity = useStore((s) => s.mouseSensitivity);
  const setTimeOfDay = useStore((s) => s.setTimeOfDay);
  const toggleDebug = useStore((s) => s.toggleDebug);

  const keys = useKeyboard();
  const vel = useRef({ x: 0, y: 0, z: 0 });
  const yaw = useRef(0);
  const pitch = useRef(0);
  const onGround = useRef(false);
  const breakTimerRef = useRef(0);
  const placeCooldownRef = useRef(0);
  const lastTargetKeyRef = useRef<string | null>(null);
  const stepCooldownRef = useRef(0);
  const spawnedRef = useRef(false);

  // Spawn position when world loads
  useEffect(() => {
    if (!world) {
      spawnedRef.current = false;
      return;
    }
    const surface = surfaceHeightAt(world.seed, 0, 0);
    runtime.playerPos.x = 0.5;
    runtime.playerPos.y = surface + 3 + HALF.y;
    runtime.playerPos.z = 0.5;
    vel.current = { x: 0, y: 0, z: 0 };
    yaw.current = 0;
    pitch.current = -0.2;
    spawnedRef.current = true;
  }, [world]);

  // Pointer lock on click
  useEffect(() => {
    const canvas = gl.domElement;
    const onClick = () => {
      if (phase === 'playing' && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    };
    canvas.addEventListener('click', onClick);
    return () => canvas.removeEventListener('click', onClick);
  }, [gl, phase]);

  // Pause when pointer lock exits
  useEffect(() => {
    const onLockChange = () => {
      if (document.pointerLockElement !== gl.domElement && useStore.getState().phase === 'playing') {
        setPhase('paused');
      }
    };
    document.addEventListener('pointerlockchange', onLockChange);
    return () => document.removeEventListener('pointerlockchange', onLockChange);
  }, [gl, setPhase]);

  // Mouse look
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return;
      yaw.current -= e.movementX * sensitivity;
      pitch.current -= e.movementY * sensitivity;
      pitch.current = Math.max(-Math.PI / 2 + 0.001, Math.min(Math.PI / 2 - 0.001, pitch.current));
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [gl, sensitivity]);

  // Hotbar number keys, Esc / E / F3 / etc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ph = useStore.getState().phase;
      if (e.code === 'Escape') {
        if (ph === 'playing') setPhase('paused');
        return;
      }
      if (e.code === 'KeyE') {
        if (ph === 'playing') setPhase('inventory');
        else if (ph === 'inventory' || ph === 'crafting') setPhase('playing');
        return;
      }
      if (e.code === 'KeyC') {
        if (ph === 'playing') setPhase('crafting');
        else if (ph === 'crafting') setPhase('playing');
        return;
      }
      if (e.code === 'F3') {
        e.preventDefault();
        toggleDebug();
        return;
      }
      if (ph !== 'playing') return;
      if (e.code.startsWith('Digit')) {
        const n = parseInt(e.code.slice(5), 10);
        if (n >= 1 && n <= 9) setSelectedHotbar(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPhase, setSelectedHotbar, toggleDebug]);

  // Mouse wheel to switch hotbar
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (useStore.getState().phase !== 'playing') return;
      const cur = useStore.getState().selectedHotbar;
      const dir = e.deltaY > 0 ? 1 : -1;
      setSelectedHotbar(((cur + dir) % 9 + 9) % 9);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [setSelectedHotbar]);

  // Mouse buttons handled imperatively via state in refs
  const mouseRef = useRef({ left: false, right: false });
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return;
      if (e.button === 0) mouseRef.current.left = true;
      else if (e.button === 2) mouseRef.current.right = true;
    };
    const onUp = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.left = false;
      else if (e.button === 2) mouseRef.current.right = false;
    };
    const onContext = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('contextmenu', onContext);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('contextmenu', onContext);
    };
  }, [gl]);

  useFrame((_, dtRaw) => {
    if (!world || phase !== 'playing' || !spawnedRef.current) return;
    const dt = Math.min(dtRaw, 0.05);

    // Camera rotation from yaw/pitch
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
    camera.rotation.z = 0;

    // Movement input
    const fwdInput = (keys.current.forward ? 1 : 0) - (keys.current.back ? 1 : 0);
    const rightInput = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
    const len = Math.hypot(fwdInput, rightInput);
    let fx = 0, fz = 0;
    if (len > 0) {
      const f = fwdInput / len;
      const r = rightInput / len;
      const sy = Math.sin(yaw.current);
      const cy = Math.cos(yaw.current);
      // forward_world = (-sin(yaw), 0, -cos(yaw)); right_world = (cos(yaw), 0, -sin(yaw))
      fx = f * -sy + r * cy;
      fz = f * -cy + r * -sy;
    }
    const speed = keys.current.sprint ? SPRINT_SPEED : WALK_SPEED;
    vel.current.x = fx * speed;
    vel.current.z = fz * speed;

    // Gravity
    vel.current.y -= GRAVITY * dt;
    // Cap fall speed
    if (vel.current.y < -50) vel.current.y = -50;

    // Jump
    if (keys.current.jump && onGround.current) {
      vel.current.y = JUMP_VELOCITY;
      onGround.current = false;
    }

    // Move + collide
    const result = moveAndCollide(world, runtime.playerPos, vel.current, HALF, dt);
    onGround.current = result.onGround;
    runtime.onGround = result.onGround;

    // Footstep audio
    stepCooldownRef.current -= dt;
    if (onGround.current && len > 0 && stepCooldownRef.current <= 0) {
      audio.play('step');
      stepCooldownRef.current = keys.current.sprint ? 0.28 : 0.42;
    }

    // Camera position = eye position
    const eyeY = runtime.playerPos.y - HALF.y + PLAYER_EYE;
    camera.position.set(runtime.playerPos.x, eyeY, runtime.playerPos.z);

    runtime.cameraOrigin.copy(camera.position);
    camera.getWorldDirection(runtime.cameraDir);

    // Raycast for selection
    const hit = voxelRaycast(world, runtime.cameraOrigin, runtime.cameraDir, REACH);
    runtime.selection = hit ? { block: hit.block, normal: hit.normal } : null;

    // Track break progress per target
    if (hit) {
      const key = hit.block.join(',');
      if (lastTargetKeyRef.current !== key) {
        breakTimerRef.current = 0;
        lastTargetKeyRef.current = key;
      }
    } else {
      breakTimerRef.current = 0;
      lastTargetKeyRef.current = null;
    }

    // Mining
    if (mouseRef.current.left && hit) {
      const id = world.getBlock(hit.block[0], hit.block[1], hit.block[2]);
      const def = BLOCKS[id];
      if (def && def.hardness >= 0) {
        const time = mode === 'creative' ? 0 : Math.max(0.1, def.hardness);
        breakTimerRef.current += dt;
        runtime.breakProgress = Math.min(1, breakTimerRef.current / Math.max(time, 0.0001));
        if (breakTimerRef.current >= time) {
          // Break it
          const drops = def.drops;
          world.setBlock(hit.block[0], hit.block[1], hit.block[2], BLOCK.AIR);
          if (drops !== BLOCK.AIR) {
            pickupItem(drops, 1);
            audio.play('pickup');
          }
          audio.play('break');
          breakTimerRef.current = 0;
          runtime.breakProgress = 0;
        }
      }
    } else {
      breakTimerRef.current = 0;
      runtime.breakProgress = 0;
    }

    // Placing
    placeCooldownRef.current -= dt;
    if (mouseRef.current.right && hit && placeCooldownRef.current <= 0) {
      const place: [number, number, number] = [
        hit.block[0] + hit.normal[0],
        hit.block[1] + hit.normal[1],
        hit.block[2] + hit.normal[2],
      ];
      // Don't place inside the player AABB
      const playerBox = {
        minX: runtime.playerPos.x - HALF.x, maxX: runtime.playerPos.x + HALF.x,
        minY: runtime.playerPos.y - HALF.y, maxY: runtime.playerPos.y + HALF.y,
        minZ: runtime.playerPos.z - HALF.z, maxZ: runtime.playerPos.z + HALF.z,
      };
      const slot = slots[selectedHotbar];
      if (slot) {
        const def = BLOCKS[slot.itemId];
        const blocking = def?.solid && blockOverlapsAABB(place[0], place[1], place[2], playerBox);
        if (def?.placeable && !blocking) {
          if (mode === 'creative' || consumeFromHotbar(1)) {
            const existing = world.getBlock(place[0], place[1], place[2]);
            if (!isSolid(existing) && existing !== BLOCK.WATER /* allow placing in water? skip */) {
              world.setBlock(place[0], place[1], place[2], slot.itemId);
              audio.play('place');
              placeCooldownRef.current = 0.18;
            }
          }
        }
      }
    }

    // Time of day progression (only while playing)
    setTimeOfDay(useStore.getState().timeOfDay + dt / DAY_LENGTH_SECONDS);

    // Safety: if player falls below the world, respawn at surface
    if (runtime.playerPos.y < -10) {
      const surface = surfaceHeightAt(world.seed, Math.floor(runtime.playerPos.x), Math.floor(runtime.playerPos.z));
      runtime.playerPos.y = surface + 3 + HALF.y;
      vel.current.y = 0;
    }
  });

  return null;
}
