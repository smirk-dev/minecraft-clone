import * as THREE from 'three';
import { ATLAS_TILES } from '../config/constants';
import { getAtlasTexture } from './atlas';

const VERT = /* glsl */`
attribute vec2 aTileBase;
attribute vec2 aUVLocal;
attribute float aShade;

varying vec2 vTileBase;
varying vec2 vUVLocal;
varying float vShade;
varying vec3 vWorldPos;
varying float vFogDepth;

void main() {
  vTileBase = aTileBase;
  vUVLocal = aUVLocal;
  vShade = aShade;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vec4 mvPos = viewMatrix * worldPos;
  vFogDepth = -mvPos.z;
  gl_Position = projectionMatrix * mvPos;
}
`;

const FRAG = /* glsl */`
precision highp float;

uniform sampler2D uAtlas;
uniform float uTileSize;
uniform float uTime;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uDayFactor; // 0 night, 1 day
uniform float uIsTransparent;

varying vec2 vTileBase;
varying vec2 vUVLocal;
varying float vShade;
varying vec3 vWorldPos;
varying float vFogDepth;

void main() {
  // Tile UV with proper inset
  vec2 local = fract(vUVLocal);
  vec2 uv = vTileBase + local * uTileSize;
  vec4 tex = texture2D(uAtlas, uv);

  // Discard fully transparent texels (cutout for leaves/glass etchings/torch)
  if (uIsTransparent < 0.5) {
    if (tex.a < 0.5) discard;
  } else {
    if (tex.a < 0.05) discard;
  }

  // Lighting: per-face shade (top brightest, sides medium, bottom darkest)
  // baked into vShade in [0.4, 1.0]. Multiply by day factor (with min night light).
  float light = mix(0.25, 1.0, uDayFactor) * vShade;
  vec3 color = tex.rgb * light;

  // Fog
  float fogFactor = smoothstep(uFogNear, uFogFar, vFogDepth);
  color = mix(color, uFogColor, fogFactor);

  gl_FragColor = vec4(color, tex.a);
}
`;

export interface VoxelMaterialUniforms {
  uTime: { value: number };
  uFogColor: { value: THREE.Color };
  uFogNear: { value: number };
  uFogFar: { value: number };
  uDayFactor: { value: number };
}

export function createVoxelMaterial(opts: { transparent?: boolean } = {}): THREE.ShaderMaterial {
  const transparent = opts.transparent ?? false;
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uAtlas: { value: getAtlasTexture() },
      uTileSize: { value: 1 / ATLAS_TILES },
      uTime: { value: 0 },
      uFogColor: { value: new THREE.Color(0x9bd0ff) },
      uFogNear: { value: 30 },
      uFogFar: { value: 90 },
      uDayFactor: { value: 1.0 },
      uIsTransparent: { value: transparent ? 1 : 0 },
    },
    transparent,
    depthWrite: !transparent,
    side: THREE.FrontSide,
  });
  return mat;
}
