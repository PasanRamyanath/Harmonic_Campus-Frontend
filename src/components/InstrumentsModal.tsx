import { useState } from 'react';
import { updateUserRecord } from '../api/authApi';

export default function InstrumentsModal({ userId, existing = [], onClose, onSaved }:
  { userId: string; existing?: string[]; onClose?: () => void; onSaved?: (user: any) => void }) {
  const [instruments, setInstruments] = useState<string[]>(existing || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instrumentOptions = ['Guitar','Piano','Vocals','Drums','Violin','Bass','Saxophone','Flute','Trumpet','Cello'];

  const toggleInstrument = (val: string) => {
    setInstruments(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!userId || !/^[0-9a-fA-F]{24}$/.test(String(userId))) {
        throw new Error('Invalid user id; cannot save instruments');
      }
      const updated = await updateUserRecord(userId, { profile: { instruments } });
      setLoading(false);
      onSaved?.(updated);
      onClose?.();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to save instruments';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Which instruments do you play?</h3>
          <button onClick={() => onClose?.()} className="text-gray-500">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {instrumentOptions.map(opt => (
            <label key={opt} className="inline-flex items-center space-x-2 p-2 border rounded cursor-pointer">
              <input type="checkbox" checked={instruments.includes(opt)} onChange={() => toggleInstrument(opt)} className="h-4 w-4" />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>

        {error && <div className="text-red-600 mb-2">{error}</div>}

        <div className="flex justify-end gap-3">
          <button onClick={() => onClose?.()} className="px-4 py-2 text-gray-600">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded-full">{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
