/**
 * asteroidInfoService.ts
 *
 * Fetches asteroid info from NASA JPL's Small-Body Database (SBDB) API
 * and transforms it into simple, fun, conversational Q&A answers —
 * like chatting with a friendly space expert.
 *
 * API: NASA JPL SBDB — https://ssd-api.jpl.nasa.gov/doc/sbdb.html (free, no key)
 */

import axios from 'axios';

/* ── Types ─────────────────────────────────────────────────────── */

/** Raw data parsed from the SBDB API (internal only) */
interface SbdbRaw {
  fullName: string;
  isNeo: boolean;
  isPha: boolean;
  orbitClass?: string;
  discoveryDate?: string;
  discoverer?: string;
  discoverySite?: string;
  diameterKm?: number;
  albedo?: number;
  rotationPeriodHrs?: number;
  absoluteMagnitude?: number;
  semiMajorAxisAu?: number;
  orbitalPeriodDays?: number;
  moidAu?: number;
  closeApproaches: { date: string; distKm: number; velocityKmS: number }[];
}

/** A single chatbot-style Q&A entry */
export interface AsteroidQA {
  question: string;
  answer: string;
  emoji: string;
}

/** The full chatbot info for an asteroid */
export interface AsteroidChatInfo {
  name: string;
  tagline: string;
  qaList: AsteroidQA[];
  nasaUrl: string;
}

/* ── SBDB name mapping ─────────────────────────────────────────── */

const SBDB_NAME_MAP: Record<string, string> = {
  'asteroid-2026-bx4': '2026 BX4',
  'asteroid-2026-aj17': '2026 AJ17',
  'asteroid-2026-cu': '2026 CU',
  'asteroid-2026-be7': '2026 BE7',
  'asteroid-2026-bq8': '2026 BQ8',
  'osiris-apex': '99942',
  'apophis': '99942',
  'eros': '433',
  'gaspra': '951',
  'ida': '243',
  'dinkinesh': '152830',
  'ryugu': '162173',
  'vesta': '4',
  'ceres': '1',
  'itokawa': '25143',
  'bennu': '101955',
  'psyche': '16',
  'didymos': '65803',
  'annefrank': '5535',
  'braille': '9969',
  'mathilde': '253',
  'borrelly': '19P',
  'churyumov-gerasimenko': '67P',
  'hartley2': '103P',
  'eurybates': '3548',
  'leucus': '11351',
  'orus': '21900',
  'tempel1': '9P',
  'psyche16': '16',
};

/* ── Cache ─────────────────────────────────────────────────────── */

const cache = new Map<string, { data: AsteroidChatInfo; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000;

/* ── Helpers: make numbers feel real ───────────────────────────── */

function friendlyDistance(km: number): string {
  if (km < 400_000) return `about ${(km / 1_000).toFixed(0)},000 km — that's ${(km / 384_400).toFixed(1)}x the distance to our Moon!`;
  if (km < 1_000_000) return `roughly ${(km / 1_000).toFixed(0)},000 km (about ${(km / 384_400).toFixed(1)}x the Moon's distance from us)`;
  if (km < 10_000_000) return `about ${(km / 1_000_000).toFixed(1)} million km — a safe flyby, but incredibly close by space standards!`;
  if (km < 100_000_000) return `about ${(km / 1_000_000).toFixed(0)} million km from Earth`;
  return `about ${(km / 1_000_000).toFixed(0)} million km away`;
}

function friendlySize(km: number): string {
  const m = km * 1000;
  if (m < 10) return `about ${m.toFixed(0)} meters — roughly the size of a school bus`;
  if (m < 50) return `about ${m.toFixed(0)} meters — imagine a blue whale or a passenger jet`;
  if (m < 100) return `about ${m.toFixed(0)} meters — picture a football field`;
  if (m < 300) return `about ${m.toFixed(0)} meters — taller than the Statue of Liberty!`;
  if (m < 1000) return `about ${m.toFixed(0)} meters across — as wide as a few city blocks`;
  if (km < 10) return `about ${km.toFixed(1)} km wide — the size of a small town`;
  if (km < 100) return `about ${km.toFixed(0)} km across — bigger than many cities!`;
  if (km < 500) return `about ${km.toFixed(0)} km wide — a giant among asteroids!`;
  return `a whopping ${km.toFixed(0)} km across — practically a mini planet!`;
}

function friendlyDate(dateStr: string): string {
  try {
    const cleaned = dateStr.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  } catch { /* fall through */ }
  return dateStr;
}

function friendlySpeed(kmS: number): string {
  const kmH = kmS * 3600;
  return `${(kmH / 1000).toFixed(0)},000 km/h — about ${(kmH / 1235).toFixed(0)}x the speed of sound!`;
}

function periodToHuman(days: number): string {
  if (days < 365) return `about ${Math.round(days)} days`;
  const yrs = days / 365.25;
  if (yrs < 2) return `about ${yrs.toFixed(1)} years`;
  return `about ${Math.round(yrs)} years`;
}

/* ── Build friendly Q&A from raw data ──────────────────────────── */

function buildQA(name: string, raw: SbdbRaw): AsteroidChatInfo {
  const qaList: AsteroidQA[] = [];
  const sbdbName = raw.fullName || name;
  const nasaUrl = `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(sbdbName)}`;

  // ── 1. What is this?
  {
    let a = `${name} is a space rock `;
    if (raw.orbitClass) {
      const cls = raw.orbitClass.toLowerCase();
      if (cls.includes('apollo') || cls.includes('amor') || cls.includes('aten'))
        a += `that swings close to Earth on its journey around the Sun. `;
      else if (cls.includes('main'))
        a += `that lives in the asteroid belt between Mars and Jupiter. `;
      else if (cls.includes('jupiter') || cls.includes('trojan'))
        a += `that travels along with Jupiter — like a cosmic hitchhiker! `;
      else a += `orbiting the Sun. `;
    } else {
      a += 'orbiting the Sun. ';
    }
    if (raw.isNeo) a += "It's one of Earth's closer space neighbors!";
    else a += "It's one of millions of rocky worlds floating out there!";
    qaList.push({ question: `What is ${name}?`, answer: a.trim(), emoji: '🪨' });
  }

  // ── 2. How big is it?
  if (raw.diameterKm) {
    qaList.push({
      question: 'How big is it?',
      answer: `${name} is ${friendlySize(raw.diameterKm)}. ${
        raw.diameterKm > 1
          ? "You wouldn't miss it if it was next to you!"
          : "Sounds small, but at cosmic speeds even tiny rocks carry huge energy!"
      }`,
      emoji: '📏',
    });
  } else if (raw.absoluteMagnitude != null) {
    const h = raw.absoluteMagnitude;
    let hint: string;
    if (h > 28) hint = "very small — probably a few meters, like a car";
    else if (h > 24) hint = "probably 30–50 meters — the size of a big building";
    else if (h > 20) hint = "likely a few hundred meters — stadium-sized!";
    else if (h > 15) hint = "probably a few kilometers wide — seriously big!";
    else hint = "really big — possibly tens of kilometers across!";
    qaList.push({
      question: 'How big is it?',
      answer: `We don't have an exact measurement yet, but based on its brightness, ${name} is ${hint}.`,
      emoji: '📏',
    });
  }

  // ── 3. Could it hit Earth? / Climate impact
  {
    let a: string;
    if (raw.isPha) {
      a = `${name} is classified as "Potentially Hazardous" — but don't panic! That's a label scientists give to any asteroid that's big enough and passes close enough to deserve extra attention. `;
      if (raw.diameterKm && raw.diameterKm > 1) {
        a += `If something this big ever hit Earth (very unlikely!), it could kick up dust, block sunlight, and cool the climate for months — similar to a volcanic winter. `;
      } else if (raw.diameterKm && raw.diameterKm > 0.05) {
        a += `An impact (extremely unlikely!) could cause powerful shockwaves and local damage, but wouldn't affect the global climate. `;
      }
      a += `The good news? NASA and space agencies worldwide track it constantly, and we even have technology to deflect asteroids now — the DART mission proved it works!`;
    } else {
      a = `No danger here! ${name} is NOT a threat to Earth. `;
      if (raw.closeApproaches.length > 0) {
        a += `It'll pass at a safe ${friendlyDistance(raw.closeApproaches[0].distKm)}. `;
      }
      a += "Think of it as a friendly neighbor passing by and saying hi! No climate impact, just a cool thing to know about. 👋";
    }
    qaList.push({ question: 'Could it hit Earth?', answer: a, emoji: '🌍' });
  }

  // ── 4. When & where can I see it?
  if (raw.closeApproaches.length > 0) {
    const next = raw.closeApproaches[0];
    const dateStr = friendlyDate(next.date);
    let a = `Mark your calendar! The next close approach is around ${dateStr}. `;

    if (raw.absoluteMagnitude != null && raw.absoluteMagnitude < 20) {
      a += `This one might actually be visible through a backyard telescope — how cool is that? Check a stargazing app like Stellarium or SkySafari for exactly where to look in the night sky.`;
    } else if (raw.absoluteMagnitude != null && raw.absoluteMagnitude < 24) {
      a += `You'd need a decent telescope (8 inches or bigger) to spot it, but if you have access to one, it's worth the effort! Astronomy clubs often host viewing events for close approaches like this.`;
    } else {
      a += `This one is too faint to see without professional equipment, but you can follow its journey in real-time right here on AstroView or on NASA's Eyes on Asteroids website!`;
    }

    // Add hemisphere visibility hint based on approach month
    try {
      const cleaned = next.date.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) {
        const month = d.getMonth();
        if (month >= 3 && month <= 8) {
          a += ' Northern hemisphere observers usually have better viewing conditions around this time of year.';
        } else {
          a += ' Southern hemisphere observers often get great views during this season.';
        }
      }
    } catch { /* skip hint */ }

    qaList.push({ question: 'When can I see it?', answer: a, emoji: '🔭' });

    // Multiple upcoming passes
    if (raw.closeApproaches.length > 1) {
      const list = raw.closeApproaches.slice(0, 4).map(
        (ca) => `• ${friendlyDate(ca.date)} — passes at ${friendlyDistance(ca.distKm)}`
      ).join('\n');
      qaList.push({
        question: 'Any other close passes coming up?',
        answer: `Here's when ${name} swings by Earth:\n\n${list}`,
        emoji: '📅',
      });
    }
  }

  // ── 5. How fast is it going?
  if (raw.closeApproaches.length > 0 && raw.closeApproaches[0].velocityKmS) {
    const v = raw.closeApproaches[0].velocityKmS;
    const nySecs = ((5570 / (v * 3600)) * 60).toFixed(0);
    qaList.push({
      question: 'How fast does it travel?',
      answer: `During its flyby, ${name} zips along at ${friendlySpeed(v)} At that speed, you could fly from New York to London in about ${nySecs} seconds! 🚀`,
      emoji: '💨',
    });
  }

  // ── 6. Who found it?
  if (raw.discoveryDate || raw.discoverer) {
    let a = '';
    if (raw.discoverer && raw.discoveryDate) {
      a = `${name} was first spotted by ${raw.discoverer} on ${raw.discoveryDate}`;
      if (raw.discoverySite) a += ` at ${raw.discoverySite}`;
      a += '. ';
    } else if (raw.discoveryDate) {
      a = `${name} was first spotted on ${raw.discoveryDate}. `;
    }
    a += "Every new discovery adds another piece to the puzzle of our solar system!";
    qaList.push({ question: 'Who discovered it?', answer: a, emoji: '🧑‍🔬' });
  }

  // ── 7. Fun fact
  {
    const facts: string[] = [];
    if (raw.rotationPeriodHrs) {
      const hrs = raw.rotationPeriodHrs;
      if (hrs < 1) facts.push(`${name} spins crazy fast — one full rotation in just ${(hrs * 60).toFixed(0)} minutes! Imagine a sunrise every ${(hrs * 60 / 2).toFixed(0)} minutes.`);
      else if (hrs < 5) facts.push(`A "day" on ${name} lasts only ${hrs.toFixed(1)} hours. You'd barely finish lunch before sunset!`);
      else if (hrs < 24) facts.push(`A day on ${name} is about ${hrs.toFixed(1)} hours — ${hrs < 12 ? "shorter" : "about the same as"} an Earth day!`);
      else facts.push(`A day on ${name} lasts ${hrs.toFixed(0)} hours. That's ${(hrs / 24).toFixed(1)} Earth days for one single spin!`);
    }
    if (raw.albedo != null) {
      if (raw.albedo < 0.05) facts.push(`${name} is darker than charcoal — it reflects less than 5% of sunlight! Imagine a space rock as dark as a lump of coal.`);
      else if (raw.albedo > 0.3) facts.push(`${name} is surprisingly shiny! It reflects ${(raw.albedo * 100).toFixed(0)}% of sunlight — think of a dusty mirror floating in space.`);
    }
    if (raw.orbitalPeriodDays) {
      const yrs = raw.orbitalPeriodDays / 365.25;
      if (yrs > 5) facts.push(`${name} takes ${periodToHuman(raw.orbitalPeriodDays)} to go around the Sun. If you were born there, you might not have had your first birthday yet!`);
    }
    if (raw.isNeo && !raw.isPha) facts.push(`${name} is a Near-Earth Object — it comes close, but it's completely harmless. It's like a cosmic neighbor who waves as they drive past!`);

    if (facts.length > 0) {
      qaList.push({ question: 'Tell me something cool!', answer: facts[Math.floor(Math.random() * facts.length)], emoji: '✨' });
    }
  }

  // ── Tagline
  let tagline: string;
  if (raw.isPha) tagline = "A closely-watched space rock that keeps astronomers on their toes!";
  else if (raw.isNeo) tagline = "A nearby cosmic neighbor zooming through our part of the solar system";
  else if (raw.orbitClass?.toLowerCase().includes('main')) tagline = "A resident of the asteroid belt, cruising between Mars and Jupiter";
  else tagline = "A fascinating space rock on its endless journey around the Sun";

  return { name, tagline, qaList, nasaUrl };
}

/* ── Main fetch function ───────────────────────────────────────── */

export async function fetchAsteroidInfo(
  id: string,
  name: string,
): Promise<AsteroidChatInfo> {
  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const sbdbName = SBDB_NAME_MAP[id] ?? name;

  try {
    const resp = await axios.get('https://ssd-api.jpl.nasa.gov/sbdb.api', {
      params: {
        sstr: sbdbName,
        'phys-par': 'true',
        discovery: 'true',
        orbit: 'true',
        'ca-data': 'true',
        'ca-body': 'Earth',
        'ca-tbl': 'true',
      },
      timeout: 10000,
    });

    const d = resp.data;

    // Parse physical params
    const phys: Record<string, string> = {};
    if (d.phys_par) for (const p of d.phys_par) phys[p.name] = p.value;

    // Parse orbital elements
    const orbMap: Record<string, string> = {};
    if (d.orbit?.elements) for (const el of d.orbit.elements) orbMap[el.name] = el.value;

    // Parse close approaches
    const cas: SbdbRaw['closeApproaches'] = [];
    if (d.ca_data) {
      const f: string[] = d.ca_fields ?? [];
      const iDate = f.indexOf('cd');
      const iDist = f.indexOf('dist');
      const iVel = f.indexOf('v_rel');
      for (const row of d.ca_data.slice(0, 6)) {
        cas.push({
          date: iDate >= 0 ? row[iDate] : '',
          distKm: iDist >= 0 ? parseFloat(row[iDist]) * 149_597_870.7 : 0,
          velocityKmS: iVel >= 0 ? parseFloat(row[iVel]) : 0,
        });
      }
    }

    const raw: SbdbRaw = {
      fullName: d.object?.fullname ?? d.object?.des ?? name,
      isNeo: d.object?.neo === true || d.object?.neo === 'Y',
      isPha: d.object?.pha === true || d.object?.pha === 'Y',
      orbitClass: d.orbit?.class?.name,
      discoveryDate: d.discovery?.date,
      discoverer: d.discovery?.who,
      discoverySite: d.discovery?.site,
      diameterKm: phys['diameter'] ? parseFloat(phys['diameter']) : undefined,
      albedo: phys['albedo'] ? parseFloat(phys['albedo']) : undefined,
      rotationPeriodHrs: phys['rot_per'] ? parseFloat(phys['rot_per']) : undefined,
      absoluteMagnitude: orbMap['H'] ? parseFloat(orbMap['H']) : (d.object?.H ? parseFloat(d.object.H) : undefined),
      semiMajorAxisAu: orbMap['a'] ? parseFloat(orbMap['a']) : undefined,
      orbitalPeriodDays: orbMap['per'] ? parseFloat(orbMap['per']) : undefined,
      moidAu: orbMap['moid'] ? parseFloat(orbMap['moid']) : (d.orbit?.moid ? parseFloat(d.orbit.moid) : undefined),
      closeApproaches: cas,
    };

    const info = buildQA(name, raw);
    cache.set(id, { data: info, ts: Date.now() });
    return info;
  } catch (err) {
    console.warn(`SBDB API error for "${sbdbName}":`, err);

    // Graceful fallback
    return {
      name,
      tagline: 'A space rock in our solar system',
      qaList: [
        {
          question: `What is ${name}?`,
          answer: `${name} is an asteroid tracked by NASA. We couldn't reach NASA's database right now — try again in a moment!`,
          emoji: '🪨',
        },
        {
          question: 'Could it hit Earth?',
          answer: "Scientists keep a close watch on all known asteroids. No need to worry — if there were a real threat, space agencies would know years in advance and have a plan!",
          emoji: '🌍',
        },
      ],
      nasaUrl: `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(sbdbName)}`,
    };
  }
}
