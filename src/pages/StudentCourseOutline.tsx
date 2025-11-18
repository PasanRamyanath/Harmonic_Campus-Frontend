import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as courseApi from '../api/courseApi';
import * as enrollmentApi from '../api/enrollmentApi';

type ContentItem = { type: string };
type Lesson = { _id?: any; title?: string; description?: string; contents?: ContentItem[] };
type Module = { title?: string; description?: string; lessons?: Lesson[] };

export default function StudentCourseOutline() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any | null>(null);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const c = await courseApi.getCourse(courseId);
        if (!mounted) return;
        setCourse(c);
        // fetch enrollment for this course
        const en = await enrollmentApi.listEnrollments({ mine: true, courseId });
        if (!mounted) return;
        setEnrollment((en && en[0]) || null);
      } catch (err: any) {
        console.error('Failed to load course outline', err);
        if (!mounted) return;
        setError(err?.message || 'Failed to load course');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId]);

  if (loading) return (
    <main className="pt-6 p-6 max-w-4xl mx-auto">Loading course...</main>
  );

  if (!course) return (
    <main className="pt-6 p-6 max-w-4xl mx-auto">{error ?? 'Course not found'}</main>
  );

  const visibleModules: Module[] = (course.modules || []).map((m: Module) => ({
    ...m,
    lessons: (m.lessons || []).filter((l: Lesson) => (l.contents || []).length > 0)
  })).filter((m: Module) => (m.lessons || []).length > 0);

  // Find next incomplete lesson for this enrollment
  const completed = (enrollment && enrollment.progress && Array.isArray(enrollment.progress.completedLessons))
    ? enrollment.progress.completedLessons.map((id: any) => id.toString())
    : [];
  let nextLessonId: string | null = null;
  outer: for (const mod of (course?.modules || [])) {
    for (const lesson of (mod.lessons || [])) {
      if (!lesson || !(lesson.contents || []).length) continue;
      const lid = (lesson as any).lessonId;
      if (!lid) continue;
      if (!completed.includes(lid.toString())) {
        nextLessonId = lid.toString();
        break outer;
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-6 p-6 max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="inline-flex items-center px-3 py-2 mb-4 rounded bg-gray-100 hover:bg-gray-200 text-sm"
        >
          <span className="mr-2">←</span> Back
        </button>
        <div className="bg-white p-6 rounded shadow mb-6">
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          <div className="text-sm text-gray-600 mt-2">{course.description}</div>
        </div>

        {visibleModules.length === 0 && (
          <div className="bg-white p-6 rounded shadow">No modules available for this course yet.</div>
        )}

        <div className="space-y-4">
          {visibleModules.map((m, mi) => (
            <div key={mi} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{m.title}</h2>
                  <div className="text-sm text-gray-600">{m.description}</div>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {(m.lessons || []).map((l: Lesson, li: number) => {
                  const lid = (l as any).lessonId;
                  const isNext = nextLessonId && lid && nextLessonId === lid.toString();
                  const isCompleted = completed.includes(lid?.toString());
                  // If completed: show View and Completed
                  // If next: show only Continue
                  // If future: show only View
                  return (
                    <div key={li} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50">
                      <div>
                        <div className="font-medium">{l.title}</div>
                        <div className="text-sm text-gray-600">{l.description}</div>
                        <div className="text-xs text-gray-500 mt-2">{(l.contents || []).length} content item{(l.contents || []).length === 1 ? '' : 's'}</div>
                      </div>
                      <div className="mt-2 md:mt-0 flex gap-2 items-center">
                        {isCompleted && (
                          <>
                            <button onClick={() => navigate(`/student/courses/${courseId}/lesson/${lid}`)} className="px-3 py-1 bg-blue-600 text-white rounded">View</button>
                            <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded">Completed</span>
                          </>
                        )}
                        {isNext && !isCompleted && (
                          <button onClick={() => navigate(`/student/courses/${courseId}/lesson/${lid}`)} className="px-3 py-1 bg-green-600 text-white rounded">Continue</button>
                        )}
                        {!isCompleted && !isNext && (
                          <button onClick={() => navigate(`/student/courses/${courseId}/lesson/${lid}`)} className="px-3 py-1 bg-blue-600 text-white rounded">View</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
