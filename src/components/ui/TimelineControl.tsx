/**
 * TimelineControl.tsx — Bottom timeline bar with playback controls
 */
import { useSolarSystemStore, TIME_SPEEDS } from '../../store/solarSystemStore';
import { formatJulianDate } from '../../engine/timeEngine';

export default function TimelineControl() {
    const simulationTime = useSolarSystemStore((s) => s.simulationTime);
    const isPlaying = useSolarSystemStore((s) => s.isPlaying);
    const speedIndex = useSolarSystemStore((s) => s.speedIndex);
    const timeDirection = useSolarSystemStore((s) => s.timeDirection);
    const togglePlay = useSolarSystemStore((s) => s.togglePlay);
    const setSpeedIndex = useSolarSystemStore((s) => s.setSpeedIndex);
    const reverseTime = useSolarSystemStore((s) => s.reverseTime);
    const jumpToNow = useSolarSystemStore((s) => s.jumpToNow);

    const dateStr = formatJulianDate(simulationTime);
    const isLive = Math.abs(simulationTime - (Date.now() / 86400000 + 2440587.5)) < 0.001;

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <div className="glass-panel rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                {/* Date display */}
                <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white/50"
                >
                    <span className="text-xs">📅</span>
                    <span className="text-[11px] font-mono tracking-wide whitespace-nowrap">{dateStr}</span>
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-white/[0.08]" />

                {/* Reverse */}
                <TlBtn
                    active={timeDirection < 0}
                    onClick={reverseTime}
                    title="Reverse"
                >
                    ⏪
                </TlBtn>

                {/* Slower */}
                <TlBtn
                    onClick={() => setSpeedIndex(speedIndex - 1)}
                    disabled={speedIndex <= 0}
                    title="Slower"
                >
                    ⏮
                </TlBtn>

                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all text-sm ${isPlaying
                            ? 'bg-[#4A90D9]/20 text-[#6BB5FF] hover:bg-[#4A90D9]/30'
                            : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white'
                        }`}
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                {/* Faster */}
                <TlBtn
                    onClick={() => setSpeedIndex(speedIndex + 1)}
                    disabled={speedIndex >= TIME_SPEEDS.length - 1}
                    title="Faster"
                >
                    ⏭
                </TlBtn>

                {/* Speed label */}
                <span className="text-[10px] font-bold font-mono text-white/30 min-w-[36px] text-center tracking-wider">
                    {TIME_SPEEDS[speedIndex].label}
                </span>

                {/* Divider */}
                <div className="w-px h-5 bg-white/[0.08]" />

                {/* Live/Now button */}
                <button
                    onClick={jumpToNow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white/30 hover:text-[#00FF88] transition-all text-xs font-bold tracking-[0.08em]"
                    title="Jump to now"
                >
                    {isLive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                    )}
                    NOW
                </button>
            </div>
        </div>
    );
}

function TlBtn({ children, onClick, active, disabled, title }: {
    children: React.ReactNode; onClick: () => void; active?: boolean; disabled?: boolean; title: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all text-xs ${disabled
                    ? 'text-white/10 cursor-not-allowed'
                    : active
                        ? 'text-[#6BB5FF] hover:bg-[#4A90D9]/15'
                        : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
                }`}
        >
            {children}
        </button>
    );
}
