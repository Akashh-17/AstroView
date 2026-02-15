/**
 * TopNav.tsx — Top navigation bar with variant support
 * "solar-system" → EYES ON THE SOLAR SYSTEM
 * "asteroids"    → EYES ON ASTEROIDS (Astrolens-branded)
 */
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';

interface TopNavProps {
    variant?: 'solar-system' | 'asteroids';
}

export default function TopNav({ variant = 'solar-system' }: TopNavProps) {
    const location = useLocation();
    const toggleLeftSidebar = useUIStore((s) => s.toggleLeftSidebar);

    const isActive = (path: string) => location.pathname === path;

    const title = variant === 'asteroids' ? 'EYES ON ASTEROIDS' : 'EYES ON THE SOLAR SYSTEM';
    const subtitle = variant === 'asteroids' ? 'REAL-TIME SIMULATION' : 'INTERACTIVE 3D EXPLORER';

    return (
        <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent pointer-events-auto">
            {/* Left: Astrolens Logo + Title */}
            <div className="flex items-center gap-4">
                {/* Astrolens logo circle */}
                <Link to="/" className="flex items-center gap-3 group" title="Home">
                    <div className="w-9 h-9 rounded-full bg-[#0B3D91] flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all shadow-[0_0_12px_rgba(11,61,145,0.4)]">
                        <span className="text-white text-[8px] font-black tracking-tighter leading-none">ASTRO</span>
                    </div>
                </Link>

                {/* Title */}
                <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-[0.2em] text-white leading-none">{title}</span>
                    <span className="text-[9px] font-medium tracking-[0.15em] text-white/30 leading-none mt-0.5">{subtitle}</span>
                </div>
            </div>

            {/* Center: Navigation */}
            <nav className="flex items-center gap-1">
                <NavLink
                    label="Home"
                    to="/"
                    active={isActive('/')}
                />
                <NavLink
                    label="Solar System"
                    to="/solar-system"
                    active={isActive('/solar-system')}
                />
                <NavLink
                    label="Asteroid Watch"
                    to="/asteroids"
                    active={isActive('/asteroids')}
                />
                <NavBtn
                    icon="☰"
                    label="Filters"
                    onClick={toggleLeftSidebar}
                />
            </nav>

            {/* Right: controls */}
            <div className="flex items-center gap-1">
                <NavBtn icon="☰" label="Explore" onClick={toggleLeftSidebar} />
                <NavBtn icon="?" label="Help" onClick={() => { }} />
            </div>
        </header>
    );
}

function NavLink({ label, to, active }: { label: string; to: string; active: boolean }) {
    return (
        <Link
            to={to}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-[0.08em] uppercase transition-all no-underline ${
                active
                    ? 'text-[#6BB5FF] bg-[#4A90D9]/15'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
            }`}
        >
            {label}
        </Link>
    );
}

function NavBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-200 text-sm"
        >
            {icon}
        </button>
    );
}
