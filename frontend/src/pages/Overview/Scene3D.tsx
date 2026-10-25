import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

import { useTelemetryStore } from "@/store/telemetryStore";

const METERS_PER_DEG_LAT = 111320;

function gpsToLocal(
    lat: number,
    lon: number,
    originLat: number,
    originLon: number
) {
    const metersPerDegLon =
        METERS_PER_DEG_LAT *
        Math.cos(originLat * Math.PI / 180);

    return {
        x: (lon - originLon) * metersPerDegLon,
        z: -(lat - originLat) * METERS_PER_DEG_LAT,
    };
}

function Waypoints() {
    const waypoints = useMemo(
        () => [
            { pos: [10, 0.2, -15], completed: true },
            { pos: [20, 0.2, -5], completed: true },
            { pos: [25, 0.2, 10], completed: true },
            { pos: [15, 0.2, 20], completed: false, current: true },
            { pos: [0, 0.2, 25], completed: false },
            { pos: [-10, 0.2, 20], completed: false },
            { pos: [-15, 0.2, 5], completed: false },
        ],
        []
    );

    const linePoints = useMemo(
        () =>
            waypoints.map(
                (w) =>
                    new THREE.Vector3(
                        w.pos[0],
                        w.pos[1],
                        w.pos[2]
                    )
            ),
        [waypoints]
    );

    return (
        <group>

            {/* Mission Path */}

            <line>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[
                            new Float32Array(
                                linePoints.flatMap((p) => [
                                    p.x,
                                    p.y,
                                    p.z,
                                ])
                            ),
                            3,
                        ]}
                    />
                </bufferGeometry>

                <lineBasicMaterial
                    color="#22C55E"
                    transparent
                    opacity={0.35}
                />
            </line>

            {/* Waypoints */}

            {waypoints.map((wp, i) => (
                <mesh
                    key={i}
                    position={
                        wp.pos as [
                            number,
                            number,
                            number
                        ]
                    }
                >
                    <sphereGeometry
                        args={[0.45, 18, 18]}
                    />

                    <meshStandardMaterial
                        color={
                            wp.completed
                                ? "#22C55E"
                                : wp.current
                                ? "#3B82F6"
                                : "#64748B"
                        }
                        emissive={
                            wp.completed
                                ? "#22C55E"
                                : wp.current
                                ? "#3B82F6"
                                : "#64748B"
                        }
                        emissiveIntensity={
                            wp.current ? 0.7 : 0.25
                        }
                    />
                </mesh>
            ))}
        </group>
    );
}

function DetectionMarkers() {

    const detections = useMemo(
        () => [
            { pos: [8, 0.15, -8], color: "#3B82F6" },
            { pos: [18, 0.15, 2], color: "#F59E0B" },
            { pos: [22, 0.15, 12], color: "#F59E0B" },
            { pos: [-5, 0.15, 15], color: "#EC4899" },
            { pos: [12, 0.15, -2], color: "#8B5CF6" },
        ],
        []
    );

    return (
        <group>

            {detections.map((det, i) => (

                <mesh
                    key={i}
                    position={
                        det.pos as [
                            number,
                            number,
                            number
                        ]
                    }
                >
                    <boxGeometry
                        args={[0.45, 0.3, 0.45]}
                    />

                    <meshStandardMaterial
                        color={det.color}
                        emissive={det.color}
                        emissiveIntensity={0.55}
                    />
                </mesh>

            ))}

        </group>
    );
}

function Scene() {

    const controls =
        useRef<any>(null);

    const latitude =
        useTelemetryStore((s) => s.latitude);

    const longitude =
        useTelemetryStore((s) => s.longitude);

    const yaw =
        useTelemetryStore((s) => s.yaw);
        const speed = useTelemetryStore((s) => s.speed);

    const leftEncoder = useTelemetryStore((s) => s.leftEncoder);

    const rightEncoder = useTelemetryStore((s) => s.rightEncoder);

    const origin = useRef<{
        lat: number;
        lon: number;
        initialized: boolean;
    }>({
        lat: 0,
        lon: 0,
        initialized: false,
    });

    const vehiclePosition = useRef(new THREE.Vector3());
    const targetPosition = useRef(new THREE.Vector3());

    const lastGps = useRef({
        lat: 0,
        lon: 0,
    });

    const lastTelemetry = useRef({
        left: 0,
        right: 0,
        time: performance.now(),
    });

    useFrame((_, delta) => {

        if (
            !origin.current.initialized &&
            latitude !== 0 &&
            longitude !== 0
        ) {
            origin.current = {
                lat: latitude,
                lon: longitude,
                initialized: true,
            };

            lastGps.current = {
                lat: latitude,
                lon: longitude,
            };
        }

        if (!origin.current.initialized)
            return;

        //-------------------------------------------------
        // Time
        //-------------------------------------------------

        const now = performance.now();

        const dt =
            (now - lastTelemetry.current.time) / 1000;

        //-------------------------------------------------
        // GPS correction ONLY when GPS changes
        //-------------------------------------------------

        if (
            latitude !== lastGps.current.lat ||
            longitude !== lastGps.current.lon
        ) {

            const local = gpsToLocal(
                latitude,
                longitude,
                origin.current.lat,
                origin.current.lon
            );

            targetPosition.current.set(
                local.x,
                0.5,
                local.z
            );

            lastGps.current = {
                lat: latitude,
                lon: longitude,
            };
        }

        //-------------------------------------------------
        // Dead reckoning
        //-------------------------------------------------

        const dLeft =
            leftEncoder - lastTelemetry.current.left;

        const dRight =
            rightEncoder - lastTelemetry.current.right;

        lastTelemetry.current.left = leftEncoder;
        lastTelemetry.current.right = rightEncoder;
        lastTelemetry.current.time = now;

        const heading =
            THREE.MathUtils.degToRad(yaw);

        if (
            Math.abs(dLeft) > 0.001 ||
            Math.abs(dRight) > 0.001
        ) {

            const distance =
                ((dLeft + dRight) * 0.5) * 0.001;

            targetPosition.current.x +=
                Math.sin(heading) * distance;

            targetPosition.current.z -=
                Math.cos(heading) * distance;
        }
        else if (speed > 0.05 && dt > 0) {

            targetPosition.current.x +=
                Math.sin(heading) * speed * dt;

            targetPosition.current.z -=
                Math.cos(heading) * speed * dt;
        }

        //-------------------------------------------------
        // Smooth motion
        //-------------------------------------------------

        vehiclePosition.current.lerp(
            targetPosition.current,
            delta * 5
        );

        //-------------------------------------------------
        // Camera follow
        //-------------------------------------------------

        if (controls.current) {

            controls.current.target.copy(
                vehiclePosition.current
            );

            controls.current.update();
        }

    });

    return (
        <>
            <ambientLight intensity={0.45} />

            <directionalLight
                position={[20, 30, 15]}
                intensity={0.8}
                castShadow
            />

            <fog
                attach="fog"
                args={["#0B1220", 50, 120]}
            />

            <Grid
                position={[0, 0, 0]}
                args={[250, 250]}
                cellSize={1}
                cellThickness={0.35}
                sectionSize={10}
                sectionThickness={0.8}
                fadeDistance={140}
                fadeStrength={1}
                infiniteGrid
            />

            {/* World Origin */}

            <lineSegments>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[
                            new Float32Array([
                                -2,
                                0.01,
                                0,

                                2,
                                0.01,
                                0,

                                0,
                                0.01,
                                -2,

                                0,
                                0.01,
                                2,
                            ]),
                            3,
                        ]}
                    />
                </bufferGeometry>

                <lineBasicMaterial
                    color="#FFFFFF"
                    transparent
                    opacity={0.15}
                />
            </lineSegments>

            <VehicleMarker
                position={vehiclePosition.current}
                yaw={yaw}
            />

            <Waypoints />

            <DetectionMarkers />

            <OrbitControls
                ref={controls}
                enableDamping
                dampingFactor={0.08}
                minDistance={15}
                maxDistance={80}
                maxPolarAngle={Math.PI / 2.05}
                target={[0, 0, 0]}
            />
        </>
    );
}

type VehicleMarkerProps = {
    position: THREE.Vector3;
    yaw: number;
};
useGLTF.preload("/models/ugv.glb");
function VehicleMarker({ position, yaw }: VehicleMarkerProps) {
    const ref = useRef<THREE.Group>(null);

    const { scene } = useGLTF("/models/ugv.glb");

    const targetQuat = useRef(new THREE.Quaternion());

    useFrame((_, delta) => {
        if (!ref.current) return;

        ref.current.position.lerp(position, delta * 6);

        targetQuat.current.setFromEuler(
            new THREE.Euler(
                0,
                THREE.MathUtils.degToRad(yaw),
                0
            )
        );

        ref.current.quaternion.slerp(
            targetQuat.current,
            delta * 6
        );
    });

    return (
        <primitive
            ref={ref}
            object={scene.clone()}
            scale={10}
        />
    );
}

export default function Scene3D() {
    return (
        <div
            className="w-full h-full"
            style={{
                background: "#0B1220",
                overflow: "hidden",
            }}
        >
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{
                    position: [30, 25, 30],
                    fov: 50,
                    near: 0.1,
                    far: 1000,
                }}
                gl={{
                    antialias: true,
                    alpha: false,
                    powerPreference: "high-performance",
                }}
                style={{
                    background: "#0B1220",
                }}
            >
                <color
                    attach="background"
                    args={["#0B1220"]}
                />

                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    );
}