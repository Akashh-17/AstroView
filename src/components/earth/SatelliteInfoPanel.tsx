/**
 * SatelliteInfoPanel.tsx
 *
 * Right panel showing detailed info about the selected satellite,
 * including an image, real-time tracking data, orbital parameters,
 * mission metadata, and TLE data.
 */

import { useMemo, useState, useEffect } from 'react';
import { twoline2satrec } from 'satellite.js';
import { useSatelliteStore } from '../../store/satelliteStore';
import { SATELLITE_CATEGORIES } from '../../data/satelliteData';

/* ── satellite images (NASA public domain / Wikimedia Commons) ───────── */
const SAT_IMAGES: Record<string, string> = {
    'ISS (ZARYA)':
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/International_Space_Station_after_undocking_of_STS-132.jpg/800px-International_Space_Station_after_undocking_of_STS-132.jpg',
    'CSS (TIANHE)':
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Chinese_Space_Station_in_2023-10.png/800px-Chinese_Space_Station_in_2023-10.png',
    HST:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HST-SM4.jpeg/800px-HST-SM4.jpeg',
    TERRA:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Terra_satellite.jpg/800px-Terra_satellite.jpg',
    AQUA:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Aqua_satellite.jpg/800px-Aqua_satellite.jpg',
    'LANDSAT 9':
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Landsat_9_-_Mission_Patch.png/800px-Landsat_9_-_Mission_Patch.png',
    'GOES 16':
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/GOES-R_spacecraft_model.png/800px-GOES-R_spacecraft_model.png',
    'GOES 18':
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/GOES-R_spacecraft_model.png/800px-GOES-R_spacecraft_model.png',
    JWST:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/James_Webb_Space_Telescope_2009_top.jpg/800px-James_Webb_Space_Telescope_2009_top.jpg',
};

/* stock fallback images for categories without specific images */
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
    stations:
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80',
    weather:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
    navigation:
        'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=600&q=80',
    communications:
        'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600&q=80',
    scientific:
        'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80',
    starlink:
        'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=600&q=80',
    earth_observation:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
    military:
        'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600&q=80',
    debris:
        'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80',
};

/* ── Notable satellite metadata ────────────────────────────────────────── */
const MISSION_META: Record<
    string,
    { country: string; launched: string; status: string; description: string }
> = {
    'ISS (ZARYA)': {
        country: 'US/RU Intl',
        launched: 'Nov 1998',
        status: 'Active',
        description:
            'International Space Station – crewed orbital laboratory hosting continuous human presence since November 2000.',
    },
    'CSS (TIANHE)': {
        country: 'CN China',
        launched: 'Apr 2021',
        status: 'Active',
        description:
            'Tiangong / Chinese Space Station – China\'s modular space station in LEO.',
    },
    HST: {
        country: 'US USA',
        launched: 'Apr 1990',
        status: 'Active',
        description:
            'Hubble Space Telescope – iconic optical/UV observatory operating for over 30 years.',
    },
    TERRA: {
        country: 'US USA',
        launched: 'Dec 1999',
        status: 'Active',
        description:
            'Earth-observing satellite studying climate, weather, and environmental change.',
    },
    AQUA: {
        country: 'US USA',
        launched: 'May 2002',
        status: 'Active',
        description:
            'Earth Observation satellite focused on the water cycle – precipitation, ocean, ice.',
    },
    'NOAA 20': {
        country: 'US USA',
        launched: 'Nov 2017',
        status: 'Active',
        description:
            'Joint Polar Satellite System (JPSS-1) – polar-orbiting weather/climate satellite.',
    },
    'LANDSAT 9': {
        country: 'US USA',
        launched: 'Sep 2021',
        status: 'Active',
        description:
            'Continues the five-decade Landsat programme imaging Earth\'s land surface.',
    },
    'GOES 16': {
        country: 'US USA',
        launched: 'Nov 2016',
        status: 'Active',
        description:
            'Geostationary weather satellite providing continuous imagery of the Western Hemisphere.',
    },
    'GOES 18': {
        country: 'US USA',
        launched: 'Mar 2022',
        status: 'Active',
        description:
            'GOES-West – next-generation geostationary weather/environmental satellite.',
    },
    'SENTINEL-6A': {
        country: 'EU ESA',
        launched: 'Nov 2020',
        status: 'Active',
        description:
            'Copernicus Sentinel-6 Michael Freilich – precision ocean altimetry mission.',
    },
    JWST: {
        country: 'US/EU/CA Intl',
        launched: 'Dec 2021',
        status: 'Active',
        description:
            'James Webb Space Telescope – infrared space observatory at Sun-Earth L2.',
    },
};

export default function SatelliteInfoPanel() {
    const satellites = useSatelliteStore((s) => s.satellites);
    const selectedId = useSatelliteStore((s) => s.selectedSatelliteId);
    const selectSatellite = useSatelliteStore((s) => s.selectSatellite);
    const focusOnSatellite = useSatelliteStore((s) => s.focusOnSatellite);

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
                (satrec.no * 60 * 24) / (2 * Math.PI);
            const periodMin = (2 * Math.PI) / satrec.no;
            const inclination = (satrec.inclo * 180) / Math.PI;
            const eccentricity = satrec.ecco;
            const raan = (satrec.nodeo * 180) / Math.PI;
            const argPerigee = (satrec.argpo * 180) / Math.PI;

            const mu = 398600.4418;
            const n = satrec.no / 60;
            const a = Math.pow(mu / (n * n), 1 / 3);
            const apogee = a * (1 + eccentricity) - 6371;
            const perigee = a * (1 - eccentricity) - 6371;

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
                raan,
                argPerigee,
                semiMajorAxis: a,
            };
        } catch {
            return null;
        }
    }, [sat]);

    const category = useMemo(() => {
        if (!sat) return null;
        return SATELLITE_CATEGORIES.find((c) => c.id === sat.category) || null;
    }, [sat]);

    const meta = sat ? MISSION_META[sat.name] || null : null;
    const imageUrl = sat
        ? SAT_IMAGES[sat.name] ||
          CATEGORY_FALLBACK_IMAGES[sat.category] ||
          'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80'
        : null;

    const [imgError, setImgError] = useState(false);

    // Reset image error state when a different satellite is selected
    useEffect(() => {
        setImgError(false);
    }, [selectedId]);

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
                        onClick={() => { selectSatellite(null); focusOnSatellite(null); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-red-500/20 border border-white/[0.08] hover:border-red-500/40 text-white/40 hover:text-red-400 transition-all duration-200 group"
                        title="Close panel"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M2 2l8 8M10 2l-8 8" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Satellite image */}
            {imageUrl && !imgError && (
                <>
                    <div className="h-px bg-white/[0.06] mx-5" />
                    <div className="relative mx-4 mt-3 mb-2 rounded-lg overflow-hidden" style={{ height: '140px' }}>
                        <img
                            src={imageUrl}
                            alt={sat.name}
                            onError={() => setImgError(true)}
                            className="w-full h-full object-cover"
                            style={{ filter: 'brightness(0.85) contrast(1.1)' }}
                        />
                        {/* gradient overlay at bottom */}
                        <div
                            className="absolute inset-x-0 bottom-0 h-12"
                            style={{
                                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                            }}
                        />
                        {/* image caption if it is a known satellite */}
                        {SAT_IMAGES[sat.name] && (
                            <span className="absolute bottom-2 left-3 text-[8px] text-white/40 tracking-wide">
                                NASA / Public Domain
                            </span>
                        )}
                    </div>
                </>
            )}

            {/* Mission metadata (if known) */}
            {meta && (
                <>
                    <div className="h-px bg-white/[0.06] mx-5" />
                    <div className="px-5 py-4">
                        <h3 className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-3">
                            Mission Info
                        </h3>
                        <p className="text-[10px] text-white/50 leading-relaxed mb-3">
                            {meta.description}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            <MiniTag label="Country" value={meta.country} />
                            <MiniTag label="Launched" value={meta.launched} />
                            <MiniTag
                                label="Status"
                                value={meta.status}
                                valueColor={
                                    meta.status === 'Active'
                                        ? '#4AFF7C'
                                        : meta.status === 'Inactive'
                                            ? '#FF6B6B'
                                            : '#FFAA40'
                                }
                            />
                        </div>
                    </div>
                </>
            )}

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

                    {/* Orbit type badge */}
                    <div className="mb-3">
                        <span
                            className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide"
                            style={{
                                backgroundColor: category
                                    ? category.color + '18'
                                    : 'rgba(255,255,255,0.06)',
                                color: category?.color || '#ffffff',
                                border: `1px solid ${category?.color || '#ffffff'}30`,
                            }}
                        >
                            {orbitalParams.orbitType}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <DataRow label="Inclination" value={`${orbitalParams.inclination.toFixed(2)}°`} />
                        <DataRow label="Period" value={formatPeriod(orbitalParams.periodMin)} />
                        <DataRow label="Apogee" value={`${Math.round(orbitalParams.apogee).toLocaleString()} km`} />
                        <DataRow label="Perigee" value={`${Math.round(orbitalParams.perigee).toLocaleString()} km`} />
                        <DataRow label="Semi-major Axis" value={`${Math.round(orbitalParams.semiMajorAxis).toLocaleString()} km`} />
                        <DataRow label="Eccentricity" value={orbitalParams.eccentricity.toFixed(6)} />
                        <DataRow label="RAAN" value={`${orbitalParams.raan.toFixed(2)}°`} />
                        <DataRow label="Arg of Perigee" value={`${orbitalParams.argPerigee.toFixed(2)}°`} />
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

function MiniTag({
    label,
    value,
    valueColor,
}: {
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <div>
            <div className="text-[8px] text-white/20 mb-0.5">{label}</div>
            <div
                className="text-[10px] font-medium"
                style={{ color: valueColor || 'rgba(255,255,255,0.65)' }}
            >
                {value}
            </div>
        </div>
    );
}

function formatPeriod(minutes: number): string {
    if (minutes < 120) return `${Math.round(minutes)} min`;
    const hours = minutes / 60;
    if (hours < 48) return `${hours.toFixed(1)} hrs`;
    return `${(hours / 24).toFixed(1)} days`;
}
