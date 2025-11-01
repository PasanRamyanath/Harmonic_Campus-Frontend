export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Emma Wilson',
      role: 'Guitar Student',
      image: '👩',
      text: 'HarmonicCampus transformed my guitar playing! The AI feedback helped me fix my technique, and the teachers are incredibly supportive.',
      rating: 5
    },
    {
      name: 'James Martinez',
      role: 'Piano Teacher',
      image: '👨',
      text: 'As a teacher, this platform gives me all the tools I need to reach students worldwide. The dashboard is intuitive and powerful.',
      rating: 5
    },
    {
      name: 'Sophia Lee',
      role: 'Vocal Student',
      image: '👩',
      text: 'I never thought I could learn to sing online, but the interactive lessons and personalized feedback proved me wrong. Highly recommend!',
      rating: 5
    }
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            What Our <span className="text-purple-600">Community</span> Says
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of happy musicians who are achieving their musical goals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl shadow-lg"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-3xl">
                  {testimonial.image}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 italic leading-relaxed">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
