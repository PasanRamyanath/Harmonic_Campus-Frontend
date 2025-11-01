import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SignupModal from '../components/SignupModal';
import LoginModal from '../components/LoginModal';
import * as courseApi from '../api/courseApi';
import * as enrollmentApi from '../api/enrollmentApi';
import { useAuth } from '../contexts/AuthContext';

type Course = { _id?: string; title: string; description?: string; accessTier?: string; status?: string; tags?: string[]; instructorId?: string };

export default function CoursesCatalog() {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [access, setAccess] = useState('');
  const [sort, setSort] = useState('newest');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { appUser } = useAuth();
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

  const fetch = async (overrides: { q?: string; tag?: string; accessTier?: string; sort?: string } = {}) => {
    setLoading(true);
    try {
      const params: any = {};
      const qVal = overrides.q !== undefined ? overrides.q : q;
      const tagVal = overrides.tag !== undefined ? overrides.tag : tag;
  const accessVal = overrides.accessTier !== undefined ? overrides.accessTier : access;
  const sortVal = overrides.sort !== undefined ? overrides.sort : sort;
      if (qVal) params.q = qVal;
      if (tagVal) params.tag = tagVal;
      if (accessVal) params.accessTier = accessVal;
  if (sortVal) params.sort = sortVal;
      const data = await courseApi.listCourses(params);
      let list = data || [];
      // defensive client-side filter: if accessTier was requested, ensure only matching items are shown
      if (accessVal) {
        const filtered = (list || []).filter((c: Course) => String(c.accessTier || '').toLowerCase() === String(accessVal).toLowerCase());
        if (filtered.length !== (list || []).length) {
          console.warn('CoursesCatalog: backend returned items that do not match accessTier filter; applying client-side filter');
        }
        list = filtered;
      }
      setCourses(list || []);
    } catch (err) {
      console.error('Failed to list courses', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    // if logged in, load enrollments for the current user so we can mark enrolled courses
    if (!appUser) {
      setEnrolledCourseIds([]);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const data = await enrollmentApi.listEnrollments({ mine: true });
        if (!mounted) return;
        const ids = (data || []).map((e: any) => e.courseId).filter(Boolean);
        setEnrolledCourseIds(ids);
      } catch (err) {
        console.warn('Failed to load enrollments', err);
        if (mounted) setEnrolledCourseIds([]);
      }
    })();

    return () => { mounted = false; };
  }, [appUser]);

  const handleEnroll = async (id?: string) => {
    if (!id) return;
    try {
      const res = await enrollmentApi.enroll(id);
      if (res && res.message) alert(res.message);
      else alert('Enrolled successfully');
      // mark as enrolled locally
      setEnrolledCourseIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    } catch (err: any) {
      if (err?.response?.status === 402) {
        if (confirm('This is a premium course. Subscribe to enroll now?')) {
          // navigate to subscription page - for now open profile
          window.location.href = '/profile';
        }
        return;
      }
      console.error('Enroll failed', err);
      alert('Enrollment failed: ' + (err?.response?.data?.error || err.message || err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onOpenSignup={() => setShowSignup(true)} onOpenLogin={() => setShowLogin(true)} />
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <main className="pt-20 p-6 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded shadow mb-4">
          <h1 className="text-xl font-semibold mb-3">Course Catalog</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input placeholder="Search" value={q} onChange={e => setQ(e.target.value)} className="p-2 border rounded" />
            <input placeholder="Tag" value={tag} onChange={e => setTag(e.target.value)} className="p-2 border rounded" />
            <select value={access} onChange={e => { setAccess(e.target.value); fetch({ accessTier: e.target.value }); }} className="p-2 border rounded">
              <option value="">Any access</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
            <select value={sort} onChange={e => { setSort(e.target.value); fetch({ sort: e.target.value }); }} className="p-2 border rounded">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title_asc">Title A–Z</option>
              <option value="title_desc">Title Z–A</option>
            </select>
            <div className="flex items-center gap-2">
              <button onClick={() => fetch()} className="px-3 py-2 bg-purple-600 text-white rounded">Search</button>
              <button onClick={() => { setQ(''); setTag(''); setAccess(''); fetch({ q: '', tag: '', accessTier: '' }); }} className="px-3 py-2 bg-gray-200 rounded">Clear</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading && <div>Loading...</div>}
          {!loading && courses.length === 0 && <div className="bg-white p-6 rounded shadow">No courses found.</div>}
          {courses.map(c => (
            <div key={c._id} className="bg-white p-4 rounded shadow flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">{c.title}</div>
                <div className="text-sm text-gray-600">{c.description?.slice(0, 160)}</div>
                <div className="text-xs text-gray-500 mt-1">{c.accessTier} · {c.status}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {enrolledCourseIds.includes(c._id || '') ? (
                  <button disabled className="px-3 py-2 bg-gray-300 text-gray-700 rounded">Enrolled</button>
                ) : (
                  <button onClick={() => handleEnroll(c._id)} className="px-3 py-2 bg-green-600 text-white rounded">Enroll</button>
                )}
                <a href={`/courses/${c._id}`} className="text-sm text-blue-600">View</a>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
