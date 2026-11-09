import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PortfolioGeneratorPage from '../../../pages/developer/PortfolioGeneratorPage';

// Mock WorkspaceContext
vi.mock('../../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    showToast: vi.fn(),
  }),
}));

describe('PortfolioGeneratorPage', () => {
  it('renders page header, input forms, and markdown preview tabs', () => {
    render(
      <MemoryRouter>
        <PortfolioGeneratorPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /AI Portfolio & README Generator/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Project Specification')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Build Portfolio/i })).toBeInTheDocument();

    // Verify Tab buttons
    expect(screen.getByRole('button', { name: /README\.md/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Portfolio Case Study/i })).toBeInTheDocument();

    // Verify Export buttons
    expect(screen.getByRole('button', { name: /^MD$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^PDF$/ })).toBeInTheDocument();
  });

  it('switches between README and Case Study tabs', () => {
    render(
      <MemoryRouter>
        <PortfolioGeneratorPage />
      </MemoryRouter>
    );

    const caseStudyTab = screen.getByRole('button', { name: /Portfolio Case Study/i });
    fireEvent.click(caseStudyTab);

    expect(screen.getByTestId('formatted-markdown-preview')).toHaveTextContent(/Case Study:/i);

    const readmeTab = screen.getByRole('button', { name: /README\.md/i });
    fireEvent.click(readmeTab);

    expect(screen.getByTestId('formatted-markdown-preview')).toHaveTextContent(
      /# MentorOS Productivity Engine/i
    );
  });

  it('toggles view mode between formatted and raw markdown', () => {
    render(
      <MemoryRouter>
        <PortfolioGeneratorPage />
      </MemoryRouter>
    );

    const rawButton = screen.getByRole('button', { name: /Raw MD/i });
    fireEvent.click(rawButton);

    const textarea = screen.getByTestId('raw-markdown-textarea') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toContain('# MentorOS Productivity Engine');
  });

  it('allows loading preset sample project', () => {
    render(
      <MemoryRouter>
        <PortfolioGeneratorPage />
      </MemoryRouter>
    );

    const loadEcommerceBtn = screen.getByRole('button', { name: /Load E-Commerce Sample/i });
    fireEvent.click(loadEcommerceBtn);

    expect(screen.getByDisplayValue('Nordic Storefront Modernization')).toBeInTheDocument();
  });
});
