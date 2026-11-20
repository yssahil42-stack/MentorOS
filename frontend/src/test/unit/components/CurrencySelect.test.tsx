import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CurrencySelect } from '../../../components/ui/CurrencySelect';
import { SUPPORTED_CURRENCIES } from '../../../utils/currency';

describe('CurrencySelect Component', () => {
  it('renders current currency button label and chevron', () => {
    const handleChange = vi.fn();
    render(<CurrencySelect value="INR" onChange={handleChange} />);

    // Shows currently selected currency in the button
    expect(screen.getByRole('button', { name: /INR/i })).toBeInTheDocument();
  });

  it('excludes INR from the dropdown list when INR is currently selected', () => {
    const handleChange = vi.fn();
    render(<CurrencySelect value="INR" onChange={handleChange} />);

    // Click to open dropdown
    const button = screen.getByRole('button', { name: /INR/i });
    fireEvent.click(button);

    // Listbox should be open
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    // Check all options rendered in the listbox
    const options = screen.getAllByRole('option');
    const optionTexts = options.map((opt) => opt.textContent);

    // NONE of the options in the dropdown list should be INR
    optionTexts.forEach((text) => {
      expect(text).not.toContain('INR');
    });

    // Other currencies SHOULD be present
    expect(screen.getByRole('option', { name: /USD/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /EUR/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /GBP/i })).toBeInTheDocument();
  });

  it('excludes USD from the dropdown list when USD is currently selected', () => {
    const handleChange = vi.fn();
    render(<CurrencySelect value="USD" onChange={handleChange} />);

    // Click to open dropdown
    const button = screen.getByRole('button', { name: /USD/i });
    fireEvent.click(button);

    const options = screen.getAllByRole('option');
    const optionTexts = options.map((opt) => opt.textContent);

    // USD should NOT be in the dropdown options
    optionTexts.forEach((text) => {
      expect(text).not.toContain('USD');
    });

    // INR should now be present in the dropdown list
    expect(screen.getByRole('option', { name: /INR/i })).toBeInTheDocument();
  });

  it('strictly excludes the selected currency for every supported currency', () => {
    const currencies = Object.keys(SUPPORTED_CURRENCIES);

    currencies.forEach((currCode) => {
      const handleChange = vi.fn();
      const { unmount } = render(<CurrencySelect value={currCode} onChange={handleChange} />);

      const triggerBtn = screen.getByRole('button');
      fireEvent.click(triggerBtn);

      const options = screen.getAllByRole('option');
      const optionTexts = options.map((opt) => opt.textContent);

      optionTexts.forEach((text) => {
        expect(text).not.toContain(currCode);
      });

      // Total options should be exactly total currencies minus 1
      expect(options).toHaveLength(currencies.length - 1);

      unmount();
    });
  });

  it('calls onChange with clicked currency and closes menu', () => {
    const handleChange = vi.fn();
    render(<CurrencySelect value="INR" onChange={handleChange} />);

    // Open menu
    fireEvent.click(screen.getByRole('button', { name: /INR/i }));

    // Click USD
    const usdOption = screen.getByRole('option', { name: /USD/i });
    fireEvent.click(usdOption);

    expect(handleChange).toHaveBeenCalledWith('USD');
    // Menu should close
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
