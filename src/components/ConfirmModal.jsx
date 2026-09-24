import { useState } from 'react';

export default function ConfirmModal({ title, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onCancel}
    >
      <div
        className="bg-bg-card border border-border rounded-lg p-5 w-full max-w-sm shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-text mb-3">{title}</h3>
        <textarea
          className="w-full bg-bg border border-border rounded px-2 py-1.5 text-xs text-text placeholder:text-text-dim resize-none focus:outline-none focus:border-cyan"
          rows={3}
          placeholder="Reason / note (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs text-text-dim hover:text-text cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="px-3 py-1 text-xs rounded bg-cyan/20 text-cyan hover:bg-cyan/30 cursor-pointer transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
