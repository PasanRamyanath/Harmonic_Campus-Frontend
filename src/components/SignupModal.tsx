import { useState } from 'react';
import { signUpWithEmail, signUpWithGoogle } from '../firebaseClient';
import InterestsModal from './InterestsModal';

export default function SignupModal({ onClose }: { onClose?: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [createdUser, setCreatedUser] = useState<any | null>(null);
  const [showInterests, setShowInterests] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res: any = await signUpWithEmail({ name, email, password, role });
      const created: any = res?.userRecord || res?.appUser || res;
      setCreatedUser(created || null);
      setShowInterests(true);
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const res: any = await signUpWithGoogle();
      const created: any = res?.userRecord || res?.appUser || res;
      setCreatedUser(created || null);
      setShowInterests(true);
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Google signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Create an account</h3>
          <button onClick={() => onClose?.()} className="text-gray-500">✕</button>
        </div>

        {success ? (
          <div className="p-4 bg-green-50 rounded">Welcome! Your account was created.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button type="button" onClick={handleGoogle} className="flex-1 px-4 py-2 bg-white border rounded shadow-sm hover:shadow-md"> 
                Continue with Google
              </button>
            </div>
            {/* interests are collected after account creation via popup */}
            <div className="text-center text-sm text-gray-500">or sign up with email</div>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={role} onChange={e => setRole(e.target.value as any)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {error && <div className="text-red-600">{error}</div>}

            <div className="flex items-center justify-between">
              <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition">
                {loading ? 'Creating...' : 'Create account'}
              </button>
              <button type="button" onClick={() => onClose?.()} className="px-4 py-2 text-gray-600">Cancel</button>
            </div>
          </form>
            </div>
        )}
        {showInterests && createdUser && (
          <InterestsModal
            userId={createdUser._id || createdUser.id}
            existing={createdUser.profile?.interests || []}
            onClose={() => { setShowInterests(false); onClose?.(); }}
            onSaved={() => { setShowInterests(false); onClose?.(); }}
          />
        )}
      </div>
    </div>
  );
}
