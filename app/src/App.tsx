import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/sections/HeroSection';
import { TrustedBySection } from '@/sections/TrustedBySection';
import { FeaturesSection } from '@/sections/FeaturesSection';
import { SpecialtiesSection } from '@/sections/SpecialtiesSection';
import { HowItWorksSection } from '@/sections/HowItWorksSection';
import { CTASection } from '@/sections/CTASection';
import { Footer } from '@/sections/Footer';
import MapPage from '@/pages/MapPage';
import ComplaintPortal from '@/pages/ComplaintPortal';
import CommunityFeed from '@/pages/CommunityFeed';
import DepartmentDirectory from '@/pages/DepartmentDirectory';
import AIHelpDesk from '@/pages/AIHelpDesk';
import CitizenDashboard from '@/pages/CitizenDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import { AppProvider } from '@/context/AppContext';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const mandyaBounds = L.latLngBounds([12.20, 76.32], [13.06, 77.33]);

function LandingPage() {
  return (
    <div className="relative">
      {/* === FIXED MANDYA MAP BACKGROUND — scrolls with page content on top === */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      >
        <MapContainer
          center={[12.5218, 76.8951]}
          zoom={11}
          minZoom={10}
          maxZoom={12}
          maxBounds={mandyaBounds}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </MapContainer>
      </div>

      {/* Light mode: cream wash over the map so content is always readable */}
      <div
        className="dark:hidden"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          background: 'rgba(253,251,246,0.45)',
          pointerEvents: 'none',
        }}
      />

      {/* Dark mode: left-side gradient overlay for text legibility only */}
      <div
        className="hidden dark:block"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Actual page content sits above the map */}
      <main className="relative" style={{ zIndex: 2 }}>
        <HeroSection />
        <TrustedBySection />
        <FeaturesSection />
        <SpecialtiesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-cream dark:bg-gray-950 transition-colors duration-300">
          <Navbar />
          <Routes>
            <Route path="/"             element={<LandingPage />} />
            <Route path="/map"          element={<MapPage />} />
            <Route path="/raise"        element={<ComplaintPortal />} />
            <Route path="/feed"         element={<CommunityFeed />} />
            <Route path="/departments"  element={<DepartmentDirectory />} />
            <Route path="/ai"           element={<AIHelpDesk />} />
            <Route path="/profile"      element={<CitizenDashboard />} />
            <Route path="/admin"        element={<AdminDashboard />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
