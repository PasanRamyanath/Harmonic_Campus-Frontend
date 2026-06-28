import { useState } from 'react';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

export default function HeroSection() {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0a1a]">
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.65 }}
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* Dark gradient overlay to keep text readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a]/50 via-[#0a0a1a]/30 to-[#0a0a1a] pointer-events-none" />

      {/* Subtle color tint overlays */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Now with AI-powered pitch analysis
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Master Music
            <span className="block gradient-text">Online, Your Way</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Learn any instrument with expert instructors, real-time AI feedback, and a thriving global community — all in one platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={() => setShowSignup(true)}
              className="btn-primary text-base px-8 py-4"
            >
              Start Learning Free
            </button>
            <a href="#features" className="btn-ghost text-base px-8 py-4 inline-flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Watch Demo
            </a>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {[
              { value: '500+', label: 'Active Students' },
              { value: '50+', label: 'Expert Instructors' },
              { value: '1,000+', label: 'Video Lessons' },
              { value: '98%', label: 'Satisfaction Rate' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Waveform visualizer */}
        <div className="flex items-end justify-center gap-1 h-16 mt-20 opacity-40 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-purple-600 to-cyan-400 rounded-full animate-waveBar origin-bottom"
              style={{
                height: `${24 + Math.sin(i * 0.5) * 20}px`,
                animationDelay: `${i * 0.07}s`,
                animationDuration: `${0.9 + (i % 5) * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a1a] to-transparent pointer-events-none" />
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
    </section>
  );
}
