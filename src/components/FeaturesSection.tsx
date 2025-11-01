export default function FeaturesSection() {
  const features = [
    {
      icon: '🎵',
      title: 'Interactive Lessons',
      description: 'High-quality audio and video lessons from expert musicians, available anytime, anywhere.',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: '🤖',
      title: 'AI-Powered Feedback',
      description: 'Get instant feedback on your practice sessions with our advanced AI analysis technology.',
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: '📊',
      title: 'Personalized Dashboard',
      description: 'Track your progress, manage lessons, and view personalized recommendations in one place.',
      color: 'from-green-400 to-green-600'
    },
    {
      icon: '👥',
      title: 'Community Learning',
      description: 'Connect with fellow musicians, share your progress, and learn together in a supportive community.',
      color: 'from-pink-400 to-pink-600'
    },
    {
      icon: '🎯',
      title: 'Goal-Based Learning',
      description: 'Set your musical goals and follow curated learning paths designed by professional educators.',
      color: 'from-yellow-400 to-yellow-600'
    },
    {
      icon: '🏆',
      title: 'Achievements & Badges',
      description: 'Stay motivated with achievements, badges, and certificates as you master new skills.',
      color: 'from-red-400 to-red-600'
    }
  ];

  return (
    <section id="features" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose <span className="text-purple-600">HarmonicCampus?</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to become a better musician, all in one platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-md`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
