/**
 * VitalSignInfo.tsx
 *
 * Expandable educational info panel for each vital-sign overlay.
 * Shows 2–3 paragraphs about the data layer, measurement techniques,
 * and the satellites that contribute to each view.
 * Collapsed by default — user clicks an up-arrow to reveal.
 */

import { useState, useEffect } from 'react';
import { useSatelliteStore } from '../../store/satelliteStore';
import { VITAL_SIGN_SATELLITES } from '../../data/satelliteData';
import type { VitalSignId } from '../../data/satelliteData';

interface VitalSignContent {
    title: string;
    paragraphs: string[];
}

const INFO_CONTENT: Partial<Record<VitalSignId, VitalSignContent>> = {
    air_temperature: {
        title: 'Air Temperature',
        paragraphs: [
            'Global air temperature is one of the most critical indicators of climate change. NASA and partner agencies track surface and atmospheric temperatures using infrared and microwave radiometers aboard polar-orbiting and geostationary satellites. These instruments measure thermal radiation emitted by the Earth\'s surface, oceans, and atmosphere to build a comprehensive picture of how our planet is warming.',
            'The color map shows surface temperature variations — warmer regions appear in reds and oranges (tropical zones, deserts), while cooler regions appear in blues and purples (polar areas, high altitudes). Scientists use this data to study heat waves, urban heat islands, Arctic amplification, and long-term warming trends that drive climate policy.',
            'Key satellites in this view include NOAA-20 and Suomi NPP (carrying the VIIRS instrument), Sentinel-3A/3B (SLSTR radiometer), Aqua and Terra (MODIS), and geostationary platforms like GOES-16/18 and Himawari-8/9 that provide continuous monitoring over their regions.',
        ],
    },
    precipitation: {
        title: 'Precipitation',
        paragraphs: [
            'Precipitation — rain, snow, sleet, and hail — is the primary way water returns from the atmosphere to Earth\'s surface. The Global Precipitation Measurement (GPM) mission, co-led by NASA and JAXA, serves as the backbone of a constellation of satellites that together provide near-real-time global precipitation estimates every 30 minutes.',
            'The visualization shows precipitation intensity across the globe — blues and greens indicate light to moderate rainfall, while yellows, oranges, and reds highlight heavy precipitation events such as tropical storms, monsoons, and atmospheric rivers. This data is vital for weather forecasting, flood prediction, drought monitoring, and understanding the global water cycle.',
            'The GPM Core Observatory carries a dual-frequency precipitation radar and a microwave imager. It is complemented by partner satellites including NOAA-18/19/20, MetOp-B/C, GOES-16/18, and Himawari-8/9, creating a constellation that captures precipitation data across the entire planet.',
        ],
    },
    soil_moisture: {
        title: 'Soil Moisture',
        paragraphs: [
            'Soil moisture — the water held in the top few centimeters of soil — plays a crucial role in weather, agriculture, and ecosystems. NASA\'s Soil Moisture Active Passive (SMAP) mission measures soil moisture globally every 2–3 days using an L-band microwave radiometer, which can penetrate vegetation and light cloud cover to detect water content in the soil.',
            'The color map shows dry regions in browns and oranges (deserts, drought areas) and wet regions in greens and blues (tropical rainforests, recently rained areas). Oceans appear dark since soil moisture is a land-only measurement. This data helps farmers optimize irrigation, aids wildfire risk prediction, and improves weather and climate models.',
            'SMAP is the primary mission for this data, supported by ESA\'s SMOS (Soil Moisture and Ocean Salinity) satellite, Sentinel-1A/1B (using SAR radar), Aqua (AMSR-E heritage), and MetOp-B/C. Together these provide multi-frequency observations that improve soil moisture accuracy across different terrain types.',
        ],
    },
    ozone: {
        title: 'Ozone Layer (O₃)',
        paragraphs: [
            'The ozone layer, located primarily in the stratosphere 15–35 km above Earth, absorbs most of the Sun\'s harmful ultraviolet (UV) radiation. Total column ozone is measured in Dobson Units (DU) — a typical value is about 300 DU. Satellites monitor ozone by observing how UV and visible sunlight is absorbed as it passes through the atmosphere.',
            'The visualization shows ozone concentration across the globe — reds and oranges indicate high ozone (300–500+ DU, typical at mid and high northern latitudes), greens and cyans show moderate levels, and blues and purples reveal low values. The famous "ozone hole" appears over Antarctica each spring as a deep purple/blue region where ozone drops below 200 DU due to chlorofluorocarbon (CFC) chemistry on polar stratospheric clouds.',
            'Sentinel-5P (carrying the TROPOMI instrument) provides the highest-resolution ozone maps, complemented by Suomi NPP and NOAA-20 (OMPS), Aura (OMI and MLS), and MetOp-B/C (GOME-2). These satellites work together to track the slow recovery of the ozone layer under the Montreal Protocol — one of the most successful international environmental agreements.',
        ],
    },
    water_storage: {
        title: 'Water Storage (GRACE-FO)',
        paragraphs: [
            'The GRACE Follow-On (GRACE-FO) mission measures tiny variations in Earth\'s gravity field caused by the movement of water mass — including groundwater, ice sheets, lakes, rivers, and ocean currents. By tracking changes in the distance between twin satellites flying 220 km apart using microwave ranging and a laser interferometer, scientists can map how water is redistributed across the planet each month.',
            'The diverging red-white-blue color map shows water storage anomalies relative to a long-term average. Blue regions indicate water surplus (above-average groundwater, recent heavy precipitation, or ice accumulation), while red regions show water deficit (drought, groundwater depletion, or ice mass loss). White areas are near normal. This data has revealed alarming groundwater depletion in India, California\'s Central Valley, and the Middle East.',
            'The GRACE-FO twin satellites are the primary data source, supported by altimetry missions like Sentinel-6A (Michael Freilich), Jason-3, and CryoSat-2 that measure sea level and ice elevation. SARAL provides ocean surface measurements, while SMAP contributes surface soil moisture data that complements the deeper groundwater signals from GRACE-FO.',
        ],
    },
};

export default function VitalSignInfo() {
    const activeVitalSign = useSatelliteStore((s) => s.activeVitalSign);
    const [expanded, setExpanded] = useState(false);

    // Collapse when switching vital signs
    useEffect(() => {
        setExpanded(false);
    }, [activeVitalSign]);

    if (!activeVitalSign || activeVitalSign === 'satellites_now') return null;

    const content = INFO_CONTENT[activeVitalSign];
    if (!content) return null;

    const satellites = VITAL_SIGN_SATELLITES[activeVitalSign] ?? [];

    return (
        <div className="absolute right-4 z-30 flex flex-col items-end"
            style={{ bottom: 120, maxWidth: 640, width: '45%' }}
        >
            {/* Toggle button */}
            <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-2 px-5 py-1.5 rounded-t-lg border border-b-0 border-white/10 backdrop-blur-md transition-all hover:bg-white/10"
                style={{ background: 'rgba(10,10,20,0.80)' }}
            >
                <svg
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                >
                    <polyline points="18 15 12 9 6 15" />
                </svg>
                <span className="text-[13px] font-semibold text-white/80 tracking-wide">
                    {expanded ? 'Hide Info' : 'Learn About This View'}
                </span>
            </button>

            {/* Expandable panel */}
            <div
                className="w-full overflow-hidden transition-all duration-400 ease-in-out rounded-lg rounded-tr-none border border-white/10"
                style={{
                    maxHeight: expanded ? 550 : 0,
                    opacity: expanded ? 1 : 0,
                    background: 'rgba(8,8,18,0.93)',
                    backdropFilter: 'blur(16px)',
                }}
            >
                <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: 500 }}>
                    {/* Title */}
                    <h3 className="text-[18px] font-bold text-white/90 tracking-wide">
                        {content.title}
                    </h3>

                    {/* Paragraphs */}
                    {content.paragraphs.map((p, i) => (
                        <p key={i} className="text-[14px] leading-[1.8] text-white/70">
                            {p}
                        </p>
                    ))}

                    {/* Satellite chips */}
                    {satellites.length > 0 && (
                        <div className="pt-3 border-t border-white/[0.08]">
                            <span className="text-[12px] font-semibold text-white/50 uppercase tracking-[0.1em]">
                                Satellites in this view
                            </span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {satellites.map((name) => (
                                    <span
                                        key={name}
                                        className="px-2.5 py-1 rounded-full text-[12px] font-mono text-white/75 border border-white/12"
                                        style={{ background: 'rgba(255,255,255,0.05)' }}
                                    >
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
