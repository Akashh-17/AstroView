/**
 * HomePage.tsx — Landing page with hero and product cards
 */
import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

// ─── STAR CANVAS BACKGROUND ─────────────────────────────────────────────────
function StarCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        const stars: { x: number; y: number; r: number; a: number; speed: number }[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create stars
        for (let i = 0; i < 400; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() < 0.05 ? 1.5 + Math.random() : 0.3 + Math.random() * 0.7,
                a: 0.3 + Math.random() * 0.7,
                speed: 0.02 + Math.random() * 0.08,
            });
        }

        const draw = () => {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const t = Date.now() * 0.001;
            for (const star of stars) {
                const flicker = 0.7 + Math.sin(t * star.speed * 10 + star.x) * 0.3;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${star.a * flicker})`;
                ctx.fill();
            }

            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─── PRODUCT CARD ────────────────────────────────────────────────────────────
interface CardProps {
    title: string;
    subtitle: string;
    gradient: string;
    icon: string;
    to: string;
    delay: number;
}

function ProductCard({ title, subtitle, gradient, icon, to, delay }: CardProps) {
    return (
        <Link
            to={to}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm transition-all duration-500 hover:scale-[1.03] hover:border-white/[0.15] hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(75,130,220,0.15)] text-left animate-fade-in no-underline"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Gradient thumbnail */}
            <div className={`h-40 w-full ${gradient} flex items-center justify-center text-5xl`}>
                {icon}
            </div>
            {/* Content */}
            <div className="p-5">
                <h3 className="text-base font-semibold text-white mb-1 tracking-wide group-hover:text-[#6BB5FF] transition-colors">
                    {title}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">{subtitle}</p>
            </div>
            {/* Hover glow strip */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#4A90D9] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>
    );
}

// ─── HOME PAGE ───────────────────────────────────────────────────────────────
export default function HomePage() {
    return (
        <div className="relative h-full w-full overflow-y-auto">
            {/* Star background */}
            <StarCanvas />

            {/* Hero Section */}
            <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
                {/* Astrolens logo mark */}
                <div className="mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <div className="w-16 h-16 mx-auto rounded-full border-2 border-white/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4A90D9] to-[#0B3D91]" />
                    </div>
                </div>

                <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
<<<<<<< HEAD
                    Astrolens <span className="bg-gradient-to-r from-[#4A90D9] to-[#6BB5FF] bg-clip-text text-transparent">Eyes</span>
=======
                    <span className="bg-gradient-to-r from-[#4A90D9] to-[#6BB5FF] bg-clip-text text-transparent">Astrolens</span>
>>>>>>> 82c6cca67ea55cc803b8afe7926ef6c0bd8549de
                </h1>

                <p className="max-w-2xl text-base md:text-lg text-white/50 leading-relaxed mb-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
                    Interactive 3D visualization of the Solar System and Near-Earth Objects.
                </p>

                {/* Scroll indicator */}
                <div className="animate-bounce text-white/20 animate-fade-in" style={{ animationDelay: '800ms' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 13l5 5 5-5M7 7l5 5 5-5" />
                    </svg>
                </div>
            </section>

            {/* Product Cards Section */}
            <section className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-4xl flex flex-col items-center">
                    <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-white/30 text-center mb-10">
                        Click any of these modules to start exploring
                    </p>

<<<<<<< HEAD
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <ProductCard
                        title="Eyes on the Solar System"
                        subtitle="Real-Time 3D Data Visualization: Past, Present, and Future"
                        gradient="bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#0a1628]"
                        icon="🪐"
                        to="/solar-system"
                        delay={100}
                    />
                    <ProductCard
                        title="Eyes on Asteroids"
                        subtitle="Tracking near-Earth objects in real-time 3D"
                        gradient="bg-gradient-to-br from-[#1a1a0a] via-[#2a2510] to-[#0a0a0a]"
                        icon="☄️"
                        to="/asteroids"
                        delay={200}
                    />
                    <ProductCard
                        title="Eyes on the Earth"
                        subtitle="See the planet's vital signs in 3D"
                        gradient="bg-gradient-to-br from-[#0a1e28] via-[#0b2d3e] to-[#0a1218]"
                        icon="🌍"
                        to="/solar-system"
                        delay={300}
                    />
                    <ProductCard
                        title="Eyes on Exoplanets"
                        subtitle="Explore alien worlds beyond our solar system"
                        gradient="bg-gradient-to-br from-[#1a0a1e] via-[#2d0a2e] to-[#0a0818]"
                        icon="✨"
                        to="/solar-system"
                        delay={400}
                    />
=======
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        <ProductCard
                            title="Solar System"
                            subtitle="Real-Time 3D Data Visualization: Past, Present, and Future"
                            gradient="bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#0a1628]"
                            icon="🪐"
                            onClick={goTo('/solar-system')}
                            delay={100}
                        />
                        <ProductCard
                            title="Asteroids"
                            subtitle="Tracking near-Earth objects in real-time 3D"
                            gradient="bg-gradient-to-br from-[#1a1a0a] via-[#2a2510] to-[#0a0a0a]"
                            icon="☄️"
                            onClick={goTo('/asteroids')}
                            delay={200}
                        />
                        <ProductCard
                            title="All Eyes on Earth"
                            subtitle="Track satellites and space activity orbiting our planet in real-time"
                            gradient="bg-gradient-to-br from-[#0d1b2a] via-[#1a2332] to-[#0a1520]"
                            icon="🛰️"
                            onClick={goTo('/earth-satellites')}
                            delay={300}
                        />
                    </div>
>>>>>>> 82c6cca67ea55cc803b8afe7926ef6c0bd8549de
                </div>
            </section>
        </div>
    );
}
