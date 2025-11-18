import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as enrollmentApi from '../api/enrollmentApi';
import * as courseApi from '../api/courseApi';
import { useAuth } from '../contexts/AuthContext';

type CourseSummary = {
  _id: string;
  title?: string;
  description?: string;
  modules?: any[];
};

export default function MyCourses() {
  const { appUser } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!appUser) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const en = await enrollmentApi.listEnrollments({ mine: true });
        if (!mounted) return;
        setEnrollments(en || []);

        // fetch courses in parallel
  const ids = (en || []).map((e: any) => e.courseId).filter(Boolean) as string[];
  const unique = Array.from(new Set(ids)) as string[];
  const fetched = await Promise.all(unique.map((id: string) => courseApi.getCourse(id).catch(() => null)));
        if (!mounted) return;
        setCourses(fetched.filter(Boolean));
      } catch (err: any) {
        console.error('Failed to load my courses', err);
        if (!mounted) return;
        setError(err?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [appUser]);

  // notification helper (left for future use)

  const computeNextLessonId = (course: CourseSummary, enrollment: any) => {
    const completed = (enrollment && enrollment.progress && Array.isArray(enrollment.progress.completedLessons))
      ? enrollment.progress.completedLessons.map((id: any) => id.toString())
      : [];
    for (const mod of (course.modules || [])) {
      for (const lesson of (mod.lessons || [])) {
  if (!lesson || !(lesson.contents || []).length) continue;
  const lid = (lesson as any).lessonId;
  if (!lid) continue;
  if (!completed.includes(lid.toString())) return lid.toString();
      }
    }
    // if all completed, return first lesson
    for (const mod of (course.modules || [])) {
      for (const lesson of (mod.lessons || [])) {
  if (lesson && (lesson.contents || []).length && (lesson as any).lessonId) return (lesson as any).lessonId.toString();
      }
    }
    return null;
  };

  if (loading) return (
    <main className="pt-6 p-6 max-w-4xl mx-auto">Loading your courses...</main>
  );

  if (!appUser) return (
    <main className="pt-6 p-6 max-w-4xl mx-auto">Please sign in to see your courses.</main>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-6 p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">My Courses</h1>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        {courses.length === 0 && (
          <div className="bg-white p-6 rounded shadow">You have no enrolled courses yet.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c: any) => {
            const enrollment = enrollments.find(e => e.courseId === c._id || (e.courseId && e.courseId._id === c._id));
            const nextLessonId = computeNextLessonId(c, enrollment);
            return (
              <div key={c._id} className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold text-lg">{c.title}</h2>
                <div className="text-sm text-gray-600 mt-2">{c.description}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">Progress: {(enrollment && enrollment.progress && enrollment.progress.completedLessons) ? `${enrollment.progress.completedLessons.length} lessons completed` : '0 completed'}</div>
                  {nextLessonId ? (
                    <button onClick={() => navigate(`/student/courses/${c._id}`)} className="px-3 py-1 bg-green-600 text-white rounded">Continue</button>
                  ) : (
                    <Link to={`/student/courses/${c._id}`} className="px-3 py-1 bg-blue-600 text-white rounded">View Course</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
