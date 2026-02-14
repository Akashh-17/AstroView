/**
 * EarthAtmosphere.tsx
 *
 * Enhanced Fresnel-based atmospheric glow for planets with atmospheres.
 * Uses a custom shader for a soft, physically-inspired rim glow
 * that fades smoothly from edge to center.
 */

import { useMemo } from 'react';
import * as THREE from 'three';

interface EarthAtmosphereProps {
    radius: number;
    color?: string;
    opacity?: number;
}

export default function EarthAtmosphere({
    radius,
    color = '#6BB5FF',
    opacity = 0.35,
}: EarthAtmosphereProps) {
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(color) },
                intensity: { value: opacity },
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
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 viewDir = normalize(-vViewPosition);
          float fresnel = 1.0 - dot(vNormal, viewDir);

          // Multi-layer falloff for a softer, more natural glow
          float glow = pow(fresnel, 2.0) * 0.8 + pow(fresnel, 5.0) * 0.4;

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
    }, [color, opacity]);

    return (
        <mesh material={material}>
            <sphereGeometry args={[radius * 1.08, 48, 48]} />
        </mesh>
    );
}
