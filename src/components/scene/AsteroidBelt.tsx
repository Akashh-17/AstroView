/**
 * AsteroidBelt.tsx
 *
 * Renders the main asteroid belt between Mars and Jupiter using
 * InstancedMesh for high performance. Each asteroid is a tiny sphere
 * with randomized orbital elements.
 *
 * InstancedMesh renders ~2500 objects in a single draw call,
 * making this very GPU-friendly.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ASTEROID_BELT, AU } from '../../data/planetaryData';
import { useSolarSystemStore } from '../../store/solarSystemStore';

// Pre-generate random orbital data for each asteroid
interface AsteroidOrbit {
    a: number;     // semi-major axis (AU)
    e: number;     // eccentricity
    i: number;     // inclination (radians)
    omega: number; // argument of perihelion (radians)
    M0: number;    // mean anomaly at epoch (radians)
    period: number; // orbital period (years)
}

export default function AsteroidBelt() {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const showAsteroids = useSolarSystemStore((s) => s.showAsteroids);
    const simulationTime = useSolarSystemStore((s) => s.simulationTime);

    const count = ASTEROID_BELT.count;

    // Generate random asteroid orbits once
    const asteroids = useMemo<AsteroidOrbit[]>(() => {
        const arr: AsteroidOrbit[] = [];
        for (let idx = 0; idx < count; idx++) {
            // Semi-major axis: uniform between inner and outer edge
            const a =
                ASTEROID_BELT.minRadius +
                Math.random() * (ASTEROID_BELT.maxRadius - ASTEROID_BELT.minRadius);

            // Eccentricity: mostly small, some larger
            const e = Math.random() * ASTEROID_BELT.maxEccentricity;

            // Inclination: concentrated near ecliptic plane
            const i =
                ((Math.random() - 0.5) * 2 * ASTEROID_BELT.maxInclination * Math.PI) / 180;

            // Random argument of perihelion
            const omega = Math.random() * Math.PI * 2;

            // Random starting position
            const M0 = Math.random() * Math.PI * 2;

            // Kepler's third law: T² ∝ a³ (T in years, a in AU)
            const period = Math.pow(a, 1.5);

            arr.push({ a, e, i, omega, M0, period });
        }
        return arr;
    }, [count]);

    // Temp objects for matrix computation
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const J2000 = 2451545.0;

    // Update all asteroid positions each frame
    useFrame(() => {
        if (!meshRef.current || !showAsteroids) return;

        const yearsSinceEpoch = (simulationTime - J2000) / 365.25;

        for (let idx = 0; idx < count; idx++) {
            const ast = asteroids[idx];

            // Mean anomaly at current time
            const n = (2 * Math.PI) / ast.period; // mean motion
            let M = ast.M0 + n * yearsSinceEpoch;
            M = M % (2 * Math.PI);
            if (M < 0) M += 2 * Math.PI;

            // Simple Kepler solve (1 iteration is fine for visualization)
            let E = M;
            for (let j = 0; j < 3; j++) {
                E = E - (E - ast.e * Math.sin(E) - M) / (1 - ast.e * Math.cos(E));
            }

            // True anomaly
            const nu = 2 * Math.atan2(
                Math.sqrt(1 + ast.e) * Math.sin(E / 2),
                Math.sqrt(1 - ast.e) * Math.cos(E / 2)
            );

            // Radial distance
            const r = ast.a * (1 - ast.e * Math.cos(E));

            // Position in orbital plane
            const xOrbital = r * Math.cos(nu);
            const yOrbital = r * Math.sin(nu);

            // Apply inclination and argument of perihelion
            const cosOmega = Math.cos(ast.omega);
            const sinOmega = Math.sin(ast.omega);
            const cosI = Math.cos(ast.i);
            const sinI = Math.sin(ast.i);

            const x = (cosOmega * xOrbital - sinOmega * yOrbital) * AU;
            const y = sinI * (sinOmega * xOrbital + cosOmega * yOrbital) * AU;
            const z = (sinOmega * xOrbital + cosOmega * yOrbital) * cosI * AU;

            tempObject.position.set(x, y, z);

            // Random rotation for visual variety
            tempObject.rotation.set(
                idx * 0.1,
                idx * 0.2 + yearsSinceEpoch,
                idx * 0.05
            );

            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(idx, tempObject.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!showAsteroids) return null;

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[ASTEROID_BELT.particleSize, 0]} />
            <meshStandardMaterial
                color={ASTEROID_BELT.color}
                roughness={0.95}
                metalness={0.1}
            />
        </instancedMesh>
    );
}
