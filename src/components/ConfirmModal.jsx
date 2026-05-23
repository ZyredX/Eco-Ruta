import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPortalTarget(document.fullscreenElement || document.body);
    }
  }, [isOpen]);

  if (!isOpen || !portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-sm glass-panel bg-[#2a1f18] border-white/10 p-6 shadow-2xl relative overflow-hidden"
        >
          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <AlertTriangle size={32} />
            </div>
            
            <div>
              <h3 className="text-xl font-black text-white">{title}</h3>
              <p className="text-sm text-gray-400 font-medium mt-2">{message}</p>
            </div>
            
            <div className="flex gap-3 w-full mt-4">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase rounded-xl transition-colors border border-white/10"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase rounded-xl transition-colors shadow-lg shadow-red-500/20"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    portalTarget
  );
}
