/**
 * orbitalMechanics.ts
 *
 * Implements simplified Keplerian orbital mechanics for computing the position
 * of a celestial body in 3D space at any given time.
 *
 * ─── KEY CONCEPTS ───
 *
 * Kepler's equation relates the Mean Anomaly (M), Eccentric Anomaly (E),
 * and Eccentricity (e):
 *
 *   M = E - e * sin(E)
 *
 * We solve for E given M using Newton-Raphson iteration, which converges
 * quickly for low eccentricities typical of planetary orbits.
 *
 * From E, we compute the True Anomaly (ν), which gives the actual angular
 * position of the body in its orbit:
 *
 *   tan(ν/2) = sqrt((1+e)/(1-e)) * tan(E/2)
 *
 * The radial distance from the focus (Sun) is:
 *
 *   r = a * (1 - e * cos(E))
 *
 * where a is the semi-major axis.
 *
 * The 3D position is obtained by rotating the in-plane coordinates (r, ν)
 * through three Euler angles:
 *   - Argument of Perihelion (ω) — rotation within the orbital plane
 *   - Inclination (i) — tilt of the orbital plane
 *   - Longitude of Ascending Node (Ω) — orientation of the orbital plane
 */

import type { OrbitalElements } from '../data/planetaryData';
import { AU } from '../data/planetaryData';

const DEG_TO_RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;

/**
 * Convert degrees to radians.
 */
export function degToRad(deg: number): number {
    return deg * DEG_TO_RAD;
}

/**
 * Compute the Mean Anomaly at a given time.
 *
 * M(t) = M0 + n * (t - t0)
 *
 * where:
 *   M0 = mean anomaly at epoch (t0 = J2000)
 *   n  = mean motion = 2π / T  (radians per year)
 *   t  = current time in Julian years since J2000
 *
 * @param M0 Mean anomaly at epoch (degrees)
 * @param orbitalPeriod Orbital period in Earth years
 * @param yearsSinceEpoch Time since J2000.0 in Julian years
 * @returns Mean anomaly in radians, normalized to [0, 2π)
 */
export function meanAnomaly(
    M0: number,
    orbitalPeriod: number,
    yearsSinceEpoch: number
): number {
    if (orbitalPeriod === 0) return 0; // Sun has no orbit

    // Mean motion: angular velocity in radians per year
    const n = TWO_PI / orbitalPeriod;

    // Mean anomaly at current time
    let M = degToRad(M0) + n * yearsSinceEpoch;

    // Normalize to [0, 2π)
    M = M % TWO_PI;
    if (M < 0) M += TWO_PI;

    return M;
}

/**
 * Solve Kepler's Equation for the Eccentric Anomaly using Newton-Raphson iteration.
 *
 * Kepler's Equation: M = E - e * sin(E)
 *
 * We want to solve for E given M and e.
 *
 * Newton-Raphson update:
 *   E_{n+1} = E_n - f(E_n) / f'(E_n)
 *
 * where:
 *   f(E)  = E - e * sin(E) - M
 *   f'(E) = 1 - e * cos(E)
 *
 * Initial guess: E_0 = M (good for small eccentricities)
 *
 * @param M Mean anomaly in radians
 * @param e Eccentricity (0 ≤ e < 1 for elliptical orbits)
 * @param tolerance Convergence threshold (default 1e-8 radians ≈ 0.002 arcsec)
 * @param maxIterations Safety limit on iterations
 * @returns Eccentric anomaly in radians
 */
export function solveKepler(
    M: number,
    e: number,
    tolerance: number = 1e-8,
    maxIterations: number = 50
): number {
    // For circular orbits, E = M
    if (e === 0) return M;

    // Initial guess: E = M for low eccentricities,
    // E = π for high eccentricities (M > π)
    let E = e < 0.8 ? M : Math.PI;

    for (let i = 0; i < maxIterations; i++) {
        // f(E) = E - e * sin(E) - M
        const f = E - e * Math.sin(E) - M;

        // f'(E) = 1 - e * cos(E)
        const fPrime = 1 - e * Math.cos(E);

        // Newton-Raphson step
        const delta = f / fPrime;
        E -= delta;

        // Check convergence
        if (Math.abs(delta) < tolerance) {
            return E;
        }
    }

    // If we didn't converge (shouldn't happen for typical solar system bodies),
    // return the best estimate
    return E;
}

/**
 * Compute the True Anomaly from the Eccentric Anomaly.
 *
 * The true anomaly ν gives the actual angular position of the body
 * as seen from the focus (Sun).
 *
 * Formula:
 *   tan(ν/2) = sqrt((1+e)/(1-e)) * tan(E/2)
 *
 * We use atan2 for numerical stability.
 *
 * @param E Eccentric anomaly in radians
 * @param e Eccentricity
 * @returns True anomaly in radians
 */
export function trueAnomaly(E: number, e: number): number {
    // Use the half-angle formula for numerical stability:
    // ν = 2 * atan2(sqrt(1+e) * sin(E/2), sqrt(1-e) * cos(E/2))
    const halfE = E / 2;
    const sinHalf = Math.sin(halfE);
    const cosHalf = Math.cos(halfE);

    return 2 * Math.atan2(
        Math.sqrt(1 + e) * sinHalf,
        Math.sqrt(1 - e) * cosHalf
    );
}

/**
 * Compute the radial distance from the focus (Sun).
 *
 * r = a * (1 - e * cos(E))
 *
 * @param a Semi-major axis (AU)
 * @param e Eccentricity
 * @param E Eccentric anomaly in radians
 * @returns Distance in AU
 */
export function radialDistance(a: number, e: number, E: number): number {
    return a * (1 - e * Math.cos(E));
}

/**
 * Compute the 3D position of a body in its orbit.
 *
 * Steps:
 * 1. Compute position in the orbital plane: (x', y') = (r cosν, r sinν)
 * 2. Apply rotation matrices for:
 *    - Argument of perihelion (ω): rotates within the orbital plane
 *    - Inclination (i): tilts the orbital plane
 *    - Longitude of ascending node (Ω): rotates the line of nodes
 *
 * The final 3D position in the ecliptic frame is:
 *
 *   x = (cosΩ cosω - sinΩ sinω cosi) * x' + (-cosΩ sinω - sinΩ cosω cosi) * y'
 *   y = (sinΩ cosω + cosΩ sinω cosi) * x' + (-sinΩ sinω + cosΩ cosω cosi) * y'
 *   z = (sinω sini) * x' + (cosω sini) * y'
 *
 * @param elements Orbital elements of the body
 * @param nu True anomaly in radians
 * @param r Radial distance in AU
 * @param scaleFactor AU to scene units conversion
 * @returns [x, y, z] position in scene coordinates
 */
export function orbitalPosition(
    elements: OrbitalElements,
    nu: number,
    r: number,
    scaleFactor: number = AU
): [number, number, number] {
    const { inclination, longitudeOfAscendingNode, argumentOfPerihelion } = elements;

    // Convert angles to radians
    const i = degToRad(inclination);
    const Omega = degToRad(longitudeOfAscendingNode);
    const omega = degToRad(argumentOfPerihelion);

    // Position in the orbital plane
    const xPrime = r * Math.cos(nu);
    const yPrime = r * Math.sin(nu);

    // Precompute trig values
    const cosOmega = Math.cos(Omega);
    const sinOmega = Math.sin(Omega);
    const cosomega = Math.cos(omega);
    const sinomega = Math.sin(omega);
    const cosI = Math.cos(i);
    const sinI = Math.sin(i);

    // Rotation matrix components
    // Rotate from orbital plane to ecliptic coordinates
    const x =
        (cosOmega * cosomega - sinOmega * sinomega * cosI) * xPrime +
        (-cosOmega * sinomega - sinOmega * cosomega * cosI) * yPrime;

    // Note: We map ecliptic Y to scene Z (up axis) for a nice top-down default view
    const y =
        (sinomega * sinI) * xPrime +
        (cosomega * sinI) * yPrime;

    const z =
        (sinOmega * cosomega + cosOmega * sinomega * cosI) * xPrime +
        (-sinOmega * sinomega + cosOmega * cosomega * cosI) * yPrime;

    // Scale from AU to scene units
    return [x * scaleFactor, y * scaleFactor, z * scaleFactor];
}

/**
 * High-level API: Get the 3D position of a celestial body at a given Julian date.
 *
 * @param elements Orbital elements of the body
 * @param julianDate Current Julian date
 * @param scaleFactor AU to scene units
 * @returns [x, y, z] position in scene coordinates
 */
export function getBodyPosition(
    elements: OrbitalElements,
    julianDate: number,
    scaleFactor: number = AU
): [number, number, number] {
    // J2000.0 epoch = JD 2451545.0
    const J2000 = 2451545.0;

    // Time since epoch in Julian years (365.25 days per year)
    const yearsSinceEpoch = (julianDate - J2000) / 365.25;

    // Step 1: Compute mean anomaly at current time
    const M = meanAnomaly(
        elements.meanAnomalyAtEpoch,
        elements.orbitalPeriod,
        yearsSinceEpoch
    );

    // Step 2: Solve Kepler's equation for eccentric anomaly
    const E = solveKepler(M, elements.eccentricity);

    // Step 3: Compute true anomaly
    const nu = trueAnomaly(E, elements.eccentricity);

    // Step 4: Compute radial distance
    const r = radialDistance(elements.semiMajorAxis, elements.eccentricity, E);

    // Step 5: Compute 3D position
    return orbitalPosition(elements, nu, r, scaleFactor);
}

/**
 * Generate an array of points along an orbit for rendering orbit lines.
 *
 * @param elements Orbital elements
 * @param segments Number of line segments
 * @param scaleFactor AU to scene units
 * @returns Array of [x, y, z] positions forming the orbit ellipse
 */
export function generateOrbitPath(
    elements: OrbitalElements,
    segments: number = 128,
    scaleFactor: number = AU
): [number, number, number][] {
    const points: [number, number, number][] = [];

    for (let j = 0; j <= segments; j++) {
        // Sweep true anomaly from 0 to 2π
        const nu = (j / segments) * TWO_PI;

        // Compute radial distance at this true anomaly
        // r = a(1-e²) / (1 + e cos(ν))
        const { semiMajorAxis: a, eccentricity: e } = elements;
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));

        points.push(orbitalPosition(elements, nu, r, scaleFactor));
    }

    return points;
}
