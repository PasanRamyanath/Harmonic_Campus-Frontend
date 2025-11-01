import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ProfileSettings from './pages/ProfileSettings';
import InstructorDashboard from './pages/InstructorDashboard';
import CoursesCatalog from './pages/CoursesCatalog';
import CourseDetails from './pages/CourseDetails';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/profile" element={<ProfileSettings />} />
  <Route path="/instructor" element={<InstructorDashboard />} />
  <Route path="/courses" element={<CoursesCatalog />} />
  <Route path="/courses/:id" element={<CourseDetails />} />
  
      </Routes>
    </BrowserRouter>
  );
}

export default App;
