import { useEffect, useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import { Link } from 'react-router-dom';
import * as enrollmentApi from '../api/enrollmentApi';
import * as courseApi from '../api/courseApi';
import * as adminApi from '../api/adminApi';
import { useAuth } from '../contexts/AuthContext';

const INSTRUMENT_OPTIONS = ['Guitar','Piano','Violin','Drums','Bass','Saxophone','Trumpet','Cello'];
const INTEREST_OPTIONS = ['Guitar','Piano','Vocals','Music Theory','Production','Drums','Violin','Bass'];

type Tab = 'enrolled' | 'profile' | 'become-instructor';

function NavItem({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`sidebar-link ${active ? 'active' : ''}`}>
      {icon}
      {label}
    </button>
  );
}

export default function StudentDashboard() {
  const { appUser, updateProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('enrolled');
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [picUrl, setPicUrl] = useState('');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!appUser) return;
    setUsername(appUser.username || '');
    setBio(appUser.profile?.bio || '');
    setPicUrl(appUser.profile?.picUrl || '');
    setInstruments(appUser.profile?.instruments || []);
    setInterests(appUser.profile?.interests || []);
  }, [appUser]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!appUser) return;
      setLoadingEnrollments(true);
      try {
        const list: any[] = await enrollmentApi.listEnrollments({ mine: true });
        const ids = (list || []).map(e => e.courseId).filter(Boolean);
        const courses = await Promise.all(ids.map((id: string) => courseApi.getCourse(id).catch(() => null)));
        if (mounted) setEnrolledCourses((courses || []).filter(Boolean));
      } catch { if (mounted) setEnrolledCourses([]); }
      finally { if (mounted) setLoadingEnrollments(false); }
    })();
    return () => { mounted = false; };
  }, [appUser]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!appUser) return;
      const tags = [...(appUser.profile?.interests || []), ...(appUser.profile?.instruments || [])];
      if (!tags.length) return;
      setLoadingRec(true);
      try {
        const byTag = await Promise.all(tags.slice(0, 4).map(tag => courseApi.listCourses({ tag, accessTier: '' }).catch(() => [])));
        const seen = new Set<string>();
        const merged: any[] = [];
        for (const list of byTag) for (const c of (list || [])) if (!seen.has(c._id) && c.status === 'published') { seen.add(c._id); merged.push(c); }
        if (mounted) setRecommendedCourses(merged.slice(0, 6));
      } catch { }
      finally { if (mounted) setLoadingRec(false); }
    })();
    return () => { mounted = false; };
  }, [appUser]);

  const toggle = (val: string, setFn: (s: string[]) => void, arr: string[]) =>
    setFn(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const handleApplyInstructor = async () => {
    setApplying(true); setApplyMsg(null);
    try {
      await adminApi.applyForInstructor();
      setApplyMsg('success');
    } catch (err: any) { setApplyMsg(err?.response?.data?.error || err.message || 'Failed'); }
    finally { setApplying(false); }
  };

  const handleSaveProfile = async () => {
    if (!updateProfile) return;
    setSaving(true);
    try {
      await updateProfile({ username, profile: { bio, picUrl, instruments, interests } });
      setMsg('Saved');
    } catch (err: any) { setMsg(err?.message || 'Failed'); }
    finally { setSaving(false); setTimeout(() => setMsg(null), 2000); }
  };

  if (!appUser) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] pt-20 flex items-center justify-center">
        <div className="glass-card p-8 text-slate-400">Please log in to access your dashboard.</div>
      </main>
    );
  }

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'enrolled', label: 'My Courses', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      key: 'profile', label: 'Profile Settings', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: 'become-instructor', label: 'Become Instructor', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Student Dashboard' }]} />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
              {(appUser.username || appUser.email || 'S')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome back, {appUser.username || 'Student'}</h1>
              <p className="text-slate-500 text-sm">{appUser.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="glass-card p-4 space-y-1">
              <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold px-3 pb-2">Navigation</p>
              {navItems.map(n => (
                <NavItem key={n.key} label={n.label} active={tab === n.key} onClick={() => setTab(n.key)} icon={n.icon} />
              ))}
              <div className="pt-3 border-t border-white/5 mt-3">
                <Link to="/practice" className="sidebar-link">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Practice Room
                </Link>
                <Link to="/courses" className="sidebar-link">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Browse Courses
                </Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <section className="md:col-span-3 space-y-6">
            {/* ── Enrolled Courses ── */}
            {tab === 'enrolled' && (
              <>
                <div className="glass-card p-6">
                  <h2 className="text-xl font-bold text-white mb-5">Enrolled Courses</h2>
                  {loadingEnrollments ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
                    </div>
                  ) : enrolledCourses.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <p className="text-slate-400 mb-3">No enrolled courses yet.</p>
                      <Link to="/courses" className="btn-primary text-sm inline-block">Browse Courses</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {enrolledCourses.map((c: any) => (
                        <div key={c._id} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 hover:border-purple-500/20 hover:bg-white/5 transition-all duration-200">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-white font-semibold truncate">{c.title}</p>
                            <p className="text-slate-500 text-sm truncate mt-0.5">{c.description?.slice(0, 80)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`tag-chip ${c.accessTier === 'premium' ? '!bg-yellow-500/15 !border-yellow-500/30 !text-yellow-400' : ''}`}>
                                {c.accessTier}
                              </span>
                              <span className="tag-chip">{c.status}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <Link to={`/student/courses/${c._id}`} className="btn-primary text-xs !py-1.5 !px-4 text-center">Continue</Link>
                            <Link to={`/courses/${c._id}`} className="text-xs text-purple-400 hover:text-purple-300 text-center transition-colors">Details</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {(recommendedCourses.length > 0 || loadingRec) && (
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-white">Recommended for You</h2>
                      <span className="tag-chip text-xs">AI Picks</span>
                    </div>
                    <p className="text-slate-500 text-sm mb-5">Based on your interests and instruments</p>
                    {loadingRec ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {recommendedCourses.filter(c => !enrolledCourses.some(e => e._id === c._id)).map((c: any) => (
                          <div key={c._id} className="p-4 rounded-xl bg-white/3 border border-white/5 hover:border-purple-500/20 hover:bg-white/5 transition-all duration-200">
                            <p className="text-white font-semibold text-sm mb-1">{c.title}</p>
                            <p className="text-slate-500 text-xs mb-3">{(c.description || '').slice(0, 80)}{c.description?.length > 80 ? '…' : ''}</p>
                            <div className="flex items-center justify-between">
                              <span className={`tag-chip text-xs ${c.accessTier === 'premium' ? '!bg-yellow-500/15 !border-yellow-500/30 !text-yellow-400' : ''}`}>{c.accessTier}</span>
                              <Link to={`/courses/${c._id}`} className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">View →</Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!loadingRec && recommendedCourses.length === 0 && !appUser?.profile?.interests?.length && !appUser?.profile?.instruments?.length && (
                  <div className="glass-card p-6 border border-purple-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold mb-1">Get personalized recommendations</p>
                        <p className="text-slate-400 text-sm">
                          Add your interests and instruments in{' '}
                          <button onClick={() => setTab('profile')} className="text-purple-400 hover:text-purple-300 underline transition-colors">Profile Settings</button>{' '}
                          to see courses tailored for you.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Profile Settings ── */}
            {tab === 'profile' && (
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">Username</label>
                    <input className="input-dark" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your display name" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">Bio</label>
                    <textarea className="input-dark resize-none" rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself and your musical journey..." />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">Profile Picture URL</label>
                    <input className="input-dark" value={picUrl} onChange={e => setPicUrl(e.target.value)} placeholder="https://..." />
                  </div>

                  {/* Instruments */}
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-3">Instruments I Play</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {INSTRUMENT_OPTIONS.map(opt => (
                        <label key={opt} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${instruments.includes(opt) ? 'bg-purple-600/20 border-purple-500/40 text-white' : 'bg-white/3 border-white/8 text-slate-400 hover:border-white/15'}`}>
                          <input type="checkbox" className="hidden" checked={instruments.includes(opt)} onChange={() => toggle(opt, setInstruments, instruments)} />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${instruments.includes(opt) ? 'bg-purple-600 border-purple-600' : 'border-white/20'}`}>
                            {instruments.includes(opt) && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-3">Musical Interests</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {INTEREST_OPTIONS.map(opt => (
                        <label key={opt} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${interests.includes(opt) ? 'bg-cyan-600/20 border-cyan-500/40 text-white' : 'bg-white/3 border-white/8 text-slate-400 hover:border-white/15'}`}>
                          <input type="checkbox" className="hidden" checked={interests.includes(opt)} onChange={() => toggle(opt, setInterests, interests)} />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${interests.includes(opt) ? 'bg-cyan-600 border-cyan-600' : 'border-white/20'}`}>
                            {interests.includes(opt) && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {msg && (
                    <div className={`px-4 py-3 rounded-xl text-sm border ${msg === 'Saved' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                      {msg}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button onClick={handleSaveProfile} disabled={saving} className="btn-primary !py-2.5 !px-6 disabled:opacity-50">
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Become Instructor ── */}
            {tab === 'become-instructor' && (
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-2">Become an Instructor</h2>
                <p className="text-slate-400 text-sm mb-6">Share your musical expertise with students worldwide.</p>

                {appUser.instructorApplicationDate && !appUser.instructorApproved ? (
                  <div className="p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-yellow-300 font-semibold">Application Pending Review</p>
                        <p className="text-yellow-400/70 text-sm mt-1">
                          Submitted on {new Date(appUser.instructorApplicationDate).toLocaleDateString()}. An admin will review it shortly.
                        </p>
                        {appUser.instructorReviewNotes && (
                          <p className="text-yellow-400/60 text-sm mt-2 italic">Admin notes: "{appUser.instructorReviewNotes}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { icon: '🎓', title: 'Teach Students', desc: 'Create courses and share your knowledge with learners globally.' },
                        { icon: '💰', title: 'Earn Revenue', desc: 'Get paid through PayHere as students subscribe to your premium content.' },
                        { icon: '📊', title: 'Track Engagement', desc: 'Monitor enrolled students and answer their questions directly.' },
                      ].map(f => (
                        <div key={f.title} className="p-5 rounded-xl bg-white/3 border border-white/8 text-center">
                          <div className="text-3xl mb-3">{f.icon}</div>
                          <div className="text-white font-semibold text-sm mb-2">{f.title}</div>
                          <div className="text-slate-500 text-xs leading-relaxed">{f.desc}</div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
                      <strong className="text-blue-200">Before you apply:</strong> Make sure your profile has a bio and instruments filled in.
                    </div>

                    {applyMsg && (
                      <div className={`px-4 py-3 rounded-xl text-sm border ${applyMsg === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                        {applyMsg === 'success' ? 'Application submitted! An admin will review your request.' : applyMsg}
                      </div>
                    )}

                    <button
                      onClick={handleApplyInstructor}
                      disabled={applying}
                      className="btn-primary !py-3 !px-8 disabled:opacity-50"
                    >
                      {applying ? 'Submitting…' : 'Submit Instructor Application'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
