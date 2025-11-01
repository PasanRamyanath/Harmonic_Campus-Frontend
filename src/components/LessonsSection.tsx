export default function LessonsSection() {
  const lessons = [
    {
      instrument: 'Guitar',
      icon: '🎸',
      instructor: 'John Smith',
      students: 245,
      rating: 4.9,
      color: 'from-amber-400 to-orange-500'
    },
    {
      instrument: 'Piano',
      icon: '🎹',
      instructor: 'Sarah Johnson',
      students: 312,
      rating: 4.8,
      color: 'from-blue-400 to-indigo-500'
    },
    {
      instrument: 'Vocals',
      icon: '🎤',
      instructor: 'Michael Brown',
      students: 189,
      rating: 4.9,
      color: 'from-pink-400 to-rose-500'
    },
    {
      instrument: 'Drums',
      icon: '🥁',
      instructor: 'David Lee',
      students: 156,
      rating: 4.7,
      color: 'from-red-400 to-red-600'
    },
    {
      instrument: 'Violin',
      icon: '🎻',
      instructor: 'Emily Chen',
      students: 198,
      rating: 4.8,
      color: 'from-purple-400 to-purple-600'
    },
    {
      instrument: 'Bass',
      icon: '🎸',
      instructor: 'Alex Turner',
      students: 134,
      rating: 4.6,
      color: 'from-green-400 to-emerald-600'
    }
  ];

  return (
    <section id="lessons" className="py-20 px-4 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Explore Our <span className="text-purple-600">Lessons</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from a wide variety of instruments and learn from the best instructors
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lessons.map((lesson, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-2"
            >
              <div className={`h-32 bg-gradient-to-br ${lesson.color} flex items-center justify-center text-6xl`}>
                {lesson.icon}
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{lesson.instrument}</h3>
                <p className="text-gray-600 mb-4">with {lesson.instructor}</p>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">⭐</span>
                    <span className="font-semibold">{lesson.rating}</span>
                  </div>
                  <div className="text-gray-600">
                    👥 {lesson.students} students
                  </div>
                </div>
                <button className="w-full py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition font-semibold">
                  View Lessons
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-4 border-2 border-purple-600 text-purple-600 rounded-full hover:bg-purple-50 transition text-lg font-semibold">
            Browse All Lessons →
          </button>
        </div>
      </div>
    </section>
  );
}
