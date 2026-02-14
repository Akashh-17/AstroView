/**
 * Toolbar.tsx — Right-side floating visibility toggles + planet quick-nav
 */
import { useState } from 'react';
import { useSolarSystemStore } from '../../store/solarSystemStore';
import { PLANETS, SUN } from '../../data/planetaryData';

const NAV_BODIES = [SUN, ...PLANETS];

export default function Toolbar() {
    const showOrbits = useSolarSystemStore((s) => s.showOrbits);
    const showLabels = useSolarSystemStore((s) => s.showLabels);
    const showMoons = useSolarSystemStore((s) => s.showMoons);
    const showAsteroids = useSolarSystemStore((s) => s.showAsteroids);
    const showGrid = useSolarSystemStore((s) => s.showGrid);
    const toggleOrbits = useSolarSystemStore((s) => s.toggleOrbits);
    const toggleLabels = useSolarSystemStore((s) => s.toggleLabels);
    const toggleMoons = useSolarSystemStore((s) => s.toggleMoons);
    const toggleAsteroids = useSolarSystemStore((s) => s.toggleAsteroids);
    const toggleGrid = useSolarSystemStore((s) => s.toggleGrid);
    const selectBody = useSolarSystemStore((s) => s.selectBody);
    const selectedBody = useSolarSystemStore((s) => s.selectedBody);

    const [planetsOpen, setPlanetsOpen] = useState(false);

    const handlePlanetClick = (id: string) => {
        selectBody(id);
        setPlanetsOpen(false);
    };

    return (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 pointer-events-auto flex items-start gap-2">
            {/* Planet list flyout */}
            {planetsOpen && (
                <div className="glass-panel rounded-xl p-1 flex flex-col gap-0.5 animate-slide-right">
                    {NAV_BODIES.map((b) => (
                        <button
                            key={b.id}
                            onClick={() => handlePlanetClick(b.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                                selectedBody === b.id
                                    ? 'text-[#6BB5FF] bg-[#4A90D9]/15'
                                    : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                            }`}
                        >
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: b.display.color }}
                            />
                            <span>{b.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Main toolbar */}
            <div className="glass-panel rounded-xl p-1 flex flex-col gap-0.5">
                <ToolBtn icon="◯" label="Orbits" active={showOrbits} onClick={toggleOrbits} />
                <ToolBtn
                    icon="🪐"
                    label="Planets"
                    active={planetsOpen}
                    onClick={() => setPlanetsOpen((v) => !v)}
                />
                <ToolBtn icon="Aa" label="Labels" active={showLabels} onClick={toggleLabels} />
                <ToolBtn icon="🌙" label="Moons" active={showMoons} onClick={toggleMoons} />
                <ToolBtn icon="✦" label="Asteroids" active={showAsteroids} onClick={toggleAsteroids} />
                <ToolBtn icon="⊞" label="Grid" active={showGrid} onClick={toggleGrid} />
            </div>
        </div>
    );
}

function ToolBtn({ icon, label, active, onClick }: {
    icon: string; label: string; active: boolean; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                active
                    ? 'text-[#6BB5FF] hover:bg-[#4A90D9]/10'
                    : 'text-white/25 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
        >
            <span className="w-5 text-center text-sm">{icon}</span>
            <span className="hidden xl:inline">{label}</span>
        </button>
    );
}
