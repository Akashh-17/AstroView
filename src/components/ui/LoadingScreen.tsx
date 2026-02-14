/**
 * LoadingScreen.tsx — Orbital loading animation
 */
export default function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
            {/* Orbital spinner */}
            <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4A90D9] animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-[#6BB5FF] animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#4A90D9]" />
                </div>
            </div>
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-white/60">{message}</p>
        </div>
    );
}
