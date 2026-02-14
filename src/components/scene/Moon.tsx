/**
 * Moon.tsx
 *
 * Moon component with procedural shader for cratered surface.
 * Orbits around its parent planet with dynamically scaled orbits
 * that ensure moons are always visible outside their parent body.
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
    ALL_BODIES,
} from '../../data/planetaryData';
import { getBodyPosition } from '../../engine/orbitalMechanics';
import { useSolarSystemStore } from '../../store/solarSystemStore';
import { createPlanetMaterial } from './planetMaterials';

interface MoonProps {
    body: CelestialBody;
}

/* ── Per-parent dynamic orbit scale ───────────────────────────────────
 * The visual planet radii are hugely exaggerated relative to orbital
 * distances (VISUAL_RADIUS_SCALE vs AU).  A single fixed orbit scale
 * causes moons to orbit *inside* bigger planets like Jupiter/Saturn.
 *
 * We compute a per-parent orbit configuration that:
 *   1) Ensures the innermost moon clears the parent's visual edge
 *      (including Saturn's rings at 2.4× radius).
 *   2) Spreads all sibling moons across a visually comfortable range
 *      proportional to the parent's visual size.
 *   3) Applies the same effective scale via getBodyPosition so that
 *      Keplerian eccentricity / inclination is preserved.
 * ─────────────────────────────────────────────────────────────────── */

interface ParentMoonConfig {
    clearanceRadius: number;   // min orbit distance (scene units)
    spreadRange: number;       // additional orbit spread for outer moons
    innerSMA: number;          // smallest semi-major axis among siblings (AU)
    outerSMA: number;          // largest semi-major axis among siblings (AU)
}

const parentMoonConfigCache: Record<string, ParentMoonConfig> = {};

function getParentMoonConfig(parentId: string): ParentMoonConfig | null {
    if (parentMoonConfigCache[parentId]) return parentMoonConfigCache[parentId];

    const parentBody = BODY_MAP[parentId];
    if (!parentBody) return null;

    const parentVisualRadius = Math.max(
        parentBody.physical.radius * VISUAL_RADIUS_SCALE,
        0.25,
    );

    // Saturn's rings extend to 2.4× radius → moons must clear that
    const clearanceFactor = parentId === 'saturn' ? 2.8 : 1.5;
    const spreadFactor = parentId === 'saturn' ? 3.5 : 3.0;

    const moons = ALL_BODIES.filter(
        (b) => b.parentId === parentId && b.type === 'moon',
    );
    if (moons.length === 0) return null;

    const smas = moons.map((m) => m.orbital.semiMajorAxis);
    const config: ParentMoonConfig = {
        clearanceRadius: parentVisualRadius * clearanceFactor,
        spreadRange: parentVisualRadius * spreadFactor,
        innerSMA: Math.min(...smas),
        outerSMA: Math.max(...smas),
    };

    parentMoonConfigCache[parentId] = config;
    return config;
}

/**
 * Return the effective orbit scale for `getBodyPosition` so that
 * this moon orbits at a visually appropriate distance from its parent.
 */
function computeMoonOrbitScale(body: CelestialBody, parentId: string): number {
    const config = getParentMoonConfig(parentId);
    if (!config) return AU * 30; // fallback

    let desiredDist: number;
    if (config.innerSMA === config.outerSMA) {
        // Single moon (or several at the same SMA) → place at clearance
        desiredDist = config.clearanceRadius;
    } else {
        const t =
            (body.orbital.semiMajorAxis - config.innerSMA) /
            (config.outerSMA - config.innerSMA);
        desiredDist = config.clearanceRadius + t * config.spreadRange;
    }

    // effectiveScale: when getBodyPosition multiplies `r` (≈ semiMajorAxis)
    // by this value the result equals desiredDist.
    return desiredDist / body.orbital.semiMajorAxis;
}

/* ───────────────────────────────────────────────────────────────────── */

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

    // Per-moon orbit scale (computed once, cached per parent)
    const orbitScale = useMemo(
        () => (body.parentId ? computeMoonOrbitScale(body, body.parentId) : AU * 30),
        [body],
    );

    // Procedural moon material
    const moonMaterial = useMemo(
        () => createPlanetMaterial(body.id, body.display.color),
        [body.id, body.display.color],
    );

    const tempVec = useMemo(() => new THREE.Vector3(), []);

    useFrame((_state, delta) => {
        if (!moonGroupRef.current || !parentBody) return;

        const parentPos = getBodyPosition(parentBody.orbital, simulationTime, AU);
        const moonRelPos = getBodyPosition(body.orbital, simulationTime, orbitScale);

        const worldX = parentPos[0] + moonRelPos[0];
        const worldY = parentPos[1] + moonRelPos[1];
        const worldZ = parentPos[2] + moonRelPos[2];

        moonGroupRef.current.position.set(worldX, worldY, worldZ);

        // Rotate using actual frame delta
        if (meshRef.current && body.physical.rotationPeriod !== 0) {
            const rate =
                (2 * Math.PI) / (Math.abs(body.physical.rotationPeriod) * 3600);
            meshRef.current.rotation.y += rate * delta * 1000;
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

    const handleClick = useCallback(
        (e: any) => {
            e.stopPropagation();
            selectBody(body.id);
        },
        [body.id, selectBody],
    );

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
                    position={[0, visualRadius + 0.3, 0]}
                    center
                    distanceFactor={8}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    <div
                        style={{
                            color: isSelected
                                ? '#6BB5FF'
                                : hovered
                                  ? '#ffffffee'
                                  : '#ffffffbb',
                            fontSize: '10px',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            textShadow:
                                '0 0 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,1)',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            backgroundColor: 'rgba(0,0,0,0.4)',
                        }}
                    >
                        {body.name}
                    </div>
                </Html>
            )}
        </group>
    );
}
