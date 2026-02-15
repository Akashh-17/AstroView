/**
 * SaturnIcon.tsx
 *
 * 3D Icon for the Solar System module card.
 * A simplified, stylized Saturn with rings.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createPlanetMaterial, createRingMaterial } from '../../scene/planetMaterials';

export default function SaturnIcon() {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);

    // Use specific colors for the icon version
    const planetMaterial = useMemo(() => {
        const mat = createPlanetMaterial('saturn', '#E8D8A0');
        // Tweak material for icon look (brightness, etc)
        return mat;
    }, []);

    const ringMaterial = useMemo(() => {
        return createRingMaterial(2.2, 4.0); // radius 1.5 planet -> 2.2 inner
    }, []);

    useFrame((state) => {
        const time = state.clock.elapsedTime;

        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;

            // Update uniforms
            if (planetMaterial.uniforms.time) planetMaterial.uniforms.time.value = time;

            // Fixed light direction for consistent icon lighting
            if (planetMaterial.uniforms.lightDirection) {
                planetMaterial.uniforms.lightDirection.value.set(1, 0.5, 1).normalize();
            }
        }

        if (ringRef.current && ringMaterial && ringMaterial.uniforms) {
            if (ringMaterial.uniforms.lightDirection) {
                ringMaterial.uniforms.lightDirection.value.set(1, 0.5, 1).normalize();
            }
        }
    });

    return (
        <group rotation={[0.4, 0, 0.3]}>
            {/* Planet */}
            <mesh ref={meshRef} material={planetMaterial}>
                <sphereGeometry args={[1.6, 64, 64]} />
            </mesh>

            {/* Rings */}
            <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} material={ringMaterial}>
                <ringGeometry args={[2.2, 4.0, 64]} />
            </mesh>

            {/* Rim Light/Glow manually added for icon pop */}
            <pointLight position={[5, 5, 5]} intensity={1.5} distance={20} color="#ffeedd" />
            <ambientLight intensity={0.2} color="#444466" />
        </group>
    );
}
