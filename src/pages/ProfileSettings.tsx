import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SignupModal from '../components/SignupModal';
import LoginModal from '../components/LoginModal';
import { useAuth } from '../contexts/AuthContext';

const INTEREST_OPTIONS = ['Guitar','Piano','Vocals','Music Theory','Production','Drums','Violin','Bass'];
const INSTRUMENT_OPTIONS = ['Guitar','Piano','Violin','Drums','Bass','Saxophone','Trumpet','Cello'];

export default function ProfileSettings() {
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const { appUser, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [picUrl, setPicUrl] = useState('');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    if (appUser) {
      setUsername(appUser.username || '');
      setBio(appUser.profile?.bio || '');
      setPicUrl(appUser.profile?.picUrl || '');
      setInstruments(appUser.profile?.instruments || []);
      setInterests(appUser.profile?.interests || []);
    }
  }, [appUser]);

  const toggle = (val: string, setFn: (s: string[]) => void, arr: string[]) => {
    setFn(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const updates = {
        username: username || '',
        profile: {
          bio: bio || '',
          picUrl: picUrl || '',
          instruments: instruments || [],
          interests: interests || []
        }
      };
      if (!updateProfile) throw new Error('updateProfile not available');
      await updateProfile(updates);
      setSuccess('Profile saved');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to save');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar onOpenSignup={() => setShowSignup(true)} onOpenLogin={() => setShowLogin(true)} />
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <main className="pt-20">
        {!appUser ? (
          <section id="profile" className="p-8">
            <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">Please login to view profile settings.</div>
          </section>
        ) : (
          <section id="profile" className="p-8">
            <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
              <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>

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

                {error && <div className="text-red-600">{error}</div>}
                {success && <div className="text-green-600">{success}</div>}

                <div className="flex justify-end">
                  <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
