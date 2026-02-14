/**
 * Planet.tsx
 *
 * Reusable planet component with procedural GLSL shader materials.
 * Each planet renders with a unique, realistic surface generated entirely in the GPU.
 *
 * Features:
 * - Procedural surface via custom shaders (Earth has continents, Jupiter has bands, etc.)
 * - Per-frame Keplerian orbital position
 * - Axial rotation with correct tilt
 * - Dynamic lighting direction from Sun
 * - Saturn's rings with procedural ring shader
 * - Atmospheric glow for Earth/Venus
 * - Labels, selection ring, hover effects
 * - Click-to-select
 */

import { useRef, useCallback, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { CelestialBody } from '../../data/planetaryData';
import {
    AU,
    VISUAL_RADIUS_SCALE,
} from '../../data/planetaryData';
import { getBodyPosition, degToRad } from '../../engine/orbitalMechanics';
import { useSolarSystemStore } from '../../store/solarSystemStore';
import OrbitLine from './OrbitLine';
import EarthAtmosphere from './EarthAtmosphere';
import { createPlanetMaterial, createRingMaterial } from './planetMaterials';

interface PlanetProps {
    body: CelestialBody;
}

export default function Planet({ body }: PlanetProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const { clock } = useThree();

    const simulationTime = useSolarSystemStore((s) => s.simulationTime);
    const selectedBody = useSolarSystemStore((s) => s.selectedBody);
    const showLabels = useSolarSystemStore((s) => s.showLabels);
    const selectBody = useSolarSystemStore((s) => s.selectBody);

    const isSelected = selectedBody === body.id;

    // Visual radius — exaggerated so planets are visible
    const visualRadius = body.physical.radius * VISUAL_RADIUS_SCALE;
    const minRadius = 0.25;
    const displayRadius = Math.max(visualRadius, minRadius);

    // Rotation speed
    const rotationRate = body.physical.rotationPeriod !== 0
        ? (2 * Math.PI) / (Math.abs(body.physical.rotationPeriod) * 3600)
        : 0;
    const rotationDirection = body.physical.rotationPeriod < 0 ? -1 : 1;

    // Axial tilt in radians
    const axialTilt = degToRad(body.physical.axialTilt);

    // Create the procedural shader material (memoized)
    const planetMaterial = useMemo(
        () => createPlanetMaterial(body.id, body.display.color),
        [body.id, body.display.color]
    );

    // Saturn rings
    const isSaturn = body.id === 'saturn';
    const ringInner = displayRadius * 1.3;
    const ringOuter = displayRadius * 2.4;
    const ringMaterial = useMemo(
        () => isSaturn ? createRingMaterial(ringInner, ringOuter) : null,
        [isSaturn, ringInner, ringOuter]
    );

    // Atmosphere
    const hasAtmosphere = body.id === 'earth' || body.id === 'venus';

    // Temp vector for light direction calculation
    const tempVec = useMemo(() => new THREE.Vector3(), []);

    // Update position, rotation, and shader uniforms each frame
    useFrame((_state, delta) => {
        if (!groupRef.current || !meshRef.current) return;

        // Compute orbital position
        const pos = getBodyPosition(body.orbital, simulationTime, AU);
        groupRef.current.position.set(pos[0], pos[1], pos[2]);

        // Rotate around axis
        meshRef.current.rotation.y += rotationRate * delta * rotationDirection * 1000;

        // Update shader uniforms
        const elapsed = clock.getElapsedTime();

        // Light direction: from planet toward the Sun (origin)
        tempVec.set(-pos[0], -pos[1], -pos[2]).normalize();

        if (planetMaterial.uniforms.lightDirection) {
            planetMaterial.uniforms.lightDirection.value.copy(tempVec);
        }
        if (planetMaterial.uniforms.time) {
            planetMaterial.uniforms.time.value = elapsed;
        }

        // Update ring material too
        if (ringMaterial) {
            if (ringMaterial.uniforms.lightDirection) {
                ringMaterial.uniforms.lightDirection.value.copy(tempVec);
            }
        }
    });

    const handleClick = useCallback((e: THREE.Event) => {
        (e as any).stopPropagation();
        selectBody(body.id);
    }, [body.id, selectBody]);

    const planetColor = body.display.color;

    return (
        <>
            {/* Orbit path */}
            <OrbitLine elements={body.orbital} color={planetColor} />

            {/* Planet group */}
            <group ref={groupRef}>
                {/* Planet sphere — tilted on axis */}
                <group rotation={[axialTilt, 0, 0]}>
                    <mesh
                        ref={meshRef}
                        onClick={handleClick}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                        material={planetMaterial}
                    >
                        <sphereGeometry args={[displayRadius, 64, 64]} />
                    </mesh>

                    {/* Atmosphere glow */}
                    {hasAtmosphere && (
                        <EarthAtmosphere
                            radius={displayRadius}
                            color={body.display.glowColor || body.display.color}
                            opacity={body.id === 'earth' ? 0.35 : 0.2}
                        />
                    )}

                    {/* Saturn's procedural rings */}
                    {isSaturn && ringMaterial && (
                        <mesh rotation={[Math.PI / 2, 0, 0]} material={ringMaterial}>
                            <ringGeometry args={[ringInner, ringOuter, 128]} />
                        </mesh>
                    )}
                </group>

                {/* Selection ring — placed outside Saturn's rings (2.4×) */}
                {isSelected && (
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[
                            isSaturn ? displayRadius * 2.6 : displayRadius * 1.6,
                            isSaturn ? displayRadius * 2.7 : displayRadius * 1.7,
                            64
                        ]} />
                        <meshBasicMaterial
                            color="#3e63dd"
                            side={THREE.DoubleSide}
                            transparent
                            opacity={0.6}
                            depthWrite={false}
                        />
                    </mesh>
                )}

                {/* Hover glow ring */}
                {hovered && !isSelected && (
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[
                            isSaturn ? displayRadius * 2.6 : displayRadius * 1.4,
                            isSaturn ? displayRadius * 2.7 : displayRadius * 1.5,
                            64
                        ]} />
                        <meshBasicMaterial
                            color="#ffffff"
                            side={THREE.DoubleSide}
                            transparent
                            opacity={0.2}
                            depthWrite={false}
                        />
                    </mesh>
                )}

                {/* HTML Label */}
                {showLabels && (
                    <Html
                        position={[0, displayRadius + 0.8, 0]}
                        center
                        distanceFactor={12}
                        style={{
                            pointerEvents: 'none',
                            userSelect: 'none',
                        }}
                    >
                        <div
                            style={{
                                color: isSelected ? '#6BB5FF' : hovered ? '#ffffff' : '#ffffffee',
                                fontSize: '13px',
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: isSelected ? 700 : 500,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                                textShadow: '0 0 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.95), 0 0 24px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,1)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(0,0,0,0.45)',
                                transition: 'color 0.3s',
                            }}
                        >
                            {body.name}
                        </div>
                    </Html>
                )}
            </group>
        </>
    );
}
