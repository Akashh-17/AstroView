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

// ─── VITAL SIGNS ────────────────────────────────────────────────────────────

export type VitalSignId =
    | 'satellites_now'
    | 'visible_earth'
    | 'air_temperature'
    | 'precipitation'
    | 'sea_level'
    | 'sea_surface_temp'
    | 'soil_moisture'
    | 'ozone'
    | 'water_storage';

export interface VitalSign {
    id: VitalSignId;
    label: string;
    shortLabel: string;
    icon: string;      // SVG path or emoji
    color: string;
    unit: string;
    description: string;
    /** Whether this vital sign changes the Earth shader */
    hasEarthOverlay: boolean;
}

export const VITAL_SIGNS: VitalSign[] = [
    {
        id: 'satellites_now',
        label: 'Satellites Now',
        shortLabel: 'Satellites',
        icon: 'SAT',
        color: '#4A9EFF',
        unit: '',
        description: 'Real-time positions of all tracked satellites',
        hasEarthOverlay: false,
    },
    {
        id: 'visible_earth',
        label: 'Visible Earth',
        shortLabel: 'Visible',
        icon: 'EYE',
        color: '#2ECC71',
        unit: '',
        description: 'True-color imagery of Earth from space',
        hasEarthOverlay: false,
    },
    {
        id: 'air_temperature',
        label: 'Air Temperature',
        shortLabel: 'Air Temp',
        icon: 'TEMP',
        color: '#FF6B35',
        unit: 'C',
        description: 'Global air temperature measured by infrared sounders',
        hasEarthOverlay: true,
    },
    {
        id: 'precipitation',
        label: 'Precipitation',
        shortLabel: 'Rain',
        icon: 'RAIN',
        color: '#5DADE2',
        unit: 'mm/hr',
        description: 'Global precipitation rate from GPM constellation',
        hasEarthOverlay: true,
    },
    {
        id: 'sea_level',
        label: 'Sea Level',
        shortLabel: 'Sea Lvl',
        icon: 'WAVE',
        color: '#1ABC9C',
        unit: 'mm',
        description: 'Sea surface height anomaly from radar altimetry',
        hasEarthOverlay: true,
    },
    {
        id: 'sea_surface_temp',
        label: 'Sea Surface Temp',
        shortLabel: 'SST',
        icon: 'SST',
        color: '#E74C3C',
        unit: 'C',
        description: 'Ocean surface temperature from MODIS & VIIRS',
        hasEarthOverlay: true,
    },
    {
        id: 'soil_moisture',
        label: 'Soil Moisture',
        shortLabel: 'Soil',
        icon: 'DROP',
        color: '#8B6914',
        unit: 'cm3/cm3',
        description: 'Surface soil moisture from SMAP microwave radiometry',
        hasEarthOverlay: true,
    },
    {
        id: 'ozone',
        label: 'Ozone',
        shortLabel: 'O3',
        icon: 'O3',
        color: '#9B59B6',
        unit: 'DU',
        description: 'Total column ozone measured by limb and nadir sounders',
        hasEarthOverlay: true,
    },
    {
        id: 'water_storage',
        label: 'Water Storage',
        shortLabel: 'Water',
        icon: 'WATER',
        color: '#2196F3',
        unit: 'cm',
        description: 'Terrestrial water storage anomalies from GRACE-FO gravity measurements',
        hasEarthOverlay: true,
    },
];

/**
 * Maps vital signs to the satellite names that measure them.
 * Satellite names should match what CelesTrak returns (uppercase).
 */
export const VITAL_SIGN_SATELLITES: Record<VitalSignId, string[]> = {
    satellites_now: [],  // show all — empty means no filter
    visible_earth: [],
    air_temperature: [
        'AQUA', 'TERRA', 'NOAA 20', 'NOAA 21', 'NOAA 19', 'NOAA 18',
        'GOES 16', 'GOES 18', 'METOP-A', 'METOP-B', 'METOP-C',
        'SUOMI NPP', 'JPSS-1', 'SENTINEL-3A', 'SENTINEL-3B',
        'FY-3D', 'FY-3E', 'HIMAWARI-8', 'HIMAWARI-9',
    ],
    water_storage: [
        'GRACE-FO 1', 'GRACE-FO 2', 'SENTINEL-6A', 'JASON-3',
        'CRYOSAT 2', 'SARAL', 'SMAP',
    ],
    precipitation: [
        'GPM-CORE', 'NOAA 20', 'NOAA 19', 'NOAA 18',
        'METOP-B', 'METOP-C', 'GOES 16', 'GOES 18',
        'HIMAWARI-8', 'HIMAWARI-9',
    ],
    sea_level: [
        'SENTINEL-6A', 'JASON-3', 'SENTINEL-3A', 'SENTINEL-3B',
        'CRYOSAT 2', 'SARAL',
    ],
    sea_surface_temp: [
        'AQUA', 'TERRA', 'SUOMI NPP', 'NOAA 20',
        'SENTINEL-3A', 'SENTINEL-3B', 'GOES 16', 'GOES 18',
    ],
    soil_moisture: [
        'SMAP', 'SMOS', 'SENTINEL-1A', 'SENTINEL-1B',
        'AQUA', 'METOP-B', 'METOP-C',
    ],
    ozone: [
        'SENTINEL-5P', 'SUOMI NPP', 'NOAA 20', 'AURA',
        'METOP-B', 'METOP-C', 'NOAA 19',
    ],
};

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
