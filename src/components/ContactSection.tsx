export default function ContactSection() {
  return (
    <section id="contact" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get In <span className="text-purple-600">Touch</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl shadow-lg">
            <form className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Message</label>
                <textarea
                  rows={5}
                  placeholder="Your message..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>
              <button className="w-full py-4 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition font-semibold text-lg shadow-lg">
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                📧
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Email Us</h4>
                <p className="text-gray-600">support@harmoniccampus.com</p>
                <p className="text-gray-600">info@harmoniccampus.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                📞
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Call Us</h4>
                <p className="text-gray-600">+1 (555) 123-4567</p>
                <p className="text-gray-600">Mon-Fri 9am-6pm EST</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                📍
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Visit Us</h4>
                <p className="text-gray-600">123 Music Street</p>
                <p className="text-gray-600">San Francisco, CA 94102</p>
              </div>
            </div>

            <div className="pt-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                  f
                </a>
                <a href="#" className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                  𝕏
                </a>
                <a href="#" className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                  IG
                </a>
                <a href="#" className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                  YT
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
