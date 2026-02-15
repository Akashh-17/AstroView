/**
 * AsteroidIcon.tsx
 *
 * 3D Icon for the Asteroids module card.
 * A procedural asteroid belt fragment or a single large detailed asteroid.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Icosahedron } from '@react-three/drei';

function SingleRock({ position, scale, rotationSpeed }: { position: [number, number, number], scale: number, rotationSpeed: number }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += rotationSpeed * delta;
            meshRef.current.rotation.y += rotationSpeed * delta * 0.5;
        }
    });

    return (
        <mesh ref={meshRef} position={position} scale={scale}>
            <dodecahedronGeometry args={[1, 0]} /> {/* Low poly look */}
            <meshStandardMaterial color="#888899" roughness={0.8} metalness={0.2} flatShading />
        </mesh>
    );
}

export default function AsteroidIcon() {
    const groupRef = useRef<THREE.Group>(null);

    // Generate random rocks
    const rocks = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 15; i++) {
            const r = 2.5 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI; // Band around equator roughly

            const x = r * Math.cos(theta) * Math.cos(phi * 0.2); // Flattened belt
            const y = (Math.random() - 0.5) * 1.5;
            const z = r * Math.sin(theta) * Math.cos(phi * 0.2);

            temp.push({
                pos: [x, y, z] as [number, number, number],
                scale: 0.2 + Math.random() * 0.4,
                rotSpeed: (Math.random() - 0.5) * 2,
            });
        }
        return temp;
    }, []);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005; // Rotate whole belt
            // Bob up and down
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Center large asteroid */}
            <SingleRock position={[0, 0, 0]} scale={1.8} rotationSpeed={0.2} />

            {/* Debris field */}
            {rocks.map((rock, i) => (
                <SingleRock key={i} position={rock.pos} scale={rock.scale} rotationSpeed={rock.rotSpeed} />
            ))}

            <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffddee" />
            <ambientLight intensity={0.2} color="#444455" />
            <pointLight position={[-5, -5, -5]} intensity={0.5} color="#334455" />
        </group>
    );
}
