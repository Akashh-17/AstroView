/**
 * EarthScene.tsx
 *
 * 3D Earth with photorealistic procedural shader, atmosphere glow,
 * day/night lighting, and starfield background for satellite tracking.
 */

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { EARTH_RADIUS_3D } from '../../data/satelliteData';
import { PLANET_VERTEX, EARTH_FRAGMENT } from '../scene/shaders/planetShaders';
import EarthAtmosphere from '../scene/EarthAtmosphere';

export default function EarthScene() {
    const meshRef = useRef<THREE.Mesh>(null);
    const { clock } = useThree();

    // Earth procedural shader material
    const earthMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: PLANET_VERTEX,
            fragmentShader: EARTH_FRAGMENT,
            uniforms: {
                lightDirection: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
                time: { value: 0 },
            },
        });
    }, []);

    // Axial tilt (23.44°)
    const axialTilt = useMemo(() => (23.44 * Math.PI) / 180, []);

    // Rotate Earth + update shader
    useFrame(() => {
        if (!meshRef.current) return;
        // Slow rotation (~24h mapped to ~120s for visual effect)
        meshRef.current.rotation.y += 0.001;
        earthMaterial.uniforms.time.value = clock.getElapsedTime();
    });

    return (
        <>
            {/* Starfield */}
            <Stars radius={300} depth={60} count={4000} factor={4} saturation={0.1} fade speed={0.5} />

            {/* Sun directional light */}
            <directionalLight
                position={[50, 10, 30]}
                intensity={2}
                color="#FFF5E0"
            />
            <ambientLight intensity={0.05} color="#334466" />

            {/* Earth sphere */}
            <group rotation={[axialTilt, 0, 0]}>
                <mesh ref={meshRef} material={earthMaterial}>
                    <sphereGeometry args={[EARTH_RADIUS_3D, 128, 128]} />
                </mesh>

                {/* Atmospheric glow */}
                <EarthAtmosphere
                    radius={EARTH_RADIUS_3D}
                    color="#4A9EFF"
                    opacity={0.3}
                    scale={1.06}
                    falloff={2.0}
                />
            </group>

            {/* Camera controls */}
            <OrbitControls
                enablePan={true}
                enableDamping={true}
                dampingFactor={0.08}
                minDistance={EARTH_RADIUS_3D * 1.3}
                maxDistance={EARTH_RADIUS_3D * 25}
                rotateSpeed={0.5}
            />
        </>
    );
}
