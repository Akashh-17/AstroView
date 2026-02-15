/**
 * SatelliteInstances.tsx
 *
 * Renders all satellites as an InstancedMesh for high performance.
 * Each satellite is a small sphere, color-coded by category.
 * Updates positions every frame via SGP4 propagation.
 */

import { useRef, useMemo, useCallback } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useSatelliteStore } from '../../store/satelliteStore';
import { propagateSatellite } from '../../engine/satelliteService';
import { SATELLITE_CATEGORIES, FEATURED_SATELLITE_NAMES, VITAL_SIGN_SATELLITES } from '../../data/satelliteData';
import { Html } from '@react-three/drei';

const MAX_INSTANCES = 2000;
const SAT_RADIUS = 0.04;

// Pre-build color lookup
const categoryColorMap: Record<string, THREE.Color> = {};
for (const cat of SATELLITE_CATEGORIES) {
    categoryColorMap[cat.id] = new THREE.Color(cat.color);
}

export default function SatelliteInstances() {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const satellites = useSatelliteStore((s) => s.satellites);
    const activeCategories = useSatelliteStore((s) => s.activeCategories);
    const searchQuery = useSatelliteStore((s) => s.searchQuery);
    const selectedSatelliteId = useSatelliteStore((s) => s.selectedSatelliteId);
    const focusOnSatellite = useSatelliteStore((s) => s.focusOnSatellite);
    const simulationTime = useSatelliteStore((s) => s.simulationTime);
    const setSatellites = useSatelliteStore((s) => s.setSatellites);
    const activeVitalSign = useSatelliteStore((s) => s.activeVitalSign);

    // Filter satellites based on active categories, search, and vital sign
    const filtered = useMemo(() => {
        let list = satellites;
        if (activeCategories.size > 0) {
            list = list.filter(s => activeCategories.has(s.category));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => s.name.toLowerCase().includes(q));
        }
        // Filter by vital sign — only show relevant satellites when a data layer is active
        if (activeVitalSign && activeVitalSign !== 'satellites_now' && activeVitalSign !== 'visible_earth') {
            const relevantNames = VITAL_SIGN_SATELLITES[activeVitalSign];
            if (relevantNames && relevantNames.length > 0) {
                list = list.filter(s =>
                    relevantNames.some(name => s.name.toUpperCase().includes(name))
                );
            }
        }
        return list.slice(0, MAX_INSTANCES);
    }, [satellites, activeCategories, searchQuery, activeVitalSign]);

    // Temp objects for instance matrix updates
    const tempObj = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    const frameCounter = useRef(0);

    // Selected satellite position for label
    const selectedPos = useMemo(() => {
        if (!selectedSatelliteId) return null;
        const sat = filtered.find(s => s.id === selectedSatelliteId);
        if (sat?.position) return new THREE.Vector3(...sat.position);
        return null;
    }, [filtered, selectedSatelliteId]);

    const selectedSat = useMemo(() => {
        if (!selectedSatelliteId) return null;
        return filtered.find(s => s.id === selectedSatelliteId) || null;
    }, [filtered, selectedSatelliteId]);

    // Labels for featured satellites
    const featuredSats = useMemo(() => {
        return filtered.filter(s =>
            FEATURED_SATELLITE_NAMES.has(s.name) && s.position
        );
    }, [filtered]);

    // Propagate positions each frame
    useFrame(() => {
        const mesh = meshRef.current;
        if (!mesh || filtered.length === 0) return;

        const date = simulationTime;
        frameCounter.current++;
        const shouldUpdateStore = frameCounter.current % 60 === 0;
        const updated = shouldUpdateStore ? [...satellites] : null;
        let changed = false;

        for (let i = 0; i < filtered.length; i++) {
            const sat = filtered[i];
            const result = propagateSatellite(sat.tle, date);

            if (result) {
                // Update instance transform
                tempObj.position.set(result.position[0], result.position[1], result.position[2]);
                const scale = sat.id === selectedSatelliteId ? 2.5 : 1.0;
                tempObj.scale.setScalar(scale);
                tempObj.updateMatrix();
                mesh.setMatrixAt(i, tempObj.matrix);

                // Color
                tempColor.copy(categoryColorMap[sat.category] || categoryColorMap['debris']);
                if (sat.id === selectedSatelliteId) {
                    tempColor.multiplyScalar(2.0); // Brighten selected
                }
                mesh.setColorAt(i, tempColor);

                // Periodically update store data for UI panels
                if (shouldUpdateStore && updated) {
                    const idx = updated.findIndex(s => s.id === sat.id);
                    if (idx !== -1) {
                        updated[idx] = {
                            ...updated[idx],
                            position: result.position,
                            lat: result.lat,
                            lng: result.lng,
                            alt: result.alt,
                            velocity: result.velocity,
                        };
                        changed = true;
                    }
                }
            } else {
                // Hide failed propagations
                tempObj.position.set(0, 0, 0);
                tempObj.scale.setScalar(0);
                tempObj.updateMatrix();
                mesh.setMatrixAt(i, tempObj.matrix);
            }
        }

        // Hide unused instances
        for (let i = filtered.length; i < MAX_INSTANCES; i++) {
            tempObj.position.set(0, 0, 0);
            tempObj.scale.setScalar(0);
            tempObj.updateMatrix();
            mesh.setMatrixAt(i, tempObj.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

        if (changed && updated) {
            setSatellites(updated);
        }
    });

    // Click handler — select & zoom to satellite
    const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.instanceId !== undefined && e.instanceId < filtered.length) {
            focusOnSatellite(filtered[e.instanceId].id);
        }
    }, [filtered, focusOnSatellite]);

    return (
        <>
            <instancedMesh
                ref={meshRef}
                args={[undefined, undefined, MAX_INSTANCES]}
                onClick={handleClick}
                frustumCulled={false}
            >
                <sphereGeometry args={[SAT_RADIUS, 6, 4]} />
                <meshBasicMaterial toneMapped={false} />
            </instancedMesh>

            {/* Labels for featured satellites */}
            {featuredSats.map(sat => sat.position && (
                <Html
                    key={sat.id}
                    position={sat.position}
                    center
                    distanceFactor={20}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    <div style={{
                        color: categoryColorMap[sat.category]?.getStyle() || '#fff',
                        fontSize: '9px',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        whiteSpace: 'nowrap',
                        textShadow: '0 0 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.8)',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        transform: 'translateY(-12px)',
                    }}>
                        {sat.name}
                    </div>
                </Html>
            ))}

            {/* Selected satellite label */}
            {selectedSat && selectedPos && !FEATURED_SATELLITE_NAMES.has(selectedSat.name) && (
                <Html
                    position={selectedPos}
                    center
                    distanceFactor={20}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    <div style={{
                        color: '#6BB5FF',
                        fontSize: '10px',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        whiteSpace: 'nowrap',
                        textShadow: '0 0 6px rgba(0,0,0,1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        transform: 'translateY(-14px)',
                    }}>
                        {selectedSat.name}
                    </div>
                </Html>
            )}
        </>
    );
}
