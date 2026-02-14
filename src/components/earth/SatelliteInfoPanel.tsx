/**
 * SatelliteInfoPanel.tsx
 *
 * Right panel showing detailed info about the selected satellite.
 */

import { useMemo } from 'react';
import { twoline2satrec } from 'satellite.js';
import { useSatelliteStore } from '../../store/satelliteStore';
import { SATELLITE_CATEGORIES } from '../../data/satelliteData';

export default function SatelliteInfoPanel() {
    const satellites = useSatelliteStore((s) => s.satellites);
    const selectedId = useSatelliteStore((s) => s.selectedSatelliteId);
    const selectSatellite = useSatelliteStore((s) => s.selectSatellite);

    const sat = useMemo(() => {
        if (!selectedId) return null;
        return satellites.find((s) => s.id === selectedId) || null;
    }, [satellites, selectedId]);

    // Parse orbital parameters from TLE
    const orbitalParams = useMemo(() => {
        if (!sat) return null;
        try {
            const satrec = twoline2satrec(sat.tle.line1, sat.tle.line2);
            const meanMotionRevPerDay =
                (satrec.no * 60 * 24) / (2 * Math.PI); // Convert rad/min to rev/day
            const periodMin = (2 * Math.PI) / satrec.no; // minutes
            const inclination = (satrec.inclo * 180) / Math.PI; // degrees
            const eccentricity = satrec.ecco;

            // Semi-major axis from mean motion (km)
            const mu = 398600.4418; // km³/s² Earth GM
            const n = satrec.no / 60; // rad/s
            const a = Math.pow(mu / (n * n), 1 / 3);
            const apogee = a * (1 + eccentricity) - 6371;
            const perigee = a * (1 - eccentricity) - 6371;

            // Orbit type classification
            let orbitType = 'Unknown';
            const avgAlt = (apogee + perigee) / 2;
            if (avgAlt < 2000) orbitType = 'LEO';
            else if (avgAlt < 35000) orbitType = 'MEO';
            else if (avgAlt > 35000 && avgAlt < 36500) orbitType = 'GEO';
            else orbitType = 'HEO';

            if (inclination > 80 && inclination < 100) orbitType += ' (Polar)';
            if (inclination > 96 && inclination < 100 && avgAlt < 1000) orbitType = 'Sun-sync';

            return {
                inclination,
                eccentricity,
                periodMin,
                meanMotionRevPerDay,
                apogee,
                perigee,
                orbitType,
            };
        } catch {
            return null;
        }
    }, [sat]);

    const category = useMemo(() => {
        if (!sat) return null;
        return SATELLITE_CATEGORIES.find((c) => c.id === sat.category) || null;
    }, [sat]);

    if (!sat) {
        return (
            <div className="w-80 flex-shrink-0 border-l border-white/[0.06] bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center px-6">
                    <div className="text-2xl mb-3 opacity-20">🛰️</div>
                    <p className="text-[11px] text-white/20 leading-relaxed">
                        Click on a satellite to view its details
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 flex-shrink-0 border-l border-white/[0.06] bg-black/40 backdrop-blur-sm overflow-y-auto">
            {/* Header */}
            <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {category && (
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                />
                            )}
                            <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30">
                                {category?.label}
                            </span>
                        </div>
                        <h2 className="text-sm font-bold text-white leading-tight">
                            {sat.name}
                        </h2>
                        <p className="text-[10px] text-white/25 mt-0.5 font-mono">
                            NORAD ID: {sat.id}
                        </p>
                    </div>
                    <button
                        onClick={() => selectSatellite(null)}
                        className="text-white/20 hover:text-white/60 transition-colors text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mx-5" />

            {/* Real-time data */}
            <div className="px-5 py-4">
                <h3 className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-3">
                    Real-Time Data
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <DataItem label="Altitude" value={sat.alt !== undefined ? `${Math.round(sat.alt)} km` : '—'} />
                    <DataItem label="Velocity" value={sat.velocity !== undefined ? `${sat.velocity.toFixed(2)} km/s` : '—'} />
                    <DataItem label="Latitude" value={sat.lat !== undefined ? `${sat.lat.toFixed(2)}°` : '—'} />
                    <DataItem label="Longitude" value={sat.lng !== undefined ? `${sat.lng.toFixed(2)}°` : '—'} />
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mx-5" />

            {/* Orbital info */}
            {orbitalParams && (
                <div className="px-5 py-4">
                    <h3 className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-3">
                        Orbital Parameters
                    </h3>
                    <div className="space-y-2">
                        <DataRow label="Orbit Type" value={orbitalParams.orbitType} highlight />
                        <DataRow label="Inclination" value={`${orbitalParams.inclination.toFixed(2)}°`} />
                        <DataRow label="Period" value={formatPeriod(orbitalParams.periodMin)} />
                        <DataRow label="Apogee" value={`${Math.round(orbitalParams.apogee)} km`} />
                        <DataRow label="Perigee" value={`${Math.round(orbitalParams.perigee)} km`} />
                        <DataRow label="Eccentricity" value={orbitalParams.eccentricity.toFixed(6)} />
                        <DataRow label="Rev/Day" value={orbitalParams.meanMotionRevPerDay.toFixed(4)} />
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mx-5" />

            {/* TLE data */}
            <div className="px-5 py-4">
                <h3 className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-3">
                    TLE Data
                </h3>
                <pre className="text-[9px] text-white/30 font-mono leading-relaxed overflow-x-auto">
                    {sat.tle.line1}{'\n'}{sat.tle.line2}
                </pre>
            </div>
        </div>
    );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────

function DataItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[9px] text-white/25">{label}</div>
            <div className="text-[12px] font-mono text-white mt-0.5">{value}</div>
        </div>
    );
}

function DataRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/30">{label}</span>
            <span className={`text-[11px] font-mono ${highlight ? 'text-[#6BB5FF] font-medium' : 'text-white/70'}`}>
                {value}
            </span>
        </div>
    );
}

function formatPeriod(minutes: number): string {
    if (minutes < 120) return `${Math.round(minutes)} min`;
    const hours = minutes / 60;
    if (hours < 48) return `${hours.toFixed(1)} hrs`;
    return `${(hours / 24).toFixed(1)} days`;
}
