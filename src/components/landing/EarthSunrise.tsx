/**
 * EarthSunrise.tsx
 *
 * Cinematic Earth for the hero section.
 * - Earth curvature visible at bottom of screen
 * - Sunrise effect via bright point light on the horizon (no visible plane geometry)
 * - Bright blue atmospheric rim
 * - Slow rotation
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { PLANET_VERTEX, EARTH_TEXTURED_FRAGMENT } from '../scene/shaders/planetShaders';
import EarthAtmosphere from '../scene/EarthAtmosphere';

// Sunrise glow sprite material
function SunriseGlow({ position, scale = 4 }: { position: [number, number, number]; scale?: number }) {
    const matRef = useRef<THREE.SpriteMaterial>(null);

    const texture = useMemo(() => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        // Radial gradient: bright warm core -> transparent
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, 'rgba(255, 230, 180, 1.0)');
        gradient.addColorStop(0.1, 'rgba(255, 200, 120, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 160, 80, 0.4)');
        gradient.addColorStop(0.6, 'rgba(200, 140, 100, 0.1)');
        gradient.addColorStop(1, 'rgba(100, 80, 60, 0.0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }, []);

    useFrame((state) => {
        if (matRef.current) {
            // Subtle pulsing
            const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
            matRef.current.opacity = 0.85 * pulse;
        }
    });

    return (
        <sprite position={position} scale={[scale * 1.8, scale, 1]}>
            <spriteMaterial
                ref={matRef}
                map={texture}
                transparent
                opacity={0.85}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </sprite>
    );
}

export default function EarthSunrise() {
    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    const earthTexture = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');

    const earthMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: PLANET_VERTEX,
            fragmentShader: EARTH_TEXTURED_FRAGMENT,
            uniforms: {
                lightDirection: { value: new THREE.Vector3(0.0, 0.5, 0.85).normalize() },
                time: { value: 0 },
                earthMap: { value: earthTexture },
            },
        });
    }, [earthTexture]);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.0003;
            earthMaterial.uniforms.time.value = t;
        }
        if (groupRef.current) {
            groupRef.current.position.y = -12.5 + Math.sin(t * 0.15) * 0.05;
        }
    });

    const EARTH_RADIUS = 10;

    return (
        <group ref={groupRef} position={[0, -12.5, 0]}>
            {/* Main Earth Sphere */}
            <mesh ref={meshRef} material={earthMaterial}>
                <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
            </mesh>

            {/* Inner atmospheric rim — bright blue */}
            <EarthAtmosphere
                radius={EARTH_RADIUS}
                color="#4488ff"
                opacity={0.6}
                scale={1.025}
                falloff={2.0}
            />

            {/* Outer atmospheric haze — softer, wider */}
            <EarthAtmosphere
                radius={EARTH_RADIUS}
                color="#6699ff"
                opacity={0.2}
                scale={1.06}
                falloff={4.0}
            />

            {/* Sunrise glow — uses a Sprite (always faces camera, no visible rectangle) */}
            <SunriseGlow position={[0, EARTH_RADIUS + 0.3, 4]} scale={5} />

            {/* Bright point light at the sunrise spot for volumetric warmth */}
            <pointLight
                position={[0, EARTH_RADIUS + 0.5, 5]}
                intensity={8}
                distance={20}
                color="#ffcc77"
                decay={2}
            />

            {/* Fill light */}
            <ambientLight intensity={0.06} />
        </group>
    );
}
