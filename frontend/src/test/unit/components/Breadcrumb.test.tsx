import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { studentConfig } from '../../../config/roles/student';
import { developerConfig } from '../../../config/roles/developer';
import * as AuthContextModule from '../../../contexts/AuthContext';

describe('Breadcrumb Component', () => {
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
  });

  it('renders "Home > Module > Page" structure for a known navigation item', () => {
    render(
      <MemoryRouter initialEntries={['/app/student/projects']}>
        <Breadcrumb roleConfig={studentConfig} />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Courses & Assignments')).toBeInTheDocument();

    const currentPageItem = screen.getByText('Courses & Assignments').closest('li');
    expect(currentPageItem).toHaveAttribute('aria-current', 'page');
  });

  it('renders "Home > Module > Page" with Dashboard for root dashboard route', () => {
    render(
      <MemoryRouter initialEntries={['/app/student/dashboard']}>
        <Breadcrumb roleConfig={studentConfig} />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('formats unmapped sub-routes into title case', () => {
    render(
      <MemoryRouter initialEntries={['/app/student/study-plan']}>
        <Breadcrumb roleConfig={studentConfig} />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Study Plan')).toBeInTheDocument();
  });

  it('infers roleConfig automatically from user context and route when not passed as prop', () => {
    render(
      <MemoryRouter initialEntries={['/app/student/projects']}>
        <Breadcrumb />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Courses & Assignments')).toBeInTheDocument();
  });

  it('adapts to different role configurations such as developer', () => {
    render(
      <MemoryRouter initialEntries={['/app/developer/build-plan']}>
        <Breadcrumb roleConfig={developerConfig} />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Build Plan')).toBeInTheDocument();
  });

  it('renders links for Home and Module with correct href targets', () => {
    render(
      <MemoryRouter initialEntries={['/app/student/projects']}>
        <Breadcrumb roleConfig={studentConfig} />
      </MemoryRouter>
    );

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('href', '/app/student/dashboard');

    const moduleLink = screen.getByRole('link', { name: /student/i });
    expect(moduleLink).toHaveAttribute('href', '/app/student/dashboard');
  });

  it('applies custom className to navigation element', () => {
    render(
      <MemoryRouter initialEntries={['/app/student/dashboard']}>
        <Breadcrumb roleConfig={studentConfig} className="custom-breadcrumb-style" />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toHaveClass('custom-breadcrumb-style');
  });
});
