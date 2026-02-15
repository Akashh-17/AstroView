/**
 * EarthScene.tsx
 *
 * 3D Earth with photorealistic procedural shader, atmosphere glow,
 * day/night lighting, starfield background, and smooth camera
 * fly-to when a satellite is focused.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { EARTH_RADIUS_3D } from '../../data/satelliteData';
import { PLANET_VERTEX, EARTH_FRAGMENT } from '../scene/shaders/planetShaders';
import EarthAtmosphere from '../scene/EarthAtmosphere';
import { useSatelliteStore } from '../../store/satelliteStore';

type OrbitControlsRef = {
    target: THREE.Vector3;
    update: () => void;
};

export default function EarthScene() {
    const meshRef = useRef<THREE.Mesh>(null);
    const controlsRef = useRef<OrbitControlsRef>(null);
    const { clock, camera } = useThree();

    const focusSatelliteId = useSatelliteStore((s) => s.focusSatelliteId);
    const cameraTransitioning = useSatelliteStore((s) => s.cameraTransitioning);
    const setCameraTransitioning = useSatelliteStore((s) => s.setCameraTransitioning);
    const satellites = useSatelliteStore((s) => s.satellites);

    // Transition state
    const isTransitioning = useRef(false);
    const transitionProgress = useRef(0);
    const startCamPos = useRef(new THREE.Vector3());
    const startTargetPos = useRef(new THREE.Vector3());

    // Kick off transition when focusSatelliteId changes
    useEffect(() => {
        if (focusSatelliteId && cameraTransitioning) {
            isTransitioning.current = true;
            transitionProgress.current = 0;
            startCamPos.current.copy(camera.position);
            if (controlsRef.current) {
                startTargetPos.current.copy(controlsRef.current.target);
            }
        }
    }, [focusSatelliteId, cameraTransitioning, camera]);

    // Earth procedural shader material
    const earthMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: PLANET_VERTEX,
            fragmentShader: EARTH_FRAGMENT,
            uniforms: {
                lightDirection: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
                time: { value: 0 },
            },
        });
    }, []);

    // Axial tilt (23.44 deg)
    const axialTilt = useMemo(() => (23.44 * Math.PI) / 180, []);

    // Rotate Earth + camera fly-to
    useFrame((_state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.001;
            earthMaterial.uniforms.time.value = clock.getElapsedTime();
        }

        if (!controlsRef.current) return;

        // Camera fly-to focused satellite
        if (focusSatelliteId) {
            const sat = satellites.find((s) => s.id === focusSatelliteId);
            if (sat?.position) {
                const destTarget = new THREE.Vector3(sat.position[0], sat.position[1], sat.position[2]);
                // Camera offset: slightly behind & above the satellite
                const dir = destTarget.clone().normalize();
                const cameraOffset = dir.clone().multiplyScalar(2.0);
                cameraOffset.y += 1.2;
                const destCamPos = destTarget.clone().add(cameraOffset);

                if (isTransitioning.current) {
                    transitionProgress.current += delta * 1.2;
                    const t = Math.min(transitionProgress.current, 1);
                    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic

                    controlsRef.current.target.lerpVectors(startTargetPos.current, destTarget, ease);
                    camera.position.lerpVectors(startCamPos.current, destCamPos, ease);

                    if (t >= 1) {
                        isTransitioning.current = false;
                        setCameraTransitioning(false);
                    }
                } else {
                    // Gently track after transition completes
                    controlsRef.current.target.lerp(destTarget, delta * 3);
                }
            }
        }

        controlsRef.current.update();
    });

    return (
        <>
            {/* Starfield */}
            <Stars radius={300} depth={60} count={4000} factor={4} saturation={0.1} fade speed={0.5} />

            {/* Sun directional light */}
            <directionalLight
                position={[50, 10, 30]}
                intensity={2}
                color="#FFF5E0"
            />
            <ambientLight intensity={0.05} color="#334466" />

            {/* Earth sphere */}
            <group rotation={[axialTilt, 0, 0]}>
                <mesh ref={meshRef} material={earthMaterial}>
                    <sphereGeometry args={[EARTH_RADIUS_3D, 128, 128]} />
                </mesh>

                {/* Atmospheric glow */}
                <EarthAtmosphere
                    radius={EARTH_RADIUS_3D}
                    color="#4A9EFF"
                    opacity={0.3}
                    scale={1.06}
                    falloff={2.0}
                />
            </group>

            {/* Camera controls */}
            <OrbitControls
                ref={controlsRef as React.Ref<never>}
                makeDefault
                enablePan={true}
                enableDamping={true}
                dampingFactor={0.08}
                minDistance={EARTH_RADIUS_3D * 1.3}
                maxDistance={EARTH_RADIUS_3D * 25}
                rotateSpeed={0.5}
            />
        </>
    );
}
