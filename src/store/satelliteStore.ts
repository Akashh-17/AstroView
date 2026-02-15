/**
 * satelliteStore.ts
 *
 * Zustand store for satellite tracking state.
 */

import { create } from 'zustand';
import type { SatelliteInfo, SatelliteCategoryId } from '../data/satelliteData';

interface SatelliteState {
    /** All loaded satellites */
    satellites: SatelliteInfo[];
    /** Currently selected satellite ID */
    selectedSatelliteId: string | null;
    /** Satellite the camera is flying toward (null = free orbit) */
    focusSatelliteId: string | null;
    /** Whether the camera is mid-transition */
    cameraTransitioning: boolean;
    /** Active category filters (empty = show all) */
    activeCategories: Set<SatelliteCategoryId>;
    /** Search query */
    searchQuery: string;
    /** Loading / error state */
    isLoading: boolean;
    error: string | null;
    /** Simulation time */
    simulationTime: Date;
    /** Time speed multiplier */
    timeSpeed: number;
    /** Whether simulation is paused */
    isPaused: boolean;
    /** Show orbits for all filtered satellites */
    showOrbits: boolean;

    // ── Actions ──
    setSatellites: (sats: SatelliteInfo[]) => void;
    selectSatellite: (id: string | null) => void;
    focusOnSatellite: (id: string | null) => void;
    setCameraTransitioning: (v: boolean) => void;
    toggleCategory: (id: SatelliteCategoryId) => void;
    setSearchQuery: (q: string) => void;
    setLoading: (v: boolean) => void;
    setError: (msg: string | null) => void;
    setSimulationTime: (t: Date) => void;
    setTimeSpeed: (s: number) => void;
    togglePause: () => void;
    toggleShowOrbits: () => void;
    resetToNow: () => void;
}

export const useSatelliteStore = create<SatelliteState>((set) => ({
    satellites: [],
    selectedSatelliteId: null,
    focusSatelliteId: null,
    cameraTransitioning: false,
    activeCategories: new Set<SatelliteCategoryId>(),
    searchQuery: '',
    isLoading: true,
    error: null,
    simulationTime: new Date(),
    timeSpeed: 1,
    isPaused: false,
    showOrbits: false,

    setSatellites: (sats) => set({ satellites: sats }),
    selectSatellite: (id) => set({ selectedSatelliteId: id }),
    focusOnSatellite: (id) => set({ focusSatelliteId: id, cameraTransitioning: !!id, selectedSatelliteId: id }),
    setCameraTransitioning: (v) => set({ cameraTransitioning: v }),
    toggleCategory: (id) =>
        set((s) => {
            const next = new Set(s.activeCategories);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return { activeCategories: next };
        }),
    setSearchQuery: (q) => set({ searchQuery: q }),
    setLoading: (v) => set({ isLoading: v }),
    setError: (msg) => set({ error: msg }),
    setSimulationTime: (t) => set({ simulationTime: t }),
    setTimeSpeed: (s) => set({ timeSpeed: s }),
    togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
    toggleShowOrbits: () => set((s) => ({ showOrbits: !s.showOrbits })),
    resetToNow: () => set({ simulationTime: new Date(), timeSpeed: 1, isPaused: false }),
}));
