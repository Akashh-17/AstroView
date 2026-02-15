/**
 * SatelliteOrbits.tsx
 *
 * Renders orbital paths for satellites.
 *
 * Two modes:
 *  1. "Always-on" orbits: Featured / notable satellites always have their
 *     orbit paths drawn as faint, category-coloured rings around Earth.
 *  2. "Show All" orbits: When the user toggles Orbits ON, orbit paths for
 *     ALL filtered satellites are drawn (capped at 250 for perf).
 *
 * Orbital paths are computed once per significant time change (memoized).
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useSatelliteStore } from '../../store/satelliteStore';
import { computeOrbitPath } from '../../engine/satelliteService';
import {
    SATELLITE_CATEGORIES,
    ALWAYS_SHOW_ORBIT_NAMES,
} from '../../data/satelliteData';

interface OrbitDef {
    geometry: THREE.BufferGeometry;
    color: string;
    opacity: number;
    linewidth: number;
}

export default function SatelliteOrbits() {
    const satellites = useSatelliteStore((s) => s.satellites);
    const activeCategories = useSatelliteStore((s) => s.activeCategories);
    const searchQuery = useSatelliteStore((s) => s.searchQuery);
    const showOrbits = useSatelliteStore((s) => s.showOrbits);
    const simulationTime = useSatelliteStore((s) => s.simulationTime);

    // ── 1. Always-on feature orbits ─────────────────────────────────────────
    const featuredOrbits = useMemo(() => {
        const featured = satellites.filter(
            (s) => ALWAYS_SHOW_ORBIT_NAMES.has(s.name),
        );
        const paths: OrbitDef[] = [];

        for (const sat of featured) {
            try {
                const pts = computeOrbitPath(sat.tle, simulationTime, 180);
                if (pts.length < 2) continue;

                const geometry = new THREE.BufferGeometry().setFromPoints(
                    pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
                );

                const cat = SATELLITE_CATEGORIES.find(
                    (c) => c.id === sat.category,
                );
                const color = cat?.color || '#ffffff';

                paths.push({ geometry, color, opacity: 0.45, linewidth: 2 });
            } catch {
                continue;
            }
        }
        return paths;
    }, [satellites, simulationTime]);

    // ── 2. Representative orbits (sample per category) ──────────────────────
    // Show a few representative orbits per active category so user can see
    // orbital planes & altitudes without toggling "Show All"
    const representativeOrbits = useMemo(() => {
        const REP_PER_CAT = 3;
        const paths: OrbitDef[] = [];
        const activeCats =
            activeCategories.size > 0
                ? SATELLITE_CATEGORIES.filter((c) => activeCategories.has(c.id))
                : SATELLITE_CATEGORIES;

        for (const cat of activeCats) {
            // Skip debris for auto-orbits (too cluttered)
            if (cat.id === 'debris') continue;

            const catSats = satellites.filter(
                (s) =>
                    s.category === cat.id &&
                    !ALWAYS_SHOW_ORBIT_NAMES.has(s.name),
            );
            // Pick evenly spaced representatives
            const step = Math.max(1, Math.floor(catSats.length / REP_PER_CAT));
            const reps = catSats.filter((_, i) => i % step === 0).slice(0, REP_PER_CAT);

            for (const sat of reps) {
                try {
                    const pts = computeOrbitPath(sat.tle, simulationTime, 90);
                    if (pts.length < 2) continue;

                    const geometry = new THREE.BufferGeometry().setFromPoints(
                        pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
                    );
                    paths.push({
                        geometry,
                        color: cat.color,
                        opacity: 0.15,
                        linewidth: 1,
                    });
                } catch {
                    continue;
                }
            }
        }
        return paths;
    }, [satellites, activeCategories, simulationTime]);

    // ── 3. Full orbits (when toggled ON) ────────────────────────────────────
    const fullOrbits = useMemo(() => {
        if (!showOrbits) return [];

        let list = satellites;
        if (activeCategories.size > 0) {
            list = list.filter((s) => activeCategories.has(s.category));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((s) => s.name.toLowerCase().includes(q));
        }
        // Cap for performance
        list = list.slice(0, 250);

        const paths: OrbitDef[] = [];
        for (const sat of list) {
            try {
                const pts = computeOrbitPath(sat.tle, simulationTime, 90);
                if (pts.length < 2) continue;

                const geometry = new THREE.BufferGeometry().setFromPoints(
                    pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
                );

                const cat = SATELLITE_CATEGORIES.find(
                    (c) => c.id === sat.category,
                );
                const color = cat?.color || '#ffffff';

                paths.push({ geometry, color, opacity: 0.25, linewidth: 1 });
            } catch {
                continue;
            }
        }
        return paths;
    }, [satellites, activeCategories, searchQuery, showOrbits, simulationTime]);

    // ── Merge all orbit sets into Line objects ──────────────────────────────
    const allOrbits = useMemo(() => {
        const combined = showOrbits
            ? [...featuredOrbits, ...fullOrbits]
            : [...featuredOrbits, ...representativeOrbits];

        return combined.map((o) => {
            const material = new THREE.LineBasicMaterial({
                color: o.color,
                transparent: true,
                opacity: o.opacity,
                depthWrite: false,
            });
            return new THREE.Line(o.geometry, material);
        });
    }, [featuredOrbits, representativeOrbits, fullOrbits, showOrbits]);

    if (allOrbits.length === 0) return null;

    return (
        <group>
            {allOrbits.map((line, i) => (
                <primitive key={i} object={line} />
            ))}
        </group>
    );
}
