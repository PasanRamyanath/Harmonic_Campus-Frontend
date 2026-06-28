const contactItems = [
  {
    label: 'Email Us',
    lines: ['support@harmoniccampus.com', 'info@harmoniccampus.com'],
    gradient: 'from-purple-500 to-violet-600',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Call Us',
    lines: ['+1 (555) 123-4567', 'Mon–Fri 9am–6pm EST'],
    gradient: 'from-cyan-500 to-blue-600',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    label: 'Visit Us',
    lines: ['123 Music Street', 'San Francisco, CA 94102'],
    gradient: 'from-emerald-500 to-teal-600',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function ContactSection() {
  return (
    <section id="contact" className="py-24 px-4 bg-[#0a0a1a] relative overflow-hidden">
      <div className="section-divider absolute top-0 left-0 right-0" />
      <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
            Get In Touch
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-5">
            We'd love to <span className="gradient-text">hear from you</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Have questions? Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact form */}
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-white mb-6">Send a Message</h3>
            <form className="space-y-5">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">Your Name</label>
                <input type="text" placeholder="John Doe" className="input-dark" />
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">Email Address</label>
                <input type="email" placeholder="john@example.com" className="input-dark" />
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">Message</label>
                <textarea
                  rows={5}
                  placeholder="Tell us how we can help..."
                  className="input-dark resize-none"
                />
              </div>
              <button type="submit" className="btn-primary w-full text-center">
                Send Message
              </button>
            </form>
          </div>

          {/* Contact info */}
          <div className="space-y-6">
            {contactItems.map(item => (
              <div key={item.label} className="glass-card-hover p-6 flex items-start gap-4">
                <div className={`w-11 h-11 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">{item.label}</h4>
                  {item.lines.map(line => (
                    <p key={line} className="text-slate-400 text-sm">{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {/* Social links */}
            <div className="glass-card p-6">
              <h4 className="text-white font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-3">
                {[
                  { label: 'Facebook', abbr: 'f', color: 'from-blue-600 to-blue-700' },
                  { label: 'Twitter', abbr: '𝕏', color: 'from-slate-600 to-slate-700' },
                  { label: 'Instagram', abbr: 'IG', color: 'from-pink-500 to-rose-600' },
                  { label: 'YouTube', abbr: 'YT', color: 'from-red-600 to-red-700' },
                ].map(s => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className={`w-11 h-11 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-white text-xs font-bold hover:scale-110 transition-transform duration-200`}
                  >
                    {s.abbr}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
