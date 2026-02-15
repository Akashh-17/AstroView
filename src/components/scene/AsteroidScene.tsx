/**
 * AsteroidScene.tsx — 3D scene for the "Eyes on Asteroids" page.
 *
 * Full solar-system view: Sun at center, inner planets with coloured orbits,
 * all 12 named asteroids with orbit lines.
 *
 * When you zoom close to Earth you can see the 5 close-approach asteroids
 * positioned around it with flyby trajectory lines — matching the Astrolens
 * "Eyes on Asteroids" visualization.
 */
import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Sun from './Sun';
import Planet from './Planet';
import NamedAsteroid from './NamedAsteroid';
import Starfield from './Starfield';
import CameraController from './CameraController';
import {
    PLANETS,
    NAMED_ASTEROIDS,
    CLOSE_APPROACHES,
    EARTH,
    AU,
} from '../../data/planetaryData';
import type { CloseApproach } from '../../data/planetaryData';
import { getBodyPosition } from '../../engine/orbitalMechanics';
import { useSolarSystemStore } from '../../store/solarSystemStore';

// ──────────────────────────────────────────────────────────────────────────
// Close-approach asteroids that orbit Earth (visible when zoomed in)
// ──────────────────────────────────────────────────────────────────────────

/** Set of asteroid IDs that have close-approach entries (rendered near Earth instead) */
const CLOSE_APPROACH_IDS = new Set(CLOSE_APPROACHES.map((c) => c.asteroidId));

// Earth's display radius in scene units (must match Planet.tsx logic)
const EARTH_DISPLAY_RADIUS = Math.max(6371 * 0.0004, 0.25); // ≈ 2.55
// Minimum offset so close-approach markers sit well outside the planet sphere
const MIN_OFFSET = EARTH_DISPLAY_RADIUS + 1.5; // ≈ 4.05
// Maximum spread so markers don't drift too far from Earth at full zoom-out
const MAX_OFFSET = EARTH_DISPLAY_RADIUS + 6; // ≈ 8.55

/** Deterministic angle per asteroid so they spread nicely around Earth */
function seededAngle(id: string, index: number) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
    }
    const theta = ((hash & 0xfff) / 0xfff) * Math.PI * 2;
    const phi = ((index - 2) / 5) * 0.5 + (((hash >> 12) & 0xff) / 0xff - 0.5) * 0.3;
    return { theta, phi };
}

/** A single close-approach asteroid marker that orbits near Earth. */
function CloseApproachAsteroid({
    approach,
    index,
    earthPos,
}: {
    approach: CloseApproach;
    index: number;
    earthPos: THREE.Vector3;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    const selectedBody = useSolarSystemStore((s) => s.selectedBody);
    const selectBody = useSolarSystemStore((s) => s.selectBody);
    const isSelected = selectedBody === approach.asteroidId;

    const { theta, phi } = useMemo(
        () => seededAngle(approach.asteroidId, index),
        [approach.asteroidId, index],
    );

    // Offset from Earth — clamp so markers sit outside the planet sphere
    // Map distanceKm linearly into [MIN_OFFSET, MAX_OFFSET] range
    const minKm = 1_000_000;
    const maxKm = 7_000_000;
    const t = Math.min(Math.max((approach.distanceKm - minKm) / (maxKm - minKm), 0), 1);
    const dist = MIN_OFFSET + t * (MAX_OFFSET - MIN_OFFSET);

    const offset = useMemo<[number, number, number]>(() => {
        const x = Math.cos(theta) * Math.cos(phi) * dist;
        const y = Math.sin(phi) * dist * 0.4;
        const z = Math.sin(theta) * Math.cos(phi) * dist;
        return [x, y, z];
    }, [theta, phi, dist]);

    // Build a trajectory line geometry that passes near Earth
    const trajectoryLine = useMemo(() => {
        const dir = new THREE.Vector3(offset[0], offset[1], offset[2]).normalize();
        const tangent = new THREE.Vector3(-dir.z, dir.y * 0.3, dir.x).normalize();
        const flybyDir = dir.clone().add(tangent.multiplyScalar(0.25)).normalize();
        const center = new THREE.Vector3(
            earthPos.x + offset[0],
            earthPos.y + offset[1],
            earthPos.z + offset[2],
        );
        const extent = dist * 3;
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 50; i++) {
            const t = (i / 50) * 2 - 1;
            pts.push(center.clone().add(flybyDir.clone().multiplyScalar(t * extent)));
        }
        return new THREE.BufferGeometry().setFromPoints(pts);
    }, [offset, earthPos, dist]);

    const trajectoryMat = useMemo(
        () =>
            new THREE.LineBasicMaterial({
                color: isSelected ? '#6BB5FF' : '#aaaacc',
                transparent: true,
                opacity: isSelected ? 0.65 : 0.35,
                depthWrite: false,
            }),
        [isSelected],
    );

    const displayRadius = 0.08 + Math.min(approach.estimatedSizeM / 600, 0.12);

    const glowMaterial = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: new THREE.Color('#aabbcc'),
                transparent: true,
                opacity: 0.2,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            }),
        [],
    );

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.008;
            meshRef.current.rotation.x += 0.004;
        }
        if (glowRef.current) {
            const t = Date.now() * 0.002;
            const pulse = 1.0 + Math.sin(t + index) * 0.15;
            glowRef.current.scale.setScalar(pulse);
            glowMaterial.opacity = (isSelected ? 0.45 : hovered ? 0.35 : 0.15) * pulse;
        }
    });

    const handleClick = useCallback(
        (e: THREE.Event) => {
            (e as any).stopPropagation();
            selectBody(approach.asteroidId);
        },
        [approach.asteroidId, selectBody],
    );

    return (
        <>
            {/* Trajectory line */}
            <primitive object={new THREE.Line(trajectoryLine, trajectoryMat)} />

            {/* Marker at Earth + offset */}
            <group
                position={[
                    earthPos.x + offset[0],
                    earthPos.y + offset[1],
                    earthPos.z + offset[2],
                ]}
            >
                {/* Hexagonal ring */}
                <mesh rotation={[0, 0, Math.PI / 6]}>
                    <ringGeometry args={[displayRadius * 1.6, displayRadius * 1.9, 6]} />
                    <meshBasicMaterial
                        color={isSelected ? '#6BB5FF' : '#888888'}
                        transparent
                        opacity={isSelected ? 0.8 : hovered ? 0.6 : 0.35}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>

                {/* Asteroid body */}
                <mesh
                    ref={meshRef}
                    onClick={handleClick}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                >
                    <dodecahedronGeometry args={[displayRadius, 0]} />
                    <meshStandardMaterial
                        color="#8a8a8a"
                        roughness={0.85}
                        metalness={0.15}
                        emissive="#888888"
                        emissiveIntensity={isSelected ? 0.4 : hovered ? 0.25 : 0.1}
                    />
                </mesh>

                {/* Glow */}
                <mesh ref={glowRef} material={glowMaterial}>
                    <sphereGeometry args={[displayRadius * 2.5, 16, 16]} />
                </mesh>

                {/* Selection ring */}
                {isSelected && (
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[displayRadius * 2, displayRadius * 2.2, 32]} />
                        <meshBasicMaterial
                            color="#3e63dd"
                            side={THREE.DoubleSide}
                            transparent
                            opacity={0.6}
                            depthWrite={false}
                        />
                    </mesh>
                )}

                {/* Label */}
                <Html
                    position={[0, displayRadius + 0.4, 0]}
                    center
                    distanceFactor={8}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    <div
                        style={{
                            color: isSelected ? '#6BB5FF' : hovered ? '#ffffff' : '#b0b8c4',
                            fontSize: '11px',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: isSelected ? 700 : 500,
                            letterSpacing: '0.08em',
                            whiteSpace: 'nowrap',
                            textShadow:
                                '0 0 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.95)',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            backgroundColor: 'rgba(0,0,0,0.45)',
                            transition: 'color 0.3s',
                        }}
                    >
                        {approach.asteroidName}
                    </div>
                </Html>
            </group>
        </>
    );
}

// ──────────────────────────────────────────────────────────────────────────
// Wrapper that tracks Earth's position and renders all close-approach markers
// ──────────────────────────────────────────────────────────────────────────
function CloseApproachGroup() {
    const simulationTime = useSolarSystemStore((s) => s.simulationTime);
    const earthPosRef = useRef(new THREE.Vector3());

    // Update Earth position each frame
    useFrame(() => {
        const pos = getBodyPosition(EARTH.orbital, simulationTime, AU);
        earthPosRef.current.set(pos[0], pos[1], pos[2]);
    });

    // We need an initial position for the first render
    const earthPosInitial = useMemo(() => {
        const pos = getBodyPosition(EARTH.orbital, simulationTime, AU);
        return new THREE.Vector3(pos[0], pos[1], pos[2]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {CLOSE_APPROACHES.map((approach, index) => (
                <CloseApproachAsteroid
                    key={approach.asteroidId}
                    approach={approach}
                    index={index}
                    earthPos={earthPosRef.current.lengthSq() > 0 ? earthPosRef.current : earthPosInitial}
                />
            ))}
        </>
    );
}

// ──────────────────────────────────────────────────────────────────────────
// Time tick
// ──────────────────────────────────────────────────────────────────────────
function TimeTickLoop() {
    const tick = useSolarSystemStore((s) => s.tick);
    useFrame((_state, delta) => {
        tick(Math.min(delta, 0.1));
    });
    return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Scene content
// ──────────────────────────────────────────────────────────────────────────
function AsteroidSceneContent() {
    const selectBody = useSolarSystemStore((s) => s.selectBody);

    const handleMissedClick = useCallback(() => {
        selectBody(null);
    }, [selectBody]);

    return (
        <>
            <TimeTickLoop />
            <CameraController />
            <Starfield count={12000} radius={5000} />

            {/* Click-away sphere to deselect */}
            <mesh visible={false} onClick={handleMissedClick} renderOrder={-1}>
                <sphereGeometry args={[4500, 8, 8]} />
                <meshBasicMaterial side={THREE.BackSide} depthWrite={false} />
            </mesh>

            {/* Sun at centre */}
            <Sun />

            {/* All 8 planets with coloured orbits */}
            {PLANETS.map((planet) => (
                <Planet key={planet.id} body={planet} />
            ))}

            {/* All named asteroids (always visible) — excluding the 5 rendered as close-approach markers */}
            {NAMED_ASTEROIDS
                .filter((a) => !CLOSE_APPROACH_IDS.has(a.id))
                .map((asteroid) => (
                    <NamedAsteroid key={asteroid.id} body={asteroid} />
                ))}

            {/* Close-approach asteroids clustered around Earth (visible on zoom) */}
            <CloseApproachGroup />
        </>
    );
}

// ──────────────────────────────────────────────────────────────────────────
// Ensure the WebGL context is properly disposed on unmount so navigation
// back to other pages isn't blocked by a lingering renderer.
// ──────────────────────────────────────────────────────────────────────────
function SceneCleanup() {
    const { gl, scene } = useThree();
    useEffect(() => {
        return () => {
            scene.traverse((obj) => {
                if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
                if ((obj as THREE.Mesh).material) {
                    const mat = (obj as THREE.Mesh).material;
                    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
                    else mat.dispose();
                }
            });
            gl.dispose();
            gl.forceContextLoss();
        };
    }, [gl, scene]);
    return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Main canvas
// ──────────────────────────────────────────────────────────────────────────
export default function AsteroidScene() {
    return (
        <Canvas
            camera={{
                position: [30, 20, 50],
                fov: 45,
                near: 0.01,
                far: 12000,
            }}
            gl={{
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.0,
                outputColorSpace: THREE.SRGBColorSpace,
            }}
            className="!absolute !inset-0"
            style={{ background: '#000000' }}
            dpr={[1, 2]}
            performance={{ min: 0.5 }}
            eventPrefix="client"
        >
            <SceneCleanup />
            <AsteroidSceneContent />
        </Canvas>
    );
}
