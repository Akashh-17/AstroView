/**
 * Sun.tsx
 *
 * The Sun at the center of the solar system with a procedural shader
 * that creates animated granulation, sunspots, and limb darkening.
 *
 * Features:
 * - Procedural GLSL surface (no textures needed)
 * - Animated granulation and sunspot patterns
 * - BackSide sphere glow for soft corona (no square artifacts)
 * - Point light for scene illumination
 * - Click to select
 */

import { useRef, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SUN, SUN_VISUAL_SCALE } from '../../data/planetaryData';
import { useSolarSystemStore } from '../../store/solarSystemStore';
import { createSunMaterial } from './planetMaterials';

/**
 * BackSide glow: renders only back faces of a slightly larger sphere,
 * so the glow appears as a soft halo around the Sun body.
 */
function createBackGlowMaterial(color: string, opacity: number): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
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
            uniform float glowOpacity;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
                vec3 viewDir = normalize(-vViewPosition);
                // For back faces, the normal points away from camera
                // so dot product gives us falloff from edge inward
                float intensity = dot(vNormal, viewDir);
                // Invert since we're on back side
                intensity = pow(max(1.0 - abs(intensity), 0.0), 1.5);
                gl_FragColor = vec4(glowColor, intensity * glowOpacity);
            }
        `,
        uniforms: {
            glowColor: { value: new THREE.Color(color) },
            glowOpacity: { value: opacity },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
    });
}

export default function Sun() {
    const meshRef = useRef<THREE.Mesh>(null);
    const selectBody = useSolarSystemStore((s) => s.selectBody);
    const { clock } = useThree();

    const visualRadius = SUN.physical.radius * SUN_VISUAL_SCALE;

    // Procedural sun material
    const sunMaterial = useMemo(() => createSunMaterial(), []);

    // BackSide glow materials — multiple layers for realistic corona
    const innerGlow = useMemo(() => createBackGlowMaterial('#FFD080', 0.7), []);
    const midGlow = useMemo(() => createBackGlowMaterial('#FFAA40', 0.4), []);
    const outerGlow = useMemo(() => createBackGlowMaterial('#FF6620', 0.15), []);

    // Rotation speed
    const rotationRate = (2 * Math.PI) / Math.abs(SUN.physical.rotationPeriod);

    useFrame((_state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += rotationRate * delta * 50;
        }

        // Update time uniform for animated surface
        const elapsed = clock.getElapsedTime();
        if (sunMaterial.uniforms.time) {
            sunMaterial.uniforms.time.value = elapsed;
        }

        // Subtle glow pulse
        const pulse = 1.0 + Math.sin(elapsed * 0.8) * 0.08;
        const pulse2 = 1.0 + Math.sin(elapsed * 0.5 + 1.0) * 0.06;
        innerGlow.uniforms.glowOpacity.value = 0.7 * pulse;
        midGlow.uniforms.glowOpacity.value = 0.4 * pulse2;
    });

    const handleClick = useCallback((e: THREE.Event) => {
        (e as any).stopPropagation();
        selectBody('sun');
    }, [selectBody]);

    return (
        <group position={[0, 0, 0]}>
            {/* Procedural Sun sphere */}
            <mesh ref={meshRef} onClick={handleClick} material={sunMaterial}>
                <sphereGeometry args={[visualRadius, 64, 64]} />
            </mesh>

            {/* Inner corona glow — BackSide halo */}
            <mesh material={innerGlow}>
                <sphereGeometry args={[visualRadius * 1.4, 48, 48]} />
            </mesh>

            {/* Mid corona glow */}
            <mesh material={midGlow}>
                <sphereGeometry args={[visualRadius * 1.8, 40, 40]} />
            </mesh>

            {/* Outer corona glow — softer, wider */}
            <mesh material={outerGlow}>
                <sphereGeometry args={[visualRadius * 2.8, 32, 32]} />
            </mesh>

            {/* Point light: illuminates all planets */}
            <pointLight
                color="#FFF5E0"
                intensity={3}
                distance={0}
                decay={0}
            />

            {/* Dim cool ambient so shadow sides have subtle fill light */}
            <ambientLight intensity={0.04} color="#334466" />
        </group>
    );
}
