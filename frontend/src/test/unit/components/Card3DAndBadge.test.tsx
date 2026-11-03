import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Card3D, cardVariants } from '../../../components/ui/Card3D';
import { Badge, badgeVariants } from '../../../components/ui/Badge';

describe('Card3D and cardVariants utility', () => {
  it('returns secondary variant classes by default from cardVariants', () => {
    const classes = cardVariants();
    expect(classes).toContain('bg-bg-surface/90');
    expect(classes).toContain('rounded-2xl');
  });

  it('handles explicit variants (secondary, glass, elevated, default)', () => {
    expect(cardVariants({ variant: 'secondary' })).toContain('bg-bg-surface/90');
    expect(cardVariants({ variant: 'glass' })).toContain('glass');
    expect(cardVariants({ variant: 'elevated' })).toContain('bg-bg-elevated/90');
    expect(cardVariants({ variant: 'default' })).toContain('bg-bg-surface/90');
  });

  it('renders Card3D component with secondary variant by default', () => {
    render(<Card3D data-testid="card-3d">3D Content</Card3D>);
    const el = screen.getByTestId('card-3d');
    expect(el).toHaveClass('rounded-2xl');
    expect(el).toHaveClass('bg-bg-surface/90');
    expect(screen.getByText('3D Content')).toBeInTheDocument();
  });
});

describe('Badge and badgeVariants utility', () => {
  it('returns default badge classes from badgeVariants', () => {
    const classes = badgeVariants();
    expect(classes).toContain('inline-flex');
    expect(classes).toContain('rounded-full');
    expect(classes).toContain('text-2xs');
  });

  it('supports size and variant configurations in badgeVariants', () => {
    const mdSuccess = badgeVariants({ variant: 'success', size: 'md' });
    expect(mdSuccess).toContain('text-xs');
    expect(mdSuccess).toContain('bg-emerald-500/15');

    const warning = badgeVariants({ variant: 'warning' });
    expect(warning).toContain('bg-amber-500/15');
  });

  it('renders Badge component using badgeVariants', () => {
    render(<Badge label="Pro Badge" variant="success" dot />);
    expect(screen.getByText('Pro Badge')).toBeInTheDocument();
  });
});
