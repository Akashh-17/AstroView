/**
 * Moon.tsx
 *
 * Moon component with procedural shader for cratered surface.
 * Orbits around its parent planet with Keplerian mechanics.
 */

import { useRef, useCallback, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { CelestialBody } from '../../data/planetaryData';
import {
    VISUAL_RADIUS_SCALE,
    AU,
    BODY_MAP,
} from '../../data/planetaryData';
import { getBodyPosition } from '../../engine/orbitalMechanics';
import { useSolarSystemStore } from '../../store/solarSystemStore';
import { createPlanetMaterial } from './planetMaterials';

interface MoonProps {
    body: CelestialBody;
}

const MOON_ORBIT_SCALE = AU * 30;

export default function Moon({ body }: MoonProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const moonGroupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const { clock } = useThree();

    const simulationTime = useSolarSystemStore((s) => s.simulationTime);
    const showLabels = useSolarSystemStore((s) => s.showLabels);
    const showMoons = useSolarSystemStore((s) => s.showMoons);
    const selectedBody = useSolarSystemStore((s) => s.selectedBody);
    const selectBody = useSolarSystemStore((s) => s.selectBody);

    const isSelected = selectedBody === body.id;
    const visualRadius = Math.max(body.physical.radius * VISUAL_RADIUS_SCALE, 0.12);
    const parentBody = body.parentId ? BODY_MAP[body.parentId] : null;

    // Procedural moon material
    const moonMaterial = useMemo(
        () => createPlanetMaterial(body.id, body.display.color),
        [body.id, body.display.color]
    );

    const tempVec = useMemo(() => new THREE.Vector3(), []);

    useFrame(() => {
        if (!moonGroupRef.current || !parentBody) return;

        const parentPos = getBodyPosition(parentBody.orbital, simulationTime, AU);
        const moonRelPos = getBodyPosition(body.orbital, simulationTime, MOON_ORBIT_SCALE);

        const worldX = parentPos[0] + moonRelPos[0];
        const worldY = parentPos[1] + moonRelPos[1];
        const worldZ = parentPos[2] + moonRelPos[2];

        moonGroupRef.current.position.set(worldX, worldY, worldZ);

        // Rotate
        if (meshRef.current && body.physical.rotationPeriod !== 0) {
            const rate = (2 * Math.PI) / (Math.abs(body.physical.rotationPeriod) * 3600);
            meshRef.current.rotation.y += rate * 0.016 * 1000;
        }

        // Update shader uniforms
        const elapsed = clock.getElapsedTime();
        tempVec.set(-worldX, -worldY, -worldZ).normalize();

        if (moonMaterial.uniforms.lightDirection) {
            moonMaterial.uniforms.lightDirection.value.copy(tempVec);
        }
        if (moonMaterial.uniforms.time) {
            moonMaterial.uniforms.time.value = elapsed;
        }
    });

    const handleClick = useCallback(() => {
        selectBody(body.id);
    }, [body.id, selectBody]);

    if (!showMoons || !parentBody) return null;

    return (
        <group ref={moonGroupRef}>
            <mesh
                ref={meshRef}
                onClick={handleClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                material={moonMaterial}
            >
                <sphereGeometry args={[visualRadius, 32, 32]} />
            </mesh>

            {showLabels && (
                <Html
                    position={[0, visualRadius + 0.2, 0]}
                    center
                    distanceFactor={10}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    <div
                        style={{
                            color: isSelected ? '#5577ee' : hovered ? '#ffffffdd' : '#ffffff77',
                            fontSize: '9px',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            textShadow: '0 0 8px rgba(0,0,0,0.9)',
                        }}
                    >
                        {body.name}
                    </div>
                </Html>
            )}
        </group>
    );
}
