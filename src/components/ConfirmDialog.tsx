'use client';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Delete',
  onConfirm, onCancel, loading = false,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet */}
      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden slide-up">
        {/* Red top bar */}
        <div className="h-1 bg-red-700" />

        <div className="px-5 pt-5 pb-4">
          {/* Icon */}
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-red-600">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </div>

          <h3 className="font-bold text-gray-900 text-base mb-1">{title}</h3>
          <p className="text-sm text-gray-500 leading-snug">{message}</p>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 active:scale-95 transition-transform disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-red-700 text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
