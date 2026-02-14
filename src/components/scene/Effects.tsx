/**
 * Effects.tsx
 * 
 * Post-processing pipeline for photorealistic space visuals.
 * Includes Bloom for glowing celestial bodies, Vignette for cinematic focus,
 * Noise for film grain, and ChromaticAberration for lens realism.
 */

// @ts-nocheck
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

export default function Effects() {
    return (
        // @ts-ignore
        <EffectComposer disableNormalPass>
            {/* Bloom: Lower threshold isolates Sun glow; mipmapBlur for quality */}
            {/* @ts-ignore */}
            <Bloom
                luminanceThreshold={0.4}
                luminanceSmoothing={0.85}
                intensity={1.8}
                mipmapBlur
            />

            {/* Chromatic Aberration: subtle lens fringing at edges */}
            {/* @ts-ignore */}
            <ChromaticAberration
                offset={new THREE.Vector2(0.0006, 0.0006)}
                blendFunction={BlendFunction.NORMAL}
                radialModulation={true}
                modulationOffset={0.5}
            />

            {/* Noise: Very subtle film grain */}
            {/* @ts-ignore */}
            <Noise opacity={0.018} blendFunction={BlendFunction.OVERLAY} />

            {/* Vignette: Soft cinematic darkening */}
            {/* @ts-ignore */}
            <Vignette eskil={false} offset={0.15} darkness={0.9} />
        </EffectComposer>
    );
}
