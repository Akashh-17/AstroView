/**
 * OrbitalReferencePlanes.tsx
 *
 * Semi-transparent rings at LEO, MEO, and GEO altitudes for reference,
 * with HTML labels and altitude readouts.
 */

import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { EARTH_RADIUS_3D, KM_TO_SCENE, ORBITAL_ALTITUDES } from '../../data/satelliteData';

interface OrbitalRingProps {
    altitude: number; // km
    color: string;
    label: string;
    showLabel?: boolean;
    dashed?: boolean;
}

function OrbitalRing({
    altitude,
    color,
    label,
    showLabel = true,
    dashed = false,
}: OrbitalRingProps) {
    const radius = EARTH_RADIUS_3D + altitude * KM_TO_SCENE;
    const thickness = radius * 0.003; // proportional thickness

    return (
        <group>
            {/* Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius - thickness, radius + thickness, 256]} />
                <meshBasicMaterial
                    color={color}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={dashed ? 0.06 : 0.10}
                    depthWrite={false}
                />
            </mesh>

            {/* Label sitting on the ring */}
            {showLabel && (
                <Html
                    position={[radius + 0.15, 0.1, 0]}
                    center
                    distanceFactor={18}
                    style={{ pointerEvents: 'none' }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            userSelect: 'none',
                        }}
                    >
                        <span
                            style={{
                                color,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textShadow: '0 0 6px rgba(0,0,0,0.9)',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            {label}
                        </span>
                        <span
                            style={{
                                color: 'rgba(255,255,255,0.55)',
                                fontSize: 9,
                                fontWeight: 400,
                                textShadow: '0 0 4px rgba(0,0,0,0.9)',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            {altitude.toLocaleString()} km
                        </span>
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function OrbitalReferencePlanes() {
    return (
        <>
            <OrbitalRing
                altitude={ORBITAL_ALTITUDES.LEO_MAX}
                color="#4A9EFF"
                label="LEO"
            />
            <OrbitalRing
                altitude={ORBITAL_ALTITUDES.MEO}
                color="#4AFF7C"
                label="MEO"
            />
            <OrbitalRing
                altitude={ORBITAL_ALTITUDES.GEO}
                color="#FFAA40"
                label="GEO"
            />
        </>
    );
}
