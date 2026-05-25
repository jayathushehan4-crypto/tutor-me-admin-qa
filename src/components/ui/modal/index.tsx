"use client";

import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils"; // if you already use cn()

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  overlayClassName?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
  ariaLabel?: string; // better accessibility
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  overlayClassName,
  showCloseButton = true,
  isFullscreen = false,
  ariaLabel = "Modal dialog",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const contentClasses = cn(
    "relative bg-white dark:bg-gray-900 transition-all duration-200",
    isFullscreen ? "w-full" : "w-full max-w-2xl rounded-3xl shadow-xl",
    className,
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-[900000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {!isFullscreen && (
        <div
          className={cn(
            "fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]",
            overlayClassName,
          )}
          onClick={onClose}
        />
      )}
      <div
        ref={modalRef}
        className={contentClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="z-10 absolute right-3 top-3 flex h-7.5 w-7.5 items-center justify-center rounded-full  text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            ✕
          </button>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );

  // Use portal so modal is always on top
  return createPortal(modalContent, document.body);
};
