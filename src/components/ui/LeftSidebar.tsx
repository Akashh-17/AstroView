/**
 * LeftSidebar.tsx — Collapsible object selector with categories & search
 */
import { useState, useMemo } from 'react';
import { PLANETS, MOONS, SUN } from '../../data/planetaryData';
import { useSolarSystemStore } from '../../store/solarSystemStore';
import { useUIStore } from '../../store/uiStore';

const CATEGORIES = [
    { id: 'star', label: 'Star', icon: '☀', items: [SUN] },
    { id: 'planets', label: 'Planets', icon: '🪐', items: PLANETS },
    { id: 'moons', label: 'Moons', icon: '🌙', items: MOONS },
];

export default function LeftSidebar() {
    const isOpen = useUIStore((s) => s.leftSidebarOpen);
    const setOpen = useUIStore((s) => s.setLeftSidebar);
    const selectBody = useSolarSystemStore((s) => s.selectBody);
    const selectedBody = useSolarSystemStore((s) => s.selectedBody);
    const [search, setSearch] = useState('');
    const [expandedCat, setExpandedCat] = useState<string | null>('planets');

    const allBodies = useMemo(() => [SUN, ...PLANETS, ...MOONS], []);

    const filtered = useMemo(() => {
        if (!search.trim()) return null;
        const q = search.toLowerCase();
        return allBodies.filter((b) => b.name.toLowerCase().includes(q));
    }, [search, allBodies]);

    if (!isOpen) return null;

    return (
        <div className="absolute top-14 left-0 bottom-16 w-72 z-40 glass-panel rounded-r-2xl overflow-hidden animate-slide-left pointer-events-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-white/60">Explore</h2>
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white text-lg transition-colors">✕</button>
            </div>

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
                    // Search results
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
                    // Categories
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
