/**
 * RightPanel.tsx — Context panel showing selected body details
 * Supports Sun, planets, moons, and asteroids
 */
import { BODY_MAP } from '../../data/planetaryData';
import { useSolarSystemStore } from '../../store/solarSystemStore';

/* ── helpers ────────────────────────────────────────────────────── */

function fmt(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(decimals) + ' B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(decimals) + ' M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(decimals) + ' K';
  return n.toFixed(decimals);
}

function tempDisplay(k: number): string {
  const c = k - 273.15;
  return `${k.toLocaleString()} K  (${c.toFixed(0)} °C)`;
}

function rotationDisplay(hrs: number): string {
  const abs = Math.abs(hrs);
  if (abs >= 48) {
    const days = abs / 24;
    return `${days.toFixed(1)} days`;
  }
  return `${abs.toFixed(2)} hrs`;
}

/* ── component ──────────────────────────────────────────────────── */

export default function RightPanel() {
  const selectedBody = useSolarSystemStore((s) => s.selectedBody);
  const selectBody = useSolarSystemStore((s) => s.selectBody);

  if (!selectedBody) return null;

  const body = BODY_MAP[selectedBody];
  if (!body) return null;

  const isSun = body.id === 'sun';
  const p = body.physical;

  const distAU = !isSun ? body.orbital.semiMajorAxis : 0;
  const distKm = distAU * 149597870.7;
  const periodDays = body.orbital.orbitalPeriod * 365.25;
  const periodYears = body.orbital.orbitalPeriod;

  return (
    <div className="absolute top-14 right-0 bottom-16 w-80 xl:w-96 z-[60] glass-panel rounded-l-2xl overflow-hidden animate-slide-right pointer-events-auto flex flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/[0.06]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span
              className="inline-block text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full mb-1.5"
              style={{ backgroundColor: body.display.color + '30', color: body.display.color }}
            >
              {body.display.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight truncate">
              {body.name}
            </h2>
          </div>
          <button
            onClick={() => selectBody(null)}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-white/30 hover:text-white hover:bg-white/[0.06] transition-all text-sm"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Description ────────────────────────────────────── */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/[0.06]">
        <p className="text-xs text-white/45 leading-relaxed">{body.display.description}</p>
      </div>

      {/* ── Scrollable Data ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5 scrollbar-thin">

        {/* Orbital Data (planets only) */}
        {!isSun && (
          <StatSection title="Orbital Data" accent={body.display.color}>
            <StatRow label="Distance from Sun" value={`${fmt(distKm)} km`} />
            <StatRow label="Semi-Major Axis" value={`${distAU.toFixed(3)} AU`} />
            <StatRow
              label="Orbital Period"
              value={periodYears >= 2 ? `${periodYears.toFixed(2)} yrs` : `${periodDays.toFixed(1)} days`}
            />
            <StatRow label="Eccentricity" value={body.orbital.eccentricity.toFixed(4)} />
            <StatRow label="Inclination" value={`${body.orbital.inclination.toFixed(2)}°`} />
          </StatSection>
        )}

        {/* Stellar Properties (Sun only) */}
        {isSun && (
          <StatSection title="Stellar Properties" accent={body.display.color}>
            {p.spectralType != null && <StatRow label="Spectral Type" value={p.spectralType} />}
            {p.luminosity != null && <StatRow label="Luminosity" value={`${p.luminosity} L☉`} />}
            {p.absoluteMagnitude != null && <StatRow label="Abs. Magnitude" value={p.absoluteMagnitude.toFixed(2)} />}
            {p.meanTemp != null && <StatRow label="Photosphere Temp" value={tempDisplay(p.meanTemp)} />}
          </StatSection>
        )}

        {/* Physical Properties */}
        <StatSection title="Physical Properties" accent={body.display.color}>
          <StatRow label="Radius" value={`${fmt(p.radius)} km`} />
          <StatRow label="Mass" value={`${fmt(p.mass)} × 10²⁴ kg`} />
          {p.density != null && <StatRow label="Density" value={`${p.density.toFixed(3)} g/cm³`} />}
          {p.gravity != null && <StatRow label="Surface Gravity" value={`${p.gravity.toFixed(2)} m/s²`} />}
          {p.escapeVelocity != null && (
            <StatRow label="Escape Velocity" value={`${p.escapeVelocity.toFixed(1)} km/s`} />
          )}
          <StatRow label="Axial Tilt" value={`${p.axialTilt.toFixed(2)}°`} />
          <StatRow label="Rotation Period" value={rotationDisplay(p.rotationPeriod)} />
          {p.rotationPeriod < 0 && <StatRow label="Rotation" value="Retrograde ↺" />}
        </StatSection>

        {/* Atmosphere & Environment */}
        {(p.atmosphere || p.meanTemp != null || p.surfacePressure != null || p.magneticField != null) && !isSun && (
          <StatSection title="Atmosphere & Environment" accent={body.display.color}>
            {p.atmosphere && <StatRow label="Composition" value={p.atmosphere} />}
            {p.meanTemp != null && <StatRow label="Mean Temperature" value={tempDisplay(p.meanTemp)} />}
            {p.surfacePressure != null && (
              <StatRow label="Surface Pressure" value={p.surfacePressure === 0 ? 'None' : `${p.surfacePressure} atm`} />
            )}
            {p.magneticField != null && (
              <StatRow label="Magnetic Field" value={p.magneticField ? 'Yes' : 'No'} />
            )}
          </StatSection>
        )}

        {/* Satellites */}
        {p.numberOfMoons != null && (
          <StatSection title="Satellites" accent={body.display.color}>
            <StatRow label="Known Moons" value={p.numberOfMoons.toString()} />
          </StatSection>
        )}

        {/* Track button */}
        <button
          onClick={() => useSolarSystemStore.getState().focusBody(body.id)}
          className="w-full py-2.5 rounded-lg border text-sm font-medium transition-colors"
          style={{
            borderColor: body.display.color + '50',
            color: body.display.color,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = body.display.color + '18')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          🎯 Track {body.name}
        </button>
      </div>
    </div>
  );
}

/* ── sub-components ─────────────────────────────────────────────── */

function StatSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2.5 flex items-center gap-2"
        style={{ color: accent ? accent + '90' : 'rgba(255,255,255,0.30)' }}
      >
        <span className="inline-block w-3 h-px" style={{ background: accent ?? '#666' }} />
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-baseline gap-3 py-1 px-2.5 rounded bg-white/[0.025] hover:bg-white/[0.05] transition-colors">
      <span className="text-[10px] sm:text-[11px] text-white/40 uppercase tracking-wide whitespace-nowrap">
        {label}
      </span>
      <span className="text-[12px] sm:text-sm text-white font-medium tabular-nums text-right">
        {value}
      </span>
    </div>
  );
}
