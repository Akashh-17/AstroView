/**
 * LeftSidebar.tsx — Left sidebar panel with variant support
 * "solar-system" → Explore tab only (Star, Planets, Moons)
 * "asteroids"    → Asteroid Watch + Explore with asteroids
 */
import { useState, useMemo } from 'react';
import { PLANETS, MOONS, SUN, NAMED_ASTEROIDS, CLOSE_APPROACHES } from '../../data/planetaryData';
import type { CloseApproach } from '../../data/planetaryData';
import { useSolarSystemStore } from '../../store/solarSystemStore';
import { useUIStore } from '../../store/uiStore';
import AsteroidLearnMore from './AsteroidLearnMore';

interface LeftSidebarProps {
    variant?: 'solar-system' | 'asteroids';
}

const SOLAR_CATEGORIES = [
    { id: 'star', label: 'Star', icon: '☀', items: [SUN] },
    { id: 'planets', label: 'Planets', icon: '🪐', items: PLANETS },
    { id: 'moons', label: 'Moons', icon: '🌙', items: MOONS },
];

const ASTEROID_CATEGORIES = [
    { id: 'star', label: 'Star', icon: '☀', items: [SUN] },
    { id: 'planets', label: 'Planets', icon: '🪐', items: PLANETS },
    { id: 'moons', label: 'Moons', icon: '🌙', items: MOONS },
    { id: 'asteroids', label: 'Asteroids', icon: '☄', items: NAMED_ASTEROIDS },
];

function formatDistanceKm(km: number): string {
    if (km >= 1e6) return (km / 1e6).toFixed(1) + 'M km';
    if (km >= 1e3) return Math.round(km / 1e3).toLocaleString() + 'K km';
    return km.toLocaleString() + ' km';
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function ApproachCard({ approach }: { approach: CloseApproach }) {
    return (
        <div className={`px-3 py-2.5 rounded-lg border transition-all hover:bg-white/[0.03] ${
            approach.isHazardous 
                ? 'border-red-500/20 bg-red-500/[0.04]' 
                : 'border-white/[0.06] bg-white/[0.02]'
        }`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                    {approach.isHazardous && (
                        <span className="text-red-400 text-[10px]">⚠</span>
                    )}
                    <span className="text-xs font-bold text-white tracking-wide">
                        {approach.asteroidName}
                    </span>
                </div>
                <span className="text-[10px] text-white/30 font-mono whitespace-nowrap">
                    {formatDate(approach.date)}
                </span>
            </div>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div>
                        <div className="text-[9px] text-white/30 uppercase tracking-wider">Distance</div>
                        <div className="text-[11px] text-[#6BB5FF] font-mono font-semibold">
                            {formatDistanceKm(approach.distanceKm)}
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-white/30 uppercase tracking-wider">Est. Size</div>
                        <div className="text-[11px] text-white/70 font-mono">
                            ~{approach.estimatedSizeM}m
                        </div>
                    </div>
                </div>
            </div>

            {/* Learn More */}
            <AsteroidLearnMore
                asteroidId={approach.asteroidId}
                asteroidName={approach.asteroidName}
                accent={approach.isHazardous ? '#EF4444' : '#4A90D9'}
                compact
            />
        </div>
    );
}

export default function LeftSidebar({ variant = 'solar-system' }: LeftSidebarProps) {
    const isOpen = useUIStore((s) => s.leftSidebarOpen);
    const setOpen = useUIStore((s) => s.setLeftSidebar);
    const selectBody = useSolarSystemStore((s) => s.selectBody);
    const selectedBody = useSolarSystemStore((s) => s.selectedBody);
    const [search, setSearch] = useState('');
    const [expandedCat, setExpandedCat] = useState<string | null>(variant === 'asteroids' ? 'asteroids' : 'planets');
    const [tab, setTab] = useState<'watch' | 'explore'>(variant === 'asteroids' ? 'watch' : 'explore');

    const isAsteroidVariant = variant === 'asteroids';
    const CATEGORIES = isAsteroidVariant ? ASTEROID_CATEGORIES : SOLAR_CATEGORIES;

    const allBodies = useMemo(() => {
        const base = [SUN, ...PLANETS, ...MOONS];
        return isAsteroidVariant ? [...base, ...NAMED_ASTEROIDS] : base;
    }, [isAsteroidVariant]);

    const filtered = useMemo(() => {
        if (!search.trim()) return null;
        const q = search.toLowerCase();
        return allBodies.filter((b) => b.name.toLowerCase().includes(q));
    }, [search, allBodies]);

    if (!isOpen) return null;

    return (
        <div className="absolute top-14 left-0 bottom-16 w-80 z-40 glass-panel rounded-r-2xl overflow-hidden animate-slide-left pointer-events-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-white/60">
                    {isAsteroidVariant ? 'Asteroid Watch' : 'Explore'}
                </h2>
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white text-lg transition-colors">✕</button>
            </div>

            {/* Tab switcher — only show for asteroid variant */}
            {isAsteroidVariant && (
                <div className="flex px-3 pt-2 gap-1">
                    <button
                        onClick={() => setTab('watch')}
                        className={`flex-1 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all ${
                            tab === 'watch'
                                ? 'bg-[#4A90D9]/20 text-[#6BB5FF]'
                                : 'text-white/30 hover:text-white/60'
                        }`}
                    >
                        Close Approaches
                    </button>
                    <button
                        onClick={() => setTab('explore')}
                        className={`flex-1 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all ${
                            tab === 'explore'
                                ? 'bg-[#4A90D9]/20 text-[#6BB5FF]'
                                : 'text-white/30 hover:text-white/60'
                        }`}
                    >
                        Explore
                    </button>
                </div>
            )}

            {isAsteroidVariant && tab === 'watch' ? (
                /* ── Asteroid Watch Tab ── */
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30">
                            Next 5 Closest Approaches to Earth
                        </span>
                    </div>
                    {CLOSE_APPROACHES.map((a, i) => (
                        <ApproachCard key={i} approach={a} />
                    ))}
                </div>
            ) : (
                /* ── Explore Tab ── */
                <div className="flex-1 overflow-y-auto flex flex-col">
                    {/* Search */}
                    <div className="px-3 py-2.5">
                        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 focus-within:border-[#4A90D9]/30 transition-colors">
                            <span className="text-white/30 text-sm">🔍</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search objects..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/25"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="text-white/20 text-xs hover:text-white/60">✕</button>
                            )}
                        </div>
                    </div>

                    {/* Results or categories */}
                    <div className="flex-1 overflow-y-auto px-1.5 pb-3">
                        {filtered ? (
                            <div className="space-y-0.5">
                                {filtered.map((body) => (
                                    <SidebarItem
                                        key={body.id}
                                        name={body.name}
                                        color={body.display.color}
                                        selected={selectedBody === body.id}
                                        onClick={() => { selectBody(body.id); setSearch(''); }}
                                    />
                                ))}
                                {filtered.length === 0 && (
                                    <p className="text-xs text-white/20 text-center py-8">No results found</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {CATEGORIES.map((cat) => (
                                    <div key={cat.id}>
                                        <button
                                            onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.04] transition-all text-left"
                                        >
                                            <span className="text-sm">{cat.icon}</span>
                                            <span className="text-xs font-semibold tracking-[0.1em] uppercase flex-1">{cat.label}</span>
                                            <span className="text-[10px] text-white/20">{cat.items.length}</span>
                                            <span className={`text-white/20 text-[10px] transition-transform ${expandedCat === cat.id ? 'rotate-90' : ''}`}>▶</span>
                                        </button>
                                        {expandedCat === cat.id && (
                                            <div className="ml-2 space-y-0.5 mt-0.5">
                                                {cat.items.map((body) => (
                                                    <SidebarItem
                                                        key={body.id}
                                                        name={body.name}
                                                        color={body.display.color}
                                                        selected={selectedBody === body.id}
                                                        onClick={() => selectBody(body.id)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function SidebarItem({ name, color, selected, onClick }: {
    name: string; color: string; selected: boolean; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-sm ${selected
                    ? 'bg-[#4A90D9]/15 text-[#6BB5FF] border border-[#4A90D9]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
        >
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="font-medium">{name}</span>
        </button>
    );
}
