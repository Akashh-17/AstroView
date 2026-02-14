/**
 * planetMaterials.ts
 *
 * Factory that creates Three.js ShaderMaterials for each planet type.
 * Maps planet IDs to their corresponding procedural GLSL shaders.
 */

import * as THREE from 'three';
import {
    PLANET_VERTEX,
    EARTH_FRAGMENT,
    MARS_FRAGMENT,
    JUPITER_FRAGMENT,
    SATURN_FRAGMENT,
    VENUS_FRAGMENT,
    MERCURY_FRAGMENT,
    ICE_GIANT_FRAGMENT,
    MOON_FRAGMENT,
    SUN_FRAGMENT,
    SATURN_RING_FRAGMENT,
    RING_VERTEX,
} from './shaders/planetShaders';

/**
 * Create a ShaderMaterial for a specific planet.
 * Each material has appropriate uniforms and fragment shader.
 */
export function createPlanetMaterial(
    planetId: string,
    bodyColor: string
): THREE.ShaderMaterial {
    const baseColor = new THREE.Color(bodyColor);

    switch (planetId) {
        case 'earth':
            return new THREE.ShaderMaterial({
                vertexShader: PLANET_VERTEX,
                fragmentShader: EARTH_FRAGMENT,
                uniforms: {
                    lightDirection: { value: new THREE.Vector3(1, 0, 0) },
                    time: { value: 0 },
                },
            });

        case 'mars':
            return new THREE.ShaderMaterial({
                vertexShader: PLANET_VERTEX,
                fragmentShader: MARS_FRAGMENT,
                uniforms: {
                    lightDirection: { value: new THREE.Vector3(1, 0, 0) },
                    time: { value: 0 },
                },
            });

        case 'jupiter':
            return new THREE.ShaderMaterial({
                vertexShader: PLANET_VERTEX,
                fragmentShader: JUPITER_FRAGMENT,
                uniforms: {
                    lightDirection: { value: new THREE.Vector3(1, 0, 0) },
                    time: { value: 0 },
                },
            });

        case 'saturn':
            return new THREE.ShaderMaterial({
                vertexShader: PLANET_VERTEX,
                fragmentShader: SATURN_FRAGMENT,
                uniforms: {
                    lightDirection: { value: new THREE.Vector3(1, 0, 0) },
                    time: { value: 0 },
                },
            });

        case 'venus':
            return new THREE.ShaderMaterial({
                vertexShader: PLANET_VERTEX,
                fragmentShader: VENUS_FRAGMENT,
                uniforms: {
                    lightDirection: { value: new THREE.Vector3(1, 0, 0) },
                    time: { value: 0 },
                },
            });

        case 'mercury':
            return new THREE.ShaderMaterial({
                vertexShader: PLANET_VERTEX,
                fragmentShader: MERCURY_FRAGMENT,
                uniforms: {
                    lightDirection: { value: new THREE.Vector3(1, 0, 0) },
                    time: { value: 0 },
                },
            });

        case 'neptune':
            return new THREE.ShaderMaterial({
                vertexShader: PLANET_VERTEX,
                fragmentShader: ICE_GIANT_FRAGMENT,
                uniforms: {
                    lightDirection: { value: new THREE.Vector3(1, 0, 0) },
                    time: { value: 0 },
                    baseColor: { value: new THREE.Color(0.25, 0.33, 0.73) },
                    bandColor: { value: new THREE.Color(0.35, 0.45, 0.85) },
                },
            });

        case 'uranus':
            return new THREE.ShaderMaterial({
                vertexShader: PLANET_VERTEX,
                fragmentShader: ICE_GIANT_FRAGMENT,
                uniforms: {
                    lightDirection: { value: new THREE.Vector3(1, 0, 0) },
                    time: { value: 0 },
                    baseColor: { value: new THREE.Color(0.45, 0.71, 0.77) },
                    bandColor: { value: new THREE.Color(0.55, 0.82, 0.88) },
                },
            });

        default:
            // Generic rocky body shader (used for moons and others)
            return new THREE.ShaderMaterial({
                vertexShader: PLANET_VERTEX,
                fragmentShader: MOON_FRAGMENT,
                uniforms: {
                    lightDirection: { value: new THREE.Vector3(1, 0, 0) },
                    time: { value: 0 },
                    baseColor: { value: baseColor },
                },
            });
    }
}

/**
 * Create the Sun's ShaderMaterial.
 */
export function createSunMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        vertexShader: PLANET_VERTEX,
        fragmentShader: SUN_FRAGMENT,
        uniforms: {
            time: { value: 0 },
        },
        toneMapped: false, // Sun should not be tone-mapped (it's emissive)
    });
}

/**
 * Create Saturn's ring ShaderMaterial.
 */
export function createRingMaterial(
    innerRadius: number,
    outerRadius: number
): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        vertexShader: RING_VERTEX,
        fragmentShader: SATURN_RING_FRAGMENT,
        uniforms: {
            lightDirection: { value: new THREE.Vector3(1, 0, 0) },
            innerRadius: { value: innerRadius },
            outerRadius: { value: outerRadius },
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
}

/**
 * Update a planet material's light direction uniform.
 * Called each frame to keep lighting consistent with the Sun.
 */
export function updateLightDirection(
    material: THREE.ShaderMaterial,
    planetWorldPos: THREE.Vector3,
    sunWorldPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): void {
    if (material.uniforms.lightDirection) {
        const dir = sunWorldPos.clone().sub(planetWorldPos).normalize();
        material.uniforms.lightDirection.value.copy(dir);
    }
}

/**
 * Update the time uniform for animated effects.
 */
export function updateTimeUniform(
    material: THREE.ShaderMaterial,
    elapsed: number
): void {
    if (material.uniforms.time) {
        material.uniforms.time.value = elapsed;
    }
}
