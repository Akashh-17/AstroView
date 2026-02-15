/**
 * AsteroidWatchPage.tsx — Full 3D "Eyes on Asteroids" visualization page.
 * Shows inner solar system with 10 named asteroids, asteroid watch sidebar,
 * Astrolens header, timeline controls, and toolbar.
 */
import { useEffect } from 'react';
import AsteroidScene from '../components/scene/AsteroidScene';
import TopNav from '../components/ui/TopNav';
import LeftSidebar from '../components/ui/LeftSidebar';
import RightPanel from '../components/ui/RightPanel';
import TimelineControl from '../components/ui/TimelineControl';
import Toolbar from '../components/ui/Toolbar';
import AsteroidWatchWidget from '../components/ui/AsteroidWatchWidget';
import { useUIStore } from '../store/uiStore';

export default function AsteroidWatchPage() {
    const setLeftSidebar = useUIStore((s) => s.setLeftSidebar);

    // Auto-open sidebar on asteroid page
    useEffect(() => {
        setLeftSidebar(true);
        return () => setLeftSidebar(false);
    }, [setLeftSidebar]);

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* 3D Scene fills entire viewport */}
            <div className="absolute inset-0 z-0">
                <AsteroidScene />
            </div>

            {/* UI Overlay — pointer-events:none on container, auto on children */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
                <TopNav variant="asteroids" />
                <LeftSidebar variant="asteroids" />
                <RightPanel />
                <Toolbar variant="asteroids" />
                <AsteroidWatchWidget />
                <TimelineControl />
            </div>
        </div>
    );
}

