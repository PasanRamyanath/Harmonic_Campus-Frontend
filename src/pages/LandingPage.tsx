import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import LessonsSection from '../components/LessonsSection';
import TestimonialsSection from '../components/TestimonialsSection';
import AboutSection from '../components/AboutSection';
import ContactSection from '../components/ContactSection';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function LandingPage() {
  const location = useLocation();

  // When a hash is present (e.g. /#about) ensure we scroll to the target after mount
  useEffect(() => {
    if (!location.hash) return;
    // Only attempt when on root path
    if (location.pathname !== '/') return;
    const id = location.hash.replace('#', '');
    // small timeout to allow sections to render/layout (helps when navigating from other routes)
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => clearTimeout(t);
  }, [location]);
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <LessonsSection />
      <TestimonialsSection />
      <AboutSection />
      <ContactSection />
    </div>
  );
}
