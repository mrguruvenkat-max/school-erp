import React, { useEffect, useRef } from 'react';

export default function LogoutConfirmModal({ onConfirm, onCancel }) {
  const modalRef = useRef(null);

  useEffect(() => {
    // ESC key closes the modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleOverlayClick = (e) => {
    // If clicking outside the main modal container
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onCancel();
    }
  };

  return (
    <div 
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 animate-fade-in"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-left text-xs font-semibold text-slate-700 animate-scale-up"
      >
        {/* Header */}
        <div className="bg-[#004D20] text-white p-4 border-b-2 border-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
          <span className="text-base">🚪</span>
          <span>Sign Out</span>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-slate-600 text-sm font-semibold leading-relaxed">
            Are you sure you want to sign out of your AP Government School ERP account?
          </p>
          <p className="text-amber-700 font-bold bg-amber-50 border border-amber-100 p-3 rounded-lg leading-normal">
            ⚠ Any unsaved changes may be lost.
          </p>
        </div>

        {/* Buttons */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold cursor-pointer transition text-center text-xs"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg font-bold cursor-pointer transition text-center text-xs"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
