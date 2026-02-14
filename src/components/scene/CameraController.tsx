/**
 * CameraController.tsx
 *
 * Manages the orbit controls and smooth camera transitions when
 * focusing on a celestial body.
 *
 * Features:
 * - OrbitControls for zoom, pan, rotate
 * - Smooth camera lerp to focused body position
 * - Zoom constraints
 * - Touch gesture support (handed by OrbitControls)
 */

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSolarSystemStore } from '../../store/solarSystemStore';
import {
    BODY_MAP,
    AU,
    VISUAL_RADIUS_SCALE,
    SUN_VISUAL_SCALE,
} from '../../data/planetaryData';
import { getBodyPosition } from '../../engine/orbitalMechanics';

// Controls ref type from drei
type OrbitControlsRef = {
    target: THREE.Vector3;
    update: () => void;
    enableDamping: boolean;
    dampingFactor: number;
};

export default function CameraController() {
    const controlsRef = useRef<OrbitControlsRef>(null);
    const { camera } = useThree();

    const focusTarget = useSolarSystemStore((s) => s.focusTarget);
    const simulationTime = useSolarSystemStore((s) => s.simulationTime);
    const cameraTransitioning = useSolarSystemStore((s) => s.cameraTransitioning);
    const setCameraTransitioning = useSolarSystemStore((s) => s.setCameraTransitioning);

    // Track the target position for smooth transitions
    const isTransitioning = useRef(false);
    const transitionProgress = useRef(0);
    const startCamPos = useRef(new THREE.Vector3());
    const startTargetPos = useRef(new THREE.Vector3());

    // When focus target changes, start a transition
    useEffect(() => {
        if (focusTarget && cameraTransitioning) {
            isTransitioning.current = true;
            transitionProgress.current = 0;
            startCamPos.current.copy(camera.position);
            if (controlsRef.current) {
                startTargetPos.current.copy(controlsRef.current.target);
            }
        }
    }, [focusTarget, cameraTransitioning, camera]);

    // Smooth camera transition each frame
    useFrame((_state, delta) => {
        if (!controlsRef.current) return;

        // If we have a focus target, compute its position and move toward it
        if (focusTarget) {
            const body = BODY_MAP[focusTarget];
            if (!body) return;

            let bodyPos: [number, number, number];

            if (body.id === 'sun') {
                bodyPos = [0, 0, 0];
            } else if (body.parentId) {
                // Moon: compute parent + relative position
                const parent = BODY_MAP[body.parentId];
                const parentPos = getBodyPosition(parent.orbital, simulationTime, AU);
                const moonScale = AU * 30;
                const moonRel = getBodyPosition(body.orbital, simulationTime, moonScale);
                bodyPos = [
                    parentPos[0] + moonRel[0],
                    parentPos[1] + moonRel[1],
                    parentPos[2] + moonRel[2],
                ];
            } else {
                bodyPos = getBodyPosition(body.orbital, simulationTime, AU);
            }

            const destTarget = new THREE.Vector3(bodyPos[0], bodyPos[1], bodyPos[2]);

            // Compute ideal camera distance based on body size
            const radius = body.id === 'sun'
                ? body.physical.radius * SUN_VISUAL_SCALE
                : Math.max(body.physical.radius * VISUAL_RADIUS_SCALE, 0.25);
            const cameraDistance = Math.max(radius * 8, 3);

            if (isTransitioning.current) {
                // Smooth transition using ease-out cubic
                transitionProgress.current += delta * 1.5;
                const t = Math.min(transitionProgress.current, 1);
                const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic

                // Lerp the controls target
                controlsRef.current.target.lerpVectors(
                    startTargetPos.current,
                    destTarget,
                    ease
                );

                // Lerp camera position
                const destCamPos = new THREE.Vector3(
                    destTarget.x + cameraDistance * 0.5,
                    destTarget.y + cameraDistance * 0.4,
                    destTarget.z + cameraDistance * 0.7,
                );
                camera.position.lerpVectors(startCamPos.current, destCamPos, ease);

                if (t >= 1) {
                    isTransitioning.current = false;
                    setCameraTransitioning(false);
                }
            } else {
                // After transition completes, gently keep tracking the body
                controlsRef.current.target.lerp(destTarget, delta * 3);
            }
        }

        controlsRef.current.update();
    });

    return (
        <OrbitControls
            ref={controlsRef as React.Ref<never>}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={0.5}
            maxDistance={600}
            enablePan
            zoomSpeed={1.2}
            rotateSpeed={0.5}
            panSpeed={0.8}
        // Touch support is built into OrbitControls
        />
    );
}
