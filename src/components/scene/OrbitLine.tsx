/**
 * OrbitLine.tsx
 *
 * Renders the orbital path of a celestial body as a faded elliptical line.
 * Uses the orbital elements to compute the full orbit ellipse.
 */

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { OrbitalElements } from '../../data/planetaryData';
import { AU } from '../../data/planetaryData';
import { generateOrbitPath } from '../../engine/orbitalMechanics';
import { useSolarSystemStore } from '../../store/solarSystemStore';

interface OrbitLineProps {
    elements: OrbitalElements;
    color?: string;
    /** For moon orbits, offset position to center on parent planet */
    parentPosition?: [number, number, number];
    scaleFactor?: number;
}

export default function OrbitLine({
    elements,
    color = '#ffffff',
    parentPosition = [0, 0, 0],
    scaleFactor = AU,
}: OrbitLineProps) {
    const showOrbits = useSolarSystemStore((s) => s.showOrbits);

    // Pre-compute orbit path points
    const points = useMemo(
        () => generateOrbitPath(elements, 256, scaleFactor),
        [elements, scaleFactor]
    );

    if (!showOrbits) return null;
    if (elements.semiMajorAxis === 0) return null; // Sun has no orbit

    return (
        <group position={parentPosition}>
            <Line
                points={points}
                color={color}
                lineWidth={1.2}
                transparent
                opacity={0.4}
                depthWrite={false}
            />
        </group>
    );
}
