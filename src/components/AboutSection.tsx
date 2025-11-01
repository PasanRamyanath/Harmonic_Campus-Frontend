export default function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              About <span className="text-purple-600">HarmonicCampus</span>
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              HarmonicCampus is a revolutionary music learning platform that combines the expertise of professional instructors with cutting-edge AI technology. Our mission is to make quality music education accessible to everyone, anywhere in the world.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Whether you're a complete beginner or an advanced musician looking to refine your skills, we provide personalized learning paths, interactive lessons, and real-time feedback to help you achieve your musical goals.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                  ✅
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Expert Instructors</h4>
                  <p className="text-gray-600">Learn from professionals with years of teaching experience</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                  ✅
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">AI-Powered Learning</h4>
                  <p className="text-gray-600">Get instant feedback and personalized recommendations</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                  ✅
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Flexible Schedule</h4>
                  <p className="text-gray-600">Learn at your own pace, on your own time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Stats Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Impact</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Active Students</span>
                <span className="text-2xl font-bold text-purple-600">2,500+</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 w-4/5"></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700">Lessons Completed</span>
                <span className="text-2xl font-bold text-blue-600">15,000+</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 w-full"></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700">Expert Instructors</span>
                <span className="text-2xl font-bold text-green-600">150+</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500 w-3/5"></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700">Satisfaction Rate</span>
                <span className="text-2xl font-bold text-yellow-600">98%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-red-500 w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
