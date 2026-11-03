import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Button } from '../../../components/ui/Button';

describe('components/Button', () => {
  it('renders button with text content', () => {
    render(<Button>Deploy Service</Button>);
    expect(screen.getByRole('button', { name: /Deploy Service/i })).toBeInTheDocument();
  });

  it('applies variant styling classes', () => {
    const { rerender } = render(<Button variant="primary">Submit</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-[var(--focus)]');

    rerender(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger');

    rerender(<Button variant="ghost">Cancel</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12');
  });

  it('triggers onClick handler on click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Action</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Action
      </Button>
    );

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders loading spinner and disables button when loading', () => {
    const handleClick = vi.fn();
    render(
      <Button loading onClick={handleClick}>
        Saving...
      </Button>
    );

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders keyboard shortcut badge when keyboardShortcut prop is passed', () => {
    render(
      <Button keyboardShortcut="⌘K" tooltip="Quick capture (⌘K)">
        Search
      </Button>
    );

    expect(screen.getByText('⌘K')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Quick capture (⌘K)');
  });

  it('applies fullWidth style', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('renders custom icon elements', () => {
    render(<Button icon={<span data-testid="custom-icon">★</span>}>Starred</Button>);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
