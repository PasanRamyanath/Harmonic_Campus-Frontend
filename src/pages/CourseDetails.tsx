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
      } catch (err: any) {
        console.error('Failed to load course', err);
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
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [id, appUser]);

  const handleEnroll = async () => {
    if (!id) return;
    if (!appUser) {
      // redirect to login/signup (simple behavior)
      navigate('/profile');
      return;
    }

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
  console.error('Enroll failed', err);
  showNotification('Enrollment failed: ' + (err?.response?.data?.error || err.message || err), 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!id) return;
    if (!appUser) {
      navigate('/profile');
      return;
    }
    // show modal instead (handled via state)
    setShowConfirm(true);
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const performUnenroll = async (password?: string) => {
    setShowConfirm(false);
    try {
  await enrollmentApi.unenroll(id!, password);
  setEnrolled(false);
  showNotification('You have been unenrolled', 'success');
    } catch (err: any) {
  console.error('Unenroll failed', err);
  showNotification('Failed to unenroll: ' + (err?.response?.data?.error || err.message || err), 'error');
    }
  };

  if (loading) {
    return (
      <main className="pt-6 p-6 max-w-4xl mx-auto">Loading...</main>
    );
  }

  if (error || !course) {
    return (
      <main className="pt-6 p-6 max-w-4xl mx-auto">{error ?? 'Course not found'}</main>
    );
  }

  const visibleModules = (course.modules || []).map(m => ({
    ...m,
    lessons: (m.lessons || []).filter(l => (l.contents || []).length > 0)
  })).filter(m => (m.lessons || []).length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-6 p-6 max-w-6xl mx-auto">
        <div className="mb-4">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="inline-flex items-center px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">
            <span className="mr-2">←</span> Back
          </button>
        </div>

  <div className="bg-white p-6 rounded shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Courses', to: '/courses' }, { label: course.title || 'Course' }]} />
            </div>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold">{course.title}</h1>
              <div className="text-sm text-gray-600 mt-2">{course.description}</div>
              <div className="text-xs text-gray-500 mt-2">{course.accessTier} · {course.status}</div>
              <div className="mt-2">
                {course.tags?.map(t => (
                  <span key={t} className="inline-block bg-gray-100 text-xs text-gray-700 px-2 py-1 mr-2 rounded">{t}</span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              {enrolled ? (
                <button onClick={handleUnenroll} className="px-4 py-2 bg-red-600 text-white rounded">Unenroll</button>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling} className="px-4 py-2 bg-green-600 text-white rounded">{enrolling ? 'Enrolling...' : 'Enroll'}</button>
              )}
              <a className="text-sm text-blue-600" href={`#/courses/${course._id}`}>Share</a>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {(visibleModules || []).length === 0 && (
            <div className="bg-white p-6 rounded shadow">No modules available for this course yet.</div>
          )}

          {(visibleModules || []).map((m: Module, mi: number) => (
            <div key={mi} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{m.title}</h2>
                  <div className="text-sm text-gray-600">{m.description}</div>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {(m.lessons || []).map((l, li) => (
                  <div key={li} className="border rounded p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{l.title}</div>
                        <div className="text-sm text-gray-600">{l.description}</div>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-500">{(l.contents || []).length} content item{(l.contents || []).length === 1 ? '' : 's'}</div>
                  </div>
                ))}
              </div>
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
