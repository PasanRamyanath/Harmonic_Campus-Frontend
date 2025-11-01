import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar({ onOpenSignup, onOpenLogin }: { onOpenSignup?: () => void; onOpenLogin?: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { firebaseUser, signOut, appUser } = useAuth();

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img src="/favicon-logo.png" alt="HarmonicCampus logo" className="h-10 w-10 md:h-12 md:w-12 mr-3 object-contain" />
            <h1 className="text-2xl font-bold text-purple-700">Harmonic Campus</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <a href="/#home" className="text-gray-700 hover:text-purple-700 transition">Home</a>
            <a href="/#features" className="text-gray-700 hover:text-purple-700 transition">Features</a>
            <Link to="/courses" className="text-gray-700 hover:text-purple-700 transition">Courses</Link>
            <a href="/#lessons" className="text-gray-700 hover:text-purple-700 transition">Lessons</a>
            <a href="/#about" className="text-gray-700 hover:text-purple-700 transition">About</a>
            <a href="/#contact" className="text-gray-700 hover:text-purple-700 transition">Contact</a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex space-x-4 items-center">
            {firebaseUser ? (
              <>
                {appUser?.role === 'instructor' && (
                  <Link to="/instructor" className="px-4 py-2 text-gray-700 hover:text-purple-700 transition">Instructor</Link>
                )}
                <Link to="/profile" className="px-4 py-2 text-gray-700 hover:text-purple-700 transition">Profile</Link>
                <button onClick={() => signOut()} className="px-4 py-2 text-purple-700 hover:text-purple-900 transition">
                  Log out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onOpenLogin?.()} className="px-4 py-2 text-purple-700 hover:text-purple-900 transition">
                  Login
                </button>
                <button onClick={() => onOpenSignup?.()} className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition shadow-md">
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-purple-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a href="/#home" className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded">Home</a>
            <a href="/#features" className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded">Features</a>
            <Link to="/courses" className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded">Courses</Link>
            <a href="/#lessons" className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded">Lessons</a>
            <a href="/#about" className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded">About</a>
            <a href="/#contact" className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded">Contact</a>
            <div className="pt-4 space-y-2">
              {firebaseUser ? (
                <>
                  <Link to="/profile" className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 rounded">Profile</Link>
                  <button onClick={() => signOut()} className="w-full px-4 py-2 text-purple-700 border border-purple-700 rounded-full hover:bg-purple-50 transition">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => onOpenLogin?.()} className="w-full px-4 py-2 text-purple-700 border border-purple-700 rounded-full hover:bg-purple-50 transition">
                    Login
                  </button>
                  <button onClick={() => onOpenSignup?.()} className="w-full px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition">
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
