/**
 * VitalSignsBar.tsx
 *
 * Bottom navigation bar inspired by NASA's "Eyes on Earth" — horizontally
 * scrollable tabs for switching between vital-sign data layers.
 */

import { useRef, useEffect } from 'react';
import { useSatelliteStore } from '../../store/satelliteStore';
import { VITAL_SIGNS, type VitalSignId } from '../../data/satelliteData';

// SVG icon components for each vital sign
function VitalIcon({ icon, color, size = 18 }: { icon: string; color: string; size?: number }) {
    const s = size;
    switch (icon) {
        case 'SAT':
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
                    <path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
            );
        case 'EYE':
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            );
        case 'TEMP':
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
                    <circle cx="11.5" cy="17.5" r="1.5" fill={color} />
                </svg>
            );
        case 'CO2':
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <circle cx="7" cy="12" r="4" />
                    <circle cx="17" cy="9" r="3" />
                    <circle cx="17" cy="16" r="2" />
                </svg>
            );
        case 'CO':
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <circle cx="9" cy="12" r="5" />
                    <circle cx="18" cy="12" r="3" />
                </svg>
            );
        case 'LEAF':
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 17c0-.53-.12-1.03-.3-1.48C9.42 14.38 12.34 13 17 8z" />
                    <path d="M20 2s-2 2-4 3c-2 1-5 2-8 6" />
                </svg>
            );
        case 'RAIN':
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25" />
                    <path d="M8 16l-2 4M12 16l-2 4M16 16l-2 4" strokeLinecap="round" />
                </svg>
            );
        case 'WAVE':
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
                    <path d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" opacity="0.5" />
                    <path d="M2 7c2-3 4-3 6 0s4 3 6 0 4-3 6 0" opacity="0.5" />
                </svg>
            );
        case 'SST':
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <path d="M2 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
                    <path d="M14 6V3.5a2.5 2.5 0 00-5 0V6" />
                    <path d="M14 9.76V6h-5v3.76a4.5 4.5 0 105 0z" />
                </svg>
            );
        case 'DROP':
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
                </svg>
            );
        case 'O3':
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" opacity="0.4" />
                </svg>
            );
        default:
            return (
                <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                </svg>
            );
    }
}

export default function VitalSignsBar() {
    const activeVitalSign = useSatelliteStore((s) => s.activeVitalSign);
    const setActiveVitalSign = useSatelliteStore((s) => s.setActiveVitalSign);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll active tab into view
    useEffect(() => {
        if (!scrollRef.current) return;
        const active = scrollRef.current.querySelector('[data-active="true"]');
        if (active) {
            active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [activeVitalSign]);

    return (
        <div className="relative w-full">
            {/* Gradient fade edges */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-black/90 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-black/90 to-transparent" />

            {/* Scrollable tab row */}
            <div
                ref={scrollRef}
                className="flex items-stretch gap-1 overflow-x-auto scrollbar-hide px-4 py-1.5"
                style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
                {VITAL_SIGNS.map((vs) => {
                    const isActive = activeVitalSign === vs.id;
                    return (
                        <button
                            key={vs.id}
                            data-active={isActive}
                            onClick={() => setActiveVitalSign(vs.id as VitalSignId)}
                            className="group relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 whitespace-nowrap flex-shrink-0 min-w-[72px]"
                            style={{
                                background: isActive
                                    ? `linear-gradient(180deg, ${vs.color}18 0%, ${vs.color}08 100%)`
                                    : 'transparent',
                                borderBottom: isActive ? `2px solid ${vs.color}` : '2px solid transparent',
                            }}
                            title={vs.description}
                        >
                            {/* Glow effect when active */}
                            {isActive && (
                                <div
                                    className="absolute inset-0 rounded-lg opacity-20 blur-sm"
                                    style={{ background: vs.color }}
                                />
                            )}

                            {/* Icon */}
                            <div className="relative z-10">
                                <VitalIcon
                                    icon={vs.icon}
                                    color={isActive ? vs.color : 'rgba(255,255,255,0.3)'}
                                    size={16}
                                />
                            </div>

                            {/* Label */}
                            <span
                                className="relative z-10 text-[9px] font-semibold tracking-[0.06em] leading-none transition-colors"
                                style={{
                                    color: isActive ? vs.color : 'rgba(255,255,255,0.35)',
                                }}
                            >
                                {vs.shortLabel}
                            </span>

                            {/* Active dot */}
                            {isActive && (
                                <div
                                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                    style={{ background: vs.color, boxShadow: `0 0 6px ${vs.color}` }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
