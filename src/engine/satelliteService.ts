/**
 * satelliteService.ts
 *
 * Fetches TLE data from CelesTrak and propagates satellite positions
 * using satellite.js (SGP4/SDP4).
 */

import {
    twoline2satrec,
    propagate,
    gstime,
    eciToGeodetic,
    degreesLat,
    degreesLong,
    type EciVec3
} from 'satellite.js';
import type { TLERecord, SatelliteInfo, SatelliteCategoryId } from '../data/satelliteData';
import { SATELLITE_CATEGORIES, KM_TO_SCENE } from '../data/satelliteData';

// ─── CELESTRAK API ──────────────────────────────────────────────────────────

const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/gp.php';

/**
 * Fetch TLE data for a CelesTrak group.
 * Returns parsed TLE records.
 */
export async function fetchTLEGroup(
    group: string,
    maxCount: number,
): Promise<TLERecord[]> {
    const url = `${CELESTRAK_BASE}?GROUP=${encodeURIComponent(group)}&FORMAT=tle`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`CelesTrak fetch failed: ${resp.status}`);
    const text = await resp.text();
    return parseTLEText(text, maxCount);
}

/**
 * Parse raw TLE text (3-line format) into TLERecord[].
 */
function parseTLEText(text: string, maxCount: number): TLERecord[] {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const records: TLERecord[] = [];

    for (let i = 0; i + 2 < lines.length && records.length < maxCount; i += 3) {
        const name = lines[i];
        const line1 = lines[i + 1];
        const line2 = lines[i + 2];

        // Validate TLE lines start with '1' and '2'
        if (line1?.startsWith('1') && line2?.startsWith('2')) {
            records.push({ name, line1, line2 });
        }
    }
    return records;
}

/**
 * Fetch all configured satellite categories.
 * Returns a flat array of SatelliteInfo.
 */
export async function fetchAllSatellites(): Promise<SatelliteInfo[]> {
    const all: SatelliteInfo[] = [];

    const results = await Promise.allSettled(
        SATELLITE_CATEGORIES.map(async (cat) => {
            const tles = await fetchTLEGroup(cat.celestrakGroup, cat.maxCount);
            return tles.map(
                (tle): SatelliteInfo => ({
                    id: extractNoradId(tle.line1),
                    name: tle.name,
                    tle,
                    category: cat.id,
                }),
            );
        }),
    );

    for (const result of results) {
        if (result.status === 'fulfilled') {
            all.push(...result.value);
        }
    }

    return all;
}

function extractNoradId(line1: string): string {
    // NORAD catalog number is chars 3-7 of line 1
    return line1.substring(2, 7).trim();
}

// ─── SGP4 PROPAGATION ───────────────────────────────────────────────────────

/**
 * Propagate a satellite to the given date.
 * Returns position in 3D scene coordinates, or null if propagation fails.
 */
export function propagateSatellite(
    tle: TLERecord,
    date: Date,
): { position: [number, number, number]; lat: number; lng: number; alt: number; velocity: number } | null {
    try {
        const satrec = twoline2satrec(tle.line1, tle.line2);
        const posVel = propagate(satrec, date);

        if (!posVel || !posVel.position || (posVel.position as any) === true) return null;

        const posEci = posVel.position as EciVec3<number>;
        const velEci = posVel.velocity as EciVec3<number>;

        // Convert to geodetic for lat/lng/alt
        const gmstVal = gstime(date);
        const geo = eciToGeodetic(posEci, gmstVal);

        const lat = degreesLat(geo.latitude);
        const lng = degreesLong(geo.longitude);
        const alt = geo.height; // km

        // Convert ECI (km) to scene coordinates
        const position = eciToScene(posEci);

        // Velocity magnitude
        const velocity = Math.sqrt(
            velEci.x ** 2 + velEci.y ** 2 + velEci.z ** 2,
        );

        return { position, lat, lng, alt, velocity };
    } catch {
        return null;
    }
}

/**
 * Convert ECI coordinates (km) to our 3D scene coordinate system.
 * ECI: x=vernal equinox, y=90° east, z=north pole
 * Three.js: x=right, y=up, z=toward camera
 * We map: x→x, z_eci→y (up), y_eci→z
 */
function eciToScene(eci: EciVec3<number>): [number, number, number] {
    return [
        eci.x * KM_TO_SCENE,
        eci.z * KM_TO_SCENE,   // ECI z (north) → scene y (up)
        eci.y * KM_TO_SCENE,   // ECI y → scene z
    ];
}

/**
 * Compute an array of orbit path points by propagating over one full period.
 */
export function computeOrbitPath(
    tle: TLERecord,
    date: Date,
    steps = 120,
): [number, number, number][] {
    const satrec = twoline2satrec(tle.line1, tle.line2);

    // Orbital period in minutes from mean motion (revs/day)
    const meanMotion = satrec.no; // rad/min in satellite.js internal
    const periodMin = (2 * Math.PI) / meanMotion;

    const points: [number, number, number][] = [];
    const startMs = date.getTime();

    for (let i = 0; i <= steps; i++) {
        const t = new Date(startMs + (i / steps) * periodMin * 60000);
        const posVel = propagate(satrec, t);
        if (!posVel || !posVel.position || (posVel.position as any) === true) continue;
        points.push(eciToScene(posVel.position as EciVec3<number>));
    }

    return points;
}

/**
 * Batch-propagate all satellites at once for performance.
 */
export function propagateAll(
    satellites: SatelliteInfo[],
    date: Date,
): SatelliteInfo[] {
    return satellites.map((sat) => {
        const result = propagateSatellite(sat.tle, date);
        if (!result) return sat;
        return {
            ...sat,
            position: result.position,
            lat: result.lat,
            lng: result.lng,
            alt: result.alt,
            velocity: result.velocity,
        };
    });
}

// ─── FALLBACK DATA ──────────────────────────────────────────────────────────

/**
 * Fallback sample TLE data for when CelesTrak is unreachable.
 */
export function getFallbackSatellites(): SatelliteInfo[] {
    const fallbackTLEs: { name: string; line1: string; line2: string; category: SatelliteCategoryId }[] = [
        {
            name: 'ISS (ZARYA)',
            line1: '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9002',
            line2: '2 25544  51.6400 208.9163 0006703  40.5765  30.5612 15.50120000000010',
            category: 'stations',
        },
        {
            name: 'HUBBLE SPACE TELESCOPE',
            line1: '1 20580U 90037B   24001.50000000  .00000560  00000-0  17650-4 0  9008',
            line2: '2 20580  28.4700  30.5000 0002800 120.0000 240.0000 15.09000000000010',
            category: 'scientific',
        },
        {
            name: 'CSS (TIANHE)',
            line1: '1 48274U 21035A   24001.50000000  .00010000  00000-0  10000-3 0  9002',
            line2: '2 48274  41.4700 120.0000 0006000  80.0000 280.0000 15.60000000000010',
            category: 'stations',
        },
        {
            name: 'GPS BIIR-2',
            line1: '1 28361U 04045A   24001.50000000  .00000010  00000-0  10000-3 0  9004',
            line2: '2 28361  55.0000  60.0000 0080000 250.0000 110.0000  2.00560000000010',
            category: 'navigation',
        },
        {
            name: 'GOES 16',
            line1: '1 41866U 16071A   24001.50000000 -.00000010  00000-0  00000+0 0  9004',
            line2: '2 41866   0.0200 270.0000 0001400  90.0000 270.0000  1.00270000000010',
            category: 'weather',
        },
        {
            name: 'NOAA 20',
            line1: '1 43013U 17073A   24001.50000000  .00000020  00000-0  15000-4 0  9002',
            line2: '2 43013  98.7300  30.0000 0001000  90.0000 270.0000 14.19540000000010',
            category: 'weather',
        },
        {
            name: 'INTELSAT 35E',
            line1: '1 42818U 17041A   24001.50000000  .00000000  00000-0  00000+0 0  9002',
            line2: '2 42818   0.0100 100.0000 0002000 200.0000 160.0000  1.00270000000010',
            category: 'communications',
        },
        {
            name: 'STARLINK-1007',
            line1: '1 44713U 19074A   24001.50000000  .00001000  00000-0  50000-4 0  9002',
            line2: '2 44713  53.0500  90.0000 0001000 270.0000  90.0000 15.06400000000010',
            category: 'starlink',
        },
        {
            name: 'STARLINK-1008',
            line1: '1 44714U 19074B   24001.50000000  .00001000  00000-0  50000-4 0  9002',
            line2: '2 44714  53.0500 150.0000 0001000  90.0000 270.0000 15.06400000000010',
            category: 'starlink',
        },
        {
            name: 'COSMOS 2251 DEB',
            line1: '1 34454U 09005F   24001.50000000  .00000200  00000-0  10000-3 0  9002',
            line2: '2 34454  74.0300 200.0000 0100000 300.0000  60.0000 14.12000000000010',
            category: 'debris',
        },
    ];

    return fallbackTLEs.map((t) => ({
        id: extractNoradId(t.line1),
        name: t.name,
        tle: { name: t.name, line1: t.line1, line2: t.line2 },
        category: t.category,
    }));
}
