/**
 * EarthAtmosphere.tsx
 *
 * Enhanced Fresnel-based atmospheric glow for planets with atmospheres.
 * Uses a custom shader for a soft, physically-inspired rim glow
 * that fades smoothly from edge to center.
 *
 * Configurable per-planet: falloff, scale, and color.
 */

import { useMemo } from 'react';
import * as THREE from 'three';

interface EarthAtmosphereProps {
    radius: number;
    color?: string;
    opacity?: number;
    /** How far the glow extends beyond the planet (1.08 = 8% larger, default) */
    scale?: number;
    /** Fresnel power exponent — higher = thinner glow concentrated at edges */
    falloff?: number;
}

export default function EarthAtmosphere({
    radius,
    color = '#6BB5FF',
    opacity = 0.35,
    scale = 1.08,
    falloff = 2.0,
}: EarthAtmosphereProps) {
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(color) },
                intensity: { value: opacity },
                falloffPower: { value: falloff },
            },
            vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
            fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        uniform float falloffPower;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 viewDir = normalize(-vViewPosition);
          float fresnel = 1.0 - dot(vNormal, viewDir);

          // Configurable falloff: thinner for thin atmospheres, broader for thick
          float glow = pow(fresnel, falloffPower) * 0.8 + pow(fresnel, falloffPower + 3.0) * 0.4;

          // Fade at very edge to prevent hard cutoff
          float edgeFade = smoothstep(0.0, 0.15, fresnel);

          gl_FragColor = vec4(glowColor, glow * intensity * edgeFade);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide,
            depthWrite: false,
        });
    }, [color, opacity, falloff]);

    return (
        <mesh material={material}>
            <sphereGeometry args={[radius * scale, 48, 48]} />
        </mesh>
    );
}
