import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import LessonsSection from '../components/LessonsSection';
import TestimonialsSection from '../components/TestimonialsSection';
import AboutSection from '../components/AboutSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import { useState } from 'react';
import SignupModal from '../components/SignupModal';
import LoginModal from '../components/LoginModal';

export default function LandingPage() {
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  return (
    <div className="min-h-screen">
  <Navbar onOpenSignup={() => setShowSignup(true)} onOpenLogin={() => setShowLogin(true)} />
  {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
  {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <HeroSection />
      <FeaturesSection />
      <LessonsSection />
      <TestimonialsSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
