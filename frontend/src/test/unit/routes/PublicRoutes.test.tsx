import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PublicTemplatePage from '../../../pages/public/PublicTemplatePage';
import DeveloperPortfolioPage from '../../../pages/public/DeveloperPortfolioPage';
import PublicCaseStudyPage from '../../../pages/public/PublicCaseStudyPage';

describe('Public Sharing Routes & SEO Pages', () => {
  afterEach(() => {
    cleanup();
  });

  describe('/templates/:id', () => {
    it('renders template details for react-saas-starter', () => {
      render(
        <MemoryRouter initialEntries={['/templates/react-saas-starter']}>
          <Routes>
            <Route path="/templates/:id" element={<PublicTemplatePage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(
        screen.getByRole('heading', { name: /Full-Stack React & AI SaaS Starter Plan/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Phase 1: Project Scaffold & Infrastructure/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Share/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Import Template/i })).toBeInTheDocument();

      // Check document title updated
      expect(document.title).toContain('Full-Stack React & AI SaaS Starter Plan');
    });

    it('renders fallback dynamic template for custom id', () => {
      render(
        <MemoryRouter initialEntries={['/templates/custom-mobile-app']}>
          <Routes>
            <Route path="/templates/:id" element={<PublicTemplatePage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(
        screen.getByRole('heading', { name: /Custom Mobile App Workflow Template/i })
      ).toBeInTheDocument();
    });
  });

  describe('/portfolio/:username', () => {
    it('renders developer portfolio view with projects and verification', () => {
      render(
        <MemoryRouter initialEntries={['/portfolio/alex-engineer']}>
          <Routes>
            <Route path="/portfolio/:username" element={<DeveloperPortfolioPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Alex Engineer')).toBeInTheDocument();
      expect(screen.getByText('@alex-engineer')).toBeInTheDocument();
      expect(screen.getByText('MentorOS Productivity Engine')).toBeInTheDocument();
      expect(screen.getByText(/Verified Portfolio/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Share Portfolio/i })).toBeInTheDocument();

      expect(document.title).toContain("Alex Engineer's Developer Portfolio");
    });
  });

  describe('/case-study/:id', () => {
    it('renders case study with challenge, solution, and metrics', () => {
      render(
        <MemoryRouter initialEntries={['/case-study/ecommerce-redesign']}>
          <Routes>
            <Route path="/case-study/:id" element={<PublicCaseStudyPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(
        screen.getByRole('heading', { name: /High-Volume E-Commerce Platform Modernization/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Client:\s*Nordic Apparel Co\./i)).toBeInTheDocument();
      expect(screen.getByText('+42%')).toBeInTheDocument();
      expect(screen.getByText('The Challenge')).toBeInTheDocument();
      expect(screen.getByText('The Solution')).toBeInTheDocument();

      expect(document.title).toContain('High-Volume E-Commerce Platform Modernization');
    });
  });
});
