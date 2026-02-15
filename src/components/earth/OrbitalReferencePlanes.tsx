/**
 * OrbitalReferencePlanes.tsx
 *
 * Semi-transparent rings at LEO, MEO, and GEO altitudes for reference,
 * with HTML labels and altitude readouts.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { EARTH_RADIUS_3D, KM_TO_SCENE, ORBITAL_ALTITUDES } from '../../data/satelliteData';

interface OrbitalRingProps {
    altitude: number; // km
    color: string;
    label: string;
    showLabel?: boolean;
}

function OrbitalRing({
    altitude,
    color,
    label,
    showLabel = true,
}: OrbitalRingProps) {
    const radius = EARTH_RADIUS_3D + altitude * KM_TO_SCENE;

    // Build a circle of points for a line loop (no filled ring = no edge-on band)
    const circlePoints = useMemo(() => {
        const segments = 256;
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
        return pts;
    }, [radius]);

    const lineGeometry = useMemo(() => {
        return new THREE.BufferGeometry().setFromPoints(circlePoints);
    }, [circlePoints]);

    return (
        <group>
            {/* Ring — rendered as a line, not a filled mesh */}
            <primitive
                object={new THREE.Line(
                    lineGeometry,
                    new THREE.LineBasicMaterial({
                        color,
                        transparent: true,
                        opacity: 0.25,
                        depthWrite: false,
                    }),
                )}
            />

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
