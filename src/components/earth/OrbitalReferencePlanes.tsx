/**
 * OrbitalReferencePlanes.tsx
 *
 * Semi-transparent rings at LEO, MEO, and GEO altitudes for reference.
 */

import * as THREE from 'three';
import { EARTH_RADIUS_3D, KM_TO_SCENE, ORBITAL_ALTITUDES } from '../../data/satelliteData';

interface OrbitalRingProps {
    altitude: number; // km
    color: string;
    label: string;
}

function OrbitalRing({ altitude, color }: OrbitalRingProps) {
    const radius = EARTH_RADIUS_3D + altitude * KM_TO_SCENE;

    return (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.01, radius + 0.01, 128]} />
            <meshBasicMaterial
                color={color}
                side={THREE.DoubleSide}
                transparent
                opacity={0.12}
                depthWrite={false}
            />
        </mesh>
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
