/**
 * SatelliteOrbitLine.tsx
 *
 * Renders the orbital path of the currently selected satellite.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useSatelliteStore } from '../../store/satelliteStore';
import { computeOrbitPath } from '../../engine/satelliteService';
import { SATELLITE_CATEGORIES } from '../../data/satelliteData';

export default function SatelliteOrbitLine() {
    const satellites = useSatelliteStore((s) => s.satellites);
    const selectedId = useSatelliteStore((s) => s.selectedSatelliteId);
    const simulationTime = useSatelliteStore((s) => s.simulationTime);

    const selected = useMemo(() => {
        if (!selectedId) return null;
        return satellites.find((s) => s.id === selectedId) || null;
    }, [satellites, selectedId]);

    const orbitPoints = useMemo(() => {
        if (!selected) return null;
        try {
            const pts = computeOrbitPath(selected.tle, simulationTime, 180);
            if (pts.length < 2) return null;
            return pts;
        } catch {
            return null;
        }
    }, [selected, simulationTime]);

    const color = useMemo(() => {
        if (!selected) return '#ffffff';
        const cat = SATELLITE_CATEGORIES.find((c) => c.id === selected.category);
        return cat?.color || '#ffffff';
    }, [selected]);

    const lineObj = useMemo(() => {
        if (!orbitPoints) return null;
        const geometry = new THREE.BufferGeometry().setFromPoints(
            orbitPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
        );
        const material = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
        });
        return new THREE.Line(geometry, material);
    }, [orbitPoints, color]);

    if (!lineObj) return null;

    return <primitive object={lineObj} />;
}
