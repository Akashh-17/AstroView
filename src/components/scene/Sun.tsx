/**
 * Sun.tsx
 *
 * The Sun at the center of the solar system with a procedural shader
 * that creates animated granulation, sunspots, and limb darkening.
 *
 * Features:
 * - Procedural GLSL surface (no textures needed)
 * - Animated granulation and sunspot patterns
 * - Glow corona via multiple layered billboards
 * - Point light for scene illumination
 * - Click to select
 */

import { useRef, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard } from '@react-three/drei';
import { SUN, SUN_VISUAL_SCALE } from '../../data/planetaryData';
import { useSolarSystemStore } from '../../store/solarSystemStore';
import { createSunMaterial } from './planetMaterials';

export default function Sun() {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowInner = useRef<THREE.Mesh>(null);
    const glowOuter = useRef<THREE.Mesh>(null);
    const selectBody = useSolarSystemStore((s) => s.selectBody);
    const { clock } = useThree();

    const visualRadius = SUN.physical.radius * SUN_VISUAL_SCALE;

    // Procedural sun material
    const sunMaterial = useMemo(() => createSunMaterial(), []);

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

        // Pulse the glow layers
        if (glowInner.current) {
            const pulse1 = 1 + Math.sin(elapsed * 0.8) * 0.03;
            const s1 = visualRadius * 4 * pulse1;
            glowInner.current.scale.set(s1, s1, 1);
        }
        if (glowOuter.current) {
            const pulse2 = 1 + Math.sin(elapsed * 0.5 + 1) * 0.05;
            const s2 = visualRadius * 8 * pulse2;
            glowOuter.current.scale.set(s2, s2, 1);
        }
    });

    const handleClick = useCallback(() => {
        selectBody('sun');
    }, [selectBody]);

    return (
        <group position={[0, 0, 0]}>
            {/* Procedural Sun sphere */}
            <mesh ref={meshRef} onClick={handleClick} material={sunMaterial}>
                <sphereGeometry args={[visualRadius, 64, 64]} />
            </mesh>

            {/* Inner corona glow */}
            <Billboard>
                <mesh ref={glowInner} scale={[visualRadius * 4, visualRadius * 4, 1]}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial
                        color="#FFB040"
                        transparent
                        opacity={0.12}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </Billboard>

            {/* Outer corona glow — softer and larger */}
            <Billboard>
                <mesh ref={glowOuter} scale={[visualRadius * 8, visualRadius * 8, 1]}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial
                        color="#FF8820"
                        transparent
                        opacity={0.05}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </Billboard>

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
