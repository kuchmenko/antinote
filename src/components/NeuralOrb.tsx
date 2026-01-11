"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

function AnimatedSphere() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            // Rotate slowly
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <Sphere args={[1, 64, 64]} scale={2.5}>
                <MeshDistortMaterial
                    color="#ffffff"
                    attach="material"
                    distort={0.4} // Strength, 0 disables the effect (default=1)
                    speed={2} // Speed (default=1)
                    roughness={0.2}
                    metalness={0.8}
                    wireframe={false}
                    emissive="#4f46e5" // Indigo-ish glow
                    emissiveIntensity={0.1}
                />
            </Sphere>
        </Float>
    );
}

export default function NeuralOrb() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
            <Canvas camera={{ position: [0, 0, 8] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#818cf8" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#c084fc" />

                <AnimatedSphere />
            </Canvas>
        </div>
    );
}
