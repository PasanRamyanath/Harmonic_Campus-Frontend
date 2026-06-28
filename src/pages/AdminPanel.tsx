import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as adminApi from '../api/adminApi';
import Breadcrumbs from '../components/Breadcrumbs';

type Tab = 'stats' | 'users' | 'applications' | 'courses' | 'files';

function StatCard({ label, value, sub, gradient }: { label: string; value: number | string; sub: string; gradient: string }) {
  return (
    <div className="stat-card">
      <div className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${gradient} mb-1`}>{value}</div>
      <div className="text-white font-semibold text-sm">{label}</div>
      <div className="text-slate-600 text-xs mt-1">{sub}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
    instructor: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    student: 'bg-slate-500/15 border-slate-500/30 text-slate-400',
  };
  return <span className={`tag-chip ${styles[role] || styles.student}`}>{role}</span>;
}

export default function AdminPanel() {
  const { appUser } = useAuth();
  const [tab, setTab] = useState<Tab>('stats');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try { setStats(await adminApi.getStats()); }
    catch (e: any) { showMsg(e?.response?.data?.error || e.message, 'error'); }
    finally { setStatsLoading(false); }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const all = await adminApi.getAllUsers();
      setUsers(all);
      setApplications(all.filter((u: any) => u.instructorApplicationDate && !u.instructorApproved && u.role !== 'instructor'));
    }
    catch (e: any) { showMsg(e?.response?.data?.error || e.message, 'error'); }
    finally { setUsersLoading(false); }
  };

  const loadCourses = async () => {
    setCoursesLoading(true);
    try { setCourses(await adminApi.getAllCourses()); }
    catch (e: any) { showMsg(e?.response?.data?.error || e.message, 'error'); }
    finally { setCoursesLoading(false); }
  };

  const loadFiles = async () => {
    setFilesLoading(true);
    try { setFiles(await adminApi.getAllFiles()); }
    catch (e: any) { showMsg(e?.response?.data?.error || e.message, 'error'); }
    finally { setFilesLoading(false); }
  };

  useEffect(() => { if (tab === 'stats') loadStats(); }, [tab]);
  useEffect(() => { if (tab === 'users' || tab === 'applications') loadUsers(); }, [tab]);
  useEffect(() => { if (tab === 'courses') loadCourses(); }, [tab]);
  useEffect(() => { if (tab === 'files') loadFiles(); }, [tab]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const updated = await adminApi.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: updated.role } : u));
      showMsg('Role updated');
    } catch (e: any) { showMsg(e?.response?.data?.error || e.message, 'error'); }
  };

  const handleReview = async (userId: string, approve: boolean) => {
    try {
      await adminApi.reviewInstructorApplication(userId, approve, reviewNotes[userId] || '');
      showMsg(approve ? 'Application approved — user is now an instructor' : 'Application denied');
      await loadUsers();
    } catch (e: any) { showMsg(e?.response?.data?.error || e.message, 'error'); }
  };

  const handleTogglePublish = async (courseId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const updated = await adminApi.adminUpdateCourse(courseId, { status: newStatus });
      setCourses(prev => prev.map(c => c._id === courseId ? { ...c, status: updated.status } : c));
      showMsg(`Course ${newStatus}`);
    } catch (e: any) { showMsg(e?.response?.data?.error || e.message, 'error'); }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Permanently delete this course?')) return;
    try { await adminApi.adminDeleteCourse(courseId); setCourses(prev => prev.filter(c => c._id !== courseId)); showMsg('Course deleted'); }
    catch (e: any) { showMsg(e?.response?.data?.error || e.message, 'error'); }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    try { await adminApi.deleteFile(fileId); setFiles(prev => prev.filter(f => f._id !== fileId)); showMsg('File deleted'); }
    catch (e: any) { showMsg(e?.response?.data?.error || e.message, 'error'); }
  };

  if (!appUser) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="glass-card p-8 text-slate-400">Please log in.</div>
      </main>
    );
  }
  if (appUser.role !== 'admin') {
    return (
      <main className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="glass-card p-8 text-red-400">Access denied. Admin only.</div>
      </main>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'stats', label: 'Overview' },
    { id: 'users', label: `Users${users.length ? ` (${users.length})` : ''}` },
    { id: 'applications', label: `Applications${applications.length ? ` (${applications.length})` : ''}` },
    { id: 'courses', label: 'Courses' },
    { id: 'files', label: 'Files' },
  ];

  const thClass = 'px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left';
  const tdClass = 'px-4 py-3 text-sm text-slate-300';

  return (
    <main className="min-h-screen bg-[#0a0a1a] pt-8 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Admin Panel' }]} />

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-500 text-sm">Manage platform users, courses, and content</p>
          </div>
        </div>

        {/* Toast message */}
        {msg && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${msg.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
            {msg.text}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 p-1 glass-card w-fit overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                tab === t.id
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── STATS ── */}
        {tab === 'stats' && (
          <div>
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4,5].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard label="Total Users" value={stats.users?.total ?? '—'} sub={`${stats.users?.students} students · ${stats.users?.instructors} instructors`} gradient="from-purple-400 to-violet-600" />
                <StatCard label="Courses" value={stats.courses?.total ?? '—'} sub={`${stats.courses?.published} published`} gradient="from-cyan-400 to-blue-600" />
                <StatCard label="Enrollments" value={stats.enrollments ?? '—'} sub="total enrollments" gradient="from-emerald-400 to-teal-600" />
                <StatCard label="Applications" value={stats.pendingApplications ?? '—'} sub="pending review" gradient="from-yellow-400 to-orange-500" />
                <StatCard label="Files" value={stats.files?.count ?? '—'} sub={`${stats.files?.totalMB} MB used`} gradient="from-pink-400 to-rose-600" />
              </div>
            ) : (
              <button onClick={loadStats} className="btn-primary">Load Stats</button>
            )}
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-semibold">All Users ({users.length})</h2>
              <button onClick={loadUsers} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">↻ Refresh</button>
            </div>
            {usersLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/5">
                    <tr>
                      <th className={thClass}>User</th>
                      <th className={thClass}>Role</th>
                      <th className={thClass}>Subscription</th>
                      <th className={thClass}>Joined</th>
                      <th className={thClass}>Change Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u: any) => (
                      <tr key={u._id} className="hover:bg-white/3 transition-colors">
                        <td className={tdClass}>
                          <div className="text-white font-medium">{u.username || '(no name)'}</div>
                          <div className="text-slate-500 text-xs">{u.email}</div>
                        </td>
                        <td className={tdClass}><RoleBadge role={u.role} /></td>
                        <td className={tdClass}>
                          <span className={`tag-chip ${u.subscription?.status === 'active' ? '!bg-emerald-500/15 !border-emerald-500/30 !text-emerald-400' : ''}`}>
                            {u.subscription?.status || 'none'}
                          </span>
                        </td>
                        <td className={tdClass}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                        <td className={tdClass}>
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u._id, e.target.value)}
                            className="input-dark !py-1.5 text-xs !w-auto"
                          >
                            <option value="student">student</option>
                            <option value="instructor">instructor</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── APPLICATIONS ── */}
        {tab === 'applications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Pending Instructor Applications ({applications.length})</h2>
              <button onClick={loadUsers} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">↻ Refresh</button>
            </div>
            {applications.length === 0 ? (
              <div className="glass-card p-8 text-center text-slate-500">No pending applications.</div>
            ) : applications.map((u: any) => (
              <div key={u._id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-white font-semibold">{u.username || '(no name)'}</div>
                    <div className="text-slate-400 text-sm">{u.email}</div>
                    <div className="text-slate-600 text-xs mt-1">
                      Applied: {u.instructorApplicationDate ? new Date(u.instructorApplicationDate).toLocaleString() : '—'}
                    </div>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
                {u.profile?.bio && (
                  <p className="text-slate-400 text-sm mb-4 italic p-3 rounded-xl bg-white/3 border border-white/5">"{u.profile.bio}"</p>
                )}
                <div className="mb-4">
                  <label className="block text-slate-500 text-xs font-medium mb-2">Review notes (optional)</label>
                  <textarea
                    rows={2}
                    value={reviewNotes[u._id] || ''}
                    onChange={e => setReviewNotes(prev => ({ ...prev, [u._id]: e.target.value }))}
                    className="input-dark resize-none text-sm"
                    placeholder="Add notes for the applicant…"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleReview(u._id, true)} className="px-5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-colors">
                    Approve
                  </button>
                  <button onClick={() => handleReview(u._id, false)} className="px-5 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/25 transition-colors">
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── COURSES ── */}
        {tab === 'courses' && (
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-semibold">All Courses ({courses.length})</h2>
              <button onClick={loadCourses} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">↻ Refresh</button>
            </div>
            {coursesLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/5">
                    <tr>
                      <th className={thClass}>Course</th>
                      <th className={thClass}>Tier</th>
                      <th className={thClass}>Status</th>
                      <th className={thClass}>Created</th>
                      <th className={thClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {courses.map((c: any) => (
                      <tr key={c._id} className="hover:bg-white/3 transition-colors">
                        <td className={tdClass}>
                          <div className="text-white font-medium">{c.title}</div>
                          <div className="text-slate-500 text-xs">{(c.description || '').slice(0, 80)}</div>
                        </td>
                        <td className={tdClass}>
                          <span className={`tag-chip ${c.accessTier === 'premium' ? '!bg-yellow-500/15 !border-yellow-500/30 !text-yellow-400' : ''}`}>{c.accessTier}</span>
                        </td>
                        <td className={tdClass}>
                          <span className={`tag-chip ${c.status === 'published' ? '!bg-emerald-500/15 !border-emerald-500/30 !text-emerald-400' : ''}`}>{c.status}</span>
                        </td>
                        <td className={tdClass}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                        <td className={tdClass}>
                          <div className="flex gap-2">
                            <button onClick={() => handleTogglePublish(c._id, c.status)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${c.status === 'published' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}>
                              {c.status === 'published' ? 'Unpublish' : 'Publish'}
                            </button>
                            <button onClick={() => handleDeleteCourse(c._id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── FILES ── */}
        {tab === 'files' && (
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-semibold">Uploaded Files ({files.length})</h2>
              <button onClick={loadFiles} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">↻ Refresh</button>
            </div>
            {filesLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/5">
                    <tr>
                      <th className={thClass}>File</th>
                      <th className={thClass}>Uploader</th>
                      <th className={thClass}>Type</th>
                      <th className={thClass}>Size</th>
                      <th className={thClass}>Uploaded</th>
                      <th className={thClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {files.map((f: any) => (
                      <tr key={f._id} className="hover:bg-white/3 transition-colors">
                        <td className={tdClass}>
                          <a href={f.storageUrl} target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
                            {f.fileName}
                          </a>
                        </td>
                        <td className={tdClass}>{f.uploaderId?.username || f.uploaderId?.email || '—'}</td>
                        <td className={tdClass}><span className="text-xs text-slate-500">{f.mimeType}</span></td>
                        <td className={tdClass}>{(f.sizeInBytes / 1024).toFixed(1)} KB</td>
                        <td className={tdClass}>{f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '—'}</td>
                        <td className={tdClass}>
                          <button onClick={() => handleDeleteFile(f._id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
