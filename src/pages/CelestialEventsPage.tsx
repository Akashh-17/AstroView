/**
 * CelestialEventsPage.tsx
 *
 * Location-based celestial events module with comprehensive visual enhancements
 * Features: Animated starfield, smooth page load sequence, polished interactions, event reminders
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, LocateFixed, ArrowLeft, Star, Moon, Sun, Sparkles, Globe, Eye, Info } from 'lucide-react';
import {
    NORTHERN_HEMISPHERE_EVENTS,
    SOUTHERN_HEMISPHERE_EVENTS,
    type CelestialEvent,
    type VisibilityLevel,
} from '../data/celestialEventsData';
import ReminderToggle from '../components/celestial/ReminderToggle';
import Toast from '../components/celestial/Toast';
import { saveReminder, removeReminder, isReminderSet } from '../utils/reminderStorage';

// ─── Icon Map ────────────────────────────────────────────────────────────────
function EventIcon({ type }: { type: CelestialEvent['icon'] }) {
    const cls = 'w-5 h-5';
    switch (type) {
        case 'meteor': return <Sparkles className={cls} />;
        case 'moon': return <Moon className={cls} />;
        case 'eclipse': return <Sun className={cls} />;
        case 'planet': return <Globe className={cls} />;
        case 'comet': return <Star className={cls} />;
        case 'aurora': return <Eye className={cls} />;
        default: return <Star className={cls} />;
    }
}

// ─── Visibility Badge ────────────────────────────────────────────────────────
function VisibilityBadge({ level }: { level: VisibilityLevel }) {
    const config: Record<VisibilityLevel, { bg: string; border: string; text: string; dot: string; glow: string }> = {
        'High': {
            bg: 'rgba(0, 255, 170, 0.15)',
            border: 'rgba(0, 255, 170, 0.4)',
            text: '#00FFAA',
            dot: '#00FFAA',
            glow: '0px 0px 12px rgba(0, 255, 170, 0.3)'
        },
        'Moderate': {
            bg: 'rgba(255, 170, 0, 0.15)',
            border: 'rgba(255, 170, 0, 0.4)',
            text: '#FFAA00',
            dot: '#FFAA00',
            glow: '0px 0px 12px rgba(255, 170, 0, 0.3)'
        },
        'Low': {
            bg: 'rgba(255, 100, 100, 0.15)',
            border: 'rgba(255, 100, 100, 0.4)',
            text: '#FF6464',
            dot: '#FF6464',
            glow: '0px 0px 12px rgba(255, 100, 100, 0.3)'
        }
    };

    const style = config[level];

    return (
        <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider badge-entrance"
            style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                color: style.text,
                boxShadow: style.glow
            }}
        >
            <span className="w-1.5 h-1.5 rounded-full badge-pulse" style={{ background: style.dot }} />
            {level.toUpperCase()}
        </div>
    );
}

// ─── Event Card ──────────────────────────────────────────────────────────────
function EventCard({
    event,
    index,
    isReminderActive,
    onToggleReminder
}: {
    event: CelestialEvent;
    index: number;
    isReminderActive: boolean;
    onToggleReminder: (active: boolean) => void;
}) {
    return (
        <div
            className="event-card group relative rounded-2xl p-8 transition-all duration-300"
            style={{
                background: 'linear-gradient(145deg, rgba(10, 14, 26, 0.9) 0%, rgba(10, 14, 26, 0.7) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.4)',
                animationDelay: `${800 + index * 150}ms`
            }}
        >
            {/* Header Row: Icon + Title */}
            <div className="flex items-start gap-4 mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div
                        className="icon-container w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                            background: 'rgba(0, 217, 255, 0.12)',
                            border: '1px solid rgba(0, 217, 255, 0.3)',
                            color: '#00D9FF'
                        }}
                    >
                        <EventIcon type={event.icon} />
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white leading-tight mb-2 group-hover:text-cyan-100 transition-colors">
                            {event.name}
                        </h3>
                        <p className="text-[11px] font-semibold uppercase tracking-wider transition-colors" style={{ color: '#777777' }}>
                            {event.date}
                        </p>
                    </div>
                </div>

                {/* Visibility Badge */}
                <VisibilityBadge level={event.visibility} />
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed mt-5" style={{ color: '#AAAAAA', lineHeight: '1.8' }}>
                {event.description}
            </p>

            {/* Reminder Toggle */}
            <div className="mt-6 pt-6 border-t border-white/5">
                <ReminderToggle
                    eventId={event.id}
                    eventName={event.name}
                    eventDate={event.date}
                    isActive={isReminderActive}
                    onToggle={onToggleReminder}
                />
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CelestialEventsPage() {
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [events, setEvents] = useState<CelestialEvent[] | null>(null);
    const [hemisphere, setHemisphere] = useState<'northern' | 'southern' | null>(null);
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reminder system state
    const [reminders, setReminders] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<{ message: string; detail?: string } | null>(null);

    // Load reminders from localStorage on mount
    useEffect(() => {
        if (events) {
            const reminderMap: Record<string, boolean> = {};
            events.forEach(event => {
                reminderMap[event.id] = isReminderSet(event.id);
            });
            setReminders(reminderMap);
        }
    }, [events]);

    const handleToggleReminder = (event: CelestialEvent, active: boolean) => {
        if (active) {
            // Save reminder
            saveReminder({
                eventId: event.id,
                eventName: event.name,
                eventDate: event.date,
            });
            setToast({
                message: 'Reminder Set!',
                detail: `You'll be notified about ${event.name} on ${event.date}`,
            });
        } else {
            // Remove reminder
            removeReminder(event.id);
            setToast({
                message: 'Reminder Removed',
                detail: `${event.name} reminder has been cleared`,
            });
        }

        // Update local state
        setReminders(prev => ({ ...prev, [event.id]: active }));
    };

    const processLocation = (lat: number) => {
        const h = lat >= 0 ? 'northern' : 'southern';
        setHemisphere(h);
        setEvents(h === 'northern' ? NORTHERN_HEMISPHERE_EVENTS : SOUTHERN_HEMISPHERE_EVENTS);
        setError(null);
    };

    const handleAutoDetect = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        setDetecting(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(pos.coords.latitude.toFixed(4));
                setLongitude(pos.coords.longitude.toFixed(4));
                processLocation(pos.coords.latitude);
                setDetecting(false);
            },
            (err) => {
                setError(err.code === 1
                    ? 'Location access denied. Please enter coordinates manually.'
                    : 'Unable to detect location. Please enter coordinates manually.'
                );
                setDetecting(false);
            },
            { timeout: 10000 }
        );
    };

    const handleManualSubmit = () => {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            setError('Please enter valid coordinates. Latitude: -90 to 90, Longitude: -180 to 180.');
            return;
        }
        processLocation(lat);
    };

    const handleReset = () => {
        setLatitude('');
        setLongitude('');
        setEvents(null);
        setHemisphere(null);
        setError(null);
    };

    return (
        <>
            {/* CSS Animations */}
            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
                
                @keyframes twinkleSlow {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 0.8; }
                }
                
                @keyframes shootingStar {
                    0% {
                        transform: translateX(-100px) translateY(-100px);
                        opacity: 0;
                    }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% {
                        transform: translateX(1000px) translateY(1000px);
                        opacity: 0;
                    }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                
                @keyframes floatSubtle {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-3px); }
                }
                
                @keyframes slideDown {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                
                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-3px) rotate(2deg); }
                }
                
                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes nebulaDrift {
                    0%, 100% {
                        transform: translateX(0) translateY(0);
                    }
                    50% {
                        transform: translateX(100px) translateY(-50px);
                    }
                }
                
                @keyframes nebulaFloat {
                    0%, 100% {
                        transform: translateY(0) scale(1);
                        opacity: 0.3;
                    }
                    50% {
                        transform: translateY(-80px) scale(1.1);
                        opacity: 0.5;
                    }
                }
                
                @keyframes particleDrift {
                    0% {
                        transform: translate(0, 0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.6;
                    }
                    90% {
                        opacity: 0.6;
                    }
                    100% {
                        transform: translate(200px, -300px);
                        opacity: 0;
                    }
                }
                
                .nav-bar {
                    animation: slideDown 600ms ease-out 200ms backwards;
                }
                
                .badge-appear {
                    animation: fadeInScale 500ms ease-out 400ms backwards;
                }
                
                .title-appear {
                    animation: slideUp 700ms cubic-bezier(0.4, 0, 0.2, 1) 600ms backwards;
                }
                
                .subtitle-appear {
                    animation: slideUp 600ms ease-out 800ms backwards;
                }
                
                .form-appear {
                    animation: scaleIn 700ms cubic-bezier(0.4, 0, 0.2, 1) 1000ms backwards, floatSubtle 4s ease-in-out 1700ms infinite;
                }
                
                .input-appear-1 {
                    animation: slideUp 400ms ease-out 1400ms backwards;
                }
                
                .input-appear-2 {
                    animation: slideUp 400ms ease-out 1500ms backwards;
                }
                
                .button-appear {
                    animation: slideUp 500ms ease-out 1600ms backwards;
                }
                
                .event-card {
                    animation: scaleIn 500ms cubic-bezier(0.4, 0, 0.2, 1) backwards;
                }
                
                .event-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    border-color: rgba(74, 158, 255, 0.3);
                    box-shadow: 0px 16px 48px rgba(0, 0, 0, 0.6);
                }
                
                .badge-pulse {
                    animation: pulse 1.5s ease-in-out infinite;
                }
                
                .badge-entrance {
                    animation: slideInRight 400ms ease-out 200ms backwards;
                }
                
                .icon-container {
                    animation: iconFloat 3s ease-in-out infinite;
                }
                
                .region-appear {
                    animation: slideInLeft 500ms ease-out 600ms backwards;
                }
                
                .recalibrate-appear {
                    animation: slideInRight 500ms ease-out 600ms backwards;
                }
                
                .live-pulse {
                    animation: pulse 1.5s ease-in-out infinite;
                }
                
                .star {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                }
                
                .star-layer-1 .star:nth-child(odd) {
                    animation: twinkle 3s ease-in-out infinite;
                }
                
                .star-layer-1 .star:nth-child(even) {
                    animation: twinkleSlow 4s ease-in-out infinite;
                }
                
                .star-layer-2 .star {
                    animation: twinkle 2.5s ease-in-out infinite;
                }
                
                .star-layer-3 .star {
                    animation: twinkleSlow 3.5s ease-in-out infinite;
                }
                
                .shooting-star {
                    position: absolute;
                    width: 2px;
                    height: 2px;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8), 0 0 20px 4px rgba(100, 200, 255, 0.4);
                    animation: shootingStar 2s linear;
                }
                
                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-black text-white overflow-y-auto overflow-x-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

                {/* Animated Starfield Background */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    {/* Nebula Clouds - Slow Drifting */}
                    <div className="absolute inset-0">
                        {/* Nebula 1 - Cyan */}
                        <div
                            className="absolute"
                            style={{
                                top: '10%',
                                left: '20%',
                                width: '600px',
                                height: '600px',
                                background: 'radial-gradient(circle, rgba(0, 217, 255, 0.15) 0%, transparent 70%)',
                                filter: 'blur(80px)',
                                animation: 'nebulaDrift 40s ease-in-out infinite',
                            }}
                        />
                        {/* Nebula 2 - Purple */}
                        <div
                            className="absolute"
                            style={{
                                top: '50%',
                                right: '15%',
                                width: '500px',
                                height: '500px',
                                background: 'radial-gradient(circle, rgba(138, 43, 226, 0.12) 0%, transparent 70%)',
                                filter: 'blur(90px)',
                                animation: 'nebulaFloat 50s ease-in-out infinite',
                                animationDelay: '5s',
                            }}
                        />
                        {/* Nebula 3 - Blue */}
                        <div
                            className="absolute"
                            style={{
                                bottom: '20%',
                                left: '10%',
                                width: '700px',
                                height: '700px',
                                background: 'radial-gradient(circle, rgba(74, 158, 255, 0.1) 0%, transparent 70%)',
                                filter: 'blur(100px)',
                                animation: 'nebulaDrift 60s ease-in-out infinite reverse',
                                animationDelay: '10s',
                            }}
                        />
                    </div>

                    {/* Drifting Particles */}
                    <div className="absolute inset-0">
                        {[...Array(15)].map((_, i) => (
                            <div
                                key={`particle-${i}`}
                                className="absolute"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    width: '3px',
                                    height: '3px',
                                    background: 'rgba(255, 255, 255, 0.6)',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)',
                                    animation: `particleDrift ${20 + Math.random() * 20}s linear infinite`,
                                    animationDelay: `${Math.random() * 10}s`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Star Layer 1 - Background */}
                    <div className="star-layer-1 absolute inset-0">
                        {[...Array(50)].map((_, i) => (
                            <div
                                key={`star1-${i}`}
                                className="star"
                                style={{
                                    width: `${Math.random() * 2 + 1}px`,
                                    height: `${Math.random() * 2 + 1}px`,
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`
                                }}
                            />
                        ))}
                    </div>

                    {/* Star Layer 2 - Midground */}
                    <div className="star-layer-2 absolute inset-0">
                        {[...Array(30)].map((_, i) => (
                            <div
                                key={`star2-${i}`}
                                className="star"
                                style={{
                                    width: `${Math.random() * 1.5 + 0.5}px`,
                                    height: `${Math.random() * 1.5 + 0.5}px`,
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2.5}s`
                                }}
                            />
                        ))}
                    </div>

                    {/* Star Layer 3 - Foreground */}
                    <div className="star-layer-3 absolute inset-0">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={`star3-${i}`}
                                className="star"
                                style={{
                                    width: `${Math.random() * 3 + 1}px`,
                                    height: `${Math.random() * 3 + 1}px`,
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3.5}s`
                                }}
                            />
                        ))}
                    </div>

                    {/* Nebula Wisps */}
                    <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-purple-900/5 to-transparent blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-blue-900/5 to-transparent blur-3xl" />

                    {/* Vignette */}
                    <div className="absolute inset-0" style={{
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)'
                    }} />
                </div>

                {/* ─── Navigation Bar ──────────────────────────────────────────── */}
                <header className="nav-bar sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
                    <div className="max-w-[1400px] mx-auto px-10 h-16 flex items-center justify-between">
                        {/* Back Button */}
                        <Link to="/" className="flex items-center gap-2 text-sm font-medium transition-all duration-200" style={{ color: '#888888' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#FFFFFF';
                                e.currentTarget.style.transform = 'translateX(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#888888';
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                        >
                            <ArrowLeft size={15} />
                            <span>Return to Orbit</span>
                        </Link>

                        {/* Live Module Indicator */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
                            <span className="relative flex h-2 w-2">
                                <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: '#4A9EFF' }}>
                                Live Module
                            </span>
                        </div>
                    </div>
                </header>

                <main className="relative max-w-[1400px] mx-auto px-10 py-24">

                    {/* ─── Hero Section ────────────────────────────────────────── */}
                    <div className="flex flex-col items-center text-center mb-24">
                        {/* Section Badge */}
                        <div className="badge-appear inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{
                            background: 'rgba(0, 217, 255, 0.1)',
                            border: '1px solid rgba(0, 217, 255, 0.3)'
                        }}>
                            <MapPin size={12} style={{ color: '#00D9FF' }} />
                            <span className="text-[11px] font-medium tracking-[0.3em] uppercase" style={{ color: '#00D9FF' }}>
                                Location Intelligence
                            </span>
                        </div>

                        {/* Main Title */}
                        <h1 className="title-appear mb-8" style={{
                            fontSize: '72px',
                            fontWeight: 800,
                            letterSpacing: '-1.5px',
                            lineHeight: '1.1'
                        }}>
                            <span style={{ color: '#FFFFFF' }}>Celestial </span>
                            <span style={{
                                background: 'linear-gradient(135deg, #4A9EFF 0%, #00D9FF 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: '0px 4px 20px rgba(0, 217, 255, 0.3)',
                                filter: 'drop-shadow(0px 4px 20px rgba(0, 217, 255, 0.3))'
                            }}>Events</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="subtitle-appear text-lg max-w-[800px] mx-auto" style={{
                            color: '#999999',
                            lineHeight: '1.8'
                        }}>
                            Your personalized astronomical forecast. Discover meteor showers, eclipses, and planetary alignments visible from your exact coordinates.
                        </p>
                    </div>

                    {/* ─── Location Calibration Section ───────────────────────── */}
                    {!events && (
                        <div className="flex justify-center mb-20">
                            <div className="w-full max-w-[800px]">
                                <div
                                    className="form-appear rounded-2xl p-12"
                                    style={{
                                        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
                                        backdropFilter: 'blur(15px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: '0px 20px 60px rgba(0, 0, 0, 0.5), 0px 8px 30px rgba(74, 158, 255, 0.08)'
                                    }}
                                >
                                    {/* Section Title */}
                                    <h2 className="text-2xl font-semibold text-white mb-10 text-center">Calibrate Location</h2>

                                    {/* Auto-Detect Button */}
                                    <button
                                        onClick={handleAutoDetect}
                                        disabled={detecting}
                                        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-semibold transition-all duration-200 mb-10 disabled:opacity-50"
                                        style={{
                                            background: 'linear-gradient(135deg, #00D9FF 0%, #0099CC 100%)',
                                            color: '#FFFFFF',
                                            boxShadow: detecting ? 'none' : '0px 0px 20px rgba(0, 217, 255, 0.4)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!detecting) {
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                e.currentTarget.style.boxShadow = '0px 8px 30px rgba(0, 217, 255, 0.5)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = detecting ? 'none' : '0px 0px 20px rgba(0, 217, 255, 0.4)';
                                        }}
                                    >
                                        <LocateFixed size={18} className={detecting ? 'animate-spin' : ''} />
                                        {detecting ? 'Initializing...' : 'Auto-Detect Coordinates'}
                                    </button>

                                    {/* Manual Entry Divider */}
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="flex-1 h-px bg-white/10" />
                                        <span className="text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: '#00D9FF' }}>
                                            Manual Entry
                                        </span>
                                        <div className="flex-1 h-px bg-white/10" />
                                    </div>

                                    {/* Input Fields */}
                                    <div className="grid grid-cols-2 gap-5 mb-8">
                                        <div className="input-appear-1">
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-2 text-center" style={{ color: '#888888' }}>
                                                Latitude
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder="00.0000"
                                                value={latitude}
                                                onChange={(e) => setLatitude(e.target.value)}
                                                className="w-full px-4 py-3.5 rounded-xl text-sm font-mono text-white transition-all duration-200 text-center"
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '2px solid rgba(255, 255, 255, 0.1)',
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.border = '2px solid #00D9FF';
                                                    e.target.style.boxShadow = '0 0 15px rgba(0, 217, 255, 0.3)';
                                                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.border = '2px solid rgba(255, 255, 255, 0.1)';
                                                    e.target.style.boxShadow = 'none';
                                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                                }}
                                            />
                                        </div>
                                        <div className="input-appear-2">
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-2 text-center" style={{ color: '#888888' }}>
                                                Longitude
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder="00.0000"
                                                value={longitude}
                                                onChange={(e) => setLongitude(e.target.value)}
                                                className="w-full px-4 py-3.5 rounded-xl text-sm font-mono text-white transition-all duration-200 text-center"
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '2px solid rgba(255, 255, 255, 0.1)',
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.border = '2px solid #00D9FF';
                                                    e.target.style.boxShadow = '0 0 15px rgba(0, 217, 255, 0.3)';
                                                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.border = '2px solid rgba(255, 255, 255, 0.1)';
                                                    e.target.style.boxShadow = 'none';
                                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Initialize Button */}
                                    <button
                                        onClick={handleManualSubmit}
                                        className="button-appear w-full py-4 rounded-xl text-base font-bold transition-all duration-250"
                                        style={{
                                            background: 'linear-gradient(135deg, #00D9FF 0%, #0099CC 100%)',
                                            color: '#FFFFFF',
                                            boxShadow: '0px 8px 24px rgba(0, 217, 255, 0.3)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                            e.currentTarget.style.boxShadow = '0px 12px 32px rgba(0, 217, 255, 0.5)';
                                            e.currentTarget.style.filter = 'brightness(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = '0px 8px 24px rgba(0, 217, 255, 0.3)';
                                            e.currentTarget.style.filter = 'brightness(1)';
                                        }}
                                        onMouseDown={(e) => {
                                            e.currentTarget.style.transform = 'scale(0.98)';
                                        }}
                                        onMouseUp={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                        }}
                                    >
                                        Initialize Data Stream
                                    </button>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="flex items-start gap-3 mt-6 p-4 rounded-xl" style={{
                                        background: 'rgba(255, 100, 100, 0.1)',
                                        border: '1px solid rgba(255, 100, 100, 0.3)',
                                        animation: 'fadeIn 300ms ease-out'
                                    }}>
                                        <Info size={16} style={{ color: '#FF6464', flexShrink: 0, marginTop: '2px' }} />
                                        <span className="text-sm" style={{ color: 'rgba(255, 100, 100, 0.9)' }}>{error}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── Results Section ─────────────────────────────────────── */}
                    {events && hemisphere && (
                        <div>
                            {/* Status Bar */}
                            <div className="flex items-center justify-between p-5 rounded-xl mb-10" style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                                <div className="region-appear flex items-center gap-8">
                                    {/* Region */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                                            background: 'rgba(0, 217, 255, 0.1)',
                                            color: '#00D9FF'
                                        }}>
                                            <Globe size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#888888' }}>
                                                Region
                                            </div>
                                            <div className="text-sm font-medium text-white capitalize">
                                                {hemisphere} Hemisphere
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coordinates */}
                                    <div className="hidden sm:block w-px h-10 bg-white/10" />
                                    <div className="hidden sm:block">
                                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#888888' }}>
                                            Coordinates
                                        </div>
                                        <div className="text-sm font-medium text-white font-mono">
                                            {latitude}°, {longitude}°
                                        </div>
                                    </div>
                                </div>

                                {/* Recalibrate Button */}
                                <button
                                    onClick={handleReset}
                                    className="recalibrate-appear px-5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200"
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255, 255, 255, 0.25)',
                                        color: '#FFFFFF'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#00D9FF';
                                        e.currentTarget.style.color = '#00D9FF';
                                        e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 217, 255, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                                        e.currentTarget.style.color = '#FFFFFF';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    Recalibrate Location
                                </button>
                            </div>

                            {/* Event Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {events.map((event, index) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        index={index}
                                        isReminderActive={reminders[event.id] || false}
                                        onToggleReminder={(active) => handleToggleReminder(event, active)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    detail={toast.detail}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
}
