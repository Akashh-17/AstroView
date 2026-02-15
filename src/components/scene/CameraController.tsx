/**
 * CameraController.tsx
 *
 * Manages the orbit controls and smooth camera transitions when
 * focusing on a celestial body. Responds to zoom level from store.
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
    CLOSE_APPROACHES,
    EARTH,
} from '../../data/planetaryData';
import { getBodyPosition } from '../../engine/orbitalMechanics';

/** Set of asteroid IDs that are close-approach objects clustered around Earth */
const CLOSE_APPROACH_IDS = new Set(CLOSE_APPROACHES.map((c) => c.asteroidId));

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
    const zoomLevel = useSolarSystemStore((s) => s.zoomLevel);

    // Track the target position for smooth transitions
    const isTransitioning = useRef(false);
    const transitionProgress = useRef(0);
    const startCamPos = useRef(new THREE.Vector3());
    const startTargetPos = useRef(new THREE.Vector3());
    const prevZoomLevel = useRef(1);

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

    // Respond to zoom level changes from the store
    useEffect(() => {
        if (zoomLevel !== prevZoomLevel.current) {
            const ratio = prevZoomLevel.current / zoomLevel;
            const dir = camera.position.clone().sub(controlsRef.current?.target ?? new THREE.Vector3());
            dir.multiplyScalar(ratio);
            camera.position.copy((controlsRef.current?.target ?? new THREE.Vector3()).clone().add(dir));
            prevZoomLevel.current = zoomLevel;
        }
    }, [zoomLevel, camera]);

    // Smooth camera transition each frame
    useFrame((_state, delta) => {
        if (!controlsRef.current) return;

        // If we have a focus target, compute its position and move toward it
        if (focusTarget) {
            // Close-approach asteroids are rendered near Earth, not at their
            // Keplerian orbital position — fly to Earth instead.
            const isCloseApproach = CLOSE_APPROACH_IDS.has(focusTarget);
            const body = isCloseApproach ? EARTH : BODY_MAP[focusTarget];
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
            const isAsteroid = body.display.category === 'asteroid';
            // For close-approach asteroids, zoom in close to Earth to see them
            const cameraDistance = isCloseApproach
                ? 18
                : body.id === 'sun'
                    ? Math.max(body.physical.radius * SUN_VISUAL_SCALE * 8, 3)
                    : isAsteroid
                        ? 3
                        : Math.max(Math.max(body.physical.radius * VISUAL_RADIUS_SCALE, 0.25) * 8, 3);

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
        />
    );
}
