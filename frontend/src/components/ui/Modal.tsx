import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import {
  ModalSize,
  modalSizes,
  modalDialogVariants,
  modalOverlayVariants,
  modalBackdropVariants,
  confirmButtonVariant,
} from '../../utils/modalVariants';

export * from '../../utils/modalVariants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // ─── Focus trap ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Move focus to close button on open
    requestAnimationFrame(() => closeBtnRef.current?.focus());

    const trap = (e: KeyboardEvent) => {
      if (!dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [isOpen, onClose]);

  // ─── Body scroll lock & a11y backdrop aria-hidden ─────────────
  useEffect(() => {
    const main = document.getElementById('main-content') ?? document.querySelector('main');
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      main?.setAttribute('aria-hidden', 'true');
    } else {
      document.body.style.overflow = '';
      main?.removeAttribute('aria-hidden');
    }
    return () => {
      document.body.style.overflow = '';
      main?.removeAttribute('aria-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={modalOverlayVariants({ size })}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-desc' : undefined}
    >
      {/* Backdrop */}
      <div
        className={modalBackdropVariants}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div ref={dialogRef} className={modalDialogVariants({ size })}>
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-6 pb-4 border-b border-border-subtle">
            <div>
              {title && (
                <h2 id="modal-title" className="text-base font-semibold text-text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-desc" className="text-sm text-text-muted mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              className="shrink-0 ml-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Body */}
        <div
          className={cn(
            'flex-1 overflow-y-auto',
            size === 'fullscreen' ? 'p-4 sm:p-6 md:p-8 flex flex-col min-h-0' : 'p-6'
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border-subtle p-4 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-text-secondary">{message}</p>
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={confirmButtonVariant(destructive)}
          size="sm"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
