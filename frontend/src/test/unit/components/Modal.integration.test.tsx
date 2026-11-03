import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal, ConfirmDialog } from '../../../components/ui/Modal';

describe('Modal Integration Tests', () => {
  let mainElement: HTMLElement;

  beforeEach(() => {
    // Setup a main content element to verify aria-hidden behavior
    mainElement = document.createElement('main');
    mainElement.id = 'main-content';
    document.body.appendChild(mainElement);
    document.body.style.overflow = '';
  });

  afterEach(() => {
    if (mainElement && mainElement.parentNode) {
      mainElement.parentNode.removeChild(mainElement);
    }
    document.body.style.overflow = '';
  });

  describe('Portal & Visibility Lifecycle', () => {
    it('does not render anything in DOM when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          <p>Hidden Content</p>
        </Modal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe('');
      expect(mainElement.getAttribute('aria-hidden')).toBeNull();
    });

    it('renders dialog in document.body with proper ARIA attributes when isOpen is true', () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          title="Profile Settings"
          description="Update your personal preferences"
        >
          <p>Dialog Body Content</p>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-desc');

      expect(screen.getByText('Profile Settings')).toHaveAttribute('id', 'modal-title');
      expect(screen.getByText('Update your personal preferences')).toHaveAttribute(
        'id',
        'modal-desc'
      );
      expect(screen.getByText('Dialog Body Content')).toBeInTheDocument();
    });

    it('locks body scroll and hides background main content while open, then restores on unmount', () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Scroll Lock Test">
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
      expect(mainElement.getAttribute('aria-hidden')).toBe('true');

      unmount();

      expect(document.body.style.overflow).toBe('');
      expect(mainElement.getAttribute('aria-hidden')).toBeNull();
    });
  });

  describe('Closing & Event Interactions', () => {
    it('calls onClose when clicking close X button', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Close Button Test">
          <div>Body</div>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      fireEvent.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking the backdrop overlay by default', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Backdrop Test">
          <div>Body</div>
        </Modal>
      );

      const backdrop = document.querySelector('.bg-black\\/60');
      expect(backdrop).toBeInTheDocument();
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when closeOnBackdrop is false and backdrop is clicked', () => {
      const handleClose = vi.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          closeOnBackdrop={false}
          title="No Backdrop Close"
        >
          <div>Body</div>
        </Modal>
      );

      const backdrop = document.querySelector('.bg-black\\/60');
      expect(backdrop).toBeInTheDocument();
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Escape Test">
          <div>Body</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Focus Trap Integration', () => {
    it('cycles focus within modal elements on Tab key press', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Focus Trap Modal">
          <input data-testid="input-first" />
          <input data-testid="input-second" />
        </Modal>
      );

      const closeBtn = screen.getByRole('button', { name: /close dialog/i });
      const firstInput = screen.getByTestId('input-first');
      const secondInput = screen.getByTestId('input-second');

      // Focus last element and press Tab -> should wrap to first element (closeBtn)
      secondInput.focus();
      expect(document.activeElement).toBe(secondInput);

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(closeBtn);

      // Focus first element and press Shift+Tab -> should wrap to last element (secondInput)
      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(secondInput);
    });
  });

  describe('Modal Sizing & Footer Rendering', () => {
    it('renders custom footer with action buttons', () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          title="Footer Modal"
          footer={<button data-testid="custom-footer-btn">Save Changes</button>}
        >
          <div>Main Modal Content</div>
        </Modal>
      );

      expect(screen.getByTestId('custom-footer-btn')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('applies fullscreen classes when size="fullscreen"', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} size="fullscreen" title="Fullscreen Modal">
          <div>Fullscreen content</div>
        </Modal>
      );

      const dialogWrapper = screen.getByRole('dialog');
      expect(dialogWrapper).toHaveClass('p-0');

      const innerDialog = dialogWrapper.children[1] as HTMLElement;
      expect(innerDialog).toBeInTheDocument();
      expect(innerDialog).toHaveClass('w-full', 'h-full', 'max-w-none', 'max-h-none');
    });
  });

  describe('ConfirmDialog Integration', () => {
    it('renders confirmation title, message, cancel and confirm buttons', () => {
      const handleClose = vi.fn();
      const handleConfirm = vi.fn();

      render(
        <ConfirmDialog
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title="Delete Workspace"
          message="Are you sure you want to delete this workspace forever?"
          confirmLabel="Yes, Delete"
          cancelLabel="No, Keep"
          destructive={true}
        />
      );

      expect(screen.getByRole('heading', { name: /delete workspace/i })).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to delete this workspace forever/i)
      ).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /no, keep/i });
      const confirmBtn = screen.getByRole('button', { name: /yes, delete/i });

      expect(cancelBtn).toBeInTheDocument();
      expect(confirmBtn).toBeInTheDocument();

      // Cancel button triggers onClose
      fireEvent.click(cancelBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Confirm button triggers onConfirm
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('disables cancel button and shows loading state on confirm button when loading is true', () => {
      const handleClose = vi.fn();
      const handleConfirm = vi.fn();

      render(
        <ConfirmDialog
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title="Processing Action"
          message="Please wait while we update your resources"
          loading={true}
        />
      );

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      expect(cancelBtn).toBeDisabled();

      const confirmBtn = screen.getByRole('button', { name: /confirm/i });
      expect(confirmBtn).toBeDisabled();
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });
  });
});
