// React import not required with new JSX transform

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
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl bg-white rounded shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Continue your courses</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-600 hover:text-gray-900">✕</button>
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
          {items.length === 0 && <div className="text-sm text-gray-600">No in-progress courses to continue.</div>}
          {items.map((it, idx) => (
            <div key={it.course._id || idx} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{it.course.title}</div>
                <div className="text-sm text-gray-600">{it.completedCount} of {it.totalLessons} lessons completed</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { onClose(); window.location.href = `/student/courses/${it.course._id}`; }} className="px-3 py-2 bg-purple-600 text-white rounded">Continue</button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t flex justify-end">
          <button onClick={onClose} className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">Close</button>
        </div>
      </div>
    </div>
  );
}
