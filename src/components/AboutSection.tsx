const stats = [
  { label: 'Active Students', value: '2,500+', pct: 80, gradient: 'from-purple-500 to-violet-600' },
  { label: 'Lessons Completed', value: '15,000+', pct: 100, gradient: 'from-cyan-500 to-blue-500' },
  { label: 'Expert Instructors', value: '150+', pct: 60, gradient: 'from-emerald-500 to-teal-500' },
  { label: 'Satisfaction Rate', value: '98%', pct: 98, gradient: 'from-yellow-500 to-orange-500' },
];

const pillars = [
  {
    title: 'Expert Instructors',
    desc: 'Learn from professionals with years of real-world teaching experience.',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    title: 'AI-Powered Learning',
    desc: 'Get instant pitch analysis and personalized practice recommendations.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    title: 'Flexible Schedule',
    desc: 'Learn at your own pace on any device — your music, your timeline.',
    gradient: 'from-emerald-500 to-teal-600',
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-24 px-4 bg-[#0a0a1a] relative overflow-hidden">
      <div className="section-divider absolute top-0 left-0 right-0" />
      <div className="absolute top-1/3 left-0 w-72 h-72 bg-purple-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left: content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8">
              Our Story
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              About{' '}
              <span className="gradient-text">HarmonicCampus</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-6">
              HarmonicCampus is a revolutionary music learning platform that combines the expertise of professional instructors with cutting-edge AI technology. Our mission is to make quality music education accessible to everyone, anywhere in the world.
            </p>
            <p className="text-slate-500 leading-relaxed mb-10">
              Whether you're a complete beginner or an advanced musician looking to refine your skills, we provide personalized learning paths, interactive lessons, and real-time feedback to help you achieve your musical goals.
            </p>

            <div className="space-y-5">
              {pillars.map(p => (
                <div key={p.title} className="flex items-start gap-4">
                  <div className={`w-10 h-10 bg-gradient-to-br ${p.gradient} rounded-xl flex items-center justify-center shrink-0`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{p.title}</h4>
                    <p className="text-slate-500 text-sm">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: stats card */}
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-white mb-8">Our Impact</h3>
            <div className="space-y-7">
              {stats.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-slate-400 text-sm">{s.label}</span>
                    <span className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${s.gradient}`}>
                      {s.value}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill bg-gradient-to-r ${s.gradient}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* CTA inside card */}
            <div className="mt-10 p-5 rounded-xl bg-gradient-to-br from-purple-600/15 to-cyan-500/10 border border-purple-500/20">
              <p className="text-white font-semibold mb-1">Ready to start?</p>
              <p className="text-slate-400 text-sm mb-4">Join 2,500+ students already learning on HarmonicCampus.</p>
              <a href="#home" className="btn-primary text-sm !py-2.5 inline-block text-center w-full">
                Get Started Free
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
