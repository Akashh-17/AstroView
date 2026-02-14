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
    | 'debris';

export interface SatelliteCategory {
    id: SatelliteCategoryId;
    label: string;
    icon: string;
    color: string;
    /** CelesTrak GP data group name */
    celestrakGroup: string;
    /** Max satellites to load from this group (performance) */
    maxCount: number;
}

export const SATELLITE_CATEGORIES: SatelliteCategory[] = [
    {
        id: 'stations',
        label: 'Space Stations',
        icon: '🏠',
        color: '#FFD700',
        celestrakGroup: 'stations',
        maxCount: 20,
    },
    {
        id: 'weather',
        label: 'Weather',
        icon: '🌤️',
        color: '#FFFFFF',
        celestrakGroup: 'weather',
        maxCount: 100,
    },
    {
        id: 'navigation',
        label: 'Navigation (GNSS)',
        icon: '🧭',
        color: '#4AFF7C',
        celestrakGroup: 'gnss',
        maxCount: 120,
    },
    {
        id: 'scientific',
        label: 'Science & Research',
        icon: '🔬',
        color: '#B44AFF',
        celestrakGroup: 'science',
        maxCount: 80,
    },
    {
        id: 'communications',
        label: 'Communications',
        icon: '📡',
        color: '#4A9EFF',
        celestrakGroup: 'geo',
        maxCount: 200,
    },
    {
        id: 'starlink',
        label: 'Starlink',
        icon: '⭐',
        color: '#88CCFF',
        celestrakGroup: 'starlink',
        maxCount: 300,
    },
    {
        id: 'debris',
        label: 'Debris (Tracked)',
        icon: '🗑️',
        color: '#808080',
        celestrakGroup: 'cosmos-2251-debris',
        maxCount: 100,
    },
];

// ─── NOTABLE / FEATURED SATELLITES ──────────────────────────────────────────

/** NORAD IDs of satellites to always label */
export const FEATURED_SATELLITE_NAMES = new Set([
    'ISS (ZARYA)',
    'ISS',
    'HST',                  // Hubble
    'TIANGONG',
    'CSS (TIANHE)',
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
