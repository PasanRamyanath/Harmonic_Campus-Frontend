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
  // stronger visual styling: larger, icon, close button, shadow and ring
  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-indigo-600';
  // accent kept for future use (border accent) — currently unused

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className={`flex items-center ${bg} text-white px-6 py-3 rounded-lg shadow-2xl ring-1 ring-black/20 max-w-md`} role="status" aria-live="polite">
        <div className="flex-shrink-0 mr-3">
          {type === 'success' && (
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
          {type === 'error' && (
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          )}
          {type === 'info' && (
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          )}
        </div>

        <div className="flex-1 text-left">
          <div className="text-base font-semibold leading-tight">{message}</div>
        </div>

        <button aria-label="Dismiss notification" onClick={onClose} className="ml-4 text-white opacity-90 hover:opacity-100">
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
