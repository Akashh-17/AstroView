/**
 * TimelineControl.tsx — Bottom timeline bar with LIVE indicator, date/time,
 * horizontal scrubber, play/pause, reset, and time speed selector
 */
import { useCallback, useRef } from 'react';
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
    const jumpToDate = useSolarSystemStore((s) => s.jumpToDate);
    const zoomIn = useSolarSystemStore((s) => s.zoomIn);
    const zoomOut = useSolarSystemStore((s) => s.zoomOut);

    const sliderRef = useRef<HTMLInputElement>(null);

    const dateStr = formatJulianDate(simulationTime);
    const isLive = Math.abs(simulationTime - (Date.now() / 86400000 + 2440587.5)) < 0.01;

    // Timeline scrubber: range from -5 years to +5 years from today
    const nowJD = Date.now() / 86400000 + 2440587.5;
    const minJD = nowJD - 5 * 365.25;
    const maxJD = nowJD + 5 * 365.25;

    const sliderValue = Math.max(0, Math.min(1000, ((simulationTime - minJD) / (maxJD - minJD)) * 1000));

    const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        const jd = minJD + (val / 1000) * (maxJD - minJD);
        jumpToDate(jd);
    }, [minJD, maxJD, jumpToDate]);

    const handleReset = useCallback(() => {
        jumpToNow();
    }, [jumpToNow]);

    return (
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
            <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8 pb-3 px-4">
                {/* Scrubber timeline */}
                <div className="max-w-4xl mx-auto mb-2 px-2">
                    <input
                        ref={sliderRef}
                        type="range"
                        min={0}
                        max={1000}
                        step={1}
                        value={sliderValue}
                        onChange={handleScrub}
                        className="timeline-scrubber w-full"
                    />
                </div>

                {/* Controls row */}
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                    {/* Left: LIVE indicator + Date/Time */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={handleReset}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-[0.1em] uppercase transition-all ${
                                isLive
                                    ? 'text-[#00FF88] bg-[#00FF88]/10'
                                    : 'text-white/30 hover:text-[#00FF88] hover:bg-[#00FF88]/5'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-[#00FF88] animate-pulse' : 'bg-white/20'}`} />
                            LIVE
                        </button>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white/40">📅</span>
                            <span className="text-[12px] font-mono tracking-wide text-white/70 whitespace-nowrap">
                                {dateStr}
                            </span>
                        </div>
                    </div>

                    {/* Center: Playback controls */}
                    <div className="flex items-center gap-1">
                        {/* Reverse */}
                        <TlBtn
                            active={timeDirection < 0}
                            onClick={reverseTime}
                            title="Reverse"
                        >
                            ⏪
                        </TlBtn>

                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all text-sm ${isPlaying
                                    ? 'bg-[#4A90D9]/20 text-[#6BB5FF] hover:bg-[#4A90D9]/30'
                                    : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white'
                                }`}
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? '⏸' : '▶'}
                        </button>

                        {/* Reset */}
                        <TlBtn onClick={handleReset} title="Reset to Now">
                            ↺
                        </TlBtn>
                    </div>

                    {/* Right: Speed selector + Zoom */}
                    <div className="flex items-center gap-2">
                        {/* Time speed selector chips */}
                        <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
                            {TIME_SPEEDS.map((speed, i) => (
                                <button
                                    key={speed.label}
                                    onClick={() => setSpeedIndex(i)}
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold font-mono tracking-wider transition-all ${
                                        speedIndex === i
                                            ? 'bg-[#4A90D9]/25 text-[#6BB5FF]'
                                            : 'text-white/30 hover:text-white/60'
                                    }`}
                                >
                                    {speed.label}
                                </button>
                            ))}
                        </div>

                        {/* Zoom controls */}
                        <div className="flex items-center gap-0.5 border-l border-white/[0.08] pl-2 ml-1">
                            <TlBtn onClick={zoomOut} title="Zoom Out">−</TlBtn>
                            <TlBtn onClick={zoomIn} title="Zoom In">+</TlBtn>
                        </div>
                    </div>
                </div>
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
