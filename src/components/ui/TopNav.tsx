/**
 * TopNav.tsx — NASA-style top navigation bar
 */
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';

export default function TopNav() {
    const navigate = useNavigate();
    const toggleFullscreen = useUIStore((s) => s.toggleFullscreen);
    const toggleLeftSidebar = useUIStore((s) => s.toggleLeftSidebar);

    return (
        <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group" title="Back to Home">
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#4A90D9]/50 transition-colors">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#4A90D9] to-[#0B3D91]" />
                    </div>
                    <div>
                        <div className="text-xs font-bold tracking-[0.15em] text-white leading-none">EYES ON THE</div>
                        <div className="text-[10px] font-medium tracking-[0.1em] text-white/50 leading-none mt-0.5">SOLAR SYSTEM</div>
                    </div>
                </button>
            </div>

            {/* Center: optional search could go here */}

            {/* Right: Action icons */}
            <div className="flex items-center gap-1">
                <NavBtn icon="☰" label="Explore" onClick={toggleLeftSidebar} />
                <NavBtn icon="⚙" label="Settings" onClick={() => { }} />
                <NavBtn icon="⛶" label="Fullscreen" onClick={toggleFullscreen} />
                <NavBtn icon="?" label="Help" onClick={() => { }} />
            </div>
        </header>
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
