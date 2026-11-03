import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal, ConfirmDialog } from '../../../components/ui/Modal';

describe('components/Modal', () => {
  let mainElement: HTMLElement;

  beforeEach(() => {
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

  it('does not render modal when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Closed Modal">
        <p>Modal Content</p>
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('renders modal with title, description, and content when isOpen is true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Edit Application"
        description="Modify application metadata"
      >
        <p>Application Form Fields</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Edit Application')).toBeInTheDocument();
    expect(screen.getByText('Modify application metadata')).toBeInTheDocument();
    expect(screen.getByText('Application Form Fields')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Closeable Modal">
        <p>Content</p>
      </Modal>
    );

    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Escape Modal">
        <p>Content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom footer when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Footer Modal"
        footer={<button type="button">Save Changes</button>}
      >
        <p>Content</p>
      </Modal>
    );

    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });

  describe('ConfirmDialog', () => {
    it('renders confirm and cancel buttons with custom labels', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Repository"
          message="Are you sure you want to delete this repository?"
          confirmLabel="Yes, Delete"
          cancelLabel="No, Keep"
          variant="danger"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );

      expect(screen.getByText('Delete Repository')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to delete this repository?')
      ).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: 'Yes, Delete' });
      const cancelBtn = screen.getByRole('button', { name: 'No, Keep' });

      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalledTimes(1);

      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
