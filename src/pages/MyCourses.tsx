import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as enrollmentApi from '../api/enrollmentApi';
import * as courseApi from '../api/courseApi';
import { useAuth } from '../contexts/AuthContext';
import Breadcrumbs from '../components/Breadcrumbs';

type CourseSummary = { _id: string; title?: string; description?: string; accessTier?: string; modules?: any[] };

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
      if (!appUser) { setLoading(false); return; }
      setLoading(true);
      try {
        const en = await enrollmentApi.listEnrollments({ mine: true });
        if (!mounted) return;
        setEnrollments(en || []);
        const ids = Array.from(new Set((en || []).map((e: any) => e.courseId).filter(Boolean))) as string[];
        const fetched = await Promise.all(ids.map((id: string) => courseApi.getCourse(id).catch(() => null)));
        if (mounted) setCourses(fetched.filter(Boolean));
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [appUser]);

  const computeNextLessonId = (course: CourseSummary, enrollment: any) => {
    const completed = (enrollment?.progress?.completedLessons || []).map((id: any) => id.toString());
    for (const mod of (course.modules || [])) {
      for (const lesson of (mod.lessons || [])) {
        if (!lesson || !(lesson.contents || []).length) continue;
        const lid = (lesson as any).lessonId;
        if (lid && !completed.includes(lid.toString())) return lid.toString();
      }
    }
    for (const mod of (course.modules || [])) {
      for (const lesson of (mod.lessons || [])) {
        if (lesson && (lesson.contents || []).length && (lesson as any).lessonId) return (lesson as any).lessonId.toString();
      }
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My Courses' }]} />
        <h1 className="text-3xl font-bold text-white mb-2">My Courses</h1>
        <p className="text-slate-400 mb-8">Continue learning where you left off</p>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-36 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : !appUser ? (
          <div className="glass-card p-8 text-center">
            <p className="text-slate-400 mb-4">Please sign in to see your courses.</p>
            <Link to="/" className="btn-primary text-sm inline-block">Go Home</Link>
          </div>
        ) : courses.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-2">No enrolled courses yet</p>
            <p className="text-slate-500 text-sm mb-5">Browse the catalog and enroll in a course to get started.</p>
            <Link to="/courses" className="btn-primary text-sm inline-block">Browse Courses</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {courses.map((c: any) => {
              const enrollment = enrollments.find(e => e.courseId === c._id || e.courseId?._id === c._id);
              const completedCount = enrollment?.progress?.completedLessons?.length || 0;
              const totalLessons = (c.modules || []).reduce((n: number, m: any) => n + (m.lessons || []).length, 0);
              const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
              const nextLessonId = computeNextLessonId(c, enrollment);

              return (
                <div key={c._id} className="glass-card-hover p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600/30 to-cyan-500/20 rounded-xl flex items-center justify-center shrink-0 border border-purple-500/20">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold leading-snug">{c.title}</h3>
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">{c.description}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">{completedCount} of {totalLessons} lessons</span>
                      <span className="text-purple-400 font-semibold">{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {nextLessonId ? (
                      <button
                        onClick={() => navigate(`/student/courses/${c._id}`)}
                        className="btn-primary text-sm flex-1 text-center !py-2"
                      >
                        Continue Learning
                      </button>
                    ) : (
                      <Link to={`/student/courses/${c._id}`} className="btn-primary text-sm flex-1 text-center !py-2">
                        View Course
                      </Link>
                    )}
                    <Link to={`/courses/${c._id}`} className="btn-ghost text-sm !py-2 !px-4">
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
