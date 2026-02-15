/**
 * SatelliteSidebar.tsx
 *
 * Premium left sidebar with clean category filters, global orbit stats,
 * search, and a scrollable satellite list with zoom-to-satellite on click.
 */

import { useMemo, useState } from 'react';
import { twoline2satrec } from 'satellite.js';
import { useSatelliteStore } from '../../store/satelliteStore';
import {
    SATELLITE_CATEGORIES,
    VITAL_SIGN_SATELLITES,
    type SatelliteInfo,
} from '../../data/satelliteData';

/* ── orbit classifier ────────────────────────────────────────────────── */
function classifyOrbit(sat: SatelliteInfo): string {
    try {
        const satrec = twoline2satrec(sat.tle.line1, sat.tle.line2);
        const mu = 398600.4418;
        const n = satrec.no / 60;
        const a = Math.pow(mu / (n * n), 1 / 3);
        const alt = a - 6371;
        if (alt < 2000) return 'LEO';
        if (alt < 35000) return 'MEO';
        if (alt >= 35000 && alt < 36500) return 'GEO';
        return 'HEO';
    } catch {
        return 'LEO';
    }
}

/* ── tiny ring animation (pure CSS, no deps) ─────────────────────────── */
const RING_KEYFRAMES = `
@keyframes sat-pulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1;   }
}`;

export default function SatelliteSidebar() {
    const satellites = useSatelliteStore((s) => s.satellites);
    const activeCategories = useSatelliteStore((s) => s.activeCategories);
    const toggleCategory = useSatelliteStore((s) => s.toggleCategory);
    const searchQuery = useSatelliteStore((s) => s.searchQuery);
    const setSearchQuery = useSatelliteStore((s) => s.setSearchQuery);
    const selectedSatelliteId = useSatelliteStore(
        (s) => s.selectedSatelliteId,
    );
    const focusOnSatellite = useSatelliteStore((s) => s.focusOnSatellite);

    const [hoveredCat, setHoveredCat] = useState<string | null>(null);

    /* ── per-category + global stats ─────────────────────────────── */
    const { categoryStats, globalStats } = useMemo(() => {
        const cs: Record<
            string,
            { total: number; leo: number; meo: number; geo: number; heo: number }
        > = {};
        for (const c of SATELLITE_CATEGORIES)
            cs[c.id] = { total: 0, leo: 0, meo: 0, geo: 0, heo: 0 };

        let leo = 0,
            meo = 0,
            geo = 0,
            heo = 0;
        for (const sat of satellites) {
            const s = cs[sat.category];
            if (!s) continue;
            s.total++;
            const o = classifyOrbit(sat);
            if (o === 'LEO') { s.leo++; leo++; }
            else if (o === 'MEO') { s.meo++; meo++; }
            else if (o === 'GEO') { s.geo++; geo++; }
            else { s.heo++; heo++; }
        }
        return {
            categoryStats: cs,
            globalStats: { total: satellites.length, leo, meo, geo, heo },
        };
    }, [satellites]);

    const activeVitalSign = useSatelliteStore((s) => s.activeVitalSign);

    /* ── filtered list for bottom panel ──────────────────────────── */
    const filteredList = useMemo(() => {
        let list = satellites;
        if (activeCategories.size > 0)
            list = list.filter((s) => activeCategories.has(s.category));
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((s) => s.name.toLowerCase().includes(q));
        }
        // When a vital‑sign data layer is active, only show relevant sats
        if (activeVitalSign && activeVitalSign !== 'satellites_now' && activeVitalSign !== 'visible_earth') {
            const relevantNames = VITAL_SIGN_SATELLITES[activeVitalSign];
            if (relevantNames && relevantNames.length > 0) {
                list = list.filter((s) =>
                    relevantNames.some((name) => s.name.toUpperCase().includes(name))
                );
            }
        }
        return list.slice(0, 200);
    }, [satellites, activeCategories, searchQuery, activeVitalSign]);

    return (
        <div className="w-[310px] flex-shrink-0 flex flex-col bg-[#0a0e17]/90 backdrop-blur-xl border-r border-white/[0.04] overflow-hidden select-none">
            {/* inject pulse keyframe */}
            <style>{RING_KEYFRAMES}</style>

            {/* ======== HEADER ======== */}
            <div className="px-5 pt-5 pb-3">
                {/* title row */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2 w-2">
                        <span
                            className="absolute inline-flex h-full w-full rounded-full bg-[#4A9EFF] opacity-60"
                            style={{ animation: 'sat-pulse 2s ease-in-out infinite' }}
                        />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4A9EFF]" />
                    </span>
                    <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/50">
                        Tracking
                    </h2>
                    <span className="text-[10px] text-white/20 font-mono ml-auto">
                        {globalStats.total.toLocaleString()}
                    </span>
                </div>

                {/* orbit stat row */}
                <div className="flex gap-3 mb-4">
                    <StatChip label="LEO" value={globalStats.leo} color="#4A9EFF" />
                    <StatChip label="MEO" value={globalStats.meo} color="#4AFF7C" />
                    <StatChip label="GEO" value={globalStats.geo} color="#FFAA40" />
                    {globalStats.heo > 0 && (
                        <StatChip label="HEO" value={globalStats.heo} color="#FF6B6B" />
                    )}
                </div>

                {/* search */}
                <div className="relative group">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-[#4A9EFF]/60 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                        />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search satellites..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/80 placeholder:text-white/15 focus:outline-none focus:border-[#4A9EFF]/40 focus:bg-white/[0.05] transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 text-[11px] transition-colors"
                        >
                            x
                        </button>
                    )}
                </div>
            </div>

            {/* thin separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mx-5" />

            {/* ======== CATEGORIES ======== */}
            <div
                className="px-3 py-3 space-y-[3px] overflow-y-auto flex-shrink-0 scrollbar-thin"
                style={{ maxHeight: '46vh' }}
            >
                {SATELLITE_CATEGORIES.map((cat) => {
                    const isActive =
                        activeCategories.size === 0 || activeCategories.has(cat.id);
                    const stats = categoryStats[cat.id];
                    const isHovered = hoveredCat === cat.id;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            onMouseEnter={() => setHoveredCat(cat.id)}
                            onMouseLeave={() => setHoveredCat(null)}
                            className={`w-full text-left rounded-[10px] transition-all duration-300 overflow-hidden ${
                                isActive
                                    ? 'bg-white/[0.04]'
                                    : 'bg-transparent opacity-35 hover:opacity-55'
                            }`}
                            style={{
                                boxShadow: isActive && isHovered
                                    ? `inset 0 0 20px ${cat.color}08, 0 0 12px ${cat.color}06`
                                    : 'none',
                            }}
                        >
                            <div className="flex items-center gap-3 px-3.5 py-3">
                                {/* color dot */}
                                <span
                                    className="w-[7px] h-[7px] rounded-full flex-shrink-0 transition-transform duration-300"
                                    style={{
                                        backgroundColor: cat.color,
                                        transform: isHovered ? 'scale(1.5)' : 'scale(1)',
                                        boxShadow: isHovered
                                            ? `0 0 8px ${cat.color}80`
                                            : 'none',
                                    }}
                                />

                                {/* label + description */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-medium text-white/85 truncate">
                                            {cat.label}
                                        </span>
                                        <span
                                            className="text-[10px] font-mono tabular-nums flex-shrink-0"
                                            style={{ color: `${cat.color}AA` }}
                                        >
                                            {stats?.total || 0}
                                        </span>
                                    </div>

                                    {/* orbit micro-bar */}
                                    {isActive && stats && stats.total > 0 && (
                                        <div className="flex gap-[2px] h-[3px] rounded-full overflow-hidden mt-1.5 bg-white/[0.03]">
                                            {stats.leo > 0 && (
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${(stats.leo / stats.total) * 100}%`,
                                                        backgroundColor: '#4A9EFF',
                                                    }}
                                                />
                                            )}
                                            {stats.meo > 0 && (
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${(stats.meo / stats.total) * 100}%`,
                                                        backgroundColor: '#4AFF7C',
                                                    }}
                                                />
                                            )}
                                            {stats.geo > 0 && (
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${(stats.geo / stats.total) * 100}%`,
                                                        backgroundColor: '#FFAA40',
                                                    }}
                                                />
                                            )}
                                            {stats.heo > 0 && (
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${(stats.heo / stats.total) * 100}%`,
                                                        backgroundColor: '#FF6B6B',
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* thin separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mx-5" />

            {/* ======== SATELLITE LIST ======== */}
            <div className="flex-1 overflow-y-auto px-3 pt-2 pb-3">
                <div className="flex items-center justify-between px-2 mb-1.5">
                    <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-white/20">
                        {filteredList.length > 0
                            ? `${filteredList.length} satellites`
                            : 'No matches'}
                    </span>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-[9px] text-[#4A9EFF]/50 hover:text-[#4A9EFF] transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="space-y-[2px]">
                    {filteredList.map((sat) => {
                        const cat = SATELLITE_CATEGORIES.find(
                            (c) => c.id === sat.category,
                        );
                        const isSelected = sat.id === selectedSatelliteId;

                        return (
                            <button
                                key={sat.id}
                                onClick={() => focusOnSatellite(sat.id)}
                                className={`w-full text-left px-3 py-[7px] rounded-lg transition-all duration-200 group flex items-center gap-2 ${
                                    isSelected
                                        ? 'bg-[#4A9EFF]/[0.08] border border-[#4A9EFF]/20'
                                        : 'border border-transparent hover:bg-white/[0.025]'
                                }`}
                            >
                                <span
                                    className="w-[5px] h-[5px] rounded-full flex-shrink-0 transition-all duration-200 group-hover:scale-150"
                                    style={{
                                        backgroundColor: cat?.color || '#888',
                                        boxShadow: isSelected
                                            ? `0 0 6px ${cat?.color || '#888'}80`
                                            : 'none',
                                    }}
                                />
                                <span
                                    className={`text-[10.5px] truncate flex-1 ${
                                        isSelected
                                            ? 'text-[#8BC8FF] font-medium'
                                            : 'text-white/50 group-hover:text-white/70'
                                    }`}
                                >
                                    {sat.name}
                                </span>
                                {sat.alt !== undefined && (
                                    <span className="text-[9px] text-white/12 font-mono tabular-nums flex-shrink-0">
                                        {Math.round(sat.alt)} km
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ── helper ───────────────────────────────────────────────────────────── */
function StatChip({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="flex items-center gap-1.5">
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
            />
            <span className="text-[9px] font-bold tracking-wider" style={{ color }}>
                {label}
            </span>
            <span
                className="text-[10px] font-mono tabular-nums"
                style={{ color: `${color}88` }}
            >
                {value}
            </span>
        </div>
    );
}
