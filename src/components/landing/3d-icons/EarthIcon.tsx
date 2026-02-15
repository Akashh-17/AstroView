/**
 * EarthIcon.tsx
 *
 * 3D Icon for the Earth Satellites module card.
 * A simplified Earth with orbiting satellite dots.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

export default function EarthIcon() {
    const groupRef = useRef<THREE.Group>(null);
    const satellitesRef = useRef<THREE.Group>(null);

    // Simple Earth texture
    const earthTexture = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');

    // Generate random satellites
    const satelliteCount = 50;
    const satellites = useMemo(() => {
        const temp = [];
        for (let i = 0; i < satelliteCount; i++) {
            const r = 2.5 + Math.random() * 1.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            // Random orbit axis
            const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();

            temp.push({ r, theta, phi, axis, speed: 0.5 + Math.random() });
        }
        return temp;
    }, []);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;
        }

        if (satellitesRef.current) {
            satellitesRef.current.children.forEach((child, i) => {
                const sat = satellites[i];
                // Rotate pos around axis
                const pos = child.position;
                pos.applyAxisAngle(sat.axis, sat.speed * delta);
            });
        }
    });

    return (
        <group ref={groupRef}>
            {/* Earth */}
            <mesh>
                <sphereGeometry args={[2, 32, 32]} />
                <meshPhongMaterial map={earthTexture} shininess={20} specular={new THREE.Color(0x333333)} />
            </mesh>

            {/* Atmosphere halo */}
            <mesh scale={[1.1, 1.1, 1.1]}>
                <sphereGeometry args={[2, 32, 32]} />
                <meshBasicMaterial color="#4488ff" transparent opacity={0.15} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Satellites */}
            <group ref={satellitesRef}>
                {satellites.map((sat, i) => {
                    // Initial pos
                    const x = sat.r * Math.sin(sat.phi) * Math.cos(sat.theta);
                    const y = sat.r * Math.sin(sat.phi) * Math.sin(sat.theta);
                    const z = sat.r * Math.cos(sat.phi);

                    return (
                        <mesh key={i} position={[x, y, z]}>
                            <sphereGeometry args={[0.08, 8, 8]} />
                            <meshBasicMaterial color={i % 2 === 0 ? "#00ff00" : "#ff0000"} />
                        </mesh>
                    );
                })}
            </group>

            <directionalLight position={[5, 3, 5]} intensity={2} />
            <ambientLight intensity={0.4} />
        </group>
    );
}
