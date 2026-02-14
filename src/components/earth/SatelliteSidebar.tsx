/**
 * SatelliteSidebar.tsx
 *
 * Left sidebar with category filters, satellite count, search, and scrollable list.
 */

import { useMemo } from 'react';
import { useSatelliteStore } from '../../store/satelliteStore';
import { SATELLITE_CATEGORIES } from '../../data/satelliteData';

export default function SatelliteSidebar() {
    const satellites = useSatelliteStore((s) => s.satellites);
    const activeCategories = useSatelliteStore((s) => s.activeCategories);
    const toggleCategory = useSatelliteStore((s) => s.toggleCategory);
    const searchQuery = useSatelliteStore((s) => s.searchQuery);
    const setSearchQuery = useSatelliteStore((s) => s.setSearchQuery);
    const selectedSatelliteId = useSatelliteStore((s) => s.selectedSatelliteId);
    const selectSatellite = useSatelliteStore((s) => s.selectSatellite);

    // Count per category
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const sat of satellites) {
            counts[sat.category] = (counts[sat.category] || 0) + 1;
        }
        return counts;
    }, [satellites]);

    // Filtered satellite list for scrollable section
    const filteredList = useMemo(() => {
        let list = satellites;
        if (activeCategories.size > 0) {
            list = list.filter(s => activeCategories.has(s.category));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => s.name.toLowerCase().includes(q));
        }
        return list.slice(0, 200); // Cap for performance
    }, [satellites, activeCategories, searchQuery]);

    const totalCount = satellites.length;

    return (
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-black/40 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3">
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30 mb-1">
                    Satellite Categories
                </h2>
                <p className="text-[10px] text-white/20">
                    {totalCount.toLocaleString()} satellites loaded
                </p>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
                <input
                    type="text"
                    placeholder="Search satellites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#4A90D9]/40 transition-colors"
                />
            </div>

            {/* Category filters */}
            <div className="px-3 pb-3 space-y-0.5">
                {SATELLITE_CATEGORIES.map((cat) => {
                    const isActive = activeCategories.size === 0 || activeCategories.has(cat.id);
                    const count = categoryCounts[cat.id] || 0;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${isActive
                                    ? 'bg-white/[0.04] text-white'
                                    : 'text-white/25 hover:bg-white/[0.02] hover:text-white/40'
                                }`}
                        >
                            <span className="text-sm">{cat.icon}</span>
                            <span className="flex-1 text-[11px] font-medium truncate">{cat.label}</span>
                            <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                style={{
                                    color: isActive ? cat.color : '#666',
                                    backgroundColor: isActive ? `${cat.color}15` : 'transparent',
                                }}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mx-4" />

            {/* Satellite list */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                <h3 className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 px-2 py-1">
                    {filteredList.length > 0 ? `Showing ${filteredList.length}` : 'No matches'}
                </h3>

                {filteredList.map((sat) => {
                    const cat = SATELLITE_CATEGORIES.find(c => c.id === sat.category);
                    const isSelected = sat.id === selectedSatelliteId;

                    return (
                        <button
                            key={sat.id}
                            onClick={() => selectSatellite(sat.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-all ${isSelected
                                    ? 'bg-[#4A90D9]/[0.12] border border-[#4A90D9]/30'
                                    : 'border border-transparent hover:bg-white/[0.03]'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: cat?.color || '#888' }}
                                />
                                <span className={`text-[11px] truncate ${isSelected ? 'text-[#6BB5FF] font-medium' : 'text-white/60'}`}>
                                    {sat.name}
                                </span>
                            </div>
                            {isSelected && sat.alt !== undefined && (
                                <div className="mt-1 ml-3.5 text-[10px] text-white/30 font-mono">
                                    Alt: {Math.round(sat.alt)} km
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
