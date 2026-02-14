/**
 * Toolbar.tsx — Right-side floating visibility toggles
 */
import { useSolarSystemStore } from '../../store/solarSystemStore';

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

    return (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
            <div className="glass-panel rounded-xl p-1 flex flex-col gap-0.5">
                <ToolBtn icon="◯" label="Orbits" active={showOrbits} onClick={toggleOrbits} />
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
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${active
                    ? 'text-[#6BB5FF] hover:bg-[#4A90D9]/10'
                    : 'text-white/25 hover:text-white/60 hover:bg-white/[0.04]'
                }`}
        >
            <span className="w-5 text-center text-sm">{icon}</span>
            <span className="hidden xl:inline">{label}</span>
        </button>
    );
}
