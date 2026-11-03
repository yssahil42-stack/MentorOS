import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileModal } from '../../../components/profile/ProfileModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useWorkspace } from '../../../contexts/WorkspaceContext';

vi.mock('../../../services/api', () => ({
  api: {
    patch: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../contexts/WorkspaceContext', () => ({
  useWorkspace: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ProfileModal Component', () => {
  const mockLogout = vi.fn().mockResolvedValue(undefined);
  const mockShowToast = vi.fn();
  const mockOnClose = vi.fn();

  const mockUser = {
    id: 42,
    email: 'alex@mentoros.edu',
    full_name: 'Alex Johnson',
    role: 'student' as const,
    created_at: '2026-09-01T10:00:00Z',
    profile_data: {
      program: 'MSc Artificial Intelligence',
      primary_goal: 'exam_prep',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
    (useWorkspace as any).mockReturnValue({
      showToast: mockShowToast,
    });
  });

  it('renders user profile details when open', () => {
    render(
      <MemoryRouter>
        <ProfileModal isOpen={true} onClose={mockOnClose} />
      </MemoryRouter>
    );

    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText('alex@mentoros.edu')).toBeInTheDocument();
    expect(screen.getByText('USR-42')).toBeInTheDocument();
    expect(screen.getByText('Active Session')).toBeInTheDocument();
    expect(screen.getByText(/MSc Artificial Intelligence/)).toBeInTheDocument();
    expect(screen.getByText(/exam prep/i)).toBeInTheDocument();
  });

  it('calls onClose when Done button is clicked', () => {
    render(
      <MemoryRouter>
        <ProfileModal isOpen={true} onClose={mockOnClose} />
      </MemoryRouter>
    );

    const doneBtn = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('navigates to settings and closes modal on Settings click', () => {
    render(
      <MemoryRouter>
        <ProfileModal isOpen={true} onClose={mockOnClose} />
      </MemoryRouter>
    );

    const settingsBtn = screen.getByRole('button', { name: /Settings/i });
    fireEvent.click(settingsBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/app/student/settings');
  });

  it('calls logout, displays toast, and closes modal on Sign Out click', async () => {
    render(
      <MemoryRouter>
        <ProfileModal isOpen={true} onClose={mockOnClose} />
      </MemoryRouter>
    );

    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('does not render when isOpen is false', () => {
    render(
      <MemoryRouter>
        <ProfileModal isOpen={false} onClose={mockOnClose} />
      </MemoryRouter>
    );

    expect(screen.queryByText('User Profile')).not.toBeInTheDocument();
  });

  it('renders module information and switches fields by module tab', async () => {
    render(
      <MemoryRouter initialEntries={['/app/student/dashboard']}>
        <ProfileModal isOpen={true} onClose={mockOnClose} />
      </MemoryRouter>
    );

    expect(screen.getByText('Module Profile Information')).toBeInTheDocument();
    expect(screen.getByText('University / Institution')).toBeInTheDocument();

    // Click Developer tab
    const devTab = screen.getByRole('button', { name: /Developer/i });
    fireEvent.click(devTab);
    expect(screen.getByText('Primary Tech Stack')).toBeInTheDocument();

    // Click Freelancer tab
    const freelancerTab = screen.getByRole('button', { name: /Freelancer/i });
    fireEvent.click(freelancerTab);
    expect(screen.getByText('Hourly Billing Rate')).toBeInTheDocument();

    // Click Job Seeker tab
    const jobTab = screen.getByRole('button', { name: /Job Seeker/i });
    fireEvent.click(jobTab);
    expect(screen.getByText('Target Job Title(s)')).toBeInTheDocument();

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /Save Job Seeker Information/i });
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('saved'), 'success');
    });
  });
});
