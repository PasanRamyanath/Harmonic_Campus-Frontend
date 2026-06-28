import { useEffect, useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import CourseEditor from '../components/CourseEditor';
import { useAuth } from '../contexts/AuthContext';
import * as courseApi from '../api/courseApi';
import * as enrollmentApi from '../api/enrollmentApi';
import * as qnaApi from '../api/qnaApi';

type Lesson = { lessonId?: string; title: string; order?: number; contents?: any[] };
type Module = { moduleId?: string; title: string; order?: number; lessons: Lesson[] };
type Course = { _id?: string; title: string; description: string; accessTier: string; status: string; tags?: string[]; modules?: Module[] };
type Tab = 'profile' | 'instructor' | 'courses' | 'engagement';

const INTEREST_OPTIONS = ['Guitar','Piano','Vocals','Music Theory','Production','Drums','Violin','Bass'];
const INSTRUMENT_OPTIONS = ['Guitar','Piano','Violin','Drums','Bass','Saxophone','Trumpet','Cello'];

function NavItem({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`sidebar-link ${active ? 'active' : ''}`}>
      {icon}
      {label}
    </button>
  );
}

export default function InstructorDashboard() {
  const { appUser, updateProfile } = useAuth();
  const [active, setActive] = useState<Tab>('profile');

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [picUrl, setPicUrl] = useState('');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [headline, setHeadline] = useState('');
  const [credentials, setCredentials] = useState('');
  const [website, setWebsite] = useState('');
  const [instrSaving, setInstrSaving] = useState(false);
  const [instrMsg, setInstrMsg] = useState<string | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrolled, setEnrolled] = useState<any[]>([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [qnaItems, setQnaItems] = useState<any[]>([]);
  const [loadingQna, setLoadingQna] = useState(false);
  const [qnaText, setQnaText] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) return;
    setUsername(appUser.username || '');
    setBio(appUser.profile?.bio || '');
    setPicUrl(appUser.profile?.picUrl || '');
    setInstruments(appUser.profile?.instruments || []);
    setInterests(appUser.profile?.interests || []);
    setHeadline(appUser.instructorProfile?.headline || '');
    setCredentials(appUser.instructorProfile?.credentials || '');
    setWebsite(appUser.instructorProfile?.website || '');
  }, [appUser]);

  const toggle = (val: string, setFn: (s: string[]) => void, arr: string[]) =>
    setFn(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const saveProfile = async () => {
    setProfileMsg(null); setProfileLoading(true);
    try {
      if (!updateProfile) throw new Error('unavailable');
      await updateProfile({ username, profile: { bio, picUrl, instruments, interests } });
      setProfileMsg('saved');
    } catch (err: unknown) { setProfileMsg(err instanceof Error ? err.message : 'Save failed'); }
    finally { setProfileLoading(false); setTimeout(() => setProfileMsg(null), 2500); }
  };

  const saveInstructor = async () => {
    setInstrMsg(null); setInstrSaving(true);
    try {
      if (!updateProfile) throw new Error('unavailable');
      await updateProfile({ instructorProfile: { headline, credentials, website } });
      setInstrMsg('saved');
    } catch (err: unknown) { setInstrMsg(err instanceof Error ? err.message : 'Save failed'); }
    finally { setInstrSaving(false); setTimeout(() => setInstrMsg(null), 2500); }
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try { setCourses((await courseApi.listCourses({ mine: true })) || []); }
    catch { setCourses([]); }
    finally { setLoadingCourses(false); }
  };

  useEffect(() => { if (appUser?.role === 'instructor') fetchCourses(); }, [appUser]);

  useEffect(() => {
    const run = async () => {
      if (!selectedCourseId) { setEnrolled([]); return; }
      setLoadingEnrolled(true);
      try { setEnrolled((await enrollmentApi.listEnrollments({ courseId: selectedCourseId })) || []); }
      catch { setEnrolled([]); }
      finally { setLoadingEnrolled(false); }
    };
    run();
  }, [selectedCourseId]);

  useEffect(() => {
    const run = async () => {
      if (!selectedCourseId || !selectedLessonId) { setQnaItems([]); return; }
      setLoadingQna(true);
      try { setQnaItems((await qnaApi.listQna(selectedCourseId, selectedLessonId)) || []); }
      catch { setQnaItems([]); }
      finally { setLoadingQna(false); }
    };
    run();
  }, [selectedCourseId, selectedLessonId]);

  const postQna = async () => {
    if (!selectedCourseId || !selectedLessonId || !qnaText.trim()) return;
    try {
      const item = await qnaApi.postQna(selectedCourseId, selectedLessonId, qnaText.trim(), replyParentId || undefined);
      setQnaItems(prev => [...prev, item]);
      setQnaText(''); setReplyParentId(null);
    } catch (err: any) { alert('Failed to post: ' + (err?.response?.data?.error || err.message)); }
  };

  const saveCourse = async (course: Course) => {
    setSavingCourse(true);
    try {
      if (course._id) {
        const updated = await courseApi.updateCourse(course._id, course);
        setCourses(prev => prev.map(c => c._id === updated._id ? updated : c));
      } else {
        const created = await courseApi.createCourse(course);
        setCourses(prev => [created, ...prev]);
      }
      setEditing(null);
    } catch (err: any) { alert('Save failed: ' + (err?.response?.data?.error || err?.message)); }
    finally { setSavingCourse(false); }
  };

  const removeCourse = async (id?: string) => {
    if (!id || !confirm('Delete this course?')) return;
    try { await courseApi.deleteCourse(id); setCourses(prev => prev.filter(c => c._id !== id)); }
    catch { alert('Delete failed'); }
  };

  const togglePublish = async (c: Course) => {
    if (!c._id) return;
    const newStatus = c.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await courseApi.updateCourse(c._id, { status: newStatus });
      setCourses(prev => prev.map(p => p._id === updated._id ? updated : p));
    } catch { alert('Failed to change publish status'); }
  };

  if (!appUser) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="glass-card p-8 text-slate-400">Please log in to access instructor dashboard.</div>
      </main>
    );
  }

  if (appUser.role !== 'instructor') {
    return (
      <main className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="glass-card p-8 text-slate-400">Your account is not an instructor account.</div>
      </main>
    );
  }

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { key: 'instructor', label: 'Instructor Info', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg> },
    { key: 'courses', label: 'Courses', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { key: 'engagement', label: 'Students & Q&A', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg> },
  ];

  const msgEl = (msg: string | null) => msg && (
    <div className={`px-4 py-3 rounded-xl text-sm border ${msg === 'saved' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
      {msg === 'saved' ? 'Changes saved successfully' : msg}
    </div>
  );

  const checkboxRow = (opt: string, arr: string[], setFn: (s: string[]) => void, accent = 'purple') => (
    <label key={opt} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${arr.includes(opt) ? `bg-${accent}-600/20 border-${accent}-500/40 text-white` : 'bg-white/3 border-white/8 text-slate-400 hover:border-white/15'}`}>
      <input type="checkbox" className="hidden" checked={arr.includes(opt)} onChange={() => toggle(opt, setFn, arr)} />
      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${arr.includes(opt) ? `bg-${accent}-600 border-${accent}-600` : 'border-white/20'}`}>
        {arr.includes(opt) && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </div>
      <span className="text-sm">{opt}</span>
    </label>
  );

  return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Instructor Dashboard' }]} />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
              {(appUser.username || appUser.email || 'I')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Instructor Dashboard</h1>
              <p className="text-slate-500 text-sm">{appUser.username || appUser.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="glass-card p-4 space-y-1">
              <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold px-3 pb-2">Navigation</p>
              {navItems.map(n => <NavItem key={n.key} label={n.label} active={active === n.key} onClick={() => setActive(n.key)} icon={n.icon} />)}
            </div>
          </aside>

          {/* Content */}
          <section className="md:col-span-3 space-y-6">
            {/* ── Profile ── */}
            {active === 'profile' && (
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">Username</label>
                    <input className="input-dark" value={username} onChange={e => setUsername(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">Bio</label>
                    <textarea className="input-dark resize-none" rows={4} value={bio} onChange={e => setBio(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">Profile Picture URL</label>
                    <input className="input-dark" value={picUrl} onChange={e => setPicUrl(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-3">Instruments</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {INSTRUMENT_OPTIONS.map(opt => checkboxRow(opt, instruments, setInstruments))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-3">Interests</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {INTEREST_OPTIONS.map(opt => checkboxRow(opt, interests, setInterests, 'cyan'))}
                    </div>
                  </div>
                  {msgEl(profileMsg)}
                  <div className="flex justify-end">
                    <button onClick={saveProfile} disabled={profileLoading} className="btn-primary !py-2.5 !px-6 disabled:opacity-50">
                      {profileLoading ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Instructor Info ── */}
            {active === 'instructor' && (
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-6">Instructor Info</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">Headline</label>
                    <input className="input-dark" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Professional Guitarist & Music Educator" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">Credentials / Short bio</label>
                    <textarea className="input-dark resize-none" rows={4} value={credentials} onChange={e => setCredentials(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">Website</label>
                    <input className="input-dark" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
                  </div>
                  {msgEl(instrMsg)}
                  <div className="flex justify-end">
                    <button onClick={saveInstructor} disabled={instrSaving} className="btn-primary !py-2.5 !px-6 disabled:opacity-50">
                      {instrSaving ? 'Saving…' : 'Save Instructor Profile'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Courses ── */}
            {active === 'courses' && (
              <div className="space-y-4">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-white">Your Courses</h2>
                    <button onClick={() => setEditing({ title: '', description: '', accessTier: 'free', status: 'draft', tags: [], modules: [] })} className="btn-primary text-sm !py-2 !px-5">
                      + New Course
                    </button>
                  </div>

                  {loadingCourses ? (
                    <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>
                  ) : courses.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-slate-500 mb-3">No courses yet.</p>
                      <button onClick={() => setEditing({ title: '', description: '', accessTier: 'free', status: 'draft', tags: [], modules: [] })} className="btn-primary text-sm">
                        Create Your First Course
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courses.map(c => (
                        <div key={c._id} className="p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold">{c.title}</p>
                              <p className="text-slate-500 text-sm mt-0.5 truncate">{c.description?.slice(0, 120)}</p>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                <span className="tag-chip">{c.accessTier}</span>
                                <span className={`tag-chip ${c.status === 'published' ? '!bg-emerald-500/15 !border-emerald-500/30 !text-emerald-400' : ''}`}>{c.status}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0 flex-wrap">
                              <button onClick={() => togglePublish(c)} className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${c.status === 'published' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                {c.status === 'published' ? 'Unpublish' : 'Publish'}
                              </button>
                              <button onClick={() => setEditing(c)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors">Edit</button>
                              <button onClick={() => removeCourse(c._id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {editing && (
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">{editing._id ? 'Edit Course' : 'New Course'}</h3>
                    <CourseEditor course={editing} onCancel={() => setEditing(null)} onSave={saveCourse} saving={savingCourse} />
                  </div>
                )}
              </div>
            )}

            {/* ── Engagement ── */}
            {active === 'engagement' && (
              <div className="space-y-5">
                {/* Course selector */}
                <div className="glass-card p-5">
                  <label className="block text-slate-400 text-sm font-medium mb-2">Select Course</label>
                  <select value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); setSelectedLessonId(''); }} className="input-dark">
                    <option value="">— Choose a course —</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>

                {/* Enrolled students */}
                <div className="glass-card p-5">
                  <h3 className="text-white font-semibold mb-4">Enrolled Students</h3>
                  {loadingEnrolled ? (
                    <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
                  ) : enrolled.length === 0 ? (
                    <p className="text-slate-500 text-sm">{selectedCourseId ? 'No enrollments yet.' : 'Select a course to see enrolled students.'}</p>
                  ) : (
                    <div className="space-y-2">
                      {enrolled.map((e: any) => (
                        <div key={e._id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                          <div className="flex items-center gap-3">
                            {e.studentId?.profile?.picUrl ? (
                              <img src={e.studentId.profile.picUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                {(e.studentId?.username || 'S')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-white text-sm font-medium">{e.studentId?.username || 'Unknown'}</p>
                              <p className="text-slate-500 text-xs">{e.studentId?.email}</p>
                            </div>
                          </div>
                          <span className="text-slate-600 text-xs">{new Date(e.enrolledAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lesson Q&A */}
                <div className="glass-card p-5">
                  <h3 className="text-white font-semibold mb-4">Lesson Q&A</h3>
                  <div className="mb-4">
                    <label className="block text-slate-400 text-sm mb-2">Select Lesson</label>
                    <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} disabled={!selectedCourseId} className="input-dark">
                      <option value="">— Choose a lesson —</option>
                      {courses.filter(c => c._id === selectedCourseId).flatMap(c => (c.modules || [])).flatMap(m => (m.lessons || []).map(l => ({ ...l, moduleTitle: m.title }))).map((l: any) => (
                        <option key={l.lessonId} value={l.lessonId}>{l.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 min-h-16">
                    {loadingQna ? (
                      <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
                    ) : qnaItems.length === 0 && selectedLessonId ? (
                      <p className="text-slate-500 text-sm">No questions yet for this lesson.</p>
                    ) : qnaItems.map((item: any) => (
                      <div key={item._id} className={`p-3 rounded-xl bg-white/3 border border-white/5 ${item.parentId ? 'ml-5' : ''}`}>
                        <div className="text-xs mb-1">
                          <span className="text-white font-medium">{item.authorId?.username || 'User'}</span>
                          <span className="text-slate-600 ml-2">{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{item.content}</p>
                        {!item.parentId && (
                          <button onClick={() => setReplyParentId(item._id)} className="text-xs text-purple-400 hover:text-purple-300 mt-2 transition-colors">Reply</button>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedLessonId && (
                    <div className="mt-4">
                      {replyParentId && (
                        <div className="text-xs text-slate-500 mb-2">
                          Replying to message · <button className="text-purple-400 hover:text-purple-300" onClick={() => setReplyParentId(null)}>cancel</button>
                        </div>
                      )}
                      <textarea className="input-dark resize-none mb-3" rows={3} value={qnaText} onChange={e => setQnaText(e.target.value)} placeholder="Write your response…" />
                      <div className="flex justify-end">
                        <button onClick={postQna} disabled={!qnaText.trim()} className="btn-primary text-sm !py-2 !px-5 disabled:opacity-50">Post</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
