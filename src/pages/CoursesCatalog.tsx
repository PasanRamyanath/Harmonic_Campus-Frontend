import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import * as courseApi from '../api/courseApi';
import * as enrollmentApi from '../api/enrollmentApi';
import { useAuth } from '../contexts/AuthContext';

type Course = { _id?: string; title: string; description?: string; accessTier?: string; status?: string; tags?: string[] };

export default function CoursesCatalog() {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [access, setAccess] = useState('');
  const [sort, setSort] = useState('newest');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const { appUser } = useAuth();
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchCourses = async (overrides: { q?: string; tag?: string; accessTier?: string; sort?: string } = {}) => {
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
      let data = (await courseApi.listCourses(params)) || [];
      if (accessVal) data = data.filter((c: Course) => String(c.accessTier || '').toLowerCase() === accessVal.toLowerCase());
      setCourses(data);
    } catch { setCourses([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  useEffect(() => {
    if (!appUser) { setEnrolledIds([]); return; }
    let mounted = true;
    (async () => {
      try {
        const data = await enrollmentApi.listEnrollments({ mine: true });
        if (mounted) setEnrolledIds((data || []).map((e: any) => e.courseId).filter(Boolean));
      } catch { if (mounted) setEnrolledIds([]); }
    })();
    return () => { mounted = false; };
  }, [appUser]);

  const handleEnroll = async (id?: string) => {
    if (!id) return;
    setEnrollingId(id);
    try {
      const res = await enrollmentApi.enroll(id);
      if (res?.message) alert(res.message);
      else alert('Enrolled successfully');
      setEnrolledIds(prev => prev.includes(id) ? prev : [...prev, id]);
    } catch (err: any) {
      if (err?.response?.status === 402) {
        if (confirm('This is a premium course. Subscribe to enroll?')) window.location.href = '/profile';
        return;
      }
      alert('Enrollment failed: ' + (err?.response?.data?.error || err.message || err));
    } finally { setEnrollingId(null); }
  };

  return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Courses' }]} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Course Catalog</h1>
          <p className="text-slate-400">Discover courses from expert musicians and start your journey today</p>
        </div>

        {/* Search & Filters */}
        <div className="glass-card p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  placeholder="Search courses..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchCourses()}
                  className="input-dark !pl-9"
                />
              </div>
            </div>
            <input placeholder="Filter by tag" value={tag} onChange={e => setTag(e.target.value)} className="input-dark" />
            <select value={access} onChange={e => { setAccess(e.target.value); fetchCourses({ accessTier: e.target.value }); }} className="input-dark">
              <option value="">Any Access</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
            <select value={sort} onChange={e => { setSort(e.target.value); fetchCourses({ sort: e.target.value }); }} className="input-dark">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title_asc">Title A–Z</option>
              <option value="title_desc">Title Z–A</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => fetchCourses()} className="btn-primary !py-2 !px-5 text-sm">Search</button>
            <button onClick={() => { setQ(''); setTag(''); setAccess(''); fetchCourses({ q: '', tag: '', accessTier: '' }); }} className="btn-ghost !py-2 !px-5 text-sm">Clear</button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-slate-400 text-lg font-medium">No courses found</p>
            <p className="text-slate-600 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-500 text-sm">{courses.length} course{courses.length !== 1 ? 's' : ''} found</p>
            {courses.map(c => (
              <div key={c._id} className="glass-card-hover p-5 flex items-start gap-5">
                {/* Course icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600/30 to-cyan-500/20 rounded-xl flex items-center justify-center shrink-0 border border-purple-500/20">
                  <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-white font-semibold text-lg leading-snug">{c.title}</h3>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">{c.description?.slice(0, 160)}{c.description && c.description.length > 160 ? '…' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={`tag-chip ${c.accessTier === 'premium' ? '!bg-yellow-500/15 !border-yellow-500/30 !text-yellow-400' : ''}`}>
                      {c.accessTier === 'premium' ? '★ Premium' : 'Free'}
                    </span>
                    {c.tags?.map(t => <span key={t} className="tag-chip">{t}</span>)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {enrolledIds.includes(c._id || '') ? (
                    <Link to={`/student/courses/${c._id}`} className="btn-primary text-xs !py-2 !px-4 text-center">
                      Continue
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(c._id)}
                      disabled={enrollingId === c._id}
                      className="btn-primary text-xs !py-2 !px-4 disabled:opacity-50"
                    >
                      {enrollingId === c._id ? 'Enrolling…' : 'Enroll Free'}
                    </button>
                  )}
                  <Link to={`/courses/${c._id}`} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
