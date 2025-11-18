export default function HeroSection() {
  return (
  <section id="home" className="relative w-full md:aspect-[16/9] overflow-hidden">
      {/* Background video covering full width */}
      <video
        className="absolute left-0 top-0 w-full h-full object-cover md:object-contain" 
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

  {/* Dark overlay for readability */}
  <div className="absolute left-0 top-0 w-full h-full bg-black/40" />

  <div className="relative pt-24 pb-16 px-4 h-full flex items-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="text-center text-white max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight drop-shadow-lg">
              Learn Music <span className="text-purple-300">Online</span> with Expert Instructors
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-purple-100">
              Master any instrument with personalized lessons, AI-powered feedback, and a thriving community of musicians.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button className="px-8 py-4 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition shadow-lg text-lg font-semibold">
                Join Now – It's Free
              </button>
              <button className="px-8 py-4 border-2 border-purple-300 text-purple-200 rounded-full hover:bg-white/10 transition text-lg font-semibold">
                Browse Lessons
              </button>
            </div>

            <div className="mt-8 flex items-center gap-8 justify-center text-purple-200">
              <div>
                <p className="text-2xl font-bold">500+</p>
                <p className="text-sm">Active Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold">50+</p>
                <p className="text-sm">Expert Instructors</p>
              </div>
              <div>
                <p className="text-2xl font-bold">1000+</p>
                <p className="text-sm">Lessons</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
