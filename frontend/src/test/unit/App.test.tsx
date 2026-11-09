import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from '../../App';

describe('App Root Component', () => {
  it('renders without throwing runtime router or context exceptions', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});
