import { describe, it, expect } from 'vitest';
import {
  badgeVariants,
  variantStyles as badgeVariantStyles,
  dotStyles as badgeDotStyles,
} from '../../../utils/badgeVariants';
import { cardVariants, cardVariantStyles } from '../../../utils/cardVariants';
import {
  modalDialogVariants,
  modalOverlayVariants,
  modalBackdropVariants,
  confirmButtonVariant,
  modalSizes,
} from '../../../utils/modalVariants';
import {
  inputVariants,
  selectVariants,
  inputSizes,
  inputVariantsMap,
} from '../../../utils/inputVariants';

describe('Component Variants Utilities', () => {
  describe('badgeVariants', () => {
    it('returns default styling with sm size', () => {
      const cls = badgeVariants();
      expect(cls).toContain('inline-flex');
      expect(cls).toContain('rounded-full');
      expect(cls).toContain('text-2xs');
      expect(cls).toContain('bg-student-500/15');
    });

    it('supports custom variants and sizes', () => {
      const primaryLg = badgeVariants({ variant: 'primary', size: 'lg' });
      expect(primaryLg).toContain('bg-orange-500/15');
      expect(primaryLg).toContain('text-sm');

      const outlineXs = badgeVariants({ variant: 'outline', size: 'xs' });
      expect(outlineXs).toContain('border-border-base');
      expect(outlineXs).toContain('text-3xs');
    });

    it('exports complete variantStyles and dotStyles maps', () => {
      expect(badgeVariantStyles.success).toContain('bg-emerald-500/15');
      expect(badgeDotStyles.primary).toBe('bg-orange-500');
      expect(badgeDotStyles.danger).toBe('bg-red-400');
    });
  });

  describe('cardVariants', () => {
    it('returns secondary styling by default', () => {
      const cls = cardVariants();
      expect(cls).toContain('rounded-2xl');
      expect(cls).toContain('bg-bg-surface/90');
    });

    it('handles elevated, glass, outline, and flat variants', () => {
      expect(cardVariants({ variant: 'elevated' })).toContain('bg-bg-elevated/90');
      expect(cardVariants({ variant: 'glass' })).toContain('glass');
      expect(cardVariants({ variant: 'outline' })).toContain('bg-transparent');
      expect(cardVariants({ variant: 'flat' })).toContain('border-transparent');
    });

    it('appends custom classNames', () => {
      const custom = cardVariants({ className: 'custom-card-class' });
      expect(custom).toContain('custom-card-class');
    });
  });

  describe('modalVariants', () => {
    it('returns dialog variants for standard and fullscreen sizes', () => {
      const mdDialog = modalDialogVariants({ size: 'md' });
      expect(mdDialog).toContain('max-w-md');
      expect(mdDialog).toContain('rounded-2xl');

      const fullDialog = modalDialogVariants({ size: 'fullscreen' });
      expect(fullDialog).toContain('h-full');
      expect(fullDialog).toContain('rounded-none');
    });

    it('returns overlay variants appropriately padded', () => {
      expect(modalOverlayVariants({ size: 'md' })).toContain('p-4');
      expect(modalOverlayVariants({ size: 'fullscreen' })).toContain('p-0');
    });

    it('exports backdrop variants', () => {
      expect(modalBackdropVariants).toContain('backdrop-blur-sm');
      expect(modalBackdropVariants).toContain('bg-black/60');
    });

    it('returns confirm button variant based on destructive flag', () => {
      expect(confirmButtonVariant(true)).toBe('danger');
      expect(confirmButtonVariant(false)).toBe('primary');
      expect(confirmButtonVariant()).toBe('primary');
    });
  });

  describe('inputVariants & selectVariants', () => {
    it('returns standard input styling', () => {
      const def = inputVariants();
      expect(def).toContain('w-full');
      expect(def).toContain('h-9');
      expect(def).toContain('bg-bg-surface');
    });

    it('applies error and icon states', () => {
      const withIcon = inputVariants({ hasIcon: true });
      expect(withIcon).toContain('pl-9');

      const withError = inputVariants({ hasError: true });
      expect(withError).toContain('border-danger');
    });

    it('supports filled, outline, and ghost variants', () => {
      expect(inputVariants({ variant: 'filled' })).toContain('bg-bg-elevated');
      expect(inputVariants({ variant: 'outline' })).toContain('bg-transparent');
      expect(inputVariants({ variant: 'ghost' })).toContain('border-transparent');
    });

    it('returns select variants with cursor pointer', () => {
      const sel = selectVariants({ size: 'lg' });
      expect(sel).toContain('cursor-pointer');
      expect(sel).toContain('h-11');
    });
  });
});
