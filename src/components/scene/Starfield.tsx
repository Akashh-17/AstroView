/**
 * Starfield.tsx
 *
 * Rich starfield background with varying brightness, subtle colors,
 * and a smooth backdrop of distant nebula-like haze.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarfieldProps {
    count?: number;
    radius?: number;
}

export default function Starfield({ count = 8000, radius = 800 }: StarfieldProps) {
    const pointsRef = useRef<THREE.Points>(null);
    const nebulaRef = useRef<THREE.Points>(null);

    // Generate main stars with varied sizes
    const starPositions = useMemo(() => {
        const pos = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = radius * (0.85 + Math.random() * 0.15);

            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }

        return pos;
    }, [count, radius]);

    // Nebula/dust cloud — soft colored points for atmosphere
    const nebulaCount = 800;
    const nebulaPositions = useMemo(() => {
        const pos = new Float32Array(nebulaCount * 3);

        for (let i = 0; i < nebulaCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = radius * (0.7 + Math.random() * 0.3);

            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }

        return pos;
    }, [radius]);

    // Subtle rotation for depth
    useFrame((_state, delta) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y += delta * 0.0005;
            pointsRef.current.rotation.x += delta * 0.0002;
        }
        if (nebulaRef.current) {
            nebulaRef.current.rotation.y -= delta * 0.0003;
        }
    });

    return (
        <>
            {/* Main starfield */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[starPositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color="#ffffff"
                    size={1.0}
                    sizeAttenuation
                    transparent
                    opacity={0.85}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Nebula dust — soft colored haze */}
            <points ref={nebulaRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[nebulaPositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color="#334488"
                    size={8}
                    sizeAttenuation
                    transparent
                    opacity={0.03}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </>
    );
}
