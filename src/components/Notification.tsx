import { useEffect } from 'react';

type NotificationProps = {
  open: boolean;
  message?: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
};

export default function Notification({ open, message = '', type = 'info', onClose, duration = 3500 }: NotificationProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  const styles = {
    success: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    )},
    error: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )},
    info: { bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    )},
  };
  const s = styles[type];

  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in-up">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl max-w-sm ${s.bg}`}
        role="status"
        aria-live="polite"
      >
        <span className={s.text}>{s.icon}</span>
        <span className={`flex-1 text-sm font-medium ${s.text}`}>{message}</span>
        <button aria-label="Dismiss" onClick={onClose} className={`${s.text} opacity-60 hover:opacity-100 transition-opacity`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
