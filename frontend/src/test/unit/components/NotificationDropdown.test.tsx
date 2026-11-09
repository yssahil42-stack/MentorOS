import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationDropdown } from '../../../components/layout/NotificationDropdown';
import * as AuthContextModule from '../../../contexts/AuthContext';

describe('NotificationDropdown Component', () => {
  beforeEach(() => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 1,
        email: 'student@example.com',
        name: 'Alex Student',
        role: 'student',
      },
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });
    localStorage.clear();
  });

  it('renders the bell button with unread indicator', () => {
    render(
      <MemoryRouter>
        <NotificationDropdown />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /view notifications/i });
    expect(button).toBeInTheDocument();
  });

  it('opens notification panel on click and displays notifications', () => {
    render(
      <MemoryRouter>
        <NotificationDropdown />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /view notifications/i });
    fireEvent.click(button);

    expect(screen.getByRole('dialog', { name: /notifications panel/i })).toBeInTheDocument();
    expect(screen.getByText('Milestone Review Upcoming')).toBeInTheDocument();
  });

  it('marks all notifications as read when clicking "Mark all read"', () => {
    render(
      <MemoryRouter>
        <NotificationDropdown />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /view notifications/i });
    fireEvent.click(button);

    const markAllBtn = screen.getByTitle('Mark all as read');
    fireEvent.click(markAllBtn);

    expect(screen.queryByText(/new/i)).not.toBeInTheDocument();
  });

  it('clears all notifications when clicking clear all', () => {
    render(
      <MemoryRouter>
        <NotificationDropdown />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /view notifications/i });
    fireEvent.click(button);

    const clearBtn = screen.getByTitle('Clear all notifications');
    fireEvent.click(clearBtn);

    expect(screen.getByText(/you're all caught up!/i)).toBeInTheDocument();
  });
});
