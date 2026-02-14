/**
 * planetShaders.ts
 *
 * Procedural GLSL shaders for realistic planet rendering.
 * Each planet gets a unique shader that generates surface details
 * using 3D Simplex noise functions.
 *
 * This avoids the need for external texture files while creating
 * visually rich, realistic planet surfaces.
 */

// ─── SHARED GLSL NOISE FUNCTIONS ────────────────────────────────────────────
// 3D Simplex noise by Ashima Arts (MIT License)
export const NOISE_GLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Fractal Brownian Motion — layered noise for natural-looking detail
  float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
`;

// ─── SHARED VERTEX SHADER ───────────────────────────────────────────────────
export const PLANET_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ─── EARTH SHADER ───────────────────────────────────────────────────────────
// Generates continents (green/brown), oceans (blue), ice caps, and cloud patterns
export const EARTH_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    // Lighting
    vec3 lightDir = normalize(lightDirection);
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.08;
    float diffuse = NdotL;

    // Surface noise for continents
    vec3 noisePos = vPosition * 2.5;
    float continent = fbm(noisePos, 6);

    // Ice caps near poles
    float latitude = abs(vPosition.y) / length(vPosition);
    float iceCap = smoothstep(0.75, 0.9, latitude);

    // Ocean vs land threshold
    float landMask = smoothstep(-0.05, 0.08, continent);

    // Land colors — varied greens, browns, and tans
    vec3 forestGreen = vec3(0.15, 0.42, 0.15);
    vec3 grassGreen = vec3(0.28, 0.55, 0.18);
    vec3 desert = vec3(0.72, 0.62, 0.38);
    vec3 mountain = vec3(0.45, 0.40, 0.35);

    // Blend land types based on secondary noise
    float landType = fbm(noisePos * 3.0 + 10.0, 4);
    float elevation = fbm(noisePos * 1.5 + 5.0, 5);
    vec3 landColor = mix(forestGreen, grassGreen, smoothstep(-0.2, 0.3, landType));
    landColor = mix(landColor, desert, smoothstep(0.2, 0.6, landType + latitude * 0.5));
    landColor = mix(landColor, mountain, smoothstep(0.15, 0.4, elevation));

    // Ocean colors — deep blue to shallow cyan
    vec3 deepOcean = vec3(0.02, 0.10, 0.35);
    vec3 shallowOcean = vec3(0.08, 0.30, 0.55);
    float oceanDepth = smoothstep(-0.4, 0.0, continent);
    vec3 oceanColor = mix(deepOcean, shallowOcean, oceanDepth);

    // Specular highlight on water
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 halfVec = normalize(lightDir + viewDir);
    float specular = pow(max(dot(vNormal, halfVec), 0.0), 40.0) * (1.0 - landMask) * 0.5;

    // Combine land and ocean
    vec3 surfaceColor = mix(oceanColor, landColor, landMask);

    // Ice caps
    surfaceColor = mix(surfaceColor, vec3(0.92, 0.95, 0.98), iceCap);

    // Cloud layer — offset noise for cloud movement
    float clouds = fbm(vPosition * 3.5 + vec3(time * 0.02, 0.0, time * 0.01), 5);
    clouds = smoothstep(0.05, 0.45, clouds) * 0.65;
    surfaceColor = mix(surfaceColor, vec3(1.0), clouds);

    // Final lighting
    vec3 finalColor = surfaceColor * (ambient + diffuse) + vec3(specular);

    // Slight rim light for atmosphere
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    rim = pow(rim, 3.0);
    finalColor += vec3(0.25, 0.45, 0.85) * rim * 0.25;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── MARS SHADER ────────────────────────────────────────────────────────────
// Red-orange surface with craters, darker regions, and polar ice caps
export const MARS_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.06;

    vec3 noisePos = vPosition * 3.0;

    // Base terrain
    float terrain = fbm(noisePos, 6);
    float detail = fbm(noisePos * 8.0 + 20.0, 4);

    // Color palette
    vec3 rustRed = vec3(0.72, 0.28, 0.12);
    vec3 darkRed = vec3(0.42, 0.15, 0.08);
    vec3 sandOrange = vec3(0.82, 0.55, 0.30);
    vec3 darkRegion = vec3(0.30, 0.18, 0.12);

    // Blend terrain types
    vec3 surfaceColor = mix(rustRed, sandOrange, smoothstep(-0.2, 0.4, terrain));
    surfaceColor = mix(surfaceColor, darkRegion, smoothstep(0.1, 0.5, detail) * 0.5);
    surfaceColor = mix(surfaceColor, darkRed, smoothstep(-0.3, -0.1, terrain) * 0.4);

    // Craters — use absolute noise for round depressions
    float craterNoise = abs(snoise(noisePos * 6.0));
    float crater = smoothstep(0.02, 0.08, craterNoise);
    surfaceColor *= 0.85 + crater * 0.15;

    // Polar ice caps
    float latitude = abs(vPosition.y) / length(vPosition);
    float polarIce = smoothstep(0.82, 0.95, latitude);
    surfaceColor = mix(surfaceColor, vec3(0.88, 0.85, 0.82), polarIce);

    // Dust atmosphere tint
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    rim = pow(rim, 2.5);

    vec3 finalColor = surfaceColor * (ambient + NdotL);
    finalColor += vec3(0.75, 0.35, 0.15) * rim * 0.15;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── JUPITER SHADER ─────────────────────────────────────────────────────────
// Horizontal bands of cream, orange, brown, and the Great Red Spot
export const JUPITER_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.08;

    // Latitude-based bands — characteristic of Jupiter
    float lat = vPosition.y / length(vPosition);
    float bandFreq = lat * 12.0;
    float band = sin(bandFreq * 3.14159) * 0.5 + 0.5;

    // Add turbulence to the bands
    float turbulence = snoise(vec3(vPosition.x * 5.0, vPosition.y * 2.0, vPosition.z * 5.0 + time * 0.005)) * 0.15;
    band += turbulence;

    // Color palette for bands
    vec3 lightBand = vec3(0.90, 0.82, 0.65);   // cream
    vec3 darkBand = vec3(0.72, 0.48, 0.25);    // brown-orange
    vec3 redBand = vec3(0.75, 0.35, 0.18);     // reddish
    vec3 whiteBand = vec3(0.92, 0.88, 0.80);   // pale

    vec3 bandColor = mix(darkBand, lightBand, smoothstep(0.3, 0.7, band));
    
    // Some bands are redder
    float redMask = smoothstep(0.6, 0.8, sin(bandFreq * 1.5 + 2.0) * 0.5 + 0.5);
    bandColor = mix(bandColor, redBand, redMask * 0.4);

    // Great Red Spot — approximate position
    float spotLat = lat + 0.22;
    float spotLon = atan(vPosition.z, vPosition.x) + time * 0.01;
    float spotDist = length(vec2(spotLat * 6.0, sin(spotLon) * 1.5));
    float spot = 1.0 - smoothstep(0.0, 0.8, spotDist);
    
    // Swirling pattern inside the spot
    float swirl = snoise(vec3(spotLat * 15.0, spotLon * 8.0 + time * 0.02, 0.0));
    vec3 spotColor = mix(vec3(0.78, 0.30, 0.15), vec3(0.85, 0.45, 0.20), swirl * 0.5 + 0.5);
    bandColor = mix(bandColor, spotColor, spot * 0.7);

    // Atmospheric detail
    float detail = fbm(vPosition * 8.0, 3) * 0.08;
    bandColor += detail;

    vec3 finalColor = bandColor * (ambient + NdotL);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── SATURN SHADER ──────────────────────────────────────────────────────────
// Pale gold bands, subtler than Jupiter
export const SATURN_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.07;

    float lat = vPosition.y / length(vPosition);
    float band = sin(lat * 18.0) * 0.5 + 0.5;
    float turbulence = snoise(vec3(vPosition.x * 4.0, vPosition.y * 2.0, vPosition.z * 4.0)) * 0.1;
    band += turbulence;

    vec3 lightGold = vec3(0.90, 0.82, 0.58);
    vec3 darkGold = vec3(0.72, 0.62, 0.38);
    vec3 paleYellow = vec3(0.88, 0.85, 0.72);

    vec3 surfaceColor = mix(darkGold, lightGold, smoothstep(0.3, 0.7, band));
    surfaceColor = mix(surfaceColor, paleYellow, smoothstep(0.65, 0.85, band) * 0.3);

    float detail = fbm(vPosition * 6.0, 3) * 0.05;
    surfaceColor += detail;

    vec3 finalColor = surfaceColor * (ambient + NdotL);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── VENUS SHADER ───────────────────────────────────────────────────────────
// Thick cloudy atmosphere — swirling yellowed clouds
export const VENUS_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.10;

    // Thick swirling cloud cover
    vec3 cloudPos = vPosition * 2.5 + vec3(time * 0.008, time * 0.003, 0.0);
    float cloud1 = fbm(cloudPos, 6);
    float cloud2 = fbm(cloudPos * 2.0 + 5.0, 4);

    vec3 paleYellow = vec3(0.88, 0.78, 0.48);
    vec3 darkOrange = vec3(0.72, 0.52, 0.28);
    vec3 cream = vec3(0.92, 0.86, 0.68);

    vec3 surfaceColor = mix(darkOrange, paleYellow, smoothstep(-0.3, 0.3, cloud1));
    surfaceColor = mix(surfaceColor, cream, smoothstep(0.0, 0.5, cloud2) * 0.3);

    // Slight banding
    float lat = vPosition.y / length(vPosition);
    float banding = sin(lat * 8.0) * 0.03;
    surfaceColor += banding;

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    rim = pow(rim, 2.0);

    vec3 finalColor = surfaceColor * (ambient + NdotL);
    finalColor += vec3(0.85, 0.65, 0.30) * rim * 0.2;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── MERCURY SHADER ─────────────────────────────────────────────────────────
// Heavily cratered gray surface like the Moon
export const MERCURY_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.04;

    vec3 noisePos = vPosition * 4.0;

    // Rocky terrain
    float terrain = fbm(noisePos, 6);
    float fineDetail = fbm(noisePos * 12.0, 4);

    // Crater noise
    float craterNoise = abs(snoise(noisePos * 5.0));
    float crater2 = abs(snoise(noisePos * 12.0));
    float craters = smoothstep(0.02, 0.1, craterNoise) * smoothstep(0.03, 0.12, crater2);

    vec3 lightGray = vec3(0.58, 0.55, 0.50);
    vec3 darkGray = vec3(0.32, 0.30, 0.28);
    vec3 brownGray = vec3(0.45, 0.40, 0.35);

    vec3 surfaceColor = mix(darkGray, lightGray, smoothstep(-0.3, 0.3, terrain));
    surfaceColor = mix(surfaceColor, brownGray, smoothstep(-0.1, 0.2, fineDetail) * 0.3);
    surfaceColor *= 0.8 + craters * 0.2;

    vec3 finalColor = surfaceColor * (ambient + NdotL);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── NEPTUNE / URANUS SHADER ────────────────────────────────────────────────
// Ice giant — smooth blue/cyan with subtle banding and storms
export const ICE_GIANT_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;
  uniform vec3 baseColor;
  uniform vec3 bandColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.06;

    float lat = vPosition.y / length(vPosition);

    // Subtle banding
    float band = sin(lat * 10.0) * 0.5 + 0.5;
    float turbulence = snoise(vec3(vPosition.x * 3.0, vPosition.y * 1.5, vPosition.z * 3.0 + time * 0.003)) * 0.1;
    band += turbulence;

    vec3 surfaceColor = mix(baseColor * 0.7, baseColor, smoothstep(0.3, 0.7, band));
    surfaceColor = mix(surfaceColor, bandColor, smoothstep(0.6, 0.9, band) * 0.2);

    // Storm features
    float storm = snoise(vPosition * 5.0 + vec3(0.0, 0.0, time * 0.01));
    float stormMask = smoothstep(0.5, 0.8, storm);
    surfaceColor = mix(surfaceColor, baseColor * 1.3, stormMask * 0.15);

    // Slight haze rim
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    rim = pow(rim, 2.5);

    vec3 finalColor = surfaceColor * (ambient + NdotL);
    finalColor += baseColor * rim * 0.12;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── MOON SHADER ────────────────────────────────────────────────────────────
// Gray cratered surface
export const MOON_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;
  uniform vec3 baseColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.05;

    vec3 noisePos = vPosition * 4.0;
    float terrain = fbm(noisePos, 5);
    float craterNoise = abs(snoise(noisePos * 6.0));
    float craters = smoothstep(0.03, 0.12, craterNoise);

    vec3 surfaceColor = baseColor * (0.7 + terrain * 0.3);
    surfaceColor *= 0.85 + craters * 0.15;

    vec3 finalColor = surfaceColor * (ambient + NdotL);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── SUN SHADER ─────────────────────────────────────────────────────────────
// Animated glowing surface with granulation and prominences
export const SUN_FRAGMENT = `
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    vec3 noisePos = vPosition * 3.0 + vec3(time * 0.05, time * 0.03, time * 0.04);

    // Granulation pattern
    float granulation = fbm(noisePos, 5);

    // Solar surface colors
    vec3 hotYellow = vec3(1.0, 0.95, 0.70);
    vec3 warmOrange = vec3(1.0, 0.72, 0.30);
    vec3 darkSpot = vec3(0.85, 0.55, 0.15);

    vec3 surfaceColor = mix(warmOrange, hotYellow, smoothstep(-0.2, 0.3, granulation));

    // Sunspots
    float spotNoise = snoise(vPosition * 2.0 + time * 0.01);
    float spots = smoothstep(0.55, 0.7, spotNoise);
    surfaceColor = mix(surfaceColor, darkSpot, spots * 0.4);

    // Bright active regions
    float active = snoise(vPosition * 5.0 + vec3(0.0, 0.0, time * 0.08));
    float activeMask = smoothstep(0.3, 0.6, active);
    surfaceColor = mix(surfaceColor, hotYellow * 1.2, activeMask * 0.3);

    // Edge darkening (limb darkening)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float NdotV = max(dot(vNormal, viewDir), 0.0);
    float limbDarkening = pow(NdotV, 0.4);
    surfaceColor *= limbDarkening;

    // Emission — sun is self-luminous
    gl_FragColor = vec4(surfaceColor * 1.8, 1.0);
  }
`;

// ─── SATURN RING SHADER ─────────────────────────────────────────────────────
export const SATURN_RING_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float innerRadius;
  uniform float outerRadius;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    // Distance from center determines ring band
    float dist = length(vPosition.xz);
    float t = (dist - innerRadius) / (outerRadius - innerRadius);

    // Multiple ring bands with gaps
    float ring1 = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.12, 0.15, t));
    float ring2 = smoothstep(0.18, 0.22, t) * (1.0 - smoothstep(0.35, 0.38, t));
    float ring3 = smoothstep(0.42, 0.45, t) * (1.0 - smoothstep(0.55, 0.58, t));
    float ring4 = smoothstep(0.60, 0.63, t) * (1.0 - smoothstep(0.95, 1.0, t));

    float ringMask = ring1 + ring2 + ring3 + ring4;

    // Ring colors — ice and rock particles
    vec3 brightRing = vec3(0.85, 0.78, 0.62);
    vec3 darkRing = vec3(0.55, 0.48, 0.35);
    vec3 iceRing = vec3(0.75, 0.72, 0.68);

    float colorVar = snoise(vec3(t * 30.0, vPosition.x * 2.0, vPosition.z * 2.0));
    vec3 ringColor = mix(darkRing, brightRing, smoothstep(-0.3, 0.3, colorVar));
    ringColor = mix(ringColor, iceRing, smoothstep(0.3, 0.6, t) * 0.3);

    // Lighting
    vec3 lightDir = normalize(lightDirection);
    float NdotL = max(dot(normalize(vNormal), lightDir), 0.0);
    float lighting = 0.3 + NdotL * 0.7;

    vec3 finalColor = ringColor * lighting;
    float alpha = ringMask * 0.75;

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const RING_VERTEX = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
