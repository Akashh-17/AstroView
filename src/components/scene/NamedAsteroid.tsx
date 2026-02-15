/**
 * NamedAsteroid.tsx
 *
 * Renders a named asteroid with its orbit, label, glow effect,
 * and click-to-select functionality.
 */

import { useRef, useCallback, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { CelestialBody } from '../../data/planetaryData';
import { AU } from '../../data/planetaryData';
import { getBodyPosition } from '../../engine/orbitalMechanics';
import { useSolarSystemStore } from '../../store/solarSystemStore';
import OrbitLine from './OrbitLine';

interface NamedAsteroidProps {
    body: CelestialBody;
}

export default function NamedAsteroid({ body }: NamedAsteroidProps) {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    const simulationTime = useSolarSystemStore((s) => s.simulationTime);
    const selectedBody = useSolarSystemStore((s) => s.selectedBody);
    const selectBody = useSolarSystemStore((s) => s.selectBody);

    const isSelected = selectedBody === body.id;

    // Make asteroids large enough to be clearly visible at solar-system scale
    const displayRadius = 0.5;

    // Glow material for the asteroid — bright so it stands out against space
    const glowMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: new THREE.Color(body.display.color),
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
    }, [body.display.color]);

    useFrame(() => {
        if (!groupRef.current) return;

        const pos = getBodyPosition(body.orbital, simulationTime, AU);
        groupRef.current.position.set(pos[0], pos[1], pos[2]);

        // Rotate asteroid
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
            meshRef.current.rotation.x += 0.005;
        }

        // Pulse glow
        if (glowRef.current) {
            const t = Date.now() * 0.002;
            const pulse = 1.0 + Math.sin(t) * 0.2;
            glowRef.current.scale.setScalar(pulse);
            glowMaterial.opacity = (isSelected ? 0.5 : hovered ? 0.4 : 0.25) * pulse;
        }
    });

    const handleClick = useCallback((e: THREE.Event) => {
        (e as any).stopPropagation();
        selectBody(body.id);
    }, [body.id, selectBody]);

    return (
        <>
            {/* Orbit path — dashed style for asteroids */}
            <OrbitLine elements={body.orbital} color={body.display.color} />

            <group ref={groupRef}>
                {/* Asteroid body — irregular shape */}
                <mesh
                    ref={meshRef}
                    onClick={handleClick}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                >
                    <dodecahedronGeometry args={[displayRadius, 0]} />
                    <meshStandardMaterial
                        color={body.display.color}
                        roughness={0.8}
                        metalness={0.2}
                        emissive={new THREE.Color(body.display.color)}
                        emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0.15}
                    />
                </mesh>

                {/* Glow sphere — larger halo for visibility */}
                <mesh ref={glowRef} material={glowMaterial}>
                    <sphereGeometry args={[displayRadius * 3.5, 16, 16]} />
                </mesh>

                {/* Selection ring */}
                {isSelected && (
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[displayRadius * 2, displayRadius * 2.2, 32]} />
                        <meshBasicMaterial
                            color="#3e63dd"
                            side={THREE.DoubleSide}
                            transparent
                            opacity={0.6}
                            depthWrite={false}
                        />
                    </mesh>
                )}

                {/* Label — always visible so asteroids can be identified at a glance */}
                <Html
                    position={[0, displayRadius + 0.8, 0]}
                    center
                    distanceFactor={18}
                    style={{
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                >
                    <div
                        style={{
                            color: isSelected ? '#6BB5FF' : hovered ? '#ffffff' : body.display.color,
                            fontSize: '13px',
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: isSelected ? 700 : 500,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                                textShadow: '0 0 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.95), 0 0 24px rgba(0,0,0,0.8)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                transition: 'color 0.3s',
                            }}
                        >
                            {body.name}
                        </div>
                </Html>
            </group>
        </>
    );
}
