import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { useKeyboard } from '../hooks/useKeyboard';

const images = {
  dirt: 'https://placehold.co/64x64/8B4513/8B4513.png',
  grass: 'https://placehold.co/64x64/228B22/228B22.png',
  glass: 'https://placehold.co/64x64/ADD8E6/ADD8E6.png',
  wood: 'https://placehold.co/64x64/DEB887/DEB887.png',
  log: 'https://placehold.co/64x64/654321/654321.png',
};

export const TextureSelector = () => {
  const [visible, setVisible] = useState(true);
  const [activeTexture, setTexture] = useStore((state) => [state.texture, state.setTexture]);
  const {
    dirt,
    grass,
    glass,
    wood,
    log,
  } = useKeyboard();

  useEffect(() => {
    const textures = {
      dirt,
      grass,
      glass,
      wood,
      log,
    };
    const pressedTexture = Object.entries(textures).find(([, v]) => v);
    if (pressedTexture) {
      const textureName = pressedTexture[0] as 'dirt' | 'grass' | 'glass' | 'wood' | 'log';
      setTexture(textureName);
    }
  }, [setTexture, dirt, grass, glass, wood, log]);

  useEffect(() => {
    if (activeTexture) {
      const visibilityTimeout = setTimeout(() => {
        setVisible(false);
      }, 2000);
      return () => {
        clearTimeout(visibilityTimeout);
      };
    }
  }, [activeTexture]);

  return visible && (
    <div className='absolute centered texture-selector'>
      {Object.entries(images).map(([k, src]) => {
        return (
          <img
            key={k}
            src={src}
            alt={k}
            className={`${k === activeTexture ? 'active' : ''}`}
          />
        );
      })}
    </div>
  );
};
