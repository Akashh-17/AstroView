/**
 * AsteroidWatchWidget.tsx — Astrolens "Asteroid Watch" floating card widget
 * Shows the next 5 closest approaches to Earth in a carousel format.
 * Matches the Astrolens "Eyes on Asteroids" design with asteroid rock illustration,
 * date/time, distance, estimated size, and dot-nav pagination.
 */
import { useState, useCallback } from 'react';
import { CLOSE_APPROACHES } from '../../data/planetaryData';
import type { CloseApproach } from '../../data/planetaryData';
import { useSolarSystemStore } from '../../store/solarSystemStore';

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDistanceKm(km: number): string {
    return km.toLocaleString() + ' km';
}

/** Simple low-poly asteroid SVG rock illustration */
function AsteroidRock({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Main asteroid body — faceted rock shape */}
            <polygon
                points="40,8 58,14 70,30 68,52 55,68 35,72 18,62 10,44 14,24 26,12"
                fill="#5C5C5C"
                stroke="#4a4a4a"
                strokeWidth="0.5"
            />
            {/* Light face */}
            <polygon points="40,8 58,14 52,32 34,28 26,12" fill="#787878" />
            {/* Medium face */}
            <polygon points="58,14 70,30 62,44 52,32" fill="#6a6a6a" />
            {/* Dark face */}
            <polygon points="10,44 18,62 35,72 28,50 14,24" fill="#484848" />
            {/* Another light face */}
            <polygon points="52,32 62,44 55,58 38,52 34,28" fill="#606060" />
            {/* Bottom face */}
            <polygon points="55,68 35,72 28,50 38,52 55,58" fill="#525252" />
            {/* Highlight */}
            <polygon points="40,8 34,28 52,32 58,14" fill="#8a8a8a" opacity="0.4" />
            {/* Shadow face */}
            <polygon points="68,52 55,68 55,58 62,44 70,30" fill="#3e3e3e" />
            {/* Top highlight edge */}
            <line x1="40" y1="8" x2="58" y2="14" stroke="#999" strokeWidth="0.5" opacity="0.5" />
        </svg>
    );
}

/** Size comparison bar — shows estimated size in meters */
function SizeBar({ sizeM }: { sizeM: number }) {
    // scale: up to ~5 bar segments depending on size
    const segments = Math.max(2, Math.min(12, Math.round(sizeM / 20)));
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="flex items-end gap-[1px]">
                {Array.from({ length: segments }).map((_, i) => (
                    <div
                        key={i}
                        className="w-[3px] bg-white/30"
                        style={{ height: `${4 + i * 1.2}px` }}
                    />
                ))}
            </div>
            <span className="text-[13px] font-semibold text-white/80 tracking-wide">{sizeM} m</span>
            <span className="text-[9px] font-bold tracking-[0.15em] text-white/30 uppercase">[Estimated]</span>
        </div>
    );
}

function ApproachSlide({ approach }: { approach: CloseApproach }) {
    const selectBody = useSolarSystemStore((s) => s.selectBody);

    return (
        <div
            className="cursor-pointer"
            onClick={() => selectBody(approach.asteroidId)}
        >
            {/* Divider */}
            <div className="h-px bg-white/[0.08] mb-4" />

            {/* Asteroid name */}
            <h3 className="text-[22px] font-bold text-white tracking-wide mb-3">{approach.asteroidName}</h3>

            <div className="flex items-start justify-between gap-4">
                {/* Left: date + distance */}
                <div className="flex-1 min-w-0">
                    {/* Date */}
                    <div className="mb-3">
                        <div className="text-[10px] font-semibold tracking-[0.15em] text-white/40 uppercase mb-0.5">Date</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[15px] font-bold text-[#4A90D9] tracking-wide">{formatDate(approach.date)}</span>
                            <span className="text-[12px] text-white/40 font-mono">{approach.time}</span>
                        </div>
                    </div>

                    {/* Distance */}
                    <div>
                        <div className="text-[10px] font-semibold tracking-[0.15em] text-white/40 uppercase mb-0.5">Distance</div>
                        <span className="text-[15px] font-bold text-white tracking-wide">
                            {formatDistanceKm(approach.distanceKm)}
                            <span className="text-white/50 font-normal ml-0.5"> </span>
                        </span>
                    </div>
                </div>

                {/* Right: rock illustration + size */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <AsteroidRock size={64} />
                    <SizeBar sizeM={approach.estimatedSizeM} />
                </div>
            </div>
        </div>
    );
}

export default function AsteroidWatchWidget() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [collapsed, setCollapsed] = useState(false);
    const approaches = CLOSE_APPROACHES;

    const goNext = useCallback(() => {
        setCurrentIndex((i) => (i + 1) % approaches.length);
    }, [approaches.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex((i) => (i - 1 + approaches.length) % approaches.length);
    }, [approaches.length]);

    if (collapsed) {
        return (
            <div className="absolute bottom-20 left-4 z-40 pointer-events-auto">
                <button
                    onClick={() => setCollapsed(false)}
                    className="bg-black/80 backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/[0.06] transition-all group"
                >
                    {/* Asteroid icon */}
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/50">
                            <polygon points="12,2 18,5 21,11 20,17 16,22 9,22 4,18 2,12 4,6 8,3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                            <polygon points="12,2 8,3 10,8 14,7 18,5" fill="currentColor" opacity="0.3"/>
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-white/60 tracking-wide group-hover:text-white/80 transition-colors">Asteroid Watch</span>
                    <span className="text-white/30 text-xs ml-1">❯</span>
                </button>
            </div>
        );
    }

    return (
        <div className="absolute bottom-20 left-4 z-40 pointer-events-auto">
            <div className="bg-black/85 backdrop-blur-xl border border-white/[0.08] rounded-2xl w-[340px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="flex items-center gap-3">
                        {/* Hexagonal asteroid icon */}
                        <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/50">
                                <polygon points="12,2 18,5 21,11 20,17 16,22 9,22 4,18 2,12 4,6 8,3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                <polygon points="12,2 8,3 10,8 14,7 18,5" fill="currentColor" opacity="0.3"/>
                                <line x1="10" y1="8" x2="4" y2="6" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
                                <line x1="14" y1="7" x2="21" y2="11" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
                            </svg>
                        </div>
                        <h2 className="text-[18px] font-semibold text-white tracking-wide">Asteroid Watch</h2>
                    </div>

                    {/* Collapse button */}
                    <button
                        onClick={() => setCollapsed(true)}
                        className="w-8 h-8 rounded-lg border border-white/[0.1] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M4 5L7 8L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M4 9L7 6L10 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Subtitle */}
                <p className="text-[11px] text-white/35 tracking-wide px-5 mb-2">
                    The next five closest approaches to Earth
                </p>

                {/* Current slide */}
                <div className="px-5 pb-3">
                    <ApproachSlide approach={approaches[currentIndex]} />
                </div>

                {/* Navigation: arrows + dots */}
                <div className="flex items-center justify-between px-5 pb-4 pt-1">
                    <button
                        onClick={goPrev}
                        className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white transition-colors"
                        aria-label="Previous asteroid"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-2">
                        {approaches.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`rounded-full transition-all ${
                                    i === currentIndex
                                        ? 'w-2.5 h-2.5 bg-[#4A90D9]'
                                        : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                                }`}
                                aria-label={`Go to asteroid ${i + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={goNext}
                        className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white transition-colors"
                        aria-label="Next asteroid"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
