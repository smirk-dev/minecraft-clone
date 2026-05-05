import { useEffect, useRef } from 'react';

export interface KeyState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  crouch: boolean;
}

// Returns a ref whose current is mutated as keys press/release. Stable across renders.
export function useKeyboard(): React.MutableRefObject<KeyState> {
  const state = useRef<KeyState>({
    forward: false, back: false, left: false, right: false,
    jump: false, sprint: false, crouch: false,
  });

  useEffect(() => {
    const set = (e: KeyboardEvent, value: boolean) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': state.current.forward = value; break;
        case 'KeyS': case 'ArrowDown': state.current.back = value; break;
        case 'KeyA': case 'ArrowLeft': state.current.left = value; break;
        case 'KeyD': case 'ArrowRight': state.current.right = value; break;
        case 'Space': state.current.jump = value; break;
        case 'ShiftLeft': case 'ShiftRight': state.current.sprint = value; break;
        case 'ControlLeft': case 'ControlRight': state.current.crouch = value; break;
        default: return;
      }
    };
    const down = (e: KeyboardEvent) => set(e, true);
    const up = (e: KeyboardEvent) => set(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  return state;
}
