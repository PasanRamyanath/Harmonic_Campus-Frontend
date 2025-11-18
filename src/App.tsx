import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ProfileSettings from './pages/ProfileSettings';
import InstructorDashboard from './pages/InstructorDashboard';
import CoursesCatalog from './pages/CoursesCatalog';
import CourseDetails from './pages/CourseDetails';
import StudentDashboard from './pages/StudentDashboard';
import MyCourses from './pages/MyCourses';
import StudentCoursePlayer from './pages/StudentCoursePlayer';
import StudentCourseOutline from './pages/StudentCourseOutline';
import Community from './pages/Community';
import CommunityThread from './pages/CommunityThread';
import ScrollToTop from './components/ScrollToTop';
import AppLayout from './components/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/courses" element={<MyCourses />} />
          <Route path="/student/courses/:courseId" element={<StudentCourseOutline />} />
          <Route path="/student/courses/:courseId/lesson/:lessonId" element={<StudentCoursePlayer />} />
          <Route path="/courses" element={<CoursesCatalog />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:id" element={<CommunityThread />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
