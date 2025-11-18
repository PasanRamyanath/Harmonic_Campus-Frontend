import { useEffect, useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import { Link } from 'react-router-dom';
import * as enrollmentApi from '../api/enrollmentApi';
import * as courseApi from '../api/courseApi';
import { useAuth } from '../contexts/AuthContext';

const INSTRUMENT_OPTIONS = ['Guitar','Piano','Violin','Drums','Bass','Saxophone','Trumpet','Cello'];
const INTEREST_OPTIONS = ['Guitar','Piano','Vocals','Music Theory','Production','Drums','Violin','Bass'];

export default function StudentDashboard() {
  const { appUser, updateProfile } = useAuth();
  const [tab, setTab] = useState<'enrolled'|'profile'>('enrolled');

  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // profile fields
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [picUrl, setPicUrl] = useState('');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

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
        if (!mounted) return;
        setEnrolledCourses((courses || []).filter(Boolean));
      } catch (err) {
        console.warn('Failed to load enrollments', err);
        if (mounted) setEnrolledCourses([]);
      } finally {
        if (mounted) setLoadingEnrollments(false);
      }
    })();
    return () => { mounted = false; };
  }, [appUser]);

  const toggle = (val: string, setFn: (s: string[]) => void, arr: string[]) => {
    setFn(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleSaveProfile = async () => {
    if (!updateProfile) return;
    setSaving(true);
    try {
      await updateProfile({ username, profile: { bio, picUrl, instruments, interests } });
      setMsg('Saved');
    } catch (err:any) {
      setMsg(err?.message || 'Failed');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2000);
    }
  };

  if (!appUser) {
    return (
      <main className="pt-6 p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">Please log in to access student dashboard.</div>
      </main>
    );
  }

  return (
    <main className="pt-6 p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="md:col-span-1 bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Student</h2>
            <nav className="space-y-2">
              <button onClick={() => setTab('enrolled')} className={`w-full text-left px-3 py-2 rounded ${tab === 'enrolled' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`}>Enrolled Courses</button>
              <button onClick={() => setTab('profile')} className={`w-full text-left px-3 py-2 rounded ${tab === 'profile' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`}>Profile Settings</button>
            </nav>
          </aside>

          <section className="md:col-span-3">
            <div className="bg-white p-6 rounded shadow">
              <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Student Dashboard' }]} />
              {tab === 'enrolled' && (
                <div>
                  <h1 className="text-2xl font-bold mb-4">Your Enrolled Courses</h1>
                  {loadingEnrollments ? <div>Loading...</div> : (
                    <div className="space-y-4">
                      {enrolledCourses.length === 0 && <div>No enrolled courses yet.</div>}
                      {enrolledCourses.map((c:any) => (
                        <div key={c._id} className="border p-4 rounded flex items-start justify-between">
                          <div>
                            <div className="text-lg font-semibold">{c.title}</div>
                            <div className="text-sm text-gray-600">{c.description?.slice(0,160)}</div>
                            <div className="text-xs text-gray-500 mt-1">{c.accessTier} · {c.status}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Link to={`/courses/${c._id}`} className="text-sm text-blue-600">View</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'profile' && (
                <div>
                  <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium">Username</label>
                      <input className="mt-1 block w-full rounded border p-2" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Bio</label>
                      <textarea className="mt-1 block w-full rounded border p-2" rows={4} value={bio} onChange={e => setBio(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Profile picture URL</label>
                      <input className="mt-1 block w-full rounded border p-2" value={picUrl} onChange={e => setPicUrl(e.target.value)} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Instruments</label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {INSTRUMENT_OPTIONS.map(opt => (
                          <label key={opt} className="inline-flex items-center space-x-2 p-2 border rounded cursor-pointer">
                            <input type="checkbox" checked={instruments.includes(opt)} onChange={() => toggle(opt, setInstruments, instruments)} className="h-4 w-4" />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Interests</label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {INTEREST_OPTIONS.map(opt => (
                          <label key={opt} className="inline-flex items-center space-x-2 p-2 border rounded cursor-pointer">
                            <input type="checkbox" checked={interests.includes(opt)} onChange={() => toggle(opt, setInterests, interests)} className="h-4 w-4" />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {msg && <div className="text-green-600">{msg}</div>}

                    <div className="flex justify-end">
                      <button onClick={handleSaveProfile} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded">{saving ? 'Saving...' : 'Save changes'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
    </main>
  );
}
