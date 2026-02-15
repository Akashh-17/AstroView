/**
 * SatelliteSidebar.tsx
 *
 * Enhanced left sidebar with rich category cards, orbit type breakdowns,
 * satellite search, statistics, and a scrollable satellite list.
 */

import { useMemo, useState } from 'react';
import { twoline2satrec } from 'satellite.js';
import { useSatelliteStore } from '../../store/satelliteStore';
import { SATELLITE_CATEGORIES, type SatelliteInfo } from '../../data/satelliteData';

/** Classify a satellite into LEO / MEO / GEO / HEO from its TLE. */
function classifyOrbit(sat: SatelliteInfo): string {
    try {
        const satrec = twoline2satrec(sat.tle.line1, sat.tle.line2);
        const mu = 398600.4418;
        const n = satrec.no / 60; // rad/s
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

export default function SatelliteSidebar() {
    const satellites = useSatelliteStore((s) => s.satellites);
    const activeCategories = useSatelliteStore((s) => s.activeCategories);
    const toggleCategory = useSatelliteStore((s) => s.toggleCategory);
    const searchQuery = useSatelliteStore((s) => s.searchQuery);
    const setSearchQuery = useSatelliteStore((s) => s.setSearchQuery);
    const selectedSatelliteId = useSatelliteStore((s) => s.selectedSatelliteId);
    const selectSatellite = useSatelliteStore((s) => s.selectSatellite);

    const [expandedCat, setExpandedCat] = useState<string | null>(null);

    // Per-category counts + orbit type breakdown
    const categoryStats = useMemo(() => {
        const stats: Record<string, {
            total: number;
            leo: number;
            meo: number;
            geo: number;
            heo: number;
        }> = {};
        for (const cat of SATELLITE_CATEGORIES) {
            stats[cat.id] = { total: 0, leo: 0, meo: 0, geo: 0, heo: 0 };
        }
        for (const sat of satellites) {
            const s = stats[sat.category];
            if (!s) continue;
            s.total++;
            const orbit = classifyOrbit(sat);
            if (orbit === 'LEO') s.leo++;
            else if (orbit === 'MEO') s.meo++;
            else if (orbit === 'GEO') s.geo++;
            else s.heo++;
        }
        return stats;
    }, [satellites]);

    // Overall stats
    const totalStats = useMemo(() => {
        let leo = 0, meo = 0, geo = 0, heo = 0;
        for (const s of Object.values(categoryStats)) {
            leo += s.leo; meo += s.meo; geo += s.geo; heo += s.heo;
        }
        return { total: satellites.length, leo, meo, geo, heo };
    }, [categoryStats, satellites.length]);

    // Filtered satellite list
    const filteredList = useMemo(() => {
        let list = satellites;
        if (activeCategories.size > 0) {
            list = list.filter(s => activeCategories.has(s.category));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => s.name.toLowerCase().includes(q));
        }
        return list.slice(0, 200);
    }, [satellites, activeCategories, searchQuery]);

    return (
        <div className="w-[340px] flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-black/60 backdrop-blur-md overflow-hidden">
            {/* ── Header & Stats ───────────────────────── */}
            <div className="px-4 pt-4 pb-2">
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#4A9EFF]/60 mb-2">
                    Satellite Categories
                </h2>
                {/* Orbit altitude summary badges */}
                <div className="flex items-center gap-1 mb-2 flex-wrap">
                    <OrbitBadge label="LEO" count={totalStats.leo} color="#4A9EFF" />
                    <OrbitBadge label="MEO" count={totalStats.meo} color="#4AFF7C" />
                    <OrbitBadge label="GEO" count={totalStats.geo} color="#FFAA40" />
                    {totalStats.heo > 0 && <OrbitBadge label="HEO" count={totalStats.heo} color="#FF6B6B" />}
                </div>
                <p className="text-[10px] text-white/20">
                    {totalStats.total.toLocaleString()} satellites loaded
                </p>
            </div>

            {/* ── Search ───────────────────────────────── */}
            <div className="px-4 pb-3">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15 text-[11px]">🔍</span>
                    <input
                        type="text"
                        placeholder="Search satellites..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#4A90D9]/50 focus:bg-white/[0.06] transition-all"
                    />
                </div>
            </div>

            {/* ── Category Cards ──────────────────────── */}
            <div className="px-3 pb-2 space-y-1 overflow-y-auto flex-shrink-0" style={{ maxHeight: '48vh' }}>
                {SATELLITE_CATEGORIES.map((cat) => {
                    const isActive = activeCategories.size === 0 || activeCategories.has(cat.id);
                    const stats = categoryStats[cat.id];
                    const isExpanded = expandedCat === cat.id;

                    return (
                        <div key={cat.id}>
                            {/* Category button */}
                            <button
                                onClick={() => toggleCategory(cat.id)}
                                onDoubleClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                                className={`w-full text-left rounded-lg transition-all duration-200 ${
                                    isActive
                                        ? 'bg-white/[0.05] border border-white/[0.08]'
                                        : 'bg-transparent border border-transparent hover:bg-white/[0.02] opacity-40 hover:opacity-60'
                                }`}
                                style={{
                                    borderLeftColor: isActive ? cat.color : 'transparent',
                                    borderLeftWidth: '3px',
                                }}
                            >
                                <div className="px-3 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-sm flex-shrink-0">{cat.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-semibold truncate text-white/90">
                                                    {cat.label}
                                                </span>
                                                <span
                                                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                                                    style={{
                                                        color: cat.color,
                                                        backgroundColor: `${cat.color}18`,
                                                    }}
                                                >
                                                    {stats?.total || 0}
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-white/25 mt-0.5 truncate">
                                                {cat.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Orbit type mini distribution bar */}
                                    {isActive && stats && stats.total > 0 && (
                                        <div className="mt-2 ml-7">
                                            <div className="flex items-center gap-0.5 h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                                                {stats.leo > 0 && (
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${(stats.leo / stats.total) * 100}%`,
                                                            backgroundColor: '#4A9EFF',
                                                        }}
                                                        title={`LEO: ${stats.leo}`}
                                                    />
                                                )}
                                                {stats.meo > 0 && (
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${(stats.meo / stats.total) * 100}%`,
                                                            backgroundColor: '#4AFF7C',
                                                        }}
                                                        title={`MEO: ${stats.meo}`}
                                                    />
                                                )}
                                                {stats.geo > 0 && (
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${(stats.geo / stats.total) * 100}%`,
                                                            backgroundColor: '#FFAA40',
                                                        }}
                                                        title={`GEO: ${stats.geo}`}
                                                    />
                                                )}
                                                {stats.heo > 0 && (
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${(stats.heo / stats.total) * 100}%`,
                                                            backgroundColor: '#FF6B6B',
                                                        }}
                                                        title={`HEO: ${stats.heo}`}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[8px] text-white/20">{cat.orbitType}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Expanded orbit breakdown */}
                            {isExpanded && isActive && stats && (
                                <div className="ml-9 mr-3 mb-1 mt-0.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <OrbitStat label="LEO" count={stats.leo} color="#4A9EFF" />
                                        <OrbitStat label="MEO" count={stats.meo} color="#4AFF7C" />
                                        <OrbitStat label="GEO" count={stats.geo} color="#FFAA40" />
                                        <OrbitStat label="HEO" count={stats.heo} color="#FF6B6B" />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Divider ──────────────────────────────── */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent mx-4 my-1" />

            {/* ── Satellite List ────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                <h3 className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 px-2 py-1 flex items-center justify-between">
                    <span>{filteredList.length > 0 ? `Showing ${filteredList.length}` : 'No matches'}</span>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-white/20 hover:text-white/50 text-[10px] transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </h3>

                {filteredList.map((sat) => {
                    const cat = SATELLITE_CATEGORIES.find(c => c.id === sat.category);
                    const isSelected = sat.id === selectedSatelliteId;

                    return (
                        <button
                            key={sat.id}
                            onClick={() => selectSatellite(sat.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-all group ${
                                isSelected
                                    ? 'bg-[#4A90D9]/[0.12] border border-[#4A90D9]/30'
                                    : 'border border-transparent hover:bg-white/[0.03]'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-150"
                                    style={{ backgroundColor: cat?.color || '#888' }}
                                />
                                <span className={`text-[11px] truncate ${
                                    isSelected ? 'text-[#6BB5FF] font-medium' : 'text-white/60'
                                }`}>
                                    {sat.name}
                                </span>
                                {sat.alt !== undefined && (
                                    <span className="text-[9px] text-white/15 font-mono ml-auto flex-shrink-0">
                                        {Math.round(sat.alt)} km
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Helper Components ──────────────────────────────────────────────────────

function OrbitBadge({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}12` }}
        >
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[8px] font-bold tracking-wider" style={{ color }}>{label}</span>
            <span className="text-[9px] font-mono" style={{ color: `${color}99` }}>{count}</span>
        </div>
    );
}

function OrbitStat({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div>
            <div className="text-[12px] font-mono font-bold" style={{ color }}>{count}</div>
            <div className="text-[8px] text-white/25">{label}</div>
        </div>
    );
}
