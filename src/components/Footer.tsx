export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-purple-400 mb-4">🎵 HarmonicCampus</h3>
            <p className="text-gray-400 leading-relaxed">
              Empowering musicians worldwide with quality education and cutting-edge technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="text-gray-400 hover:text-purple-400 transition">Home</a></li>
              <li><a href="#features" className="text-gray-400 hover:text-purple-400 transition">Features</a></li>
              <li><a href="#lessons" className="text-gray-400 hover:text-purple-400 transition">Lessons</a></li>
              <li><a href="#about" className="text-gray-400 hover:text-purple-400 transition">About</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition">FAQs</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-purple-400 transition">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-bold mb-4">Stay Updated</h4>
            <p className="text-gray-400 mb-4">Subscribe to our newsletter for tips and updates</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              />
              <button className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition">
                →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400">© 2025 HarmonicCampus. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-purple-400 transition">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-purple-400 transition">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-purple-400 transition">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
