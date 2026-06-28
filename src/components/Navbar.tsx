import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SignupModal from './SignupModal';
import LoginModal from './LoginModal';

export default function Navbar({ onOpenSignup, onOpenLogin }: { onOpenSignup?: () => void; onOpenLogin?: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { firebaseUser, signOut, appUser } = useAuth();
  const location = useLocation();

  const profileLink = appUser?.role === 'instructor' ? '/instructor' : '/student';
  const showStudentCourses = firebaseUser && appUser?.role === 'student';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navLinks = [
    { to: '/#home', label: 'Home' },
    { to: '/#features', label: 'Features' },
    { to: '/courses', label: 'Courses' },
    { to: '/community', label: 'Community' },
    { to: '/audio-tools', label: 'Audio Tools' },
    { to: '/#about', label: 'About' },
    { to: '/#contact', label: 'Contact' },
    ...(showStudentCourses ? [{ to: '/student/courses', label: 'My Courses' }] : []),
  ];

  return (
    <>
      <nav
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0a1a]/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/30'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <img
                  src="/favicon-logo.png"
                  alt="HarmonicCampus"
                  className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-xl font-bold gradient-text">Harmonic Campus</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} className="nav-link">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-3">
              {firebaseUser ? (
                <>
                  {appUser?.role === 'instructor' && (
                    <Link to="/instructor" className="nav-link">Instructor</Link>
                  )}
                  {appUser?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-600/30 transition-all duration-200"
                    >
                      Admin
                    </Link>
                  )}
                  <Link to="/practice" className="nav-link">Practice</Link>
                  <Link to={profileLink} className="nav-link">Profile</Link>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white border border-white/10 rounded-lg hover:border-white/20 hover:bg-white/5 transition-all duration-200"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => (onOpenLogin ? onOpenLogin() : setShowLogin(true))}
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => (onOpenSignup ? onOpenSignup() : setShowSignup(true))}
                    className="btn-primary text-sm !py-2 !px-5"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            mobileOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-[#0a0a1a]/95 backdrop-blur-xl border-t border-white/10 px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-4 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10 space-y-2">
              {firebaseUser ? (
                <>
                  {appUser?.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2.5 rounded-lg text-purple-300 text-sm font-medium hover:bg-purple-600/20 transition-all">
                      Admin Panel
                    </Link>
                  )}
                  <Link to="/practice" className="block px-4 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm">Practice</Link>
                  <Link to={profileLink} className="block px-4 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm">Profile</Link>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => (onOpenLogin ? onOpenLogin() : setShowLogin(true))}
                    className="w-full px-4 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm text-left"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => (onOpenSignup ? onOpenSignup() : setShowSignup(true))}
                    className="w-full btn-primary text-sm text-center"
                  >
                    Sign Up Free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
