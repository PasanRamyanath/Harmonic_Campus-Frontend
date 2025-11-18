import { useState } from 'react';

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  courseTitle?: string;
  requirePassword?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  // onConfirm receives optional password when modal includes password field
  onConfirm: (password?: string) => void;
  onCancel: () => void;
};

export default function ConfirmModal({ open, title = 'Confirm', message = '', courseTitle, requirePassword = false, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }: ConfirmModalProps) {
  const [password, setPassword] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded shadow-lg overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-4">
          {courseTitle && <div className="text-sm text-gray-800 font-medium mb-2">{courseTitle}</div>}
          <p className="text-sm text-gray-700">{message}</p>

          {requirePassword && (
            <div className="mt-4">
              <label className="block text-xs text-gray-600 mb-1">Enter your password to confirm</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Your account password"
              />
            </div>
          )}
        </div>
        <div className="p-3 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">{cancelLabel}</button>
          <button onClick={() => onConfirm(requirePassword ? password : undefined)} className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
