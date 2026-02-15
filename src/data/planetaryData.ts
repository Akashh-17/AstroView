/**
 * planetaryData.ts
 *
 * Complete dataset for the Solar System.
 * Orbital elements are given for J2000.0 epoch (JD 2451545.0 = 2000-Jan-1.5 TDB).
 *
 * Sources: NASA JPL Planetary Fact Sheets, Meeus "Astronomical Algorithms"
 *
 * Units:
 *   - Semi-major axis (a): AU
 *   - Eccentricity (e): dimensionless
 *   - Inclination (i): degrees
 *   - Longitude of ascending node (Ω / lan): degrees
 *   - Argument of perihelion (ω / aop): degrees
 *   - Mean anomaly at epoch (M0): degrees
 *   - Orbital period: Earth years
 *   - Radius: km (physical radius of the body)
 *   - Rotation period: hours (sidereal, negative = retrograde)
 *   - Axial tilt: degrees
 */

export interface OrbitalElements {
  semiMajorAxis: number;       // AU
  eccentricity: number;
  inclination: number;         // degrees
  longitudeOfAscendingNode: number; // degrees (Ω)
  argumentOfPerihelion: number;     // degrees (ω)
  meanAnomalyAtEpoch: number;      // degrees (M0 at J2000)
  orbitalPeriod: number;           // Earth years
}

export interface PhysicalProperties {
  radius: number;              // km
  mass: number;                // kg (×10^24 for planets, ×10^24 for Sun)
  rotationPeriod: number;      // hours (negative = retrograde)
  axialTilt: number;           // degrees
  gravity?: number;            // m/s² surface gravity
  escapeVelocity?: number;     // km/s
  meanTemp?: number;           // K (mean surface or cloud-top temperature)
  atmosphere?: string;         // primary atmospheric composition
  magneticField?: boolean;     // has significant magnetic field
  numberOfMoons?: number;      // total known moons
  surfacePressure?: number;    // atm (Earth = 1)
  density?: number;            // g/cm³ mean density
  spectralType?: string;       // for stars
  luminosity?: number;         // solar luminosities (for stars)
  absoluteMagnitude?: number;  // for stars
}

export interface DisplayProperties {
  color: string;               // hex color for the body
  emissive?: string;           // emissive color (for Sun)
  glowColor?: string;          // atmospheric glow color
  description: string;         // short description
  category: 'star' | 'planet' | 'dwarf-planet' | 'moon' | 'asteroid';
}

export interface CelestialBody {
  id: string;
  name: string;
  orbital: OrbitalElements;
  physical: PhysicalProperties;
  display: DisplayProperties;
  parentId?: string;           // for moons, the planet they orbit
  moons?: string[];            // IDs of child moons
}

// ─── SCALE CONSTANTS ────────────────────────────────────────────────────────────
// 1 AU in our scene units. We use a visual scale so the Solar System fits nicely.
export const AU = 50; // 1 AU = 50 scene units (visual mode)
export const REAL_AU = 500; // 1 AU = 500 scene units (real-scale mode)

// Planet visual radius multiplier so planets are visible (real scale they'd be invisible)
export const VISUAL_RADIUS_SCALE = 0.0004; // km → scene units (visual mode)
export const SUN_VISUAL_SCALE = 0.000004;  // Sun is huge, scale it down more

// ─── PLANETS ────────────────────────────────────────────────────────────────────

export const SUN: CelestialBody = {
  id: 'sun',
  name: 'Sun',
  orbital: {
    semiMajorAxis: 0,
    eccentricity: 0,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPerihelion: 0,
    meanAnomalyAtEpoch: 0,
    orbitalPeriod: 0,
  },
  physical: {
    radius: 696340,
    mass: 1989100,
    rotationPeriod: 609.12,   // ~25.38 days at equator
    axialTilt: 7.25,
    gravity: 274,
    escapeVelocity: 617.7,
    meanTemp: 5778,
    density: 1.408,
    spectralType: 'G2V',
    luminosity: 1.0,
    absoluteMagnitude: 4.83,
    atmosphere: 'Hydrogen (~73%), Helium (~25%)',
    magneticField: true,
  },
  display: {
    color: '#FDB813',
    emissive: '#FDB813',
    glowColor: '#FF8C00',
    description: 'The Sun is the star at the center of our Solar System. It is a nearly perfect ball of hot plasma, heated to incandescence by nuclear fusion reactions in its core.',
    category: 'star',
  },
  moons: [],
};

export const MERCURY: CelestialBody = {
  id: 'mercury',
  name: 'Mercury',
  orbital: {
    semiMajorAxis: 0.387098,
    eccentricity: 0.205630,
    inclination: 7.005,
    longitudeOfAscendingNode: 48.331,
    argumentOfPerihelion: 29.124,
    meanAnomalyAtEpoch: 174.796,
    orbitalPeriod: 0.240846,
  },
  physical: {
    radius: 2439.7,
    mass: 0.33011,
    rotationPeriod: 1407.6,    // ~58.65 days
    axialTilt: 0.034,
    gravity: 3.7,
    escapeVelocity: 4.25,
    meanTemp: 440,
    density: 5.427,
    atmosphere: 'Trace (O₂, Na, H₂)',
    magneticField: true,
    numberOfMoons: 0,
    surfacePressure: 0,
  },
  display: {
    color: '#8C7E6D',
    description: 'Mercury is the smallest planet in our Solar System and closest to the Sun. Its surface is heavily cratered and resembles Earth\'s Moon.',
    category: 'planet',
  },
  moons: [],
};

export const VENUS: CelestialBody = {
  id: 'venus',
  name: 'Venus',
  orbital: {
    semiMajorAxis: 0.723332,
    eccentricity: 0.006772,
    inclination: 3.39458,
    longitudeOfAscendingNode: 76.680,
    argumentOfPerihelion: 54.884,
    meanAnomalyAtEpoch: 50.115,
    orbitalPeriod: 0.615198,
  },
  physical: {
    radius: 6051.8,
    mass: 4.8675,
    rotationPeriod: -5832.5,    // retrograde rotation (~243 days)
    axialTilt: 177.36,
    gravity: 8.87,
    escapeVelocity: 10.36,
    meanTemp: 737,
    density: 5.243,
    atmosphere: 'CO₂ (~96.5%), N₂ (~3.5%)',
    magneticField: false,
    numberOfMoons: 0,
    surfacePressure: 92,
  },
  display: {
    color: '#C8A25C',
    glowColor: '#E8C87088',
    description: 'Venus is the second planet from the Sun. It has a thick, toxic atmosphere filled with carbon dioxide and clouds of sulfuric acid.',
    category: 'planet',
  },
  moons: [],
};

export const EARTH: CelestialBody = {
  id: 'earth',
  name: 'Earth',
  orbital: {
    semiMajorAxis: 1.000001018,
    eccentricity: 0.0167086,
    inclination: 0.00005,
    longitudeOfAscendingNode: -11.26064,
    argumentOfPerihelion: 114.20783,
    meanAnomalyAtEpoch: 358.617,
    orbitalPeriod: 1.0000174,
  },
  physical: {
    radius: 6371.0,
    mass: 5.9724,
    rotationPeriod: 23.9345,
    axialTilt: 23.4393,
    gravity: 9.807,
    escapeVelocity: 11.186,
    meanTemp: 288,
    density: 5.514,
    atmosphere: 'N₂ (~78%), O₂ (~21%), Ar (~0.9%)',
    magneticField: true,
    numberOfMoons: 1,
    surfacePressure: 1,
  },
  display: {
    color: '#2E6BBF',
    glowColor: '#4A9EFF44',
    description: 'Earth is the third planet from the Sun and the only known planet to harbor life. It has liquid water on its surface and a protective magnetic field.',
    category: 'planet',
  },
  moons: ['moon'],
};

export const MARS: CelestialBody = {
  id: 'mars',
  name: 'Mars',
  orbital: {
    semiMajorAxis: 1.523679,
    eccentricity: 0.0934,
    inclination: 1.850,
    longitudeOfAscendingNode: 49.558,
    argumentOfPerihelion: 286.502,
    meanAnomalyAtEpoch: 19.373,
    orbitalPeriod: 1.8808,
  },
  physical: {
    radius: 3389.5,
    mass: 0.64171,
    rotationPeriod: 24.6229,
    axialTilt: 25.19,
    gravity: 3.721,
    escapeVelocity: 5.027,
    meanTemp: 210,
    density: 3.934,
    atmosphere: 'CO₂ (~95.3%), N₂ (~2.7%)',
    magneticField: false,
    numberOfMoons: 2,
    surfacePressure: 0.006,
  },
  display: {
    color: '#C1440E',
    description: 'Mars is the fourth planet from the Sun, often called the "Red Planet" due to iron oxide prevalent on its surface. It has the tallest volcano in the Solar System, Olympus Mons.',
    category: 'planet',
  },
  moons: ['phobos', 'deimos'],
};

export const JUPITER: CelestialBody = {
  id: 'jupiter',
  name: 'Jupiter',
  orbital: {
    semiMajorAxis: 5.2026,
    eccentricity: 0.0489,
    inclination: 1.303,
    longitudeOfAscendingNode: 100.464,
    argumentOfPerihelion: 273.867,
    meanAnomalyAtEpoch: 20.020,
    orbitalPeriod: 11.862,
  },
  physical: {
    radius: 69911,
    mass: 1898.19,
    rotationPeriod: 9.925,
    axialTilt: 3.13,
    gravity: 24.79,
    escapeVelocity: 59.5,
    meanTemp: 165,
    density: 1.326,
    atmosphere: 'H₂ (~89.8%), He (~10.2%)',
    magneticField: true,
    numberOfMoons: 95,
  },
  display: {
    color: '#C88B3A',
    description: 'Jupiter is the largest planet in the Solar System. It is a gas giant with a Great Red Spot, a storm larger than Earth that has raged for hundreds of years.',
    category: 'planet',
  },
  moons: ['io', 'europa', 'ganymede', 'callisto'],
};

export const SATURN: CelestialBody = {
  id: 'saturn',
  name: 'Saturn',
  orbital: {
    semiMajorAxis: 9.5549,
    eccentricity: 0.0565,
    inclination: 2.485,
    longitudeOfAscendingNode: 113.665,
    argumentOfPerihelion: 339.392,
    meanAnomalyAtEpoch: 317.020,
    orbitalPeriod: 29.4571,
  },
  physical: {
    radius: 58232,
    mass: 568.34,
    rotationPeriod: 10.656,
    axialTilt: 26.73,
    gravity: 10.44,
    escapeVelocity: 35.5,
    meanTemp: 134,
    density: 0.687,
    atmosphere: 'H₂ (~96.3%), He (~3.25%)',
    magneticField: true,
    numberOfMoons: 146,
  },
  display: {
    color: '#D4B96A',
    description: 'Saturn is the sixth planet from the Sun, best known for its spectacular ring system made of ice and rock particles.',
    category: 'planet',
  },
  moons: ['titan', 'enceladus'],
};

export const URANUS: CelestialBody = {
  id: 'uranus',
  name: 'Uranus',
  orbital: {
    semiMajorAxis: 19.2184,
    eccentricity: 0.0464,
    inclination: 0.773,
    longitudeOfAscendingNode: 74.006,
    argumentOfPerihelion: 96.998857,
    meanAnomalyAtEpoch: 142.238600,
    orbitalPeriod: 84.0205,
  },
  physical: {
    radius: 25362,
    mass: 86.813,
    rotationPeriod: -17.24,    // retrograde
    axialTilt: 97.77,
    gravity: 8.87,
    escapeVelocity: 21.3,
    meanTemp: 76,
    density: 1.270,
    atmosphere: 'H₂ (~82.5%), He (~15.2%), CH₄ (~2.3%)',
    magneticField: true,
    numberOfMoons: 28,
  },
  display: {
    color: '#72B5C4',
    glowColor: '#72B5C422',
    description: 'Uranus is the seventh planet from the Sun. It rotates on its side with an axial tilt of nearly 98 degrees, likely the result of a massive collision.',
    category: 'planet',
  },
  moons: ['miranda', 'ariel', 'titania'],
};

export const NEPTUNE: CelestialBody = {
  id: 'neptune',
  name: 'Neptune',
  orbital: {
    semiMajorAxis: 30.0690,
    eccentricity: 0.0086,
    inclination: 1.770,
    longitudeOfAscendingNode: 131.784,
    argumentOfPerihelion: 276.336,
    meanAnomalyAtEpoch: 256.228,
    orbitalPeriod: 164.8,
  },
  physical: {
    radius: 24622,
    mass: 102.413,
    rotationPeriod: 16.11,
    axialTilt: 28.32,
    gravity: 11.15,
    escapeVelocity: 23.5,
    meanTemp: 72,
    density: 1.638,
    atmosphere: 'H₂ (~80%), He (~19%), CH₄ (~1.5%)',
    magneticField: true,
    numberOfMoons: 16,
  },
  display: {
    color: '#3F54BA',
    glowColor: '#3F54BA22',
    description: 'Neptune is the eighth and farthest planet from the Sun. It has the strongest winds in the Solar System, reaching speeds of 2,100 km/h.',
    category: 'planet',
  },
  moons: ['triton'],
};

// ─── MAJOR MOONS ────────────────────────────────────────────────────────────────

export const MOON: CelestialBody = {
  id: 'moon',
  name: 'Moon',
  parentId: 'earth',
  orbital: {
    semiMajorAxis: 0.00257,     // ~384,400 km in AU
    eccentricity: 0.0549,
    inclination: 5.145,
    longitudeOfAscendingNode: 125.08,
    argumentOfPerihelion: 318.15,
    meanAnomalyAtEpoch: 135.27,
    orbitalPeriod: 0.0748,      // ~27.3 days
  },
  physical: {
    radius: 1737.4,
    mass: 0.07346,
    rotationPeriod: 655.7,      // tidally locked
    axialTilt: 6.68,
  },
  display: {
    color: '#AAAAAA',
    description: 'The Moon is Earth\'s only natural satellite. It is the fifth largest moon in the Solar System.',
    category: 'moon',
  },
};

export const IO: CelestialBody = {
  id: 'io',
  name: 'Io',
  parentId: 'jupiter',
  orbital: {
    semiMajorAxis: 0.00282,
    eccentricity: 0.0041,
    inclination: 0.036,
    longitudeOfAscendingNode: 43.977,
    argumentOfPerihelion: 84.129,
    meanAnomalyAtEpoch: 342.021,
    orbitalPeriod: 0.00485,
  },
  physical: {
    radius: 1821.6,
    mass: 0.08932,
    rotationPeriod: 42.456,
    axialTilt: 0.0,
  },
  display: {
    color: '#C8B456',
    description: 'Io is the innermost of Jupiter\'s four Galilean moons and the most volcanically active body in the Solar System.',
    category: 'moon',
  },
};

export const EUROPA: CelestialBody = {
  id: 'europa',
  name: 'Europa',
  parentId: 'jupiter',
  orbital: {
    semiMajorAxis: 0.00449,
    eccentricity: 0.009,
    inclination: 0.466,
    longitudeOfAscendingNode: 219.106,
    argumentOfPerihelion: 88.97,
    meanAnomalyAtEpoch: 171.016,
    orbitalPeriod: 0.00972,
  },
  physical: {
    radius: 1560.8,
    mass: 0.048,
    rotationPeriod: 85.228,
    axialTilt: 0.1,
  },
  display: {
    color: '#B8A88A',
    description: 'Europa is one of Jupiter\'s Galilean moons, believed to have a subsurface ocean beneath its icy crust that could potentially harbor life.',
    category: 'moon',
  },
};

export const GANYMEDE: CelestialBody = {
  id: 'ganymede',
  name: 'Ganymede',
  parentId: 'jupiter',
  orbital: {
    semiMajorAxis: 0.00716,
    eccentricity: 0.0013,
    inclination: 0.177,
    longitudeOfAscendingNode: 63.552,
    argumentOfPerihelion: 192.417,
    meanAnomalyAtEpoch: 317.54,
    orbitalPeriod: 0.01959,
  },
  physical: {
    radius: 2634.1,
    mass: 0.14819,
    rotationPeriod: 171.709,
    axialTilt: 0.33,
  },
  display: {
    color: '#8C7E6D',
    description: 'Ganymede is the largest moon in the Solar System and the only moon known to have its own magnetic field.',
    category: 'moon',
  },
};

export const CALLISTO: CelestialBody = {
  id: 'callisto',
  name: 'Callisto',
  parentId: 'jupiter',
  orbital: {
    semiMajorAxis: 0.01259,
    eccentricity: 0.0074,
    inclination: 0.192,
    longitudeOfAscendingNode: 298.848,
    argumentOfPerihelion: 52.643,
    meanAnomalyAtEpoch: 181.408,
    orbitalPeriod: 0.04569,
  },
  physical: {
    radius: 2410.3,
    mass: 0.10759,
    rotationPeriod: 400.536,
    axialTilt: 0.0,
  },
  display: {
    color: '#6B5F51',
    description: 'Callisto is the second-largest moon of Jupiter. Its surface is the most heavily cratered of any object in the Solar System.',
    category: 'moon',
  },
};

export const TITAN: CelestialBody = {
  id: 'titan',
  name: 'Titan',
  parentId: 'saturn',
  orbital: {
    semiMajorAxis: 0.00817,
    eccentricity: 0.0288,
    inclination: 0.34854,
    longitudeOfAscendingNode: 28.06,
    argumentOfPerihelion: 180.532,
    meanAnomalyAtEpoch: 163.31,
    orbitalPeriod: 0.04366,
  },
  physical: {
    radius: 2574.7,
    mass: 0.13452,
    rotationPeriod: 382.68,
    axialTilt: 0.0,
  },
  display: {
    color: '#C4A135',
    glowColor: '#C4A13522',
    description: 'Titan is the largest moon of Saturn and the second-largest in the Solar System. It has a thick atmosphere and liquid methane lakes.',
    category: 'moon',
  },
};

export const ENCELADUS: CelestialBody = {
  id: 'enceladus',
  name: 'Enceladus',
  parentId: 'saturn',
  orbital: {
    semiMajorAxis: 0.00159,
    eccentricity: 0.0047,
    inclination: 0.009,
    longitudeOfAscendingNode: 0.0,
    argumentOfPerihelion: 0.0,
    meanAnomalyAtEpoch: 0.0,
    orbitalPeriod: 0.00376,
  },
  physical: {
    radius: 252.1,
    mass: 0.000108,
    rotationPeriod: 32.885,
    axialTilt: 0.0,
  },
  display: {
    color: '#E8E8E8',
    description: 'Enceladus is a small, icy moon of Saturn known for its geysers that shoot water vapor and ice from its south pole.',
    category: 'moon',
  },
};

export const TRITON: CelestialBody = {
  id: 'triton',
  name: 'Triton',
  parentId: 'neptune',
  orbital: {
    semiMajorAxis: 0.00237,
    eccentricity: 0.000016,
    inclination: 156.885,       // retrograde orbit
    longitudeOfAscendingNode: 177.608,
    argumentOfPerihelion: 66.142,
    meanAnomalyAtEpoch: 352.257,
    orbitalPeriod: 0.01608,
  },
  physical: {
    radius: 1353.4,
    mass: 0.02141,
    rotationPeriod: -141.043,   // retrograde
    axialTilt: 0.0,
  },
  display: {
    color: '#A8C4D4',
    description: 'Triton is the largest moon of Neptune. It has a retrograde orbit, suggesting it was captured from the Kuiper Belt.',
    category: 'moon',
  },
};

export const MIRANDA: CelestialBody = {
  id: 'miranda',
  name: 'Miranda',
  parentId: 'uranus',
  orbital: {
    semiMajorAxis: 0.000868,
    eccentricity: 0.0013,
    inclination: 4.338,
    longitudeOfAscendingNode: 0.0,
    argumentOfPerihelion: 0.0,
    meanAnomalyAtEpoch: 0.0,
    orbitalPeriod: 0.00387,
  },
  physical: {
    radius: 235.8,
    mass: 0.0000659,
    rotationPeriod: 33.923,
    axialTilt: 0.0,
  },
  display: {
    color: '#C0C0C0',
    description: 'Miranda is the smallest and innermost of Uranus\'s five round satellites.',
    category: 'moon',
  },
};

export const ARIEL: CelestialBody = {
  id: 'ariel',
  name: 'Ariel',
  parentId: 'uranus',
  orbital: {
    semiMajorAxis: 0.001277,
    eccentricity: 0.0012,
    inclination: 0.041,
    longitudeOfAscendingNode: 0.0,
    argumentOfPerihelion: 0.0,
    meanAnomalyAtEpoch: 0.0,
    orbitalPeriod: 0.00693,
  },
  physical: {
    radius: 578.9,
    mass: 0.00135,
    rotationPeriod: 60.489,
    axialTilt: 0.0,
  },
  display: {
    color: '#D8D8D8',
    description: 'Ariel is the fourth-largest moon of Uranus, known for its bright surface and complex terrain.',
    category: 'moon',
  },
};

export const TITANIA: CelestialBody = {
  id: 'titania',
  name: 'Titania',
  parentId: 'uranus',
  orbital: {
    semiMajorAxis: 0.002916,
    eccentricity: 0.0011,
    inclination: 0.079,
    longitudeOfAscendingNode: 0.0,
    argumentOfPerihelion: 0.0,
    meanAnomalyAtEpoch: 0.0,
    orbitalPeriod: 0.02388,
  },
  physical: {
    radius: 788.4,
    mass: 0.00352,
    rotationPeriod: 208.941,
    axialTilt: 0.0,
  },
  display: {
    color: '#C8C8C8',
    description: 'Titania is the largest moon of Uranus and the eighth-largest moon in the Solar System.',
    category: 'moon',
  },
};

export const PHOBOS: CelestialBody = {
  id: 'phobos',
  name: 'Phobos',
  parentId: 'mars',
  orbital: {
    semiMajorAxis: 0.0000627,
    eccentricity: 0.0151,
    inclination: 1.093,
    longitudeOfAscendingNode: 0.0,
    argumentOfPerihelion: 0.0,
    meanAnomalyAtEpoch: 0.0,
    orbitalPeriod: 0.000875,
  },
  physical: {
    radius: 11.267,
    mass: 0.0000000106,
    rotationPeriod: 7.654,
    axialTilt: 0.0,
  },
  display: {
    color: '#8B7355',
    description: 'Phobos is the larger and closer of Mars\'s two moons.',
    category: 'moon',
  },
};

export const DEIMOS: CelestialBody = {
  id: 'deimos',
  name: 'Deimos',
  parentId: 'mars',
  orbital: {
    semiMajorAxis: 0.000157,
    eccentricity: 0.00033,
    inclination: 0.93,
    longitudeOfAscendingNode: 0.0,
    argumentOfPerihelion: 0.0,
    meanAnomalyAtEpoch: 0.0,
    orbitalPeriod: 0.00345,
  },
  physical: {
    radius: 6.2,
    mass: 0.00000000148,
    rotationPeriod: 30.312,
    axialTilt: 0.0,
  },
  display: {
    color: '#A09070',
    description: 'Deimos is the smaller and outermost of Mars\'s two moons.',
    category: 'moon',
  },
};

// ─── NAMED ASTEROIDS ────────────────────────────────────────────────────────────

export const ASTEROID_2026_BE7: CelestialBody = {
  id: 'asteroid-2026-be7',
  name: '2026 BE7',
  orbital: {
    semiMajorAxis: 1.15,
    eccentricity: 0.22,
    inclination: 4.5,
    longitudeOfAscendingNode: 120.0,
    argumentOfPerihelion: 200.0,
    meanAnomalyAtEpoch: 45.0,
    orbitalPeriod: 1.23,
  },
  physical: {
    radius: 0.025,
    mass: 0.0000000001,
    rotationPeriod: 6.0,
    axialTilt: 0,
  },
  display: {
    color: '#FF6B6B',
    description: '2026 BE7 is a near-Earth asteroid discovered in 2026. It makes periodic close approaches to Earth.',
    category: 'asteroid',
  },
};

export const ASTEROID_2026_BX4: CelestialBody = {
  id: 'asteroid-2026-bx4',
  name: '2026 BX4',
  orbital: {
    semiMajorAxis: 1.32,
    eccentricity: 0.30,
    inclination: 6.2,
    longitudeOfAscendingNode: 85.0,
    argumentOfPerihelion: 155.0,
    meanAnomalyAtEpoch: 120.0,
    orbitalPeriod: 1.52,
  },
  physical: {
    radius: 0.015,
    mass: 0.0000000001,
    rotationPeriod: 4.2,
    axialTilt: 0,
  },
  display: {
    color: '#FFA94D',
    description: '2026 BX4 is a small near-Earth asteroid with an orbit that brings it close to Earth periodically.',
    category: 'asteroid',
  },
};

export const ASTEROID_2026_BQ8: CelestialBody = {
  id: 'asteroid-2026-bq8',
  name: '2026 BQ8',
  orbital: {
    semiMajorAxis: 1.08,
    eccentricity: 0.18,
    inclination: 2.8,
    longitudeOfAscendingNode: 200.0,
    argumentOfPerihelion: 310.0,
    meanAnomalyAtEpoch: 80.0,
    orbitalPeriod: 1.12,
  },
  physical: {
    radius: 0.030,
    mass: 0.0000000001,
    rotationPeriod: 8.5,
    axialTilt: 0,
  },
  display: {
    color: '#FFD43B',
    description: '2026 BQ8 is a near-Earth asteroid discovered in early 2026 with a relatively short orbital period.',
    category: 'asteroid',
  },
};

export const ASTEROID_2026_AJ17: CelestialBody = {
  id: 'asteroid-2026-aj17',
  name: '2026 AJ17',
  orbital: {
    semiMajorAxis: 1.22,
    eccentricity: 0.25,
    inclination: 5.1,
    longitudeOfAscendingNode: 145.0,
    argumentOfPerihelion: 275.0,
    meanAnomalyAtEpoch: 95.0,
    orbitalPeriod: 1.35,
  },
  physical: {
    radius: 0.017,
    mass: 0.0000000001,
    rotationPeriod: 5.8,
    axialTilt: 0,
  },
  display: {
    color: '#8CE99A',
    description: '2026 AJ17 is a near-Earth asteroid making a close approach in February 2026.',
    category: 'asteroid',
  },
};

export const ASTEROID_2026_CU: CelestialBody = {
  id: 'asteroid-2026-cu',
  name: '2026 CU',
  orbital: {
    semiMajorAxis: 1.05,
    eccentricity: 0.15,
    inclination: 3.4,
    longitudeOfAscendingNode: 168.0,
    argumentOfPerihelion: 240.0,
    meanAnomalyAtEpoch: 60.0,
    orbitalPeriod: 1.08,
  },
  physical: {
    radius: 0.013,
    mass: 0.0000000001,
    rotationPeriod: 3.6,
    axialTilt: 0,
  },
  display: {
    color: '#74C0FC',
    description: '2026 CU is a small near-Earth asteroid discovered in 2026 with a very close approach trajectory.',
    category: 'asteroid',
  },
};

export const OSIRIS_APEX: CelestialBody = {
  id: 'osiris-apex',
  name: 'OSIRIS-APEX',
  orbital: {
    semiMajorAxis: 0.922,
    eccentricity: 0.191,
    inclination: 3.33,
    longitudeOfAscendingNode: 204.43,
    argumentOfPerihelion: 126.37,
    meanAnomalyAtEpoch: 270.0,
    orbitalPeriod: 0.886,
  },
  physical: {
    radius: 0.180,
    mass: 0.0000000001,
    rotationPeriod: 4.3,
    axialTilt: 0,
  },
  display: {
    color: '#69DB7C',
    description: 'OSIRIS-APEX (formerly OSIRIS-REx) is targeting asteroid Apophis for a close encounter. The spacecraft will study the asteroid during its 2029 Earth flyby.',
    category: 'asteroid',
  },
};

export const APOPHIS: CelestialBody = {
  id: 'apophis',
  name: 'Apophis',
  orbital: {
    semiMajorAxis: 0.9224,
    eccentricity: 0.1911,
    inclination: 3.331,
    longitudeOfAscendingNode: 204.43,
    argumentOfPerihelion: 126.37,
    meanAnomalyAtEpoch: 215.54,
    orbitalPeriod: 0.886,
  },
  physical: {
    radius: 0.185,
    mass: 0.000000027,
    rotationPeriod: 30.4,
    axialTilt: 0,
  },
  display: {
    color: '#FF4444',
    description: 'Apophis (99942) is a near-Earth asteroid that will pass extremely close to Earth on April 13, 2029 — within 31,000 km, closer than geostationary satellites.',
    category: 'asteroid',
  },
};

export const EROS: CelestialBody = {
  id: 'eros',
  name: 'Eros',
  orbital: {
    semiMajorAxis: 1.458,
    eccentricity: 0.2226,
    inclination: 10.829,
    longitudeOfAscendingNode: 304.32,
    argumentOfPerihelion: 178.82,
    meanAnomalyAtEpoch: 208.12,
    orbitalPeriod: 1.76,
  },
  physical: {
    radius: 8.42,
    mass: 0.0000067,
    rotationPeriod: 5.27,
    axialTilt: 0,
  },
  display: {
    color: '#E8A838',
    description: 'Eros (433) is the second-largest near-Earth asteroid. It was the first asteroid to be orbited by a spacecraft (NEAR Shoemaker, 2000).',
    category: 'asteroid',
  },
};

export const GASPRA: CelestialBody = {
  id: 'gaspra',
  name: 'Gaspra',
  orbital: {
    semiMajorAxis: 2.2096,
    eccentricity: 0.1734,
    inclination: 4.102,
    longitudeOfAscendingNode: 253.16,
    argumentOfPerihelion: 132.43,
    meanAnomalyAtEpoch: 293.66,
    orbitalPeriod: 3.29,
  },
  physical: {
    radius: 6.1,
    mass: 0.00000001,
    rotationPeriod: 7.042,
    axialTilt: 0,
  },
  display: {
    color: '#A8A060',
    description: 'Gaspra (951) was the first asteroid to be closely visited by a spacecraft when Galileo flew by it in 1991.',
    category: 'asteroid',
  },
};

export const IDA: CelestialBody = {
  id: 'ida',
  name: 'Ida',
  orbital: {
    semiMajorAxis: 2.8616,
    eccentricity: 0.0412,
    inclination: 1.138,
    longitudeOfAscendingNode: 324.02,
    argumentOfPerihelion: 113.0,
    meanAnomalyAtEpoch: 55.88,
    orbitalPeriod: 4.84,
  },
  physical: {
    radius: 15.7,
    mass: 0.00004,
    rotationPeriod: 4.634,
    axialTilt: 0,
  },
  display: {
    color: '#B8A878',
    description: 'Ida (243) is an asteroid in the main belt. The Galileo spacecraft discovered its tiny moon Dactyl during a flyby in 1993.',
    category: 'asteroid',
  },
};

export const DINKINESH: CelestialBody = {
  id: 'dinkinesh',
  name: 'Dinkinesh',
  orbital: {
    semiMajorAxis: 2.1924,
    eccentricity: 0.1134,
    inclination: 2.077,
    longitudeOfAscendingNode: 10.64,
    argumentOfPerihelion: 290.61,
    meanAnomalyAtEpoch: 176.0,
    orbitalPeriod: 3.25,
  },
  physical: {
    radius: 0.39,
    mass: 0.0000000001,
    rotationPeriod: 3.73,
    axialTilt: 0,
  },
  display: {
    color: '#70C4D8',
    description: 'Dinkinesh (152830) was visited by NASA\'s Lucy spacecraft in November 2023, revealing it to be a contact binary with its own moonlet.',
    category: 'asteroid',
  },
};

export const RYUGU: CelestialBody = {
  id: 'ryugu',
  name: 'Ryugu',
  orbital: {
    semiMajorAxis: 1.1896,
    eccentricity: 0.1903,
    inclination: 5.884,
    longitudeOfAscendingNode: 251.62,
    argumentOfPerihelion: 211.43,
    meanAnomalyAtEpoch: 315.85,
    orbitalPeriod: 1.30,
  },
  physical: {
    radius: 0.45,
    mass: 0.00000045,
    rotationPeriod: 7.627,
    axialTilt: 0,
  },
  display: {
    color: '#4DABF7',
    description: 'Ryugu (162173) is a near-Earth asteroid visited by JAXA\'s Hayabusa2 mission, which returned samples to Earth in December 2020.',
    category: 'asteroid',
  },
};

// ─── ADDITIONAL NAMED ASTEROIDS (matching Astrolens Eyes on Asteroids) ────────────

export const VESTA: CelestialBody = {
  id: 'vesta',
  name: 'Vesta',
  orbital: {
    semiMajorAxis: 2.3615,
    eccentricity: 0.0887,
    inclination: 7.134,
    longitudeOfAscendingNode: 103.85,
    argumentOfPerihelion: 149.83,
    meanAnomalyAtEpoch: 20.86,
    orbitalPeriod: 3.63,
  },
  physical: { radius: 262.7, mass: 0.00013, rotationPeriod: 5.342, axialTilt: 29 },
  display: { color: '#C4A882', description: 'Vesta (4) is the second-largest asteroid in the main belt, visited by NASA\'s Dawn spacecraft in 2011-2012.', category: 'asteroid' },
};

export const CERES: CelestialBody = {
  id: 'ceres',
  name: 'Ceres',
  orbital: {
    semiMajorAxis: 2.7675,
    eccentricity: 0.0758,
    inclination: 10.594,
    longitudeOfAscendingNode: 80.393,
    argumentOfPerihelion: 73.115,
    meanAnomalyAtEpoch: 77.37,
    orbitalPeriod: 4.60,
  },
  physical: { radius: 469.73, mass: 0.00047, rotationPeriod: 9.074, axialTilt: 4 },
  display: { color: '#8899AA', description: 'Ceres (1) is the largest object in the asteroid belt and the only dwarf planet in the inner solar system, visited by Dawn in 2015.', category: 'asteroid' },
};

export const ITOKAWA: CelestialBody = {
  id: 'itokawa',
  name: 'Itokawa',
  orbital: {
    semiMajorAxis: 1.3241,
    eccentricity: 0.2802,
    inclination: 1.622,
    longitudeOfAscendingNode: 69.095,
    argumentOfPerihelion: 162.76,
    meanAnomalyAtEpoch: 310.0,
    orbitalPeriod: 1.52,
  },
  physical: { radius: 0.165, mass: 0.0000000004, rotationPeriod: 12.132, axialTilt: 0 },
  display: { color: '#D4B896', description: 'Itokawa (25143) was visited by JAXA\'s Hayabusa mission, the first to return asteroid samples to Earth in 2010.', category: 'asteroid' },
};

export const BENNU: CelestialBody = {
  id: 'bennu',
  name: 'Bennu',
  orbital: {
    semiMajorAxis: 1.1264,
    eccentricity: 0.2037,
    inclination: 6.035,
    longitudeOfAscendingNode: 2.060,
    argumentOfPerihelion: 66.223,
    meanAnomalyAtEpoch: 101.70,
    orbitalPeriod: 1.20,
  },
  physical: { radius: 0.2625, mass: 0.000000073, rotationPeriod: 4.296, axialTilt: 0 },
  display: { color: '#7AB8D4', description: 'Bennu (101955) is the target of NASA\'s OSIRIS-REx mission, which returned samples in September 2023.', category: 'asteroid' },
};

export const PSYCHE: CelestialBody = {
  id: 'psyche',
  name: 'Psyche',
  orbital: {
    semiMajorAxis: 2.9212,
    eccentricity: 0.1339,
    inclination: 3.095,
    longitudeOfAscendingNode: 150.19,
    argumentOfPerihelion: 228.05,
    meanAnomalyAtEpoch: 152.0,
    orbitalPeriod: 4.99,
  },
  physical: { radius: 113, mass: 0.000012, rotationPeriod: 4.196, axialTilt: 0 },
  display: { color: '#B0B8C4', description: 'Psyche (16) is a metal-rich asteroid that NASA\'s Psyche spacecraft is en route to study, arriving in 2029.', category: 'asteroid' },
};

export const DIDYMOS: CelestialBody = {
  id: 'didymos',
  name: 'Didymos',
  orbital: {
    semiMajorAxis: 1.6444,
    eccentricity: 0.3840,
    inclination: 3.408,
    longitudeOfAscendingNode: 73.21,
    argumentOfPerihelion: 319.32,
    meanAnomalyAtEpoch: 182.0,
    orbitalPeriod: 2.11,
  },
  physical: { radius: 0.39, mass: 0.00000000053, rotationPeriod: 2.26, axialTilt: 0 },
  display: { color: '#E0C880', description: 'Didymos is a binary near-Earth asteroid. NASA\'s DART mission impacted its moonlet Dimorphos in 2022 to test planetary defense.', category: 'asteroid' },
};

export const ANNEFRANK: CelestialBody = {
  id: 'annefrank',
  name: 'Annefrank',
  orbital: {
    semiMajorAxis: 2.2125,
    eccentricity: 0.2282,
    inclination: 4.249,
    longitudeOfAscendingNode: 47.15,
    argumentOfPerihelion: 356.08,
    meanAnomalyAtEpoch: 115.0,
    orbitalPeriod: 3.29,
  },
  physical: { radius: 3.4, mass: 0.000000001, rotationPeriod: 15.0, axialTilt: 0 },
  display: { color: '#AA9988', description: 'Annefrank (5535) was an asteroid flyby target for the Stardust spacecraft in 2002.', category: 'asteroid' },
};

export const BRAILLE: CelestialBody = {
  id: 'braille',
  name: 'Braille',
  orbital: {
    semiMajorAxis: 2.3417,
    eccentricity: 0.4327,
    inclination: 28.97,
    longitudeOfAscendingNode: 241.90,
    argumentOfPerihelion: 356.62,
    meanAnomalyAtEpoch: 46.0,
    orbitalPeriod: 3.58,
  },
  physical: { radius: 0.8, mass: 0.0000000001, rotationPeriod: 226.4, axialTilt: 0 },
  display: { color: '#9090A0', description: 'Braille (9969) was visited by Deep Space 1 in 1999, one of the first asteroid flybys.', category: 'asteroid' },
};

export const MATHILDE: CelestialBody = {
  id: 'mathilde',
  name: 'Mathilde',
  orbital: {
    semiMajorAxis: 2.6461,
    eccentricity: 0.2664,
    inclination: 6.710,
    longitudeOfAscendingNode: 179.58,
    argumentOfPerihelion: 157.36,
    meanAnomalyAtEpoch: 219.3,
    orbitalPeriod: 4.31,
  },
  physical: { radius: 26.4, mass: 0.0000052, rotationPeriod: 417.7, axialTilt: 0 },
  display: { color: '#7A7A88', description: 'Mathilde (253) is a main-belt asteroid visited by NEAR Shoemaker in 1997, revealing large impact craters.', category: 'asteroid' },
};

export const BORRELLY: CelestialBody = {
  id: 'borrelly',
  name: 'Borrelly',
  orbital: {
    semiMajorAxis: 3.6107,
    eccentricity: 0.6231,
    inclination: 30.323,
    longitudeOfAscendingNode: 75.43,
    argumentOfPerihelion: 353.35,
    meanAnomalyAtEpoch: 30.0,
    orbitalPeriod: 6.86,
  },
  physical: { radius: 4.0, mass: 0.000000002, rotationPeriod: 25.0, axialTilt: 0 },
  display: { color: '#6688AA', description: 'Borrelly (19P) is a comet visited by Deep Space 1 in 2001, revealing a dark, bowling-pin-shaped nucleus.', category: 'asteroid' },
};

export const CHURYUMOV_GERASIMENKO: CelestialBody = {
  id: '67p',
  name: '67P/Churyumov-Gerasimenko',
  orbital: {
    semiMajorAxis: 3.4630,
    eccentricity: 0.6410,
    inclination: 7.040,
    longitudeOfAscendingNode: 50.15,
    argumentOfPerihelion: 12.78,
    meanAnomalyAtEpoch: 50.0,
    orbitalPeriod: 6.44,
  },
  physical: { radius: 2.0, mass: 0.00000001, rotationPeriod: 12.4, axialTilt: 0 },
  display: { color: '#5577AA', description: '67P/Churyumov-Gerasimenko is the comet visited by ESA\'s Rosetta mission, which deployed the Philae lander in 2014.', category: 'asteroid' },
};

export const HARTLEY2: CelestialBody = {
  id: 'hartley2',
  name: 'Hartley 2',
  orbital: {
    semiMajorAxis: 3.4713,
    eccentricity: 0.6950,
    inclination: 13.617,
    longitudeOfAscendingNode: 219.76,
    argumentOfPerihelion: 181.22,
    meanAnomalyAtEpoch: 120.0,
    orbitalPeriod: 6.46,
  },
  physical: { radius: 0.57, mass: 0.0000000001, rotationPeriod: 18.0, axialTilt: 0 },
  display: { color: '#4488BB', description: 'Hartley 2 (103P) is a comet visited by NASA\'s EPOXI mission in 2010, revealing CO2-driven jets.', category: 'asteroid' },
};

export const EURYBATES: CelestialBody = {
  id: 'eurybates',
  name: 'Eurybates',
  orbital: {
    semiMajorAxis: 5.1911,
    eccentricity: 0.0908,
    inclination: 7.997,
    longitudeOfAscendingNode: 43.58,
    argumentOfPerihelion: 39.55,
    meanAnomalyAtEpoch: 340.0,
    orbitalPeriod: 11.83,
  },
  physical: { radius: 32.0, mass: 0.0000001, rotationPeriod: 8.7, axialTilt: 0 },
  display: { color: '#99AACC', description: 'Eurybates (3548) is a Jupiter Trojan asteroid and future target of NASA\'s Lucy mission.', category: 'asteroid' },
};

export const LEUCUS: CelestialBody = {
  id: 'leucus',
  name: 'Leucus',
  orbital: {
    semiMajorAxis: 5.2900,
    eccentricity: 0.0632,
    inclination: 11.48,
    longitudeOfAscendingNode: 213.54,
    argumentOfPerihelion: 102.73,
    meanAnomalyAtEpoch: 260.0,
    orbitalPeriod: 12.17,
  },
  physical: { radius: 20.0, mass: 0.00000001, rotationPeriod: 445.7, axialTilt: 0 },
  display: { color: '#8899BB', description: 'Leucus (11351) is a Jupiter Trojan asteroid and target of NASA\'s Lucy mission.', category: 'asteroid' },
};

export const ORUS: CelestialBody = {
  id: 'orus',
  name: 'Orus',
  orbital: {
    semiMajorAxis: 5.2280,
    eccentricity: 0.0570,
    inclination: 8.48,
    longitudeOfAscendingNode: 74.97,
    argumentOfPerihelion: 198.84,
    meanAnomalyAtEpoch: 200.0,
    orbitalPeriod: 11.95,
  },
  physical: { radius: 25.5, mass: 0.00000002, rotationPeriod: 13.5, axialTilt: 0 },
  display: { color: '#7788AA', description: 'Orus (21900) is a Jupiter Trojan asteroid and target of NASA\'s Lucy mission.', category: 'asteroid' },
};

export const TEMPEL1: CelestialBody = {
  id: 'tempel1',
  name: 'Tempel 1',
  orbital: {
    semiMajorAxis: 3.1383,
    eccentricity: 0.5121,
    inclination: 10.474,
    longitudeOfAscendingNode: 68.93,
    argumentOfPerihelion: 178.93,
    meanAnomalyAtEpoch: 200.0,
    orbitalPeriod: 5.56,
  },
  physical: { radius: 3.0, mass: 0.0000001, rotationPeriod: 40.7, axialTilt: 0 },
  display: { color: '#6699BB', description: 'Tempel 1 (9P) is a comet famously impacted by NASA\'s Deep Impact mission in 2005 to study its interior.', category: 'asteroid' },
};

export const PSYCHE16: CelestialBody = {
  id: '16psyche',
  name: '16 Psyche',
  orbital: {
    semiMajorAxis: 2.9230,
    eccentricity: 0.1340,
    inclination: 3.096,
    longitudeOfAscendingNode: 150.20,
    argumentOfPerihelion: 228.10,
    meanAnomalyAtEpoch: 155.0,
    orbitalPeriod: 5.00,
  },
  physical: { radius: 113, mass: 0.000012, rotationPeriod: 4.196, axialTilt: 0 },
  display: { color: '#A8B0C0', description: '16 Psyche is one of the most massive asteroids, thought to be the exposed core of a protoplanet. Target of NASA\'s Psyche mission.', category: 'asteroid' },
};

// ─── COLLECTIONS ────────────────────────────────────────────────────────────────

export const PLANETS: CelestialBody[] = [
  MERCURY, VENUS, EARTH, MARS, JUPITER, SATURN, URANUS, NEPTUNE,
];

export const INNER_PLANETS: CelestialBody[] = [
  MERCURY, VENUS, EARTH, MARS,
];

export const MOONS: CelestialBody[] = [
  MOON, IO, EUROPA, GANYMEDE, CALLISTO, TITAN, ENCELADUS, TRITON,
  MIRANDA, ARIEL, TITANIA, PHOBOS, DEIMOS,
];

export const NAMED_ASTEROIDS: CelestialBody[] = [
  ASTEROID_2026_BE7, ASTEROID_2026_BX4, ASTEROID_2026_BQ8,
  ASTEROID_2026_AJ17, ASTEROID_2026_CU,
  OSIRIS_APEX, APOPHIS, EROS, GASPRA, IDA, DINKINESH, RYUGU,
  VESTA, CERES, ITOKAWA, BENNU, PSYCHE, DIDYMOS, ANNEFRANK,
  BRAILLE, MATHILDE, BORRELLY, CHURYUMOV_GERASIMENKO, HARTLEY2,
  EURYBATES, LEUCUS, ORUS, TEMPEL1, PSYCHE16,
];

export const ALL_BODIES: CelestialBody[] = [SUN, ...PLANETS, ...MOONS, ...NAMED_ASTEROIDS];

/**
 * Look up any celestial body by its ID.
 */
export const BODY_MAP: Record<string, CelestialBody> = {};
ALL_BODIES.forEach((b) => {
  BODY_MAP[b.id] = b;
});

/**
 * Asteroid belt configuration.
 * Asteroids are distributed between Mars and Jupiter.
 */
export const ASTEROID_BELT = {
  count: 2500,
  minRadius: 2.1,     // AU — inner edge
  maxRadius: 3.3,     // AU — outer edge
  maxInclination: 20,  // degrees
  maxEccentricity: 0.3,
  particleSize: 0.08,
  color: '#887766',
};

/**
 * Simulated close approach data for the asteroid watch sidebar.
 */
export interface CloseApproach {
  asteroidId: string;
  asteroidName: string;
  date: string;
  time: string;
  distanceKm: number;
  estimatedSizeM: number;
  isHazardous: boolean;
}

export const CLOSE_APPROACHES: CloseApproach[] = [
  { asteroidId: 'asteroid-2026-bx4', asteroidName: '2026 BX4', date: '2026-02-16', time: '9:06:26 PM', distanceKm: 2_941_523, estimatedSizeM: 223.1, isHazardous: false },
  { asteroidId: 'asteroid-2026-aj17', asteroidName: '2026 AJ17', date: '2026-02-18', time: '2:58:26 AM', distanceKm: 6_659_369, estimatedSizeM: 33.1, isHazardous: false },
  { asteroidId: 'asteroid-2026-cu', asteroidName: '2026 CU', date: '2026-02-18', time: '10:06:10 PM', distanceKm: 2_075_021, estimatedSizeM: 25.8, isHazardous: false },
  { asteroidId: 'asteroid-2026-be7', asteroidName: '2026 BE7', date: '2026-02-20', time: '4:22:00 AM', distanceKm: 1_200_000, estimatedSizeM: 50.0, isHazardous: false },
  { asteroidId: 'asteroid-2026-bq8', asteroidName: '2026 BQ8', date: '2026-02-25', time: '11:30:45 AM', distanceKm: 5_800_000, estimatedSizeM: 60.0, isHazardous: false },
];
