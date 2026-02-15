/**
 * EarthSatellitesPage.tsx
 *
 * "All Eyes on Earth" — Real-time satellite tracking with 3D Earth.
 */

import { useEffect, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useSatelliteStore } from '../store/satelliteStore';
import { fetchAllSatellites, getFallbackSatellites } from '../engine/satelliteService';
import { VITAL_SIGNS } from '../data/satelliteData';
import EarthScene from '../components/earth/EarthScene';
import SatelliteInstances from '../components/earth/SatelliteInstances';
import SatelliteOrbitLine from '../components/earth/SatelliteOrbitLine';
import SatelliteOrbits from '../components/earth/SatelliteOrbits';
import OrbitalReferencePlanes from '../components/earth/OrbitalReferencePlanes';
import SatelliteSidebar from '../components/earth/SatelliteSidebar';
import SatelliteInfoPanel from '../components/earth/SatelliteInfoPanel';
import VitalSignsBar from '../components/earth/VitalSignsBar';
import VitalSignLegend from '../components/earth/VitalSignLegend';
import VitalSignInfo from '../components/earth/VitalSignInfo';

export default function EarthSatellitesPage() {
    const navigate = useNavigate();
    const setSatellites = useSatelliteStore((s) => s.setSatellites);
    const setLoading = useSatelliteStore((s) => s.setLoading);
    const setError = useSatelliteStore((s) => s.setError);
    const isLoading = useSatelliteStore((s) => s.isLoading);
    const error = useSatelliteStore((s) => s.error);
    const satellites = useSatelliteStore((s) => s.satellites);
    const simulationTime = useSatelliteStore((s) => s.simulationTime);
    const setSimulationTime = useSatelliteStore((s) => s.setSimulationTime);
    const timeSpeed = useSatelliteStore((s) => s.timeSpeed);
    const setTimeSpeed = useSatelliteStore((s) => s.setTimeSpeed);
    const isPaused = useSatelliteStore((s) => s.isPaused);
    const togglePause = useSatelliteStore((s) => s.togglePause);
    const resetToNow = useSatelliteStore((s) => s.resetToNow);
    const activeVitalSign = useSatelliteStore((s) => s.activeVitalSign);
    const activeVS = VITAL_SIGNS.find(v => v.id === activeVitalSign);

    // Fetch TLE data on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const sats = await fetchAllSatellites();
                if (!cancelled) {
                    if (sats.length === 0) throw new Error('No satellites loaded');
                    setSatellites(sats);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError('Failed to fetch live data. Using sample satellites.');
                    setSatellites(getFallbackSatellites());
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [setSatellites, setLoading, setError]);

    // Advance simulation time
    useEffect(() => {
        if (isPaused) return;
        const id = setInterval(() => {
            setSimulationTime(new Date(Date.now()));
        }, 1000 / Math.min(timeSpeed, 10));
        return () => clearInterval(id);
    }, [isPaused, timeSpeed, setSimulationTime]);

    const handleSpeedChange = useCallback((speed: number) => {
        setTimeSpeed(speed);
    }, [setTimeSpeed]);

    return (
        <div className="relative h-full w-full flex flex-col bg-black text-white overflow-hidden">
            {/* ─── TOP HEADER ──────────────────────────────────────── */}
            <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-black/60 backdrop-blur-md flex-shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="text-white/30 hover:text-white transition-colors text-sm"
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-sm font-bold tracking-[0.15em] uppercase">
                            All Eyes on Earth
                        </h1>
                        <p className="text-[10px] text-white/30 tracking-wide">
                            Real-time satellite tracking • {satellites.length.toLocaleString()} objects
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                        <span className="text-[10px] font-bold tracking-[0.1em] text-[#00FF88]">LIVE</span>
                    </div>

                    {/* Time display */}
                    <div className="text-[10px] font-mono text-white/40">
                        {simulationTime.toISOString().replace('T', ' ').slice(0, 19)} UTC
                    </div>
                </div>
            </header>

            {/* ─── MAIN CONTENT ────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left sidebar */}
                <SatelliteSidebar />

                {/* 3D Viewport */}
                <div className="flex-1 relative">
                    {/* Loading overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                            <div className="w-10 h-10 border-2 border-white/10 border-t-[#4A90D9] rounded-full animate-spin mb-4" />
                            <span className="text-xs text-white/40 tracking-wider">Loading satellite data...</span>
                        </div>
                    )}

                    {/* Error banner */}
                    {error && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 text-xs text-[#FF9A42] bg-[#FF9A42]/10 px-4 py-2 rounded-lg border border-[#FF9A42]/20">
                            {error}
                        </div>
                    )}

                    <Canvas
                        camera={{ position: [0, 8, 18], fov: 45, near: 0.1, far: 2000 }}
                        gl={{
                            antialias: true,
                            toneMapping: THREE.ACESFilmicToneMapping,
                            toneMappingExposure: 1.2,
                        }}
                        style={{ background: '#000' }}
                    >
                        <Suspense fallback={null}>
                            <EarthScene />
                            <SatelliteInstances />
                            <SatelliteOrbitLine />
                            <SatelliteOrbits />
                            {!activeVS?.hasEarthOverlay && <OrbitalReferencePlanes />}
                        </Suspense>
                    </Canvas>

                    {/* ─── VITAL SIGN LEGEND (color bar) ────────────── */}
                    <VitalSignLegend />

                    {/* ─── VITAL SIGN DATA LAYER BANNER ───────────────── */}
                    {activeVS && activeVS.hasEarthOverlay && (
                        <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md"
                            style={{
                                background: `${activeVS.color}12`,
                                borderColor: `${activeVS.color}30`,
                            }}
                        >
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: activeVS.color }} />
                            <span className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: activeVS.color }}>
                                {activeVS.label}
                            </span>
                            {activeVS.unit && (
                                <span className="text-[9px] text-white/30 font-mono">({activeVS.unit})</span>
                            )}
                        </div>
                    )}

                    {/* ─── VITAL SIGN INFO (expandable) ─────────────── */}
                    <VitalSignInfo />

                    {/* ─── BOTTOM CONTROLS: VITAL SIGNS + TIME ──────────── */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                        {/* Vital Signs Navigation Bar */}
                        <div className="border-b border-white/[0.04]">
                            <VitalSignsBar />
                        </div>

                        {/* Time controls row */}
                        <div className="flex items-center justify-center gap-3 px-6 py-2">
                            <button
                                onClick={togglePause}
                                className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/60 hover:text-white transition-all text-xs"
                            >
                                {isPaused ? '\u25B6' : '\u23F8'}
                            </button>

                            {[1, 10, 100, 1000].map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => handleSpeedChange(speed)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${timeSpeed === speed
                                        ? 'bg-[#4A90D9]/20 text-[#6BB5FF] border border-[#4A90D9]/30'
                                        : 'text-white/25 hover:text-white/50 border border-transparent'
                                        }`}
                                >
                                    {speed}x
                                </button>
                            ))}

                            <div className="w-px h-5 bg-white/[0.08] mx-1" />

                            <button
                                onClick={useSatelliteStore(s => s.toggleShowOrbits)}
                                className={`px-3 py-1 rounded text-[10px] font-medium transition-all border ${useSatelliteStore(s => s.showOrbits)
                                        ? 'bg-[#4A90D9]/20 text-[#6BB5FF] border-[#4A90D9]/30'
                                        : 'text-white/30 border-white/[0.06] hover:text-white/60'
                                    }`}
                            >
                                Orbits: {useSatelliteStore(s => s.showOrbits) ? 'ON' : 'OFF'}
                            </button>

                            <button
                                onClick={resetToNow}
                                className="px-3 py-1 rounded text-[10px] font-medium text-white/30 hover:text-[#00FF88] border border-white/[0.06] hover:border-[#00FF88]/20 transition-all"
                            >
                                ● NOW
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right info panel */}
                <SatelliteInfoPanel />
            </div>
        </div>
    );
}
