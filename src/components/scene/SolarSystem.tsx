/**
 * SolarSystem.tsx — Root 3D scene component
 */
import { useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Sun from './Sun';
import Planet from './Planet';
import Moon from './Moon';
import AsteroidBelt from './AsteroidBelt';
import Starfield from './Starfield';
import CameraController from './CameraController';
import { PLANETS, MOONS } from '../../data/planetaryData';
import { useSolarSystemStore } from '../../store/solarSystemStore';

function TimeTickLoop() {
    const tick = useSolarSystemStore((s) => s.tick);
    useFrame((_state, delta) => {
        tick(Math.min(delta, 0.1));
    });
    return null;
}

function SolarSystemScene() {
    const selectBody = useSolarSystemStore((s) => s.selectBody);
    const showMoons = useSolarSystemStore((s) => s.showMoons);
    const showAsteroids = useSolarSystemStore((s) => s.showAsteroids);

    const handleMissedClick = useCallback(() => {
        selectBody(null);
    }, [selectBody]);

    return (
        <>
            <TimeTickLoop />
            <CameraController />
            <Starfield count={8000} radius={700} />

            <mesh visible={false} onClick={handleMissedClick}>
                <sphereGeometry args={[600, 8, 8]} />
                <meshBasicMaterial side={THREE.BackSide} />
            </mesh>

            <Sun />

            {PLANETS.map((planet) => (
                <Planet key={planet.id} body={planet} />
            ))}

            {showMoons && MOONS.map((moon) => (
                <Moon key={moon.id} body={moon} />
            ))}

            {showAsteroids && <AsteroidBelt />}
        </>
    );
}

export default function SolarSystem() {
    return (
        <Canvas
            camera={{
                position: [50, 35, 80],
                fov: 45,
                near: 0.01,
                far: 2000,
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
        >
            <SolarSystemScene />
        </Canvas>
    );
}
