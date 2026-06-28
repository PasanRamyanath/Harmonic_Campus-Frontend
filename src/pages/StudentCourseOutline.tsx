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
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const c = await courseApi.getCourse(courseId);
        if (!mounted) return;
        setCourse(c);
        setExpandedModules({ 0: true });
        const en = await enrollmentApi.listEnrollments({ mine: true, courseId });
        if (!mounted) return;
        setEnrollment((en && en[0]) || null);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load course');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId]);

  if (loading) return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />
        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
      </div>
    </main>
  );

  if (!course) return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4 flex items-center justify-center">
      <div className="glass-card p-8 text-center">
        <p className="text-red-400">{error ?? 'Course not found'}</p>
        <button onClick={() => navigate(-1)} className="btn-primary text-sm mt-4">Go Back</button>
      </div>
    </main>
  );

  const visibleModules: Module[] = (course.modules || []).map((m: Module) => ({
    ...m,
    lessons: (m.lessons || []).filter((l: Lesson) => (l.contents || []).length > 0)
  })).filter((m: Module) => (m.lessons || []).length > 0);

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

  const totalLessons = visibleModules.reduce((sum, m) => sum + (m.lessons || []).length, 0);
  const completedCount = completed.length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Course header */}
        <div className="glass-card p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
          <p className="text-slate-400 text-sm mb-5">{course.description}</p>

          {/* Progress */}
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">{completedCount} of {totalLessons} lessons completed</span>
            <span className="text-purple-400 font-semibold">{progressPct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {visibleModules.length === 0 && (
          <div className="glass-card p-8 text-center text-slate-500">No modules available yet.</div>
        )}

        <div className="space-y-3">
          {visibleModules.map((m, mi) => (
            <div key={mi} className="glass-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors"
                onClick={() => setExpandedModules(prev => ({ ...prev, [mi]: !prev[mi] }))}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-400 text-xs font-bold">
                    {mi + 1}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{m.title}</div>
                    {m.description && <div className="text-slate-500 text-xs mt-0.5">{m.description}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs">{(m.lessons || []).length} lessons</span>
                  <svg
                    className={`w-4 h-4 text-slate-500 transition-transform ${expandedModules[mi] ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {expandedModules[mi] && (
                <div className="border-t border-white/5 divide-y divide-white/5">
                  {(m.lessons || []).map((l: Lesson, li: number) => {
                    const lid = (l as any).lessonId;
                    const isNext = nextLessonId && lid && nextLessonId === lid.toString();
                    const isCompleted = completed.includes(lid?.toString());
                    return (
                      <div key={li} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors">
                        {/* Status icon */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-emerald-500/20 border border-emerald-500/40' : isNext ? 'bg-purple-600/20 border-2 border-purple-500' : 'border border-white/10'
                        }`}>
                          {isCompleted ? (
                            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <span className={`text-xs ${isNext ? 'text-purple-400' : 'text-slate-600'}`}>{li + 1}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{l.title}</div>
                          {l.description && <div className="text-slate-600 text-xs mt-0.5 truncate">{l.description}</div>}
                          <div className="text-xs text-slate-600 mt-0.5">{(l.contents || []).length} item{(l.contents || []).length === 1 ? '' : 's'}</div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          {isCompleted && (
                            <button onClick={() => navigate(`/student/courses/${courseId}/lesson/${lid}`)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
                              Review
                            </button>
                          )}
                          {isNext && !isCompleted && (
                            <button onClick={() => navigate(`/student/courses/${courseId}/lesson/${lid}`)} className="btn-primary text-xs !py-1.5 !px-3">
                              Continue
                            </button>
                          )}
                          {!isCompleted && !isNext && (
                            <button onClick={() => navigate(`/student/courses/${courseId}/lesson/${lid}`)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
