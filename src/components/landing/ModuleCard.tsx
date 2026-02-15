import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface ModuleCardProps {
    title: string;
    description: string;
    to: string;
    image: string;
    color: string;
}

export default function ModuleCard({ title, description, to, image, color }: ModuleCardProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <Link
            to={to}
            className="group relative flex flex-col rounded-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
                backdropFilter: 'blur(16px)',
                border: `1px solid ${hovered ? color + '66' : 'rgba(255, 255, 255, 0.08)'}`,
                boxShadow: hovered
                    ? `0 25px 50px -12px ${color}44, 0 0 30px -5px ${color}22, inset 0 1px 0 rgba(255,255,255,0.1)`
                    : '0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
        >
            {/* Image Container */}
            <div className="relative w-full h-48 overflow-hidden">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
                {/* Gradient overlay on image */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/40 to-transparent" />

                {/* Color accent glow */}
                <div
                    className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse at center bottom, ${color}20 0%, transparent 70%)`,
                        opacity: hovered ? 1 : 0.3,
                    }}
                />
            </div>

            {/* Text Content */}
            <div className="text-center px-6 pb-6 pt-4 z-10">
                <h3 className="text-xl font-semibold text-white mb-2 tracking-wide">
                    {title}
                </h3>
                <p className="text-white/50 text-sm mb-5 leading-relaxed">
                    {description}
                </p>

                <div className={`inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-300 ${hovered ? 'text-white gap-3' : 'text-white/30'}`}>
                    EXPLORE <ArrowRight size={14} className={`transition-transform duration-300 ${hovered ? 'translate-x-1' : ''}`} />
                </div>
            </div>

            {/* Hover Border Glow */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    boxShadow: `inset 0 0 30px ${color}15, 0 0 15px ${color}10`
                }}
            />
        </Link>
    );
}
