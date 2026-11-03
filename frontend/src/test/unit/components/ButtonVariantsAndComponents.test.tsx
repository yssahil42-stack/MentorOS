import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SplitButton } from '../../../components/ui/SplitButton';
import { ToggleButton } from '../../../components/ui/ToggleButton';
import { IconButton } from '../../../components/ui/IconButton';
import { ButtonGroup } from '../../../components/ui/ButtonGroup';
import { LoadingButton } from '../../../components/ui/LoadingButton';
import { Button } from '../../../components/ui/Button';
import { Settings, Plus, Check } from 'lucide-react';

describe('New Button UI Components', () => {
  describe('SplitButton', () => {
    it('renders main button and dropdown trigger', () => {
      const handleMain = vi.fn();
      render(
        <SplitButton
          onClick={handleMain}
          options={[
            { label: 'Option A', onClick: vi.fn() },
            { label: 'Option B', onClick: vi.fn() },
          ]}
        >
          Publish
        </SplitButton>
      );

      const mainBtn = screen.getByRole('button', { name: 'Publish' });
      const toggleBtn = screen.getByLabelText('Toggle more actions');
      expect(mainBtn).toBeInTheDocument();
      expect(toggleBtn).toBeInTheDocument();

      fireEvent.click(mainBtn);
      expect(handleMain).toHaveBeenCalledTimes(1);
    });

    it('opens and selects from dropdown menu', () => {
      const handleOption = vi.fn();
      render(
        <SplitButton
          onClick={vi.fn()}
          options={[
            { label: 'Schedule Post', onClick: handleOption },
            { label: 'Save Draft', onClick: vi.fn() },
          ]}
        >
          Publish
        </SplitButton>
      );

      // Initially menu is closed
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      // Click toggle
      const toggleBtn = screen.getByLabelText('Toggle more actions');
      fireEvent.click(toggleBtn);

      // Menu opens
      expect(screen.getByRole('menu')).toBeInTheDocument();
      const optionBtn = screen.getByRole('menuitem', { name: /Schedule Post/i });
      fireEvent.click(optionBtn);

      expect(handleOption).toHaveBeenCalledTimes(1);
      // Menu closes after click
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes menu when Escape key is pressed', () => {
      render(
        <SplitButton onClick={vi.fn()} options={[{ label: 'Option 1', onClick: vi.fn() }]}>
          Action
        </SplitButton>
      );

      fireEvent.click(screen.getByLabelText('Toggle more actions'));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('ToggleButton', () => {
    it('handles uncontrolled toggling and updates aria-pressed', () => {
      const handlePressedChange = vi.fn();
      render(<ToggleButton onPressedChange={handlePressedChange}>Favorite</ToggleButton>);

      const btn = screen.getByRole('button', { name: 'Favorite' });
      expect(btn).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(btn);
      expect(btn).toHaveAttribute('aria-pressed', 'true');
      expect(handlePressedChange).toHaveBeenCalledWith(true);

      fireEvent.click(btn);
      expect(btn).toHaveAttribute('aria-pressed', 'false');
      expect(handlePressedChange).toHaveBeenCalledWith(false);
    });

    it('respects controlled pressed prop', () => {
      const handlePressedChange = vi.fn();
      const { rerender } = render(
        <ToggleButton pressed={true} onPressedChange={handlePressedChange}>
          Pin
        </ToggleButton>
      );

      const btn = screen.getByRole('button', { name: 'Pin' });
      expect(btn).toHaveAttribute('aria-pressed', 'true');

      fireEvent.click(btn);
      expect(handlePressedChange).toHaveBeenCalledWith(false);

      rerender(
        <ToggleButton pressed={false} onPressedChange={handlePressedChange}>
          Pin
        </ToggleButton>
      );
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('IconButton', () => {
    it('renders with accessibility attributes and icon element', () => {
      const handleClick = vi.fn();
      render(
        <IconButton
          icon={<Settings data-testid="settings-icon" />}
          aria-label="Account Settings"
          onClick={handleClick}
        />
      );

      const btn = screen.getByRole('button', { name: 'Account Settings' });
      expect(btn).toBeInTheDocument();
      expect(btn.querySelector('svg')).toBeInTheDocument();

      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports rounded variant', () => {
      render(<IconButton icon={<Plus />} aria-label="Add item" rounded />);

      const btn = screen.getByRole('button', { name: 'Add item' });
      expect(btn.className).toContain('rounded-full');
    });
  });

  describe('ButtonGroup', () => {
    it('renders connected children in role="group"', () => {
      render(
        <ButtonGroup aria-label="Pagination">
          <Button>Previous</Button>
          <Button>1</Button>
          <Button>2</Button>
          <Button>Next</Button>
        </ButtonGroup>
      );

      const group = screen.getByRole('group', { name: 'Pagination' });
      expect(group).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('supports vertical orientation', () => {
      render(
        <ButtonGroup orientation="vertical" aria-label="Vertical group">
          <Button>Top</Button>
          <Button>Bottom</Button>
        </ButtonGroup>
      );

      const group = screen.getByRole('group', { name: 'Vertical group' });
      expect(group.className).toContain('flex-col');
    });
  });

  describe('LoadingButton', () => {
    it('displays loading text and disabled state when loading', () => {
      render(
        <LoadingButton loading loadingText="Saving Changes...">
          Save
        </LoadingButton>
      );

      const btn = screen.getByRole('button', { name: /Saving Changes.../i });
      expect(btn).toBeDisabled();
      expect(screen.getByText('Saving Changes...')).toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('displays standard children and clickability when not loading', () => {
      const handleClick = vi.fn();
      render(
        <LoadingButton loading={false} loadingText="Saving..." onClick={handleClick}>
          Confirm
        </LoadingButton>
      );

      const btn = screen.getByRole('button', { name: 'Confirm' });
      expect(btn).not.toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
