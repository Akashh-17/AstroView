/**
 * satelliteData.ts
 *
 * Type definitions, category config, and notable satellite metadata
 * for the "All Eyes on Earth" module.
 */

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface TLERecord {
    name: string;
    line1: string;
    line2: string;
}

export interface SatelliteInfo {
    id: string;             // NORAD catalog number
    name: string;
    tle: TLERecord;
    category: SatelliteCategoryId;
    /** Current ECI position in km, updated per-frame */
    position?: [number, number, number];
    /** Current geodetic coords */
    lat?: number;
    lng?: number;
    alt?: number;  // km
    velocity?: number; // km/s
}

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

export type SatelliteCategoryId =
    | 'stations'
    | 'communications'
    | 'weather'
    | 'navigation'
    | 'scientific'
    | 'starlink'
    | 'earth_observation'
    | 'military'
    | 'debris';

export interface SatelliteCategory {
    id: SatelliteCategoryId;
    label: string;
    shortLabel: string;
    icon: string;
    color: string;
    description: string;
    orbitType: string;
    /** CelesTrak GP data group name */
    celestrakGroup: string;
    /** Max satellites to load from this group (performance) */
    maxCount: number;
}

export const SATELLITE_CATEGORIES: SatelliteCategory[] = [
    {
        id: 'stations',
        label: 'Space Stations',
        shortLabel: 'Stations',
        icon: '🏠',
        color: '#FFD700',
        description: 'Crewed orbital habitats — ISS, CSS Tiangong, and visiting vehicles',
        orbitType: 'LEO (400–420 km)',
        celestrakGroup: 'stations',
        maxCount: 25,
    },
    {
        id: 'earth_observation',
        label: 'Earth Observation',
        shortLabel: 'Earth Obs',
        icon: '🌍',
        color: '#2ECC71',
        description: 'Remote sensing, imaging & environmental monitoring satellites',
        orbitType: 'SSO / LEO',
        celestrakGroup: 'resource',
        maxCount: 80,
    },
    {
        id: 'weather',
        label: 'Weather & Climate',
        shortLabel: 'Weather',
        icon: '🌤️',
        color: '#E8E8E8',
        description: 'Meteorological satellites in polar and geostationary orbits',
        orbitType: 'LEO / GEO',
        celestrakGroup: 'weather',
        maxCount: 100,
    },
    {
        id: 'navigation',
        label: 'Navigation (GNSS)',
        shortLabel: 'GNSS',
        icon: '🧭',
        color: '#4AFF7C',
        description: 'GPS, GLONASS, Galileo, BeiDou — global positioning constellations',
        orbitType: 'MEO (~20,200 km)',
        celestrakGroup: 'gnss',
        maxCount: 120,
    },
    {
        id: 'scientific',
        label: 'Science & Research',
        shortLabel: 'Science',
        icon: '🔬',
        color: '#B44AFF',
        description: 'Telescopes, particle physics, heliophysics & planetary science',
        orbitType: 'Various',
        celestrakGroup: 'science',
        maxCount: 80,
    },
    {
        id: 'communications',
        label: 'Communications',
        shortLabel: 'Comms',
        icon: '📡',
        color: '#4A9EFF',
        description: 'Geostationary & MEO relay satellites for TV, internet & telephony',
        orbitType: 'GEO (~35,786 km)',
        celestrakGroup: 'geo',
        maxCount: 200,
    },
    {
        id: 'starlink',
        label: 'Starlink',
        shortLabel: 'Starlink',
        icon: '⭐',
        color: '#88CCFF',
        description: 'SpaceX mega-constellation for broadband internet — 6,000+ in orbit',
        orbitType: 'LEO (550 km)',
        celestrakGroup: 'starlink',
        maxCount: 300,
    },
    {
        id: 'military',
        label: 'Military / Recon',
        shortLabel: 'Military',
        icon: '🎖️',
        color: '#FF6B6B',
        description: 'Defense, surveillance, signals intelligence & early warning systems',
        orbitType: 'Various',
        celestrakGroup: 'military',
        maxCount: 60,
    },
    {
        id: 'debris',
        label: 'Debris (Tracked)',
        shortLabel: 'Debris',
        icon: '💀',
        color: '#666666',
        description: 'Dead satellites, rocket bodies & collision fragments tracked by SSN',
        orbitType: 'Various',
        celestrakGroup: 'cosmos-2251-debris',
        maxCount: 100,
    },
];

// ─── NOTABLE / FEATURED SATELLITES ──────────────────────────────────────────

/** Names of satellites to always label and show orbits for */
export const FEATURED_SATELLITE_NAMES = new Set([
    'ISS (ZARYA)',
    'ISS',
    'HST',                  // Hubble
    'TIANGONG',
    'CSS (TIANHE)',
    'NOAA 20',
    'TERRA',
    'AQUA',
    'LANDSAT 9',
    'GOES 16',
    'GOES 18',
    'SENTINEL-6A',
    'JAMES WEBB SPACE TELESCOPE',
]);

/** Satellites whose orbits are always drawn (even with Orbits OFF) */
export const ALWAYS_SHOW_ORBIT_NAMES = new Set([
    'ISS (ZARYA)',
    'ISS',
    'CSS (TIANHE)',
    'HST',
]);

// ─── SCALE ──────────────────────────────────────────────────────────────────

/** Earth radius in our 3D scene units */
export const EARTH_RADIUS_3D = 6.0;

/** Real Earth radius in km */
export const EARTH_RADIUS_KM = 6371;

/** Conversion factor: scene units per km */
export const KM_TO_SCENE = EARTH_RADIUS_3D / EARTH_RADIUS_KM;

/** Reference orbital altitudes in km */
export const ORBITAL_ALTITUDES = {
    LEO_MIN: 200,
    LEO_MAX: 2000,
    MEO: 20200,
    GEO: 35786,
};
