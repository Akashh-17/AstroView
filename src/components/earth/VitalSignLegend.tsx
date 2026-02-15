/**
 * VitalSignLegend.tsx
 *
 * Color-bar legend overlay shown at the bottom of the globe
 * when a vital-sign data layer is active (ozone, temperature, etc.).
 * Matches NASA "Eyes on Earth" style.
 */

import { useSatelliteStore } from '../../store/satelliteStore';
import type { VitalSignId } from '../../data/satelliteData';

/** Legend configuration per vital sign */
interface LegendConfig {
    label: string;
    unit: string;
    /** CSS gradient (left = low, right = high) */
    gradient: string;
    /** Tick labels along the bar */
    ticks: string[];
}

const LEGEND_MAP: Partial<Record<VitalSignId, LegendConfig>> = {
    ozone: {
        label: 'Ozone',
        unit: 'Dobson units',
        gradient:
            'linear-gradient(to right, #59007a, #1a0090, #0033cc, #0073bf, #009999, #00b359, #26bf0d, #80cc00, #d9d900, #ffa600, #f25a00, #d91a00, #990000)',
        ticks: ['0', '100', '200', '300', '400', '500', '600', '700'],
    },
    air_temperature: {
        label: 'Temperature',
        unit: '°C',
        gradient:
            'linear-gradient(to right, #1a0038, #260a6b, #1419b3, #008ed9, #00b380, #34d126, #a6e600, #ffe600, #ff8c00, #f21e00, #b30514, #f27390)',
        ticks: ['-40', '-20', '0', '10', '20', '30', '40', '50'],
    },
    precipitation: {
        label: 'Precipitation',
        unit: 'mm/hr',
        gradient:
            'linear-gradient(to right, #1a1a2e, #1c3d6e, #0073b3, #00a38c, #26b31a, #99cc00, #e6e600, #ff9900, #e63900, #990d0d)',
        ticks: ['0', '1', '2', '4', '8', '16', '32'],
    },
    soil_moisture: {
        label: 'Soil Moisture',
        unit: 'cm³/cm³',
        gradient:
            'linear-gradient(to right, #733805, #b36608, #e6c71a, #80cc26, #1ab34d, #0e8c59, #0d8fb3, #0850cc, #1a1a8c)',
        ticks: ['0', '0.1', '0.2', '0.3', '0.4', '0.5'],
    },
    water_storage: {
        label: 'Water Storage',
        unit: 'cm of equiv water',
        gradient:
            'linear-gradient(to right, #8c0000, #cc1400, #f83319, #f97a4d, #fcc0a6, #faf2ef, #eff2fa, #a6c0f0, #4d80e0, #1940c0, #001480, #000059)',
        ticks: ['-25', '-16', '-8', '0', '8', '16', '25'],
    },
};

export default function VitalSignLegend() {
    const activeVitalSign = useSatelliteStore((s) => s.activeVitalSign);

    if (!activeVitalSign || activeVitalSign === 'satellites_now') return null;

    const config = LEGEND_MAP[activeVitalSign];
    if (!config) return null;

    return (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none select-none">
            {/* Unit label */}
            <span className="text-white/70 text-[11px] font-medium tracking-wide mb-1.5">
                {config.unit}
            </span>

            {/* Color bar */}
            <div
                className="rounded-sm overflow-hidden"
                style={{
                    width: 280,
                    height: 14,
                    background: config.gradient,
                    boxShadow: '0 0 12px rgba(0,0,0,0.6)',
                }}
            />

            {/* Tick labels */}
            <div
                className="flex justify-between mt-1"
                style={{ width: 280 }}
            >
                {config.ticks.map((t, i) => (
                    <span
                        key={i}
                        className="text-white/60 text-[9px] font-mono"
                        style={{ minWidth: 0 }}
                    >
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
}
