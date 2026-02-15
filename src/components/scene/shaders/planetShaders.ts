/**
 * planetShaders.ts
 *
 * Procedural GLSL shaders for photorealistic planet rendering.
 * Each planet gets a unique shader that generates surface details
 * using 3D Simplex noise functions.
 *
 * Enhancements:
 *  - Earth: night-side city lights, improved ocean specular
 *  - Neptune: dedicated deep azure shader (split from Uranus)
 *  - Jupiter/Saturn: wavelength-dependent limb darkening
 *  - Saturn: approximate ring-shadow on planet body
 *  - Sun: prominence hints at the limb
 *  - Color accuracy improvements across all planets
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

// ─── TEXTURED EARTH SHADER ──────────────────────────────────────────────────
// Uses NASA Blue Marble texture for realistic Earth surface with day/night
// lighting, atmospheric rim glow, specular on oceans, and city lights.

export const EARTH_TEXTURED_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;
  uniform sampler2D earthMap;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    // Sample the Blue Marble texture
    vec3 texColor = texture2D(earthMap, vUv).rgb;

    // Lighting
    vec3 lightDir = normalize(lightDirection);
    float NdotL = dot(vNormal, lightDir);
    float ambient = 0.06;
    float diffuse = max(NdotL, 0.0);

    // Detect land vs ocean from texture luminance + blue channel ratio
    float lum = dot(texColor, vec3(0.299, 0.587, 0.114));
    float blueRatio = texColor.b / (lum + 0.001);
    float landMask = 1.0 - smoothstep(1.1, 1.6, blueRatio);
    // Ice/snow: high luminance, low saturation
    float maxC = max(texColor.r, max(texColor.g, texColor.b));
    float minC = min(texColor.r, min(texColor.g, texColor.b));
    float sat = (maxC - minC) / (maxC + 0.001);
    float iceMask = smoothstep(0.55, 0.75, lum) * (1.0 - smoothstep(0.15, 0.35, sat));

    // Specular on water
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 halfVec = normalize(lightDir + viewDir);
    float specAngle = max(dot(vNormal, halfVec), 0.0);
    float specular = pow(specAngle, 80.0) * (1.0 - landMask) * (1.0 - iceMask) * 0.5;

    // === DAY SIDE ===
    vec3 dayColor = texColor * (ambient + diffuse) + vec3(specular);

    // Atmospheric rim light
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    float rimGlow = pow(rim, 3.5);
    dayColor += vec3(0.30, 0.55, 1.0) * rimGlow * 0.35;

    // === NIGHT SIDE — CITY LIGHTS ===
    vec3 noisePos = vPosition * 2.5;
    float cityNoise1 = fbm(noisePos * 12.0 + 100.0, 4);
    float cityNoise2 = snoise(noisePos * 25.0 + 200.0);
    float cityMask = smoothstep(0.25, 0.55, cityNoise1) * smoothstep(0.1, 0.5, cityNoise2);
    cityMask *= landMask * (1.0 - iceMask);
    float absLat = abs(vPosition.y) / length(vPosition);
    float latWeight = smoothstep(0.1, 0.25, absLat) * (1.0 - smoothstep(0.65, 0.85, absLat));
    cityMask *= latWeight;
    vec3 cityColor = vec3(1.0, 0.75, 0.30) * cityMask * 0.8;

    // === BLEND DAY / NIGHT ===
    float terminator = smoothstep(-0.08, 0.12, NdotL);
    vec3 nightColor = vec3(0.0) + cityColor;
    float nightRim = pow(rim, 4.0) * (1.0 - terminator);
    nightColor += vec3(0.15, 0.25, 0.50) * nightRim * 0.2;

    vec3 finalColor = mix(nightColor, dayColor, terminator);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── PROCEDURAL EARTH SHADER (FALLBACK) ─────────────────────────────────────
// Continents, oceans, ice caps, clouds, specular, AND night-side city lights
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
    float NdotL = dot(vNormal, lightDir);
    float ambient = 0.08;
    float diffuse = max(NdotL, 0.0);

    // Surface noise for continents
    vec3 noisePos = vPosition * 2.5;
    float continent = fbm(noisePos, 6);

    // Ice caps near poles
    float latitude = abs(vPosition.y) / length(vPosition);
    float iceCap = smoothstep(0.75, 0.9, latitude);

    // Ocean vs land threshold
    float landMask = smoothstep(-0.05, 0.08, continent);

    // Land colors — natural satellite-like greens, browns, and tans
    vec3 forestGreen = vec3(0.06, 0.28, 0.05);
    vec3 grassGreen = vec3(0.15, 0.38, 0.08);
    vec3 desert = vec3(0.62, 0.50, 0.28);
    vec3 mountain = vec3(0.36, 0.32, 0.26);

    // Blend land types based on secondary noise
    float landType = fbm(noisePos * 3.0 + 10.0, 4);
    float elevation = fbm(noisePos * 1.5 + 5.0, 5);
    vec3 landColor = mix(forestGreen, grassGreen, smoothstep(-0.2, 0.3, landType));
    landColor = mix(landColor, desert, smoothstep(0.2, 0.6, landType + latitude * 0.5));
    landColor = mix(landColor, mountain, smoothstep(0.15, 0.4, elevation));

    // Ocean colors — deeper, richer blues (#003366 base)
    vec3 deepOcean = vec3(0.0, 0.04, 0.22);
    vec3 shallowOcean = vec3(0.02, 0.15, 0.40);
    float oceanDepth = smoothstep(-0.4, 0.0, continent);
    vec3 oceanColor = mix(deepOcean, shallowOcean, oceanDepth);

    // Specular highlight on water (improved physically-based)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 halfVec = normalize(lightDir + viewDir);
    float specAngle = max(dot(vNormal, halfVec), 0.0);
    float specular = pow(specAngle, 64.0) * (1.0 - landMask) * 0.6;

    // Combine land and ocean
    vec3 surfaceColor = mix(oceanColor, landColor, landMask);

    // Ice caps
    surfaceColor = mix(surfaceColor, vec3(0.92, 0.95, 0.98), iceCap);

    // Cloud layer — offset noise for cloud movement
    float clouds = fbm(vPosition * 3.5 + vec3(time * 0.02, 0.0, time * 0.01), 5);
    clouds = smoothstep(0.05, 0.45, clouds) * 0.6;

    // === DAY SIDE ===
    vec3 dayColor = surfaceColor * (ambient + diffuse) + vec3(specular);
    dayColor = mix(dayColor, vec3(1.0), clouds); // clouds are white on day side

    // Atmospheric rim light — thin blue glow at the edges
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    float rimGlow = pow(rim, 3.5);
    dayColor += vec3(0.30, 0.55, 1.0) * rimGlow * 0.35;

    // === NIGHT SIDE — CITY LIGHTS ===
    // Generate city light pattern using noise at populated latitudes
    float cityNoise1 = fbm(noisePos * 12.0 + 100.0, 4);
    float cityNoise2 = snoise(noisePos * 25.0 + 200.0);
    float cityMask = smoothstep(0.25, 0.55, cityNoise1) * smoothstep(0.1, 0.5, cityNoise2);

    // Cities only on land, not on ice caps
    cityMask *= landMask * (1.0 - iceCap);

    // Concentrate cities at mid-latitudes (30-55 degrees)
    float absLat = abs(vPosition.y) / length(vPosition);
    float latWeight = smoothstep(0.1, 0.25, absLat) * (1.0 - smoothstep(0.65, 0.85, absLat));
    cityMask *= latWeight;

    // Cities glow warm yellow-orange
    vec3 cityColor = vec3(1.0, 0.75, 0.30) * cityMask * 0.8;

    // Clouds dim city lights slightly
    cityColor *= (1.0 - clouds * 0.6);

    // === BLEND DAY / NIGHT ===
    // Smooth terminator transition
    float terminator = smoothstep(-0.08, 0.12, NdotL);
    vec3 nightColor = vec3(0.0) + cityColor;

    // Thin atmospheric crescent on dark side
    float nightRim = pow(rim, 4.0) * (1.0 - terminator);
    nightColor += vec3(0.15, 0.25, 0.50) * nightRim * 0.2;

    vec3 finalColor = mix(nightColor, dayColor, terminator);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── VITAL SIGN EARTH SHADERS ──────────────────────────────────────────────
// Temperature heatmap, CO2, sea level, etc. – overlay colors on the same
// procedural continent geometry so the shapes stay consistent.

/**
 * AIR TEMPERATURE – latitude-based temperature gradient with continental detail.
 * Hot equator (reds/oranges), temperate mid-lats (yellows/greens), cold poles (blues/purples).
 * Matches NASA "Eyes on Earth" style thermal visualization.
 */
export const TEMPERATURE_EARTH_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;
  uniform sampler2D earthMap;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  // Detect land vs ocean from Earth texture RGB
  float getLandSignal(vec2 uv) {
    vec4 c = texture2D(earthMap, uv);
    return (c.r * 0.5 + c.g * 0.5) - c.b * 0.55;
  }

  // NASA-style infrared thermal color ramp
  // Deep violet/blue (coldest) -> cyan -> green -> yellow -> orange -> bright red
  vec3 thermalColor(float t) {
    vec3 c;
    if (t < 0.08) {
      c = mix(vec3(0.10, 0.0, 0.22), vec3(0.15, 0.03, 0.42), t / 0.08);
    } else if (t < 0.18) {
      c = mix(vec3(0.15, 0.03, 0.42), vec3(0.08, 0.10, 0.70), (t - 0.08) / 0.10);
    } else if (t < 0.28) {
      c = mix(vec3(0.08, 0.10, 0.70), vec3(0.0, 0.55, 0.85), (t - 0.18) / 0.10);
    } else if (t < 0.38) {
      c = mix(vec3(0.0, 0.55, 0.85), vec3(0.0, 0.70, 0.50), (t - 0.28) / 0.10);
    } else if (t < 0.48) {
      c = mix(vec3(0.0, 0.70, 0.50), vec3(0.20, 0.82, 0.15), (t - 0.38) / 0.10);
    } else if (t < 0.56) {
      c = mix(vec3(0.20, 0.82, 0.15), vec3(0.65, 0.90, 0.0), (t - 0.48) / 0.08);
    } else if (t < 0.64) {
      c = mix(vec3(0.65, 0.90, 0.0), vec3(1.0, 0.92, 0.0), (t - 0.56) / 0.08);
    } else if (t < 0.74) {
      c = mix(vec3(1.0, 0.92, 0.0), vec3(1.0, 0.55, 0.0), (t - 0.64) / 0.10);
    } else if (t < 0.84) {
      c = mix(vec3(1.0, 0.55, 0.0), vec3(0.95, 0.12, 0.0), (t - 0.74) / 0.10);
    } else if (t < 0.92) {
      c = mix(vec3(0.95, 0.12, 0.0), vec3(0.70, 0.02, 0.08), (t - 0.84) / 0.08);
    } else {
      c = mix(vec3(0.70, 0.02, 0.08), vec3(0.95, 0.45, 0.55), (t - 0.92) / 0.08);
    }
    return c;
  }

  void main() {
    // Soft lighting
    vec3 lightDir = normalize(lightDirection);
    float NdotL = dot(vNormal, lightDir);
    float ambient = 0.25;
    float diffuse = max(NdotL, 0.0);

    // === REAL GEOGRAPHY from Earth blue-marble texture ===
    vec4 earthTex = texture2D(earthMap, vUv);
    float centerLand = getLandSignal(vUv);
    float landMask = smoothstep(-0.02, 0.08, centerLand);

    // Latitude
    float latitude = abs(vPosition.y) / length(vPosition);
    float signedLat = vPosition.y / length(vPosition);

    // Ice/snow from texture brightness + polar latitude
    float texBright = dot(earthTex.rgb, vec3(0.299, 0.587, 0.114));
    float iceMask = smoothstep(0.55, 0.78, texBright) * smoothstep(0.45, 0.72, latitude);

    // === COASTLINE BORDER DETECTION ===
    // Multi-scale edge detection for visible continent outlines
    // Fine scale
    vec2 ts1 = vec2(0.0012, 0.0024);
    float lR1 = getLandSignal(vUv + vec2(ts1.x, 0.0));
    float lL1 = getLandSignal(vUv - vec2(ts1.x, 0.0));
    float lU1 = getLandSignal(vUv + vec2(0.0, ts1.y));
    float lD1 = getLandSignal(vUv - vec2(0.0, ts1.y));
    float edge1 = length(vec2(lR1 - lL1, lU1 - lD1));

    // Broader scale for thicker outline
    vec2 ts2 = vec2(0.003, 0.006);
    float lR2 = getLandSignal(vUv + vec2(ts2.x, 0.0));
    float lL2 = getLandSignal(vUv - vec2(ts2.x, 0.0));
    float lU2 = getLandSignal(vUv + vec2(0.0, ts2.y));
    float lD2 = getLandSignal(vUv - vec2(0.0, ts2.y));
    float edge2 = length(vec2(lR2 - lL2, lU2 - lD2));

    // Combine edges: fine + broad for anti-aliased visible borders
    float borderLine = max(
      smoothstep(0.03, 0.12, edge1),
      smoothstep(0.02, 0.08, edge2) * 0.75
    );

    // === TEMPERATURE MODEL ===
    vec3 noisePos = vPosition * 2.5;
    // Base: strong latitude gradient (equator hot, poles cold)
    float baseTemp = pow(1.0 - latitude, 0.85);
    // Sub-tropical desert belt
    float desertBelt = exp(-pow((latitude - 0.35) * 4.5, 2.0)) * 0.18;
    // Tropical ITCZ
    float tropicalWarm = exp(-pow(latitude * 7.0, 2.0)) * 0.12;
    // Continental interior heating
    float continentalHeat = landMask * 0.10 * (1.0 - latitude * 0.5);
    // Elevation cooling
    float elevation = fbm(noisePos * 1.5 + 5.0, 5);
    float elevCool = smoothstep(0.15, 0.45, elevation) * landMask * -0.18;
    // Ocean thermal inertia
    float oceanMod = (1.0 - landMask) * -0.05;
    // Regional variation
    float regionNoise = fbm(noisePos * 2.2 + 50.0, 5) * 0.12;
    float microNoise = snoise(noisePos * 8.0 + 30.0) * 0.04;
    // Warm ocean currents
    float lonAngle = atan(vPosition.z, vPosition.x);
    float currentWarm = 0.0;
    currentWarm += exp(-pow((signedLat - 0.45) * 5.0, 2.0)) * exp(-pow((lonAngle + 0.5) * 2.0, 2.0)) * 0.08;
    currentWarm += exp(-pow((signedLat - 0.40) * 5.0, 2.0)) * exp(-pow((lonAngle - 2.5) * 2.0, 2.0)) * 0.06;
    currentWarm *= (1.0 - landMask);

    float temp = clamp(
      baseTemp + desertBelt + tropicalWarm + continentalHeat
      + elevCool + oceanMod + regionNoise + microNoise + currentWarm,
      0.0, 1.0
    );

    // === COLOR MAPPING ===
    vec3 heatColor = thermalColor(temp);
    heatColor = pow(heatColor, vec3(0.88)) * 1.25;

    vec3 landHeat = heatColor * 1.05;
    vec3 oceanHeat = heatColor * 0.82;
    vec3 surfaceColor = mix(oceanHeat, landHeat, landMask);

    // Polar ice tint
    vec3 iceColor = vec3(0.70, 0.80, 0.95);
    surfaceColor = mix(surfaceColor, iceColor, iceMask * 0.55);

    // === APPLY COASTLINE BORDERS ===
    // Dark outlines like NASA reference image
    surfaceColor = mix(surfaceColor, vec3(0.02, 0.02, 0.02), borderLine * 0.88);

    // === LIGHTING ===
    float lighting = ambient + diffuse * 0.55;
    vec3 litColor = surfaceColor * lighting;

    // Hot emissive glow
    float hotGlow = smoothstep(0.65, 0.90, temp) * 0.15;
    litColor += heatColor * hotGlow;

    // Atmospheric rim
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    float rimGlow = pow(rim, 3.0);
    vec3 rimColor = mix(vec3(0.15, 0.30, 0.80), vec3(0.85, 0.35, 0.15), temp);
    litColor += rimColor * rimGlow * 0.22;

    // Day/night
    float terminator = smoothstep(-0.15, 0.20, NdotL);
    vec3 nightSide = surfaceColor * 0.5;
    nightSide += heatColor * hotGlow * 0.5;
    vec3 finalColor = mix(nightSide, litColor, terminator);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * CO2 CONCENTRATION – yellows/oranges for high, greens for moderate, blues for low.
 */
export const CO2_EARTH_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  vec3 co2Color(float c) {
    if (c < 0.3) return mix(vec3(0.05, 0.25, 0.55), vec3(0.10, 0.50, 0.40), c / 0.3);
    if (c < 0.5) return mix(vec3(0.10, 0.50, 0.40), vec3(0.45, 0.70, 0.15), (c - 0.3) / 0.2);
    if (c < 0.7) return mix(vec3(0.45, 0.70, 0.15), vec3(0.90, 0.80, 0.10), (c - 0.5) / 0.2);
    if (c < 0.85) return mix(vec3(0.90, 0.80, 0.10), vec3(0.95, 0.50, 0.08), (c - 0.7) / 0.15);
    return mix(vec3(0.95, 0.50, 0.08), vec3(0.80, 0.15, 0.05), (c - 0.85) / 0.15);
  }

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = dot(vNormal, lightDir);
    float ambient = 0.15;
    float diffuse = max(NdotL, 0.0);

    vec3 noisePos = vPosition * 2.5;
    float continent = fbm(noisePos, 6);
    float landMask = smoothstep(-0.05, 0.08, continent);
    float latitude = abs(vPosition.y) / length(vPosition);

    // CO2 pattern: highest over industrial regions (mid-northern latitudes on land)
    float baseCO2 = 0.5 + 0.2 * (1.0 - latitude);
    float industrial = fbm(noisePos * 2.0 + 300.0, 4) * 0.25;
    float northernBias = smoothstep(0.15, 0.50, vPosition.y / length(vPosition)) * 0.15;
    float co2 = clamp(baseCO2 + industrial * landMask + northernBias * landMask, 0.0, 1.0);

    vec3 heatColor = co2Color(co2);
    vec3 surfaceColor = mix(heatColor * 0.7, heatColor, landMask);

    float edgeMask = smoothstep(0.0, 0.06, abs(continent - 0.015));
    surfaceColor *= mix(0.6, 1.0, edgeMask);

    float lighting = ambient + diffuse * 0.7;
    vec3 litColor = surfaceColor * lighting;

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    litColor += vec3(0.30, 0.50, 0.20) * pow(rim, 3.5) * 0.2;

    float terminator = smoothstep(-0.1, 0.15, NdotL);
    vec3 finalColor = mix(surfaceColor * 0.3, litColor, terminator);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * SEA SURFACE TEMPERATURE – ocean-focused: warm reds in tropics, cold blues at poles.
 */
export const SST_EARTH_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  vec3 sstColor(float t) {
    if (t < 0.2) return mix(vec3(0.08, 0.02, 0.25), vec3(0.05, 0.20, 0.60), t / 0.2);
    if (t < 0.4) return mix(vec3(0.05, 0.20, 0.60), vec3(0.05, 0.55, 0.65), (t - 0.2) / 0.2);
    if (t < 0.6) return mix(vec3(0.05, 0.55, 0.65), vec3(0.50, 0.80, 0.15), (t - 0.4) / 0.2);
    if (t < 0.8) return mix(vec3(0.50, 0.80, 0.15), vec3(0.95, 0.65, 0.05), (t - 0.6) / 0.2);
    return mix(vec3(0.95, 0.65, 0.05), vec3(0.85, 0.10, 0.05), (t - 0.8) / 0.2);
  }

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = dot(vNormal, lightDir);
    float ambient = 0.15;
    float diffuse = max(NdotL, 0.0);

    vec3 noisePos = vPosition * 2.5;
    float continent = fbm(noisePos, 6);
    float landMask = smoothstep(-0.05, 0.08, continent);
    float latitude = abs(vPosition.y) / length(vPosition);

    float sst = clamp(1.0 - latitude + fbm(noisePos * 1.5 + 80.0, 3) * 0.15, 0.0, 1.0);

    // Ocean gets color; land is dark gray
    vec3 oceanColor = sstColor(sst);
    vec3 landColor = vec3(0.12, 0.12, 0.10);
    vec3 surfaceColor = mix(oceanColor, landColor, landMask);

    float edgeMask = smoothstep(0.0, 0.06, abs(continent - 0.015));
    surfaceColor *= mix(0.65, 1.0, edgeMask);

    float lighting = ambient + diffuse * 0.7;
    vec3 litColor = surfaceColor * lighting;

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    litColor += vec3(0.15, 0.35, 0.80) * pow(rim, 3.5) * 0.2;

    float terminator = smoothstep(-0.1, 0.15, NdotL);
    vec3 finalColor = mix(surfaceColor * 0.3, litColor, terminator);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * PRECIPITATION – blues/cyans for rain, white for heavy, gray/tan for dry.
 */
export const PRECIPITATION_EARTH_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  vec3 precipColor(float p) {
    if (p < 0.15) return vec3(0.55, 0.45, 0.30);  // dry – tan
    if (p < 0.35) return mix(vec3(0.55, 0.45, 0.30), vec3(0.30, 0.55, 0.35), (p - 0.15) / 0.2);
    if (p < 0.55) return mix(vec3(0.30, 0.55, 0.35), vec3(0.10, 0.50, 0.75), (p - 0.35) / 0.2);
    if (p < 0.75) return mix(vec3(0.10, 0.50, 0.75), vec3(0.15, 0.35, 0.85), (p - 0.55) / 0.2);
    if (p < 0.90) return mix(vec3(0.15, 0.35, 0.85), vec3(0.60, 0.70, 0.95), (p - 0.75) / 0.15);
    return mix(vec3(0.60, 0.70, 0.95), vec3(0.95, 0.95, 1.0), (p - 0.90) / 0.10);
  }

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = dot(vNormal, lightDir);
    float ambient = 0.15;
    float diffuse = max(NdotL, 0.0);

    vec3 noisePos = vPosition * 2.5;
    float continent = fbm(noisePos, 6);
    float landMask = smoothstep(-0.05, 0.08, continent);
    float latitude = abs(vPosition.y) / length(vPosition);

    // Precipitation pattern: ITCZ near equator, mid-lat storms, dry subtropics
    float itcz = exp(-pow((latitude - 0.05) * 8.0, 2.0)) * 0.6;
    float midLatRain = exp(-pow((latitude - 0.45) * 6.0, 2.0)) * 0.4;
    float drySubtrop = exp(-pow((latitude - 0.25) * 7.0, 2.0)) * -0.3;
    float stormNoise = fbm(noisePos * 2.5 + vec3(time * 0.03, 0.0, 0.0), 4) * 0.3;

    float precip = clamp(0.3 + itcz + midLatRain + drySubtrop + stormNoise, 0.0, 1.0);

    vec3 surfaceColor = precipColor(precip);

    float edgeMask = smoothstep(0.0, 0.06, abs(continent - 0.015));
    surfaceColor *= mix(0.7, 1.0, edgeMask);

    float lighting = ambient + diffuse * 0.7;
    vec3 litColor = surfaceColor * lighting;

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    litColor += vec3(0.20, 0.45, 0.85) * pow(rim, 3.5) * 0.2;

    float terminator = smoothstep(-0.1, 0.15, NdotL);
    vec3 finalColor = mix(surfaceColor * 0.3, litColor, terminator);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * OZONE – purples, blues, and greens for ozone column density.
 */
export const OZONE_EARTH_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  vec3 ozoneColor(float o) {
    if (o < 0.15) return vec3(0.15, 0.02, 0.20);   // ozone hole – dark purple
    if (o < 0.3) return mix(vec3(0.15, 0.02, 0.20), vec3(0.30, 0.10, 0.60), (o - 0.15) / 0.15);
    if (o < 0.5) return mix(vec3(0.30, 0.10, 0.60), vec3(0.15, 0.40, 0.70), (o - 0.3) / 0.2);
    if (o < 0.7) return mix(vec3(0.15, 0.40, 0.70), vec3(0.20, 0.65, 0.45), (o - 0.5) / 0.2);
    if (o < 0.85) return mix(vec3(0.20, 0.65, 0.45), vec3(0.60, 0.80, 0.20), (o - 0.7) / 0.15);
    return mix(vec3(0.60, 0.80, 0.20), vec3(0.90, 0.90, 0.25), (o - 0.85) / 0.15);
  }

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = dot(vNormal, lightDir);
    float ambient = 0.15;
    float diffuse = max(NdotL, 0.0);

    vec3 noisePos = vPosition * 2.5;
    float continent = fbm(noisePos, 6);
    float latitude = abs(vPosition.y) / length(vPosition);

    // Ozone: thickest at mid-latitudes, ozone hole at south pole
    float baseOzone = 0.6 + 0.2 * sin(latitude * 3.14);
    float southPoleHole = (vPosition.y < 0.0) ? exp(-pow((latitude - 0.9) * 5.0, 2.0)) * -0.5 : 0.0;
    float variation = fbm(noisePos * 1.5 + 150.0, 3) * 0.15;

    float ozone = clamp(baseOzone + southPoleHole + variation, 0.0, 1.0);

    vec3 surfaceColor = ozoneColor(ozone);

    float edgeMask = smoothstep(0.0, 0.06, abs(continent - 0.015));
    surfaceColor *= mix(0.7, 1.0, edgeMask);

    float lighting = ambient + diffuse * 0.7;
    vec3 litColor = surfaceColor * lighting;

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    litColor += vec3(0.40, 0.20, 0.70) * pow(rim, 3.5) * 0.2;

    float terminator = smoothstep(-0.1, 0.15, NdotL);
    vec3 finalColor = mix(surfaceColor * 0.3, litColor, terminator);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * GENERIC DATA OVERLAY – used for vital signs without a custom shader.
 * Teal-to-orange gradient based on noise + latitude.
 */
export const GENERIC_DATA_EARTH_FRAGMENT = `
  uniform vec3 lightDirection;
  uniform float time;
  uniform vec3 dataColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    vec3 lightDir = normalize(lightDirection);
    float NdotL = dot(vNormal, lightDir);
    float ambient = 0.15;
    float diffuse = max(NdotL, 0.0);

    vec3 noisePos = vPosition * 2.5;
    float continent = fbm(noisePos, 6);
    float landMask = smoothstep(-0.05, 0.08, continent);
    float latitude = abs(vPosition.y) / length(vPosition);

    float dataValue = clamp(0.5 + fbm(noisePos * 2.0 + 500.0, 4) * 0.4 + (1.0 - latitude) * 0.2, 0.0, 1.0);

    vec3 lowColor = vec3(0.05, 0.15, 0.35);
    vec3 midColor = dataColor;
    vec3 highColor = dataColor * 1.3 + vec3(0.2);
    vec3 heatColor;
    if (dataValue < 0.5) {
      heatColor = mix(lowColor, midColor, dataValue / 0.5);
    } else {
      heatColor = mix(midColor, highColor, (dataValue - 0.5) / 0.5);
    }

    vec3 surfaceColor = mix(heatColor * 0.7, heatColor, landMask);

    float edgeMask = smoothstep(0.0, 0.06, abs(continent - 0.015));
    surfaceColor *= mix(0.65, 1.0, edgeMask);

    float lighting = ambient + diffuse * 0.7;
    vec3 litColor = surfaceColor * lighting;

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    litColor += dataColor * pow(rim, 3.5) * 0.2;

    float terminator = smoothstep(-0.1, 0.15, NdotL);
    vec3 finalColor = mix(surfaceColor * 0.3, litColor, terminator);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── MARS SHADER ────────────────────────────────────────────────────────────
// Red-orange surface with craters, darker regions, polar ice caps, pinkish atmosphere
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
    float ambient = 0.12;

    vec3 noisePos = vPosition * 3.0;

    // Base terrain
    float terrain = fbm(noisePos, 6);
    float detail = fbm(noisePos * 8.0 + 20.0, 4);

    // Color palette — rusty red tones (#CD5C5C)
    vec3 rustRed = vec3(0.80, 0.36, 0.36);
    vec3 darkRed = vec3(0.45, 0.18, 0.10);
    vec3 sandOrange = vec3(0.85, 0.58, 0.32);
    vec3 darkRegion = vec3(0.32, 0.20, 0.14);

    // Blend terrain types
    vec3 surfaceColor = mix(rustRed, sandOrange, smoothstep(-0.2, 0.4, terrain));
    surfaceColor = mix(surfaceColor, darkRegion, smoothstep(0.1, 0.5, detail) * 0.5);
    surfaceColor = mix(surfaceColor, darkRed, smoothstep(-0.3, -0.1, terrain) * 0.4);

    // Craters
    float craterNoise = abs(snoise(noisePos * 6.0));
    float crater = smoothstep(0.02, 0.08, craterNoise);
    surfaceColor *= 0.85 + crater * 0.15;

    // Olympus Mons approximation — a large bright region
    float lat = vPosition.y / length(vPosition);
    float lon = atan(vPosition.z, vPosition.x);
    float olympusDist = length(vec2((lat - 0.18) * 4.0, sin(lon + 1.5) * 1.2));
    float olympus = 1.0 - smoothstep(0.0, 0.6, olympusDist);
    surfaceColor = mix(surfaceColor, sandOrange * 1.1, olympus * 0.3);

    // Polar ice caps — white CO2/water ice
    float latitude = abs(vPosition.y) / length(vPosition);
    float polarIce = smoothstep(0.82, 0.95, latitude);
    surfaceColor = mix(surfaceColor, vec3(0.88, 0.85, 0.82), polarIce);

    // Pinkish-orange dust atmosphere tint at rim
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    rim = pow(rim, 2.5);

    vec3 finalColor = surfaceColor * (ambient + NdotL);
    finalColor += vec3(0.80, 0.40, 0.20) * rim * 0.18;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── JUPITER SHADER ─────────────────────────────────────────────────────────
// Horizontal bands, Great Red Spot, turbulence, wavelength-dependent limb darkening
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
    float ambient = 0.12;

    // Latitude-based bands
    float lat = vPosition.y / length(vPosition);
    float bandFreq = lat * 12.0;
    float band = sin(bandFreq * 3.14159) * 0.5 + 0.5;

    // Add turbulence to the bands
    float turbulence = snoise(vec3(vPosition.x * 5.0, vPosition.y * 2.0, vPosition.z * 5.0 + time * 0.005)) * 0.15;
    float fineTurb = snoise(vec3(vPosition.x * 12.0, vPosition.y * 4.0, vPosition.z * 12.0 + time * 0.008)) * 0.06;
    band += turbulence + fineTurb;

    // Color palette for bands (#F5E6D3 zones, #D4A373/#8B7355 belts)
    vec3 lightBand = vec3(0.96, 0.90, 0.83);   // cream zones
    vec3 darkBand = vec3(0.83, 0.64, 0.45);    // brown-orange belts
    vec3 redBand = vec3(0.75, 0.35, 0.18);     // reddish
    vec3 whiteBand = vec3(0.94, 0.90, 0.84);   // pale

    vec3 bandColor = mix(darkBand, lightBand, smoothstep(0.3, 0.7, band));

    // Some bands are redder
    float redMask = smoothstep(0.6, 0.8, sin(bandFreq * 1.5 + 2.0) * 0.5 + 0.5);
    bandColor = mix(bandColor, redBand, redMask * 0.4);

    // Great Red Spot (~22° south, reddish-orange #B8705D to #A0522D)
    float spotLat = lat + 0.22;
    float spotLon = atan(vPosition.z, vPosition.x) + time * 0.01;
    float spotDist = length(vec2(spotLat * 6.0, sin(spotLon) * 1.5));
    float spot = 1.0 - smoothstep(0.0, 0.8, spotDist);

    // Swirling pattern inside the spot
    float swirl = snoise(vec3(spotLat * 15.0, spotLon * 8.0 + time * 0.02, 0.0));
    vec3 spotColor = mix(vec3(0.72, 0.44, 0.36), vec3(0.63, 0.32, 0.16), swirl * 0.5 + 0.5);
    bandColor = mix(bandColor, spotColor, spot * 0.75);

    // Atmospheric detail
    float detail = fbm(vPosition * 8.0, 3) * 0.08;
    bandColor += detail;

    // === LIMB DARKENING (wavelength-dependent) ===
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float NdotV = max(dot(vNormal, viewDir), 0.0);
    float limbR = pow(NdotV, 0.35);
    float limbG = pow(NdotV, 0.45);
    float limbB = pow(NdotV, 0.55);
    bandColor *= vec3(limbR, limbG, limbB);

    // Subtle atmospheric glow at limb
    float rim = 1.0 - NdotV;
    float rimGlow = pow(rim, 3.0);
    bandColor += vec3(0.85, 0.65, 0.35) * rimGlow * 0.08;

    vec3 finalColor = bandColor * (ambient + NdotL);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── SATURN SHADER ──────────────────────────────────────────────────────────
// Pale golden bands, limb darkening, ring-shadow approximation
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
    float ambient = 0.12;

    float lat = vPosition.y / length(vPosition);
    float band = sin(lat * 18.0) * 0.5 + 0.5;
    float turbulence = snoise(vec3(vPosition.x * 4.0, vPosition.y * 2.0, vPosition.z * 4.0)) * 0.1;
    band += turbulence;

    // Pale golden palette (#F4E4C1)
    vec3 lightGold = vec3(0.96, 0.89, 0.76);
    vec3 darkGold = vec3(0.75, 0.65, 0.42);
    vec3 paleYellow = vec3(0.92, 0.88, 0.76);

    vec3 surfaceColor = mix(darkGold, lightGold, smoothstep(0.3, 0.7, band));
    surfaceColor = mix(surfaceColor, paleYellow, smoothstep(0.65, 0.85, band) * 0.3);

    float detail = fbm(vPosition * 6.0, 3) * 0.05;
    surfaceColor += detail;

    // === LIMB DARKENING ===
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float NdotV = max(dot(vNormal, viewDir), 0.0);
    float limbR = pow(NdotV, 0.30);
    float limbG = pow(NdotV, 0.40);
    float limbB = pow(NdotV, 0.55);
    surfaceColor *= vec3(limbR, limbG, limbB);

    // === RING SHADOW APPROXIMATION ===
    // Darken a band near the equator to simulate ring shadow
    float absLat = abs(lat);
    float ringShadow = smoothstep(0.0, 0.08, absLat) * (1.0 - smoothstep(0.08, 0.22, absLat));
    // Only cast shadow where light comes from above
    float shadowSide = max(dot(normalize(vec3(lightDir.x, 0.0, lightDir.z)), normalize(vec3(vPosition.x, 0.0, vPosition.z))), 0.0);
    surfaceColor *= 1.0 - ringShadow * 0.35 * shadowSide;

    vec3 finalColor = surfaceColor * (ambient + NdotL);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── VENUS SHADER ───────────────────────────────────────────────────────────
// Thick cloudy atmosphere — pale yellowish-white (#E8D7C3 to #FFF8DC)
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
    float ambient = 0.18;

    // Thick swirling cloud cover (super-rotation: 4-day period)
    vec3 cloudPos = vPosition * 2.5 + vec3(time * 0.012, time * 0.004, 0.0);
    float cloud1 = fbm(cloudPos, 6);
    float cloud2 = fbm(cloudPos * 2.0 + 5.0, 4);

    // Pale yellowish-white palette (#E8D7C3 to #FFF8DC)
    vec3 paleYellow = vec3(0.91, 0.84, 0.76);
    vec3 cream = vec3(1.0, 0.97, 0.86);
    vec3 softOrange = vec3(0.85, 0.72, 0.55);

    vec3 surfaceColor = mix(softOrange, paleYellow, smoothstep(-0.3, 0.3, cloud1));
    surfaceColor = mix(surfaceColor, cream, smoothstep(0.0, 0.5, cloud2) * 0.35);

    // V-shaped banding pattern (barely visible)
    float lat = vPosition.y / length(vPosition);
    float banding = sin(lat * 8.0) * 0.02;
    surfaceColor += banding;

    // Very soft terminator (thick atmosphere diffuses light)
    float softDiffuse = smoothstep(-0.15, 0.3, dot(vNormal, lightDir));

    // Thick atmospheric halo at limb (pale yellow-orange)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    rim = pow(rim, 1.8);

    vec3 finalColor = surfaceColor * (ambient + softDiffuse * 0.7);
    finalColor += vec3(0.90, 0.75, 0.40) * rim * 0.25;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── MERCURY SHADER ─────────────────────────────────────────────────────────
// Heavily cratered grayish-brown surface (#8C7853), razor-sharp shadows
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
    // Very low ambient — no atmosphere to scatter light
    float ambient = 0.04;

    vec3 noisePos = vPosition * 4.0;

    // Rocky terrain
    float terrain = fbm(noisePos, 6);
    float fineDetail = fbm(noisePos * 12.0, 4);

    // Multi-scale crater noise
    float craterNoise = abs(snoise(noisePos * 5.0));
    float crater2 = abs(snoise(noisePos * 12.0));
    float crater3 = abs(snoise(noisePos * 20.0));
    float craters = smoothstep(0.02, 0.1, craterNoise) * smoothstep(0.03, 0.12, crater2);

    // Bright ray systems from recent impacts
    float rays = smoothstep(0.01, 0.03, crater3) * 0.15;

    // Color palette — grayish-brown (#8C7853)
    vec3 lightGray = vec3(0.55, 0.47, 0.33);
    vec3 darkGray = vec3(0.30, 0.27, 0.24);
    vec3 brownGray = vec3(0.42, 0.38, 0.30);

    vec3 surfaceColor = mix(darkGray, lightGray, smoothstep(-0.3, 0.3, terrain));
    surfaceColor = mix(surfaceColor, brownGray, smoothstep(-0.1, 0.2, fineDetail) * 0.3);
    surfaceColor *= 0.8 + craters * 0.2;
    surfaceColor += rays; // bright ray streaks

    // Razor-sharp shadow boundary (no atmosphere)
    float sharpDiffuse = smoothstep(-0.01, 0.02, dot(vNormal, lightDir));

    vec3 finalColor = surfaceColor * (ambient + sharpDiffuse);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── NEPTUNE SHADER ─────────────────────────────────────────────────────────
// Rich deep azure blue (#3A5FCD), bright white scooter clouds, visible storms
export const NEPTUNE_FRAGMENT = `
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
    float ambient = 0.12;

    float lat = vPosition.y / length(vPosition);

    // Deep azure base color (#3A5FCD)
    vec3 deepBlue = vec3(0.23, 0.37, 0.80);
    vec3 midBlue = vec3(0.28, 0.42, 0.88);
    vec3 brightBlue = vec3(0.35, 0.50, 0.95);

    // Subtle horizontal banding (more visible than Uranus)
    float band = sin(lat * 14.0) * 0.5 + 0.5;
    float turbulence = snoise(vec3(vPosition.x * 4.0, vPosition.y * 2.0, vPosition.z * 4.0 + time * 0.008)) * 0.12;
    band += turbulence;

    vec3 surfaceColor = mix(deepBlue, midBlue, smoothstep(0.3, 0.7, band));
    surfaceColor = mix(surfaceColor, brightBlue, smoothstep(0.7, 0.95, band) * 0.25);

    // === WHITE SCOOTER CLOUDS (bright cirrus-like features) ===
    float cloudNoise1 = snoise(vPosition * 6.0 + vec3(time * 0.025, 0.0, time * 0.015));
    float cloudNoise2 = snoise(vPosition * 10.0 + vec3(time * 0.04, time * 0.01, 0.0));
    float scooterClouds = smoothstep(0.45, 0.75, cloudNoise1) * smoothstep(0.3, 0.6, cloudNoise2);
    surfaceColor = mix(surfaceColor, vec3(1.0, 0.98, 0.95), scooterClouds * 0.5);

    // === GREAT DARK SPOT (approximate) ===
    float spotLat = lat + 0.3;
    float spotLon = atan(vPosition.z, vPosition.x) + time * 0.005;
    float spotDist = length(vec2(spotLat * 5.0, sin(spotLon) * 1.8));
    float darkSpot = 1.0 - smoothstep(0.0, 0.6, spotDist);
    surfaceColor = mix(surfaceColor, deepBlue * 0.6, darkSpot * 0.4);

    // White companion cloud near dark spot
    float companionDist = length(vec2((spotLat - 0.08) * 6.0, sin(spotLon + 0.3) * 2.0));
    float companion = 1.0 - smoothstep(0.0, 0.3, companionDist);
    surfaceColor = mix(surfaceColor, vec3(1.0), companion * 0.3);

    // === LIMB BRIGHTENING (atmospheric scattering) ===
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float NdotV = max(dot(vNormal, viewDir), 0.0);
    float rim = 1.0 - NdotV;
    float limbGlow = pow(rim, 2.5);
    surfaceColor += deepBlue * 0.5 * limbGlow;

    vec3 finalColor = surfaceColor * (ambient + NdotL);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── URANUS SHADER (ICE GIANT) ──────────────────────────────────────────────
// Nearly featureless pale cyan-blue (#4FD0E7), very subtle banding
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
    float ambient = 0.14;

    float lat = vPosition.y / length(vPosition);

    // Very subtle banding (almost featureless)
    float band = sin(lat * 10.0) * 0.5 + 0.5;
    float turbulence = snoise(vec3(vPosition.x * 3.0, vPosition.y * 1.5, vPosition.z * 3.0 + time * 0.003)) * 0.06;
    band += turbulence;

    vec3 surfaceColor = mix(baseColor * 0.85, baseColor, smoothstep(0.3, 0.7, band));
    surfaceColor = mix(surfaceColor, bandColor, smoothstep(0.6, 0.9, band) * 0.15);

    // Very rare white cloud spots
    float storm = snoise(vPosition * 5.0 + vec3(0.0, 0.0, time * 0.01));
    float stormMask = smoothstep(0.6, 0.85, storm);
    surfaceColor = mix(surfaceColor, baseColor * 1.2, stormMask * 0.1);

    // Subtle limb brightening from atmospheric scattering
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    rim = pow(rim, 2.5);
    surfaceColor += baseColor * rim * 0.1;

    vec3 finalColor = surfaceColor * (ambient + NdotL);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── MOON SHADER ────────────────────────────────────────────────────────────
// Gray cratered surface with maria (dark basaltic seas) and bright ray systems
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
    // Very low ambient — no atmosphere
    float ambient = 0.03;

    vec3 noisePos = vPosition * 4.0;
    float terrain = fbm(noisePos, 5);
    float craterNoise = abs(snoise(noisePos * 6.0));
    float craters = smoothstep(0.03, 0.12, craterNoise);

    // Maria (dark basaltic seas)
    float mariaNoise = fbm(noisePos * 0.8 + 50.0, 3);
    float mariaMask = smoothstep(-0.1, 0.2, mariaNoise) * 0.3;

    vec3 surfaceColor = baseColor * (0.7 + terrain * 0.3);
    surfaceColor *= 0.85 + craters * 0.15;
    surfaceColor = mix(surfaceColor, baseColor * 0.5, mariaMask); // darker maria

    // Bright ray systems
    float rayNoise = abs(snoise(noisePos * 15.0));
    float rays = smoothstep(0.01, 0.04, rayNoise) * 0.12;
    surfaceColor += rays;

    // Razor-sharp shadows (no atmosphere)
    float sharpDiffuse = smoothstep(-0.005, 0.015, dot(vNormal, lightDir));

    vec3 finalColor = surfaceColor * (ambient + sharpDiffuse);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── SUN SHADER ─────────────────────────────────────────────────────────────
// Animated solar surface with convection cells, sunspots, faculae,
// chromospheric rim, limb darkening, and prominence hints
export const SUN_FRAGMENT = `
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    // === GRANULATION (convection cells) ===
    vec3 slowDrift = vec3(time * 0.02, time * 0.015, time * 0.018);
    vec3 noisePos1 = vPosition * 4.0 + slowDrift;
    vec3 noisePos2 = vPosition * 8.0 + slowDrift * 1.3;
    vec3 noisePos3 = vPosition * 16.0 + slowDrift * 0.7;

    float granulation = fbm(noisePos1, 6) * 0.6
                      + fbm(noisePos2, 4) * 0.25
                      + fbm(noisePos3, 3) * 0.15;

    // === SOLAR SURFACE PALETTE ===
    vec3 brightWhite  = vec3(1.0, 0.98, 0.90);
    vec3 hotYellow    = vec3(1.0, 0.92, 0.65);
    vec3 warmOrange   = vec3(0.98, 0.72, 0.35);
    vec3 coolOrange   = vec3(0.90, 0.55, 0.18);
    vec3 darkUmbra    = vec3(0.45, 0.25, 0.08);
    vec3 penumbra     = vec3(0.70, 0.42, 0.15);

    // Base surface
    vec3 surfaceColor = mix(coolOrange, warmOrange, smoothstep(-0.3, 0.0, granulation));
    surfaceColor = mix(surfaceColor, hotYellow, smoothstep(0.0, 0.25, granulation));
    surfaceColor = mix(surfaceColor, brightWhite, smoothstep(0.25, 0.5, granulation) * 0.4);

    // === SUNSPOTS ===
    float spotNoise1 = snoise(vPosition * 1.8 + time * 0.008);
    float spotNoise2 = snoise(vPosition * 2.5 + time * 0.005 + 50.0);
    float spotMask = smoothstep(0.58, 0.72, spotNoise1) * smoothstep(0.45, 0.65, spotNoise2);

    float penumbraMask = smoothstep(0.50, 0.62, spotNoise1) * smoothstep(0.38, 0.55, spotNoise2);
    surfaceColor = mix(surfaceColor, penumbra, penumbraMask * 0.5);
    surfaceColor = mix(surfaceColor, darkUmbra, spotMask * 0.7);

    // === FACULAE (bright patches near sunspots / limb) ===
    float faculae = snoise(vPosition * 6.0 + vec3(time * 0.03, 0.0, time * 0.02));
    float faculaeMask = smoothstep(0.35, 0.55, faculae) * (1.0 - spotMask);
    surfaceColor = mix(surfaceColor, brightWhite, faculaeMask * 0.2);

    // === BRIGHT ACTIVE REGIONS / PLAGES ===
    float active = snoise(vPosition * 3.5 + vec3(time * 0.04, time * 0.02, 0.0));
    float activeMask = smoothstep(0.4, 0.65, active) * (1.0 - spotMask);
    surfaceColor = mix(surfaceColor, hotYellow * 1.15, activeMask * 0.25);

    // === LIMB DARKENING (wavelength-dependent) ===
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float NdotV = max(dot(vNormal, viewDir), 0.0);
    float limbR = pow(NdotV, 0.30);
    float limbG = pow(NdotV, 0.45);
    float limbB = pow(NdotV, 0.65);
    surfaceColor *= vec3(limbR, limbG, limbB);

    // === CHROMOSPHERIC RIM ===
    float rimEdge = 1.0 - NdotV;
    float chromosphere = smoothstep(0.75, 0.98, rimEdge);
    vec3 chromoColor = vec3(1.0, 0.30, 0.15);
    surfaceColor += chromoColor * chromosphere * 0.35;

    // === SOLAR PROMINENCES (hint at the limb) ===
    float promNoise = snoise(vPosition * 3.0 + vec3(time * 0.015, time * 0.01, 0.0));
    float promMask = smoothstep(0.85, 0.97, rimEdge) * smoothstep(0.3, 0.7, promNoise);
    vec3 promColor = vec3(1.0, 0.45, 0.15);
    surfaceColor += promColor * promMask * 0.4;

    // === FINAL EMISSION ===
    gl_FragColor = vec4(surfaceColor * 2.2, 1.0);
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
    // RingGeometry lies in the XY plane
    float dist = length(vPosition.xy);
    float t = (dist - innerRadius) / (outerRadius - innerRadius);

    // === RING DENSITY PROFILE (modeled after real Saturn rings) ===
    // C Ring (inner, faint): t ~ 0.0 - 0.20
    // B Ring (bright, dense): t ~ 0.20 - 0.48
    // Cassini Division (gap): t ~ 0.48 - 0.54
    // A Ring (moderate): t ~ 0.54 - 0.85
    // Encke Gap: t ~ 0.76 - 0.78
    // F Ring (thin, outer): t ~ 0.92 - 0.96

    float cRing = smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(0.18, 0.20, t)) * 0.35;
    float bRing = smoothstep(0.20, 0.22, t) * (1.0 - smoothstep(0.46, 0.48, t)) * 1.0;
    float cassiniDiv = 1.0 - smoothstep(0.48, 0.49, t) * (1.0 - smoothstep(0.53, 0.54, t));
    float aRing = smoothstep(0.54, 0.56, t) * (1.0 - smoothstep(0.83, 0.85, t)) * 0.7;
    float enckeGap = 1.0 - smoothstep(0.755, 0.76, t) * (1.0 - smoothstep(0.775, 0.78, t));
    float fRing = smoothstep(0.91, 0.93, t) * (1.0 - smoothstep(0.95, 0.97, t)) * 0.25;

    float density = (cRing + bRing + aRing + fRing) * cassiniDiv * enckeGap;

    // Fine radial structure (hundreds of ringlets)
    float ringlets = sin(t * 280.0) * 0.5 + 0.5;
    float fineRinglets = sin(t * 800.0) * 0.5 + 0.5;
    density *= 0.7 + ringlets * 0.2 + fineRinglets * 0.1;

    // Subtle azimuthal variation
    float angle = atan(vPosition.y, vPosition.x);
    float azVar = snoise(vec3(angle * 3.0, t * 50.0, 0.0)) * 0.08;
    density += azVar * density;

    // === RING COLORS ===
    vec3 innerColor = vec3(0.55, 0.45, 0.32);
    vec3 midColor   = vec3(0.82, 0.74, 0.58);
    vec3 outerColor = vec3(0.78, 0.76, 0.70);
    vec3 iceColor   = vec3(0.88, 0.86, 0.82);

    vec3 ringColor = mix(innerColor, midColor, smoothstep(0.1, 0.35, t));
    ringColor = mix(ringColor, outerColor, smoothstep(0.5, 0.7, t));
    ringColor = mix(ringColor, iceColor, smoothstep(0.75, 0.95, t) * 0.4);

    float colorNoise = snoise(vec3(t * 40.0, angle * 2.0, 0.5));
    ringColor *= 1.3;
    ringColor *= 0.92 + colorNoise * 0.08;

    // === LIGHTING ===
    vec3 lightDir = normalize(lightDirection);
    vec3 N = normalize(vNormal);
    float frontLight = max(dot(N, lightDir), 0.0);
    float backScatter = max(-dot(N, lightDir), 0.0) * 0.3;
    float lighting = 0.25 + frontLight * 0.6 + backScatter * 0.15;

    vec3 finalColor = ringColor * lighting;
    float alpha = clamp(density, 0.0, 1.0) * 0.85;

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
