/**
 * uiStore.ts — UI state management
 */
import { create } from 'zustand';

interface UIState {
    leftSidebarOpen: boolean;
    rightPanelOpen: boolean;
    isFullscreen: boolean;
    isLoading: boolean;
    loadingMessage: string;
    toggleLeftSidebar: () => void;
    toggleRightPanel: () => void;
    setLeftSidebar: (v: boolean) => void;
    setRightPanel: (v: boolean) => void;
    toggleFullscreen: () => void;
    setLoading: (v: boolean, msg?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
    leftSidebarOpen: false,
    rightPanelOpen: false,
    isFullscreen: false,
    isLoading: false,
    loadingMessage: 'Loading...',

    toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
    toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
    setLeftSidebar: (v) => set({ leftSidebarOpen: v }),
    setRightPanel: (v) => set({ rightPanelOpen: v }),
    toggleFullscreen: () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            set({ isFullscreen: true });
        } else {
            document.exitFullscreen();
            set({ isFullscreen: false });
        }
    },
    setLoading: (v, msg) => set({ isLoading: v, loadingMessage: msg || 'Loading...' }),
}));
