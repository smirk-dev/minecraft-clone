import { NearestFilter, TextureLoader, RepeatWrapping } from 'three';
import { useLoader } from '@react-three/fiber';

const dirtImg = 'https://placehold.co/64x64/8B4513/8B4513.png';
const grassImg = 'https://placehold.co/64x64/228B22/228B22.png';
const glassImg = 'https://placehold.co/64x64/ADD8E6/ADD8E6.png';
const woodImg = 'https://placehold.co/64x64/DEB887/DEB887.png';
const logImg = 'https://placehold.co/64x64/654321/654321.png';

export const useTextures = () => {
	const [dirtTexture, grassTexture, glassTexture, woodTexture, logTexture] = useLoader(TextureLoader, [
		dirtImg,
		grassImg,
		glassImg,
		woodImg,
		logImg,
	]);

	dirtTexture.magFilter = NearestFilter;
	grassTexture.magFilter = NearestFilter;
	glassTexture.magFilter = NearestFilter;
	woodTexture.magFilter = NearestFilter;
	logTexture.magFilter = NearestFilter;
    
    grassTexture.wrapS = RepeatWrapping;
    grassTexture.wrapT = RepeatWrapping;
    grassTexture.repeat.set(100, 100);

	return {
		dirtTexture,
		grassTexture,
		glassTexture,
		woodTexture,
		logTexture,
	};
};
