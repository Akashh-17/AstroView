/**
 * HeroBackground.tsx
 *
 * Realistic deep-space starfield using drei's Stars component
 * plus a slow drift for immersion. No procedural nebula (looks fake).
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

export default function HeroBackground() {
    const groupRef = useRef<THREE.Group>(null);

    // Very slow drift rotation for the entire starfield
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.00008;
            groupRef.current.rotation.x += 0.00003;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Primary starfield — dense, small, realistic */}
            <Stars
                radius={120}
                depth={80}
                count={6000}
                factor={3}
                saturation={0.1}
                fade
                speed={0.3}
            />

            {/* Secondary layer — fewer but brighter stars for depth */}
            <Stars
                radius={60}
                depth={50}
                count={1500}
                factor={5}
                saturation={0}
                fade
                speed={0.1}
            />
        </group>
    );
}
