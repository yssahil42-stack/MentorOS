import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ClientPortalPage from '../../../pages/freelancer/ClientPortalPage';

describe('ClientPortalPage — SEO Meta Robots', () => {
  let robotsMeta: HTMLMetaElement;

  beforeEach(() => {
    robotsMeta = document.createElement('meta');
    robotsMeta.setAttribute('name', 'robots');
    robotsMeta.setAttribute('content', 'index, follow');
    document.head.appendChild(robotsMeta);
  });

  afterEach(() => {
    robotsMeta.remove();
  });

  it('sets robots meta to "noindex, nofollow" when in public view', () => {
    render(
      <MemoryRouter initialEntries={['/client/1?token=public-1']}>
        <Routes>
          <Route path="/client/:projectId" element={<ClientPortalPage />} />
        </Routes>
      </MemoryRouter>
    );

    const meta = document.querySelector('meta[name="robots"]');
    expect(meta?.getAttribute('content')).toBe('noindex, nofollow');
  });

  it('keeps robots meta default when not in public view', () => {
    render(
      <MemoryRouter initialEntries={['/client/1']}>
        <Routes>
          <Route path="/client/:projectId" element={<ClientPortalPage />} />
        </Routes>
      </MemoryRouter>
    );

    const meta = document.querySelector('meta[name="robots"]');
    expect(meta?.getAttribute('content')).toBe('index, follow');
  });
});
