import { useState } from 'react';
import { signInWithEmail, signInWithGoogle } from '../firebaseClient';

export default function LoginModal({ onClose, onSuccess }: { onClose?: () => void; onSuccess?: (user: any) => void; }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { firebaseUser, appUser } = await signInWithEmail({ email, password });
      onSuccess?.({ firebaseUser, appUser });
      onClose?.();
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const { firebaseUser, appUser } = await signInWithGoogle();
      onSuccess?.({ firebaseUser, appUser });
      onClose?.();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Sign in</h3>
          <button onClick={() => onClose?.()} className="text-gray-500">✕</button>
        </div>

        {error && <div className="text-red-600 mb-2">{error}</div>}

        <div className="space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={handleGoogle} className="flex-1 px-4 py-2 bg-white border rounded shadow-sm hover:shadow-md">Continue with Google</button>
          </div>
          <div className="text-center text-sm text-gray-500">or sign in with email</div>

          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
          </div>

          <div className="flex items-center justify-between">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <button type="button" onClick={() => onClose?.()} className="text-gray-600">Cancel</button>
          </div>
        </form>
          </div>
      </div>
    </div>
  );
}
