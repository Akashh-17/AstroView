/**
 * App.tsx — Root with routing
 */
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SolarSystemPage from './pages/SolarSystemPage';
import AsteroidWatchPage from './pages/AsteroidWatchPage';
import EarthSatellitesPage from './pages/EarthSatellitesPage';
import CelestialEventsPage from './pages/CelestialEventsPage';
import LoadingScreen from './components/ui/LoadingScreen';
import { useUIStore } from './store/uiStore';

export default function App() {
  const isLoading = useUIStore((s) => s.isLoading);
  const loadingMessage = useUIStore((s) => s.loadingMessage);

  return (
    <>
      {isLoading && <LoadingScreen message={loadingMessage} />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/solar-system" element={<SolarSystemPage />} />
        <Route path="/asteroids" element={<AsteroidWatchPage />} />
        <Route path="/earth-satellites" element={<EarthSatellitesPage />} />
        <Route path="/celestial-events" element={<CelestialEventsPage />} />
      </Routes>
    </>
  );
}
