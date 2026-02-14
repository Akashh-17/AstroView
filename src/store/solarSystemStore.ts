/**
 * solarSystemStore.ts — Solar system simulation state
 */
import { create } from 'zustand';
import { currentJulianDate } from '../engine/timeEngine';

export const TIME_SPEEDS = [
    { label: '1s', factor: 1 },
    { label: '1m', factor: 60 },
    { label: '1h', factor: 3600 },
    { label: '1d', factor: 86400 },
    { label: '10d', factor: 864000 },
    { label: '30d', factor: 2592000 },
    { label: '1y', factor: 31536000 },
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
}

export const useSolarSystemStore = create<SolarSystemState>((set, get) => ({
    simulationTime: currentJulianDate(),
    isPlaying: true,
    speedIndex: 3,
    timeDirection: 1,
    selectedBody: null,
    focusTarget: null,
    cameraTransitioning: false,
    showOrbits: true,
    showLabels: true,
    showMoons: true,
    showAsteroids: true,
    showGrid: false,

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
}));
