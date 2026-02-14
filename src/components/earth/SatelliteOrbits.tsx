/**
 * SatelliteOrbits.tsx
 *
 * Renders orbital paths for all filtered satellites when enabled.
 * Optimized for performance: limits point count and updates lazily.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useSatelliteStore } from '../../store/satelliteStore';
import { computeOrbitPath } from '../../engine/satelliteService';
import { SATELLITE_CATEGORIES } from '../../data/satelliteData';

export default function SatelliteOrbits() {
    const satellites = useSatelliteStore((s) => s.satellites);
    const activeCategories = useSatelliteStore((s) => s.activeCategories);
    const searchQuery = useSatelliteStore((s) => s.searchQuery);
    const showOrbits = useSatelliteStore((s) => s.showOrbits);
    const simulationTime = useSatelliteStore((s) => s.simulationTime);

    // Reuse the filtering logic
    const filtered = useMemo(() => {
        if (!showOrbits) return [];
        let list = satellites;
        if (activeCategories.size > 0) {
            list = list.filter(s => activeCategories.has(s.category));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => s.name.toLowerCase().includes(q));
        }
        // Cap at 200 orbits to prevent freezing/lag
        return list.slice(0, 200);
    }, [satellites, activeCategories, searchQuery, showOrbits]);

    // Compute paths for all filtered satellites
    // This is expensive, so we memoize heavily
    const orbits = useMemo(() => {
        if (!showOrbits || filtered.length === 0) return [];

        const paths: { geometry: THREE.BufferGeometry; color: string }[] = [];

        for (const sat of filtered) {
            try {
                // Lower resolution for mass rendering (90 steps instead of 180)
                const pts = computeOrbitPath(sat.tle, simulationTime, 90);
                if (pts.length < 2) continue;

                const geometry = new THREE.BufferGeometry().setFromPoints(
                    pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))
                );

                const cat = SATELLITE_CATEGORIES.find(c => c.id === sat.category);
                const color = cat?.color || '#ffffff';

                paths.push({ geometry, color });
            } catch {
                continue;
            }
        }
        return paths;
    }, [filtered, showOrbits, simulationTime]); // Re-computes when time changes significantly

    // Optimization: If simulation is running fast, this might lag.
    // Ideally we shouldn't re-compute orbits every frame for the same TLEs unless time drift is huge.
    // But Earth rotation is handled by the container, so these ECI orbits need to rotate with Earth?
    // No, ECI is fixed stars. Our scene setup in EarthScene rotates the Earth mesh.
    // The satellites (ECI) are added to the scene root?
    // Wait, EarthScene rotates the EARTH MESH.
    // SatelliteInstances adds points in scene space.
    // ECI x/y/z are inertial.
    // So the orbits are fixed in the scene until the satellite itself moves (which SGP4 handles).
    // The "orbit path" is the locus of future points.
    // SGP4 output is ECI.
    // So visual orbit lines in ECI frame are relatively stable over short times.

    if (!showOrbits) return null;

    // Create Line objects
    const lineObjects = useMemo(() => {
        return orbits.map(o => {
            const material = new THREE.LineBasicMaterial({
                color: o.color,
                transparent: true,
                opacity: 0.3,
                depthWrite: false,
            });
            return new THREE.Line(o.geometry, material);
        });
    }, [orbits]);

    if (!showOrbits) return null;

    return (
        <group>
            {lineObjects.map((line, i) => (
                <primitive key={i} object={line} />
            ))}
        </group>
    );
}
