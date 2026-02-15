import { useRef, useEffect } from 'react';
import { View } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { ChevronDown } from 'lucide-react';
import HeroBackground from '../components/landing/HeroBackground';
import EarthSunrise from '../components/landing/EarthSunrise';
import ModuleCard from '../components/landing/ModuleCard';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// High-quality space images (public domain / free use)
const CARD_IMAGES = {
    solarSystem: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&q=80&auto=format',
    asteroids: 'https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?w=600&q=80&auto=format',
    earthSatellites: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80&auto=format',
    celestialEvents: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&q=80&auto=format',
};

export default function HomePage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const heroTextRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (heroTextRef.current) {
            gsap.fromTo(heroTextRef.current.children,
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.8, stagger: 0.15, ease: 'power3.out', delay: 0.3 }
            );
        }
    }, []);

    return (
        <div ref={containerRef} className="relative w-full min-h-screen bg-black text-white selection:bg-blue-500/30 selection:text-white overflow-x-hidden">

            {/* ─── SHARED CANVAS (Fixed Background) ────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <Canvas
                    eventSource={containerRef as React.RefObject<HTMLElement>}
                    className="w-full h-full"
                    shadows
                    camera={{ position: [0, 0, 20], fov: 35 }}
                    style={{ pointerEvents: 'none' }}
                >
                    <View.Port />
                </Canvas>
            </div>

            {/* ─── HERO SECTION (Screen 1) ─────────────────────────────────── */}
            <section className="relative h-screen w-full flex flex-col items-center justify-center z-10">
                {/* Hero Scene View (Background Stars + Earth) */}
                <div className="absolute inset-0 -z-10">
                    <View className="w-full h-full">
                        <HeroBackground />
                        <EarthSunrise />
                        <ambientLight intensity={0.3} />
                    </View>
                </div>

                {/* Hero Content Overlay */}
                <div ref={heroTextRef} className="text-center z-20 pointer-events-auto px-4 flex flex-col items-center -mt-20">
                    <h1 className="text-5xl sm:text-7xl md:text-[8rem] lg:text-[10rem] font-extralight tracking-[-0.04em] mb-3 text-white/95 leading-[0.85]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        ASTRO<span className="font-light">LENS</span>
                    </h1>
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent mb-4"></div>
                    <p className="text-xs sm:text-sm font-light text-white/40 tracking-[0.4em] uppercase">
                        Explore · Discover · Understand
                    </p>
                </div>

                {/* Scroll Indicator */}
                <div
                    className="absolute bottom-8 flex flex-col items-center gap-2 text-white/25 hover:text-white/50 transition-colors cursor-pointer z-20"
                    onClick={() => {
                        document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    <span className="text-[10px] tracking-[0.3em] uppercase font-light">Scroll</span>
                    <ChevronDown size={20} strokeWidth={1} className="animate-bounce" />
                </div>
            </section>

            {/* ─── MODULE CARDS SECTION (Screen 2) ─────────────────────────── */}
            <section id="modules" className="relative min-h-screen w-full flex flex-col items-center justify-center py-32 z-10" style={{ background: 'linear-gradient(180deg, #000000 0%, #020208 30%, #050510 100%)' }}>

                {/* Subtle radial accent */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(30, 60, 120, 0.08) 0%, transparent 100%)'
                }} />

                <p className="text-[11px] font-medium mb-3 tracking-[0.4em] text-blue-400/70 uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Mission Control
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-light mb-16 sm:mb-20 text-center tracking-tight text-white/90" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-normal">Destination</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 px-4 sm:px-6 max-w-7xl w-full pointer-events-auto">
                    {/* Card 1: Solar System */}
                    <ModuleCard
                        title="Solar System"
                        description="Navigate through our cosmic neighborhood. Explore planets, moons, and their orbits in real-time."
                        to="/solar-system"
                        image={CARD_IMAGES.solarSystem}
                        color="#E8C870"
                    />

                    {/* Card 2: Asteroids */}
                    <ModuleCard
                        title="Asteroid Belt"
                        description="Track Near-Earth Objects and hazardous asteroids. Monitor their proximity and impact risk."
                        to="/asteroids"
                        image={CARD_IMAGES.asteroids}
                        color="#FF6B6B"
                    />

                    {/* Card 3: Earth Satellites */}
                    <ModuleCard
                        title="All Eyes on Earth"
                        description="Visualize thousands of active satellites orbiting our planet. Filter by type and orbit."
                        to="/earth-satellites"
                        image={CARD_IMAGES.earthSatellites}
                        color="#4A9EFF"
                    />

                    {/* Card 4: Celestial Events */}
                    <ModuleCard
                        title="Explore Events Near You"
                        description="Discover upcoming celestial events visible from your location based on your hemisphere."
                        to="/celestial-events"
                        image={CARD_IMAGES.celestialEvents}
                        color="#A78BFA"
                    />
                </div>
            </section>
        </div>
    );
}
