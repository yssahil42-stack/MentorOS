import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuickCaptureFab } from '../../../components/quickCapture/QuickCaptureFab';
import * as apiClient from '../../../services/apiClient';

const mockAuthState = {
  user: { id: 1, full_name: 'Alex Morgan', role: 'job_seeker' } as any,
  isAuthenticated: true,
};

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// Mock WorkspaceContext
vi.mock('../../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    showToast: vi.fn(),
  }),
}));

describe('QuickCaptureFab', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(apiClient.tasksApi, 'get').mockResolvedValue([
      {
        id: 101,
        user_id: 1,
        role: 'job_seeker',
        title: 'Review target job requirements for Data Analyst',
        status: 'todo',
        priority: 'high',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as any);

    vi.spyOn(apiClient.tasksApi, 'create').mockImplementation((data: any) =>
      Promise.resolve({
        id: 102,
        user_id: 1,
        ...data,
        status: data.status || 'todo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    );

    vi.spyOn(apiClient.tasksApi, 'update').mockImplementation((id: any, data: any) =>
      Promise.resolve({
        id,
        user_id: 1,
        role: 'job_seeker',
        title: 'Review target job requirements for Data Analyst',
        status: data.status,
        priority: 'high',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    );
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <QuickCaptureFab />
      </MemoryRouter>
    );

  it('does not render if user is not signed in', () => {
    mockAuthState.user = null;
    mockAuthState.isAuthenticated = false;

    renderComponent();

    expect(
      screen.queryByRole('button', { name: /Open quick task manager/i })
    ).not.toBeInTheDocument();

    mockAuthState.user = { id: 1, full_name: 'Alex Morgan', role: 'job_seeker' };
    mockAuthState.isAuthenticated = true;
  });

  it('renders the floating action button and opens quick tasks dialog on click', () => {
    renderComponent();

    const fabButton = screen.getByRole('button', { name: /Open quick task manager/i });
    expect(fabButton).toBeInTheDocument();

    // Click FAB button
    fireEvent.click(fabButton);

    // Should open Quick Task Manager, NOT redirect to AI
    expect(screen.getByText('Quick Task Manager')).toBeInTheDocument();
    expect(
      screen.getByText('Direct task actions without AI redirection')
    ).toBeInTheDocument();
  });

  it('allows adding a specific task directly without AI redirection', async () => {
    renderComponent();

    const fabButton = screen.getByRole('button', { name: /Open quick task manager/i });
    fireEvent.click(fabButton);

    const taskInput = screen.getByPlaceholderText('Enter specific task title...');
    fireEvent.change(taskInput, {
      target: { value: 'Follow up on Stripe frontend application' },
    });

    const form = taskInput.closest('form');
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(
        screen.getByText('Follow up on Stripe frontend application')
      ).toBeInTheDocument();
    });
  });

  it('displays 1-click suggested career tasks and adds them on click', async () => {
    renderComponent();

    const fabButton = screen.getByRole('button', { name: /Open quick task manager/i });
    fireEvent.click(fabButton);

    expect(screen.getByText('Suggested Career Tasks:')).toBeInTheDocument();

    const suggestionBtn = screen.getByText('Tailor resume for target job description');
    fireEvent.click(suggestionBtn);

    await waitFor(() => {
      expect(apiClient.tasksApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Tailor resume for target job description',
          priority: 'high',
        })
      );
    });
  });

  it('displays active tasks checklist and allows toggling completion', async () => {
    renderComponent();

    const fabButton = screen.getByRole('button', { name: /Open quick task manager/i });
    fireEvent.click(fabButton);

    expect(
      screen.getByText('Review target job requirements for Data Analyst')
    ).toBeInTheDocument();

    const toggleBtn = screen.getAllByTitle('Mark as done')[0];
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(apiClient.tasksApi.update).toHaveBeenCalledWith(1001, {
        status: 'completed',
      });
    });
  });
});
