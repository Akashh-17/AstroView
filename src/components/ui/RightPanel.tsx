/**
 * RightPanel.tsx — Context panel showing selected body details
 */
import { BODY_MAP } from '../../data/planetaryData';
import { useSolarSystemStore } from '../../store/solarSystemStore';

function formatNumber(n: number, decimals = 2): string {
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(decimals) + 'B';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(decimals) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(decimals) + 'K';
    return n.toFixed(decimals);
}

export default function RightPanel() {
    const selectedBody = useSolarSystemStore((s) => s.selectedBody);
    const selectBody = useSolarSystemStore((s) => s.selectBody);

    if (!selectedBody) return null;

    const body = BODY_MAP[selectedBody];
    if (!body) return null;

    const distAU = body.id !== 'sun' ? body.orbital.semiMajorAxis : 0;
    const distKm = distAU * 149597870.7;
    const periodDays = body.orbital.orbitalPeriod * 365.25;

    return (
        <div className="absolute top-14 right-0 bottom-16 w-80 z-40 glass-panel rounded-l-2xl overflow-hidden animate-slide-right pointer-events-auto flex flex-col">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
                <div className="flex items-start justify-between">
                    <div>
                        <span
                            className="inline-block text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full mb-2"
                            style={{ backgroundColor: body.display.color + '30', color: body.display.color }}
                        >
                            {body.display.category}
                        </span>
                        <h2 className="text-2xl font-light text-white tracking-tight">{body.name}</h2>
                    </div>
                    <button
                        onClick={() => selectBody(null)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-white/30 hover:text-white hover:bg-white/[0.06] transition-all text-sm"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Description */}
            <div className="px-5 py-4 border-b border-white/[0.06]">
                <p className="text-xs text-white/45 leading-relaxed">{body.display.description}</p>
            </div>

            {/* Stats */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Orbital Data */}
                {body.id !== 'sun' && (
                    <StatSection title="Orbital Data">
                        <StatRow label="Distance from Sun" value={`${formatNumber(distKm)} km`} />
                        <StatRow label="Semi-Major Axis" value={`${distAU.toFixed(3)} AU`} />
                        <StatRow label="Orbital Period" value={`${periodDays.toFixed(1)} days`} />
                        <StatRow label="Eccentricity" value={body.orbital.eccentricity.toFixed(4)} />
                        <StatRow label="Inclination" value={`${body.orbital.inclination.toFixed(2)}°`} />
                    </StatSection>
                )}

                {/* Physical Data */}
                <StatSection title="Physical Properties">
                    <StatRow label="Radius" value={`${formatNumber(body.physical.radius)} km`} />
                    <StatRow label="Axial Tilt" value={`${body.physical.axialTilt.toFixed(1)}°`} />
                    <StatRow label="Rotation Period" value={`${Math.abs(body.physical.rotationPeriod).toFixed(1)} hrs`} />
                    {body.physical.rotationPeriod < 0 && (
                        <StatRow label="Rotation" value="Retrograde" />
                    )}
                </StatSection>

                {/* Track button */}
                <button
                    onClick={() => useSolarSystemStore.getState().focusBody(body.id)}
                    className="w-full py-2.5 rounded-lg border border-[#4A90D9]/30 text-[#6BB5FF] text-sm font-medium hover:bg-[#4A90D9]/10 transition-colors"
                >
                    🎯 Track {body.name}
                </button>
            </div>
        </div>
    );
}

function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2.5">{title}</h3>
            <div className="space-y-1.5">{children}</div>
        </div>
    );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex justify-between items-baseline py-1 px-2.5 rounded bg-white/[0.02]">
            <span className="text-[11px] text-white/35 uppercase tracking-wide">{label}</span>
            <span className="text-sm text-white font-medium tabular-nums">{value}</span>
        </div>
    );
}
