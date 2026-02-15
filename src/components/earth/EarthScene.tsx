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
import { EARTH_RADIUS_3D, VITAL_SIGNS, type VitalSignId } from '../../data/satelliteData';
import {
    PLANET_VERTEX,
    EARTH_TEXTURED_FRAGMENT,
    TEMPERATURE_EARTH_FRAGMENT,
    PRECIPITATION_EARTH_FRAGMENT,
    OZONE_EARTH_FRAGMENT,
    SOIL_MOISTURE_EARTH_FRAGMENT,
    WATER_STORAGE_EARTH_FRAGMENT,
} from '../scene/shaders/planetShaders';
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
    const activeVitalSign = useSatelliteStore((s) => s.activeVitalSign);

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

    // Helper: get fragment shader for a vital sign
    const getVitalSignShader = (id: VitalSignId): string => {
        switch (id) {
            case 'air_temperature': return TEMPERATURE_EARTH_FRAGMENT;
            case 'precipitation': return PRECIPITATION_EARTH_FRAGMENT;
            case 'ozone': return OZONE_EARTH_FRAGMENT;
            case 'soil_moisture': return SOIL_MOISTURE_EARTH_FRAGMENT;
            case 'water_storage': return WATER_STORAGE_EARTH_FRAGMENT;
            default: return EARTH_TEXTURED_FRAGMENT;
        }
    };

    // Helper: get the dataColor uniform for generic shaders
    const getDataColor = (id: VitalSignId): THREE.Vector3 => {
        const vs = VITAL_SIGNS.find(v => v.id === id);
        if (!vs) return new THREE.Vector3(0.3, 0.6, 0.9);
        const c = new THREE.Color(vs.color);
        return new THREE.Vector3(c.r, c.g, c.b);
    };

    // Load a real Earth texture for geography-aware overlays (coastlines, borders)
    const earthTexture = useMemo(() => {
        const tex = new THREE.TextureLoader().load(
            'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
        );
        return tex;
    }, []);

    // Earth textured shader material — default (Blue Marble)
    const earthMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: PLANET_VERTEX,
            fragmentShader: EARTH_TEXTURED_FRAGMENT,
            uniforms: {
                lightDirection: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
                time: { value: 0 },
                earthMap: { value: earthTexture },
            },
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [earthTexture]);

    // Vital-sign overlay material — created when needed
    const vitalMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: PLANET_VERTEX,
            fragmentShader: TEMPERATURE_EARTH_FRAGMENT,
            uniforms: {
                lightDirection: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
                time: { value: 0 },
                dataColor: { value: new THREE.Vector3(0.3, 0.6, 0.9) },
                earthMap: { value: earthTexture },
            },
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [earthTexture]);

    // Switch material when vital sign changes
    useEffect(() => {
        if (!meshRef.current) return;

        const hasOverlay = activeVitalSign !== 'satellites_now';

        if (hasOverlay) {
            vitalMaterial.fragmentShader = getVitalSignShader(activeVitalSign);
            vitalMaterial.uniforms.dataColor.value = getDataColor(activeVitalSign);
            vitalMaterial.needsUpdate = true;
            meshRef.current.material = vitalMaterial;
        } else {
            meshRef.current.material = earthMaterial;
        }
    }, [activeVitalSign, earthMaterial, vitalMaterial]);

    // Axial tilt (23.44 deg)
    const axialTilt = useMemo(() => (23.44 * Math.PI) / 180, []);

    // Whether an overlay mode is active (Earth fixed + 360° rotation only)
    const isOverlayMode = activeVitalSign !== 'satellites_now';

    // Rotate Earth + camera fly-to
    useFrame((_state, delta) => {
        if (meshRef.current) {
            // In overlay mode, stop auto-rotation so user controls rotation
            if (!isOverlayMode) {
                meshRef.current.rotation.y += 0.001;
            }
            const elapsed = clock.getElapsedTime();
            earthMaterial.uniforms.time.value = elapsed;
            vitalMaterial.uniforms.time.value = elapsed;
        }

        if (!controlsRef.current) return;

        // In overlay mode, lock camera target to origin (Earth center)
        if (isOverlayMode) {
            controlsRef.current.target.set(0, 0, 0);
        }

        // Camera fly-to focused satellite (skip in overlay mode — Earth stays centered)
        if (focusSatelliteId && !isOverlayMode) {
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
                enablePan={!isOverlayMode}
                enableDamping={true}
                dampingFactor={0.08}
                minDistance={isOverlayMode ? EARTH_RADIUS_3D * 1.6 : EARTH_RADIUS_3D * 1.3}
                maxDistance={isOverlayMode ? EARTH_RADIUS_3D * 5 : EARTH_RADIUS_3D * 25}
                rotateSpeed={0.5}
            />
        </>
    );
}
