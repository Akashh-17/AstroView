/**
 * SolarSystemPage.tsx — Full solar system visualization page
 * Astrolens "Eyes on the Solar System" style layout
 */
import SolarSystem from '../components/scene/SolarSystem';
import TopNav from '../components/ui/TopNav';
import LeftSidebar from '../components/ui/LeftSidebar';
import RightPanel from '../components/ui/RightPanel';
import TimelineControl from '../components/ui/TimelineControl';
import Toolbar from '../components/ui/Toolbar';

export default function SolarSystemPage() {
    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* 3D Scene fills entire viewport */}
            <div className="absolute inset-0 z-0">
                <SolarSystem />
            </div>

            {/* UI Overlay — pointer-events:none on container, auto on children */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
                <TopNav variant="solar-system" />
                <LeftSidebar variant="solar-system" />
                <RightPanel />
                <Toolbar variant="solar-system" />
                <TimelineControl />
            </div>
        </div>
    );
}
