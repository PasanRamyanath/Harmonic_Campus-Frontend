const testimonials = [
  {
    name: 'Emma Wilson',
    role: 'Guitar Student',
    initials: 'EW',
    color: 'from-purple-500 to-violet-600',
    text: 'HarmonicCampus transformed my guitar playing in just 3 months. The AI feedback helped me fix my technique instantly, and the instructors are incredibly supportive.',
    rating: 5,
  },
  {
    name: 'James Martinez',
    role: 'Piano Instructor',
    initials: 'JM',
    color: 'from-cyan-500 to-blue-600',
    text: 'As an instructor, this platform gives me all the tools I need to reach students worldwide. The dashboard is intuitive and the student engagement features are excellent.',
    rating: 5,
  },
  {
    name: 'Sophia Lee',
    role: 'Vocal Student',
    initials: 'SL',
    color: 'from-pink-500 to-rose-600',
    text: "I never thought I could learn to sing online, but the interactive lessons and real-time pitch analysis proved me wrong. My range has expanded by nearly an octave!",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-4 bg-[#0a0a1a] relative overflow-hidden">
      <div className="section-divider absolute top-0 left-0 right-0" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-600/15 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-6">
            Student Stories
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-5">
            What our <span className="gradient-text">community says</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Join thousands of musicians who are achieving their goals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="glass-card p-7 flex flex-col">
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-slate-300 leading-relaxed text-sm flex-1 italic">"{t.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/5">
                <div className={`w-10 h-10 bg-gradient-to-br ${t.color} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof row */}
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          {[
            { number: '2,500+', label: 'Active Learners' },
            { number: '15,000+', label: 'Lessons Completed' },
            { number: '150+', label: 'Expert Instructors' },
            { number: '4.9/5', label: 'Average Rating' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold gradient-text">{s.number}</div>
              <div className="text-slate-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
