/**
 * AsteroidWatchPage.tsx — NASA Asteroid Watch with NeoWs API
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NASA_API_KEY = 'DEMO_KEY';
const NEOWS_URL = 'https://api.nasa.gov/neo/rest/v1/feed';

interface NeoAsteroid {
    id: string;
    name: string;
    estimated_diameter_min_km: number;
    estimated_diameter_max_km: number;
    is_potentially_hazardous: boolean;
    close_approach_date: string;
    close_approach_time: string;
    miss_distance_km: number;
    relative_velocity_kmps: number;
}

function parseNeoData(data: Record<string, unknown>): NeoAsteroid[] {
    const results: NeoAsteroid[] = [];
    const near_earth_objects = (data as {
        near_earth_objects?: Record<string, Array<{
            id: string;
            name: string;
            estimated_diameter: { kilometers: { estimated_diameter_min: number; estimated_diameter_max: number } };
            is_potentially_hazardous_asteroid: boolean;
            close_approach_data: Array<{
                close_approach_date: string;
                close_approach_date_full: string;
                miss_distance: { kilometers: string };
                relative_velocity: { kilometers_per_second: string };
            }>;
        }>>
    }).near_earth_objects;
    if (!near_earth_objects) return results;

    for (const date of Object.keys(near_earth_objects)) {
        for (const neo of near_earth_objects[date]) {
            const cad = neo.close_approach_data[0];
            if (!cad) continue;
            results.push({
                id: neo.id,
                name: neo.name,
                estimated_diameter_min_km: neo.estimated_diameter.kilometers.estimated_diameter_min,
                estimated_diameter_max_km: neo.estimated_diameter.kilometers.estimated_diameter_max,
                is_potentially_hazardous: neo.is_potentially_hazardous_asteroid,
                close_approach_date: cad.close_approach_date,
                close_approach_time: cad.close_approach_date_full || cad.close_approach_date,
                miss_distance_km: parseFloat(cad.miss_distance.kilometers),
                relative_velocity_kmps: parseFloat(cad.relative_velocity.kilometers_per_second),
            });
        }
    }

    return results.sort((a, b) => a.miss_distance_km - b.miss_distance_km).slice(0, 10);
}

function formatDistance(km: number): string {
    if (km >= 1e6) return (km / 1e6).toFixed(2) + ' million km';
    return Math.round(km).toLocaleString() + ' km';
}

// Countdown timer component
function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const update = () => {
            const now = Date.now();
            const target = new Date(targetDate).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('PASSED');
                return;
            }

            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${days}d ${hours}h ${mins}m ${secs}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [targetDate]);

    return <span className="font-mono text-[#00FF88] text-sm">{timeLeft}</span>;
}

export default function AsteroidWatchPage() {
    const navigate = useNavigate();
    const [asteroids, setAsteroids] = useState<NeoAsteroid[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Fetch asteroid data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const today = new Date();
                const end = new Date(today);
                end.setDate(end.getDate() + 7);

                const startDate = today.toISOString().split('T')[0];
                const endDate = end.toISOString().split('T')[0];

                const resp = await axios.get(NEOWS_URL, {
                    params: {
                        start_date: startDate,
                        end_date: endDate,
                        api_key: NASA_API_KEY,
                    },
                });

                const parsed = parseNeoData(resp.data);
                setAsteroids(parsed);
                setError(null);
            } catch (err) {
                setError('Failed to fetch asteroid data. Using sample data.');
                // Fallback sample data
                setAsteroids([
                    { id: '1', name: '2024 XK1', estimated_diameter_min_km: 0.05, estimated_diameter_max_km: 0.12, is_potentially_hazardous: false, close_approach_date: '2026-02-15', close_approach_time: '2026-02-15 14:30', miss_distance_km: 4523000, relative_velocity_kmps: 12.5 },
                    { id: '2', name: '162882 (2001 FD58)', estimated_diameter_min_km: 1.2, estimated_diameter_max_km: 2.7, is_potentially_hazardous: true, close_approach_date: '2026-02-16', close_approach_time: '2026-02-16 19:41', miss_distance_km: 6498301, relative_velocity_kmps: 18.3 },
                    { id: '3', name: '2025 AB7', estimated_diameter_min_km: 0.03, estimated_diameter_max_km: 0.07, is_potentially_hazardous: false, close_approach_date: '2026-02-17', close_approach_time: '2026-02-17 08:15', miss_distance_km: 8234000, relative_velocity_kmps: 8.7 },
                    { id: '4', name: '2023 TL4', estimated_diameter_min_km: 0.15, estimated_diameter_max_km: 0.34, is_potentially_hazardous: false, close_approach_date: '2026-02-18', close_approach_time: '2026-02-18 22:10', miss_distance_km: 12450000, relative_velocity_kmps: 15.1 },
                    { id: '5', name: '(52768) 1998 OR2', estimated_diameter_min_km: 1.8, estimated_diameter_max_km: 4.1, is_potentially_hazardous: true, close_approach_date: '2026-02-20', close_approach_time: '2026-02-20 06:30', miss_distance_km: 16200000, relative_velocity_kmps: 31.2 },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Draw Earth + trajectory visualization
    const drawVisualization = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);

        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        const cx = w * 0.5;
        const cy = h * 0.5;

        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        // Stars
        for (let i = 0; i < 100; i++) {
            const sx = Math.random() * w;
            const sy = Math.random() * h;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.random() * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.5})`;
            ctx.fill();
        }

        // Earth
        const earthR = 40;
        const earthGrad = ctx.createRadialGradient(cx - 10, cy - 10, 0, cx, cy, earthR);
        earthGrad.addColorStop(0, '#6BB5FF');
        earthGrad.addColorStop(0.5, '#4A90D9');
        earthGrad.addColorStop(1, '#1a3a5c');
        ctx.beginPath();
        ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
        ctx.fillStyle = earthGrad;
        ctx.fill();

        // Atmosphere glow
        const glow = ctx.createRadialGradient(cx, cy, earthR, cx, cy, earthR + 20);
        glow.addColorStop(0, 'rgba(107,181,255,0.3)');
        glow.addColorStop(1, 'rgba(107,181,255,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, earthR + 20, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Draw asteroid trajectories
        if (asteroids.length > 0) {
            asteroids.forEach((ast, i) => {
                const angle = -0.5 + (i * 0.25);
                const dist = 60 + (ast.miss_distance_km / 1e6) * 8;
                const ax = cx + Math.cos(angle) * dist;
                const ay = cy + Math.sin(angle) * dist;
                const size = 2 + (ast.estimated_diameter_max_km * 2);

                // Trajectory line
                ctx.beginPath();
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = i === selectedIdx
                    ? ast.is_potentially_hazardous ? '#FF6B35' : '#00FF88'
                    : 'rgba(255,255,255,0.1)';
                ctx.lineWidth = i === selectedIdx ? 1.5 : 0.5;
                ctx.moveTo(cx + Math.cos(angle) * (earthR + 25), cy + Math.sin(angle) * (earthR + 25));
                ctx.lineTo(ax + Math.cos(angle) * 80, ay + Math.sin(angle) * 80);
                ctx.stroke();
                ctx.setLineDash([]);

                // Asteroid dot
                ctx.beginPath();
                ctx.arc(ax, ay, Math.min(size, 6), 0, Math.PI * 2);
                ctx.fillStyle = i === selectedIdx
                    ? (ast.is_potentially_hazardous ? '#FF6B35' : '#00FF88')
                    : '#666';
                ctx.fill();

                // Label for selected
                if (i === selectedIdx) {
                    ctx.font = '10px Inter, sans-serif';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.fillText(ast.name, ax, ay - 10);
                }
            });
        }

        // "Earth" label
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('EARTH', cx, cy + earthR + 16);
    }, [asteroids, selectedIdx]);

    useEffect(() => {
        drawVisualization();
    }, [drawVisualization]);

    return (
        <div className="relative h-full w-full flex flex-col bg-black text-white overflow-hidden">
            {/* Top bar */}
            <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-black/50 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="text-white/30 hover:text-white transition-colors text-sm"
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-sm font-bold tracking-[0.15em] uppercase">Eyes on Asteroids</h1>
                        <p className="text-[10px] text-white/30 tracking-wide">The next closest approaches to Earth</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                    <span className="text-[10px] font-bold tracking-[0.1em] text-[#00FF88]">LIVE</span>
                </div>
            </header>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* LEFT: Asteroid cards */}
                <div className="w-96 flex-shrink-0 overflow-y-auto border-r border-white/[0.06] p-4 space-y-3">
                    <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30 mb-3">
                        Asteroid Watch
                    </h2>

                    {loading && (
                        <div className="flex flex-col items-center py-16 text-white/20">
                            <div className="w-8 h-8 border-2 border-white/10 border-t-[#4A90D9] rounded-full animate-spin mb-3" />
                            <span className="text-xs">Fetching asteroid data...</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-xs text-[#FF9A42] bg-[#FF9A42]/10 px-3 py-2 rounded-lg mb-3">
                            {error}
                        </div>
                    )}

                    {asteroids.map((ast, i) => (
                        <button
                            key={ast.id}
                            onClick={() => setSelectedIdx(i)}
                            className={`w-full text-left rounded-xl p-4 border transition-all ${i === selectedIdx
                                    ? 'border-[#4A90D9]/30 bg-[#4A90D9]/[0.06]'
                                    : 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-white truncate">{ast.name}</h3>
                                    <p className="text-[10px] text-white/30 mt-0.5">{ast.close_approach_date}</p>
                                </div>
                                {ast.is_potentially_hazardous && (
                                    <span className="text-[9px] bg-[#FF6B35]/20 text-[#FF6B35] px-1.5 py-0.5 rounded font-bold tracking-wider">
                                        PHA
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] mt-3">
                                <div>
                                    <span className="text-white/30">Miss Distance</span>
                                    <p className="text-white font-mono text-xs mt-0.5">{formatDistance(ast.miss_distance_km)}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-white/30">Countdown</span>
                                    <p className="mt-0.5">
                                        <CountdownTimer targetDate={ast.close_approach_time} />
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-2.5 text-[10px] text-white/20">
                                <span>⌀ {ast.estimated_diameter_min_km.toFixed(2)}-{ast.estimated_diameter_max_km.toFixed(2)} km</span>
                                <span>v: {ast.relative_velocity_kmps.toFixed(1)} km/s</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* RIGHT: Visualization */}
                <div className="flex-1 relative">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                    />

                    {/* Overlay info */}
                    {asteroids[selectedIdx] && (
                        <div className="absolute bottom-6 left-6 glass-panel rounded-xl p-4 max-w-xs">
                            <h3 className="text-sm font-medium mb-1">{asteroids[selectedIdx].name}</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                                <div className="text-white/30">Miss Distance</div>
                                <div className="font-mono text-right">{formatDistance(asteroids[selectedIdx].miss_distance_km)}</div>
                                <div className="text-white/30">Velocity</div>
                                <div className="font-mono text-right">{asteroids[selectedIdx].relative_velocity_kmps.toFixed(1)} km/s</div>
                                <div className="text-white/30">Diameter</div>
                                <div className="font-mono text-right">{asteroids[selectedIdx].estimated_diameter_min_km.toFixed(2)}-{asteroids[selectedIdx].estimated_diameter_max_km.toFixed(2)} km</div>
                                <div className="text-white/30">Hazardous</div>
                                <div className={`text-right font-medium ${asteroids[selectedIdx].is_potentially_hazardous ? 'text-[#FF6B35]' : 'text-[#00FF88]'}`}>
                                    {asteroids[selectedIdx].is_potentially_hazardous ? 'Yes' : 'No'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
