import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#080812] border-t border-white/5">
      <div className="section-divider" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/favicon-logo.png" alt="HarmonicCampus" className="h-8 w-8 object-contain" />
              <span className="text-lg font-bold gradient-text">Harmonic Campus</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Empowering musicians worldwide with quality education and cutting-edge AI technology.
            </p>
            <div className="flex gap-3 mt-5">
              {[
                { label: 'f', bg: 'from-blue-600 to-blue-700' },
                { label: '𝕏', bg: 'from-slate-700 to-slate-800' },
                { label: 'IG', bg: 'from-pink-600 to-red-500' },
                { label: 'YT', bg: 'from-red-600 to-red-700' },
              ].map(s => (
                <a
                  key={s.label}
                  href="#"
                  className={`w-9 h-9 bg-gradient-to-br ${s.bg} rounded-lg flex items-center justify-center text-white text-xs font-bold hover:scale-110 transition-transform duration-200`}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/#home', label: 'Home' },
                { to: '/#features', label: 'Features' },
                { to: '/courses', label: 'Courses' },
                { to: '/#about', label: 'About Us' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-slate-500 hover:text-purple-400 text-sm transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2.5">
              {['Help Center', 'FAQs', 'Contact Us', 'Privacy Policy'].map(label => (
                <li key={label}>
                  <a href="#contact" className="text-slate-500 hover:text-purple-400 text-sm transition-colors duration-200">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Stay Updated</h4>
            <p className="text-slate-500 text-sm mb-4">Get tips, updates, and new course alerts.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 input-dark text-sm !py-2.5"
              />
              <button className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity shrink-0">
                →
              </button>
            </div>
          </div>
        </div>

        {/* Waveform decoration */}
        <div className="flex items-end justify-center gap-0.5 h-8 mb-10 opacity-20">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-purple-600 to-cyan-400 rounded-full animate-waveBar origin-bottom"
              style={{
                height: `${20 + Math.sin(i * 0.4) * 16}px`,
                animationDelay: `${i * 0.06}s`,
                animationDuration: `${1.2 + (i % 4) * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-sm">© 2025 HarmonicCampus. All rights reserved.</p>
          <div className="flex gap-6">
            {['Terms of Service', 'Privacy Policy', 'Cookie Policy'].map(label => (
              <a key={label} href="#" className="text-slate-600 hover:text-slate-400 text-sm transition-colors duration-200">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
