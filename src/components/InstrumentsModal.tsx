import { useState } from 'react';
import { updateUserRecord } from '../api/authApi';

export default function InstrumentsModal({ userId, existing = [], onClose, onSaved }:
  { userId: string; existing?: string[]; onClose?: () => void; onSaved?: (user: any) => void }) {
  const [instruments, setInstruments] = useState<string[]>(existing || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instrumentOptions = ['Guitar', 'Piano', 'Vocals', 'Drums', 'Violin', 'Bass', 'Saxophone', 'Flute', 'Trumpet', 'Cello'];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md mx-4 p-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Instruments You Play</h3>
            <p className="text-sm text-slate-400 mt-0.5">Select all that apply — we'll personalize your experience</p>
          </div>
          <button
            onClick={() => onClose?.()}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instrument chips */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {instrumentOptions.map(opt => {
            const selected = instruments.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggleInstrument(opt)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 text-left ${
                  selected
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                  selected ? 'bg-cyan-500 border-cyan-400' : 'border-white/20'
                }`}>
                  {selected && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {instruments.length > 0 && (
          <p className="text-xs text-cyan-400 mb-4">{instruments.length} instrument{instruments.length > 1 ? 's' : ''} selected</p>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => onClose?.()} className="btn-ghost flex-1 !py-2.5">Skip</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 !py-2.5 disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : 'Save & Finish'}
          </button>
        </div>
      </div>
    </div>
  );
}
