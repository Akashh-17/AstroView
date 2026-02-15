/**
 * solarSystemStore.ts — Solar system simulation state
 * Supports time controls with 0.1x–1000x speed factors
 */
import { create } from 'zustand';
import { currentJulianDate } from '../engine/timeEngine';

export const TIME_SPEEDS = [
    { label: '0.1x', factor: 0.1 * 86400 },
    { label: '1x', factor: 1 * 86400 },
    { label: '10x', factor: 10 * 86400 },
    { label: '100x', factor: 100 * 86400 },
    { label: '1000x', factor: 1000 * 86400 },
];

interface SolarSystemState {
    // Time
    simulationTime: number;
    isPlaying: boolean;
    speedIndex: number;
    timeDirection: number;
    // Selection
    selectedBody: string | null;
    focusTarget: string | null;
    cameraTransitioning: boolean;
    // Visibility
    showOrbits: boolean;
    showLabels: boolean;
    showMoons: boolean;
    showAsteroids: boolean;
    showGrid: boolean;
    // Camera zoom
    zoomLevel: number;
    // Actions
    tick: (delta: number) => void;
    togglePlay: () => void;
    setSpeedIndex: (i: number) => void;
    reverseTime: () => void;
    jumpToNow: () => void;
    jumpToDate: (jd: number) => void;
    selectBody: (id: string | null) => void;
    focusBody: (id: string | null) => void;
    setCameraTransitioning: (v: boolean) => void;
    toggleOrbits: () => void;
    toggleLabels: () => void;
    toggleMoons: () => void;
    toggleAsteroids: () => void;
    toggleGrid: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
}

export const useSolarSystemStore = create<SolarSystemState>((set, get) => ({
    simulationTime: currentJulianDate(),
    isPlaying: true,
    speedIndex: 1, // 1x by default
    timeDirection: 1,
    selectedBody: null,
    focusTarget: null,
    cameraTransitioning: false,
    showOrbits: true,
    showLabels: true,
    showMoons: true,
    showAsteroids: true,
    showGrid: false,
    zoomLevel: 1,

    tick: (delta) => {
        const s = get();
        if (!s.isPlaying) return;
        const speed = TIME_SPEEDS[s.speedIndex].factor;
        const jdDelta = (delta * speed * s.timeDirection) / 86400;
        set({ simulationTime: s.simulationTime + jdDelta });
    },

    togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
    setSpeedIndex: (i) => set({ speedIndex: Math.max(0, Math.min(i, TIME_SPEEDS.length - 1)) }),
    reverseTime: () => set((s) => ({ timeDirection: s.timeDirection * -1 })),
    jumpToNow: () => set({ simulationTime: currentJulianDate(), isPlaying: true }),
    jumpToDate: (jd) => set({ simulationTime: jd }),

    selectBody: (id) => {
        set({ selectedBody: id });
        if (id) {
            set({ focusTarget: id, cameraTransitioning: true });
        }
    },

    focusBody: (id) => set({ focusTarget: id, cameraTransitioning: true }),
    setCameraTransitioning: (v) => set({ cameraTransitioning: v }),
    toggleOrbits: () => set((s) => ({ showOrbits: !s.showOrbits })),
    toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
    toggleMoons: () => set((s) => ({ showMoons: !s.showMoons })),
    toggleAsteroids: () => set((s) => ({ showAsteroids: !s.showAsteroids })),
    toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    zoomIn: () => set((s) => ({ zoomLevel: Math.min(s.zoomLevel * 1.3, 10) })),
    zoomOut: () => set((s) => ({ zoomLevel: Math.max(s.zoomLevel / 1.3, 0.1) })),
    resetZoom: () => set({ zoomLevel: 1 }),
}));
