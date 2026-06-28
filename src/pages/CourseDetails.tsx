import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import ConfirmModal from '../components/ConfirmModal';
import Notification from '../components/Notification';
import * as courseApi from '../api/courseApi';
import * as enrollmentApi from '../api/enrollmentApi';
import { useAuth } from '../contexts/AuthContext';

type ContentItem = {
  type: 'text' | 'video' | 'file' | string;
  text?: string;
  url?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
};

type Lesson = { title?: string; description?: string; contents?: ContentItem[] };
type Module = { title?: string; description?: string; lessons?: Lesson[] };
type Course = {
  _id?: string;
  title?: string;
  description?: string;
  instructorName?: string;
  accessTier?: string;
  status?: string;
  tags?: string[];
  modules?: Module[];
};

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appUser } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotificationMsg(message);
    setNotificationType(type);
    setNotificationOpen(true);
  };

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await courseApi.getCourse(id);
        if (!mounted) return;
        setCourse(data || null);
        // expand first module by default
        setExpandedModules({ 0: true });
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load course');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (!id || !appUser) return;
    let mounted = true;
    (async () => {
      try {
        const list = await enrollmentApi.listEnrollments({ mine: true, courseId: id });
        if (!mounted) return;
        setEnrolled((list || []).length > 0);
      } catch { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [id, appUser]);

  const handleEnroll = async () => {
    if (!id) return;
    if (!appUser) { navigate('/profile'); return; }
    try {
      setEnrolling(true);
      await enrollmentApi.enroll(id);
      setEnrolled(true);
      showNotification('Enrolled successfully', 'success');
    } catch (err: any) {
      if (err?.response?.status === 402) {
        if (confirm('This is a premium course. Subscribe to enroll now?')) navigate('/profile');
        return;
      }
      showNotification('Enrollment failed: ' + (err?.response?.data?.error || err.message || err), 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!id) return;
    if (!appUser) { navigate('/profile'); return; }
    setShowConfirm(true);
  };

  const performUnenroll = async (password?: string) => {
    setShowConfirm(false);
    try {
      await enrollmentApi.unenroll(id!, password);
      setEnrolled(false);
      showNotification('You have been unenrolled', 'success');
    } catch (err: any) {
      showNotification('Failed to unenroll: ' + (err?.response?.data?.error || err.message || err), 'error');
    }
  };

  const totalLessons = (course?.modules || []).reduce((sum, m) =>
    sum + (m.lessons || []).filter(l => (l.contents || []).length > 0).length, 0);
  const totalModules = (course?.modules || []).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-8 w-40 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />
          {[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <p className="text-red-400">{error ?? 'Course not found'}</p>
          <button onClick={() => navigate(-1)} className="btn-primary text-sm mt-4 inline-block">Go Back</button>
        </div>
      </main>
    );
  }

  const visibleModules = (course.modules || []).map(m => ({
    ...m,
    lessons: (m.lessons || []).filter(l => (l.contents || []).length > 0)
  })).filter(m => (m.lessons || []).length > 0);

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <main className="pt-8 pb-16 px-4 max-w-6xl mx-auto">
        <div className="mb-6">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Courses', to: '/courses' }, { label: course.title || 'Course' }]} />
        </div>

        {/* Course header card */}
        <div className="glass-card p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`tag-chip ${course.accessTier === 'premium' ? '!bg-yellow-500/15 !border-yellow-500/30 !text-yellow-400' : '!bg-emerald-500/15 !border-emerald-500/30 !text-emerald-400'}`}>
                  {course.accessTier}
                </span>
                <span className={`tag-chip ${course.status === 'published' ? '!bg-emerald-500/15 !border-emerald-500/30 !text-emerald-400' : ''}`}>
                  {course.status}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{course.title}</h1>
              <p className="text-slate-400 leading-relaxed mb-4">{course.description}</p>

              {/* Tags */}
              {(course.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {course.tags!.map(t => <span key={t} className="tag-chip">{t}</span>)}
                </div>
              )}

              {/* Quick stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  {totalModules} modules
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                  {totalLessons} lessons
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3 md:w-48 shrink-0">
              {enrolled ? (
                <>
                  <button
                    onClick={() => navigate(`/student/courses/${course._id}`)}
                    className="btn-primary !py-3 text-sm"
                  >
                    Continue Learning
                  </button>
                  <button onClick={handleUnenroll} className="btn-ghost text-sm !py-2.5 text-red-400 border-red-500/20 hover:bg-red-500/10">
                    Unenroll
                  </button>
                </>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling} className="btn-primary !py-3 text-sm disabled:opacity-60">
                  {enrolling ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enrolling…
                    </span>
                  ) : 'Enroll Now'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Curriculum */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Course Curriculum</h2>
          <span className="text-slate-500 text-sm">{totalModules} modules · {totalLessons} lessons</span>
        </div>

        {visibleModules.length === 0 && (
          <div className="glass-card p-8 text-center text-slate-500">No modules available for this course yet.</div>
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
                  {(m.lessons || []).map((l, li) => (
                    <div key={li} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors">
                      <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-slate-600 text-xs shrink-0">
                        {li + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-300 text-sm">{l.title}</div>
                        {l.description && <div className="text-slate-600 text-xs mt-0.5 truncate">{l.description}</div>}
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 text-xs shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                        {(l.contents || []).length} item{(l.contents || []).length === 1 ? '' : 's'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <ConfirmModal
        open={showConfirm}
        title="Unenroll"
        courseTitle={course.title}
        requirePassword={true}
        message="Are you sure you want to unenroll from this course? You will lose access to the content."
        confirmLabel="Unenroll"
        cancelLabel="Cancel"
        onConfirm={(pw?: string) => performUnenroll(pw)}
        onCancel={() => setShowConfirm(false)}
      />
      <Notification
        open={notificationOpen}
        message={notificationMsg}
        type={notificationType}
        onClose={() => setNotificationOpen(false)}
      />
    </div>
  );
}
