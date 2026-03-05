import React from "react";

export default function NotificationModal({ open, data, onClose }) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-50 bg-black border border-white/20 rounded-xl w-full max-w-xl p-6">
        <h2 className="text-xl font-bold text-white">{data.title}</h2>

        <p className="text-sm text-gray-400 mt-2">
          {new Date(data.createdAt).toLocaleString()}
        </p>

        <p className="text-white mt-4">{data.message}</p>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}