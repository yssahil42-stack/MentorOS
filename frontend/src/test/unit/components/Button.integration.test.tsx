import React, { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../components/ui/Button';

describe('Button Integration Tests', () => {
  describe('Form Integration', () => {
    it('submits a parent form when clicked with type="submit"', () => {
      const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit} data-testid="test-form">
          <input name="testInput" defaultValue="hello" />
          <Button type="submit">Submit Form</Button>
        </form>
      );

      const submitBtn = screen.getByRole('button', { name: /submit form/i });
      fireEvent.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not submit parent form when disabled', () => {
      const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit" disabled>
            Submit Form
          </Button>
        </form>
      );

      const submitBtn = screen.getByRole('button', { name: /submit form/i });
      fireEvent.click(submitBtn);

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('does not submit parent form when in loading state', () => {
      const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit" loading>
            Saving...
          </Button>
        </form>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      fireEvent.click(button);

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('resets form when clicked with type="reset"', () => {
      const handleReset = vi.fn((e: React.FormEvent) => e.preventDefault());

      render(
        <form onReset={handleReset}>
          <input name="title" defaultValue="Default Text" />
          <Button type="reset">Reset Form</Button>
        </form>
      );

      const resetBtn = screen.getByRole('button', { name: /reset form/i });
      fireEvent.click(resetBtn);

      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Forwarding & DOM Integration', () => {
    it('forwards ref to underlying HTML button element and supports imperatively focusing', () => {
      const buttonRef = createRef<HTMLButtonElement>();

      render(<Button ref={buttonRef}>Focus Me</Button>);

      expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
      expect(buttonRef.current?.tagName).toBe('BUTTON');

      buttonRef.current?.focus();
      expect(document.activeElement).toBe(buttonRef.current);
    });

    it('allows programmatic click invocation through ref', () => {
      const buttonRef = createRef<HTMLButtonElement>();
      const handleClick = vi.fn();

      render(
        <Button ref={buttonRef} onClick={handleClick}>
          Programmatic Click
        </Button>
      );

      buttonRef.current?.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon & Slot Integration', () => {
    it('renders left icon and right icon correctly alongside text', () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">Left</span>}
          iconRight={<span data-testid="right-icon">Right</span>}
        >
          Icon Button
        </Button>
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('Icon Button')).toBeInTheDocument();
    });

    it('replaces lead icon with spinner during loading state and hides right icon', () => {
      render(
        <Button
          leftIcon={<span data-testid="lead-icon">Icon</span>}
          iconRight={<span data-testid="right-icon">Right</span>}
          loading
        >
          Saving Item
        </Button>
      );

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
      expect(screen.queryByTestId('lead-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
      expect(screen.getByText('Saving Item')).toBeInTheDocument();
    });

    it('supports alias prop "icon" as left icon', () => {
      render(<Button icon={<span data-testid="alias-icon">★</span>}>Starred</Button>);
      expect(screen.getByTestId('alias-icon')).toBeInTheDocument();
    });
  });

  describe('Selected & ARIA States Integration', () => {
    it('applies micro-movement and shadow when selected prop is true', () => {
      render(<Button selected>Selected Item</Button>);
      const btn = screen.getByRole('button', { name: /selected item/i });
      expect(btn).toHaveClass('translate-y-[1px]');
      expect(btn).toHaveClass('shadow-xs');
    });

    it('applies selected styles when aria-pressed is true', () => {
      render(<Button aria-pressed={true}>Pressed Button</Button>);
      const btn = screen.getByRole('button', { name: /pressed button/i });
      expect(btn).toHaveClass('translate-y-[1px]');
      expect(btn).toHaveClass('shadow-xs');
    });

    it('propagates custom ARIA attributes seamlessly', () => {
      render(
        <Button aria-expanded={true} aria-controls="dropdown-menu-1" aria-haspopup="menu">
          Menu
        </Button>
      );

      const btn = screen.getByRole('button', { name: /menu/i });
      expect(btn).toHaveAttribute('aria-expanded', 'true');
      expect(btn).toHaveAttribute('aria-controls', 'dropdown-menu-1');
      expect(btn).toHaveAttribute('aria-haspopup', 'menu');
    });
  });

  describe('Keyboard & Focus Interactions', () => {
    it('executes click handler when keydown event or click occurs', () => {
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Accessible Action</Button>);
      const btn = screen.getByRole('button', { name: /accessible action/i });

      btn.focus();
      expect(btn).toHaveFocus();

      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports onFocus and onBlur handlers', () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      render(
        <Button onFocus={handleFocus} onBlur={handleBlur}>
          Focus Event
        </Button>
      );
      const btn = screen.getByRole('button', { name: /focus event/i });

      fireEvent.focus(btn);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(btn);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Variants & Sizes Integration', () => {
    const variants = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'danger',
      'subtle',
      'workspace',
    ] as const;
    const sizes = ['xs', 'sm', 'md', 'lg'] as const;

    variants.forEach((variant) => {
      it(`renders variant="${variant}" without runtime crash`, () => {
        const { unmount } = render(<Button variant={variant}>{variant}</Button>);
        const btn = screen.getByRole('button', { name: variant });
        expect(btn).toBeInTheDocument();
        unmount();
      });
    });

    sizes.forEach((size) => {
      it(`renders size="${size}" without runtime crash`, () => {
        const { unmount } = render(<Button size={size}>Size {size}</Button>);
        const btn = screen.getByRole('button', { name: `Size ${size}` });
        expect(btn).toBeInTheDocument();
        unmount();
      });
    });
  });
});
