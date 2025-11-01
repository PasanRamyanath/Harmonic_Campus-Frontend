import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
      alert('Enrolled successfully');
    } catch (err: any) {
      if (err?.response?.status === 402) {
        if (confirm('This is a premium course. Subscribe to enroll now?')) navigate('/profile');
        return;
      }
      console.error('Enroll failed', err);
      alert('Enrollment failed: ' + (err?.response?.data?.error || err.message || err));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-20 p-6 max-w-4xl mx-auto">Loading...</main>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-20 p-6 max-w-4xl mx-auto">{error ?? 'Course not found'}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 p-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded shadow mb-6">
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
                <button disabled className="px-4 py-2 bg-gray-300 text-gray-700 rounded">Enrolled</button>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling} className="px-4 py-2 bg-green-600 text-white rounded">{enrolling ? 'Enrolling...' : 'Enroll'}</button>
              )}
              <a className="text-sm text-blue-600" href={`#/courses/${course._id}`}>Share</a>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {course.modules?.length === 0 && (
            <div className="bg-white p-6 rounded shadow">No modules available for this course yet.</div>
          )}

          {course.modules?.map((m, mi) => (
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

                    <div className="mt-2 space-y-2">
                      {(l.contents || []).map((c, ci) => (
                        <div key={ci} className="p-2 bg-gray-50 rounded">
                          {c.type === 'text' && <div dangerouslySetInnerHTML={{ __html: c.text || '' }} className="prose max-w-none"></div>}
                          {c.type === 'video' && c.url && (
                            <div>
                              {enrolled ? (
                                <video controls src={c.url} className="w-full rounded" />
                              ) : (
                                <div className="p-4 border rounded bg-white text-center">
                                  <div className="text-sm text-gray-700 mb-3">Video content is available to enrolled students only.</div>
                                  <button onClick={handleEnroll} className="px-3 py-2 bg-green-600 text-white rounded">{enrolling ? 'Enrolling...' : 'Enroll to watch'}</button>
                                </div>
                              )}
                            </div>
                          )}
                          {c.type === 'file' && c.url && (
                            <div>
                              <a href={c.url} target="_blank" rel="noreferrer" className="text-blue-600">{c.filename || 'Download file'}</a>
                              <div className="text-xs text-gray-500">{c.mimeType} · {c.size ? `${c.size} bytes` : ''}</div>
                            </div>
                          )}
                          {/* fallback for unknown types */}
                          {c.type && !['text','video','file'].includes(c.type) && (
                            <div className="text-sm text-gray-700">{JSON.stringify(c)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
