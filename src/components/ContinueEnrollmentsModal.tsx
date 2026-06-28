type Item = {
  course: any;
  enrollment: any;
  nextLessonId?: string | null;
  completedCount: number;
  totalLessons: number;
};

export default function ContinueEnrollmentsModal({ open, items, onClose }: { open: boolean; items: Item[]; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass-card overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/30 to-cyan-500/20 border border-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold">Continue your courses</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-auto">
          {items.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No in-progress courses to continue.</p>
          )}
          {items.map((it, idx) => {
            const pct = it.totalLessons > 0 ? Math.round((it.completedCount / it.totalLessons) * 100) : 0;
            return (
              <div key={it.course._id || idx} className="glass-card p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{it.course.title}</div>
                  <div className="text-slate-500 text-xs mt-1">{it.completedCount} of {it.totalLessons} lessons completed</div>
                  <div className="mt-2">
                    <div className="progress-bar !h-1.5">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { onClose(); window.location.href = `/student/courses/${it.course._id}`; }}
                  className="btn-primary text-sm !py-2 !px-4 shrink-0"
                >
                  Continue
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex justify-end">
          <button onClick={onClose} className="btn-ghost text-sm !py-2 !px-5">Close</button>
        </div>
      </div>
    </div>
  );
}
