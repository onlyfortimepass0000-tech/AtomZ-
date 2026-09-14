import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, Sparkles, Check } from 'lucide-react';

const STORAGE_KEY = 'atomz_resize_help_seen';

export const HelpAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setShowHint(true);
      }
    } catch (err) {
      // fallback
    }
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    if (showHint) {
      setShowHint(false);
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch (err) {}
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  // Close on Escape or Click Outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      {/* "New here?" First-Time Hint Badge */}
      {showHint && !isOpen && (
        <div className="absolute -top-7 right-0 animate-bounce bg-orange-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-lg pointer-events-none flex items-center gap-1 z-30 whitespace-nowrap">
          <span>New here?</span>
        </div>
      )}

      {/* "How to use" Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        aria-label="How to use assistant"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-800 transition-colors shadow-sm"
      >
        <HelpCircle className="w-4 h-4 text-orange-400" />
        <span>How to use</span>
      </button>

      {/* Floating Assistant Popover */}
      {isOpen && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="How to use assistant"
          className="fixed sm:absolute right-4 sm:right-0 bottom-4 sm:bottom-auto sm:top-full mt-2 w-[calc(100vw-32px)] sm:w-80 p-5 bg-gray-900/95 border border-gray-700/80 rounded-2xl shadow-2xl backdrop-blur-xl z-50 text-left text-gray-200 animate-fadeIn space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xs font-bold">
                ?
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">How to use</h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-300 font-medium leading-relaxed">
            Turn one creative into every size you need.
          </p>

          {/* 3 Short Steps */}
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] shrink-0 border border-orange-500/30">
                1
              </span>
              <div>
                <span className="font-bold text-white block">Upload</span>
                <span className="text-gray-400 text-[11px]">Choose your original image.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] shrink-0 border border-orange-500/30">
                2
              </span>
              <div>
                <span className="font-bold text-white block">Choose sizes</span>
                <span className="text-gray-400 text-[11px]">Pick the platforms you want.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] shrink-0 border border-orange-500/30">
                3
              </span>
              <div>
                <span className="font-bold text-white block">Download</span>
                <span className="text-gray-400 text-[11px]">Adjust the image once, then export everything.</span>
              </div>
            </div>
          </div>

          {/* Tip Callout */}
          <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-[11px] text-orange-300">
            <strong>Tip:</strong> Use the preview to make sure important text or faces stay visible.
          </div>

          {/* "Got it" Action Button */}
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Got it</span>
          </button>
        </div>
      )}
    </div>
  );
};
