import { describe, it, expect } from 'vitest';
import {
  buttonVariants,
  buttonSizes,
  type ButtonVariant,
  type ButtonSize,
} from '../../../utils/buttonVariants';

describe('utils/buttonVariants', () => {
  describe('buttonVariants dictionary', () => {
    const expectedVariants: ButtonVariant[] = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'danger',
      'success',
      'subtle',
      'link',
      'toggle',
      'split',
    ];

    it('defines styles for all required button variants', () => {
      expectedVariants.forEach((variant) => {
        expect(buttonVariants[variant]).toBeDefined();
        expect(typeof buttonVariants[variant]).toBe('string');
        expect(buttonVariants[variant].length).toBeGreaterThan(0);
      });
    });

    it('applies focus variable styling to primary and link variants', () => {
      expect(buttonVariants.primary).toContain('var(--focus)');
      expect(buttonVariants.link).toContain('var(--focus)');
    });

    it('applies semantic color tokens to danger and success variants', () => {
      expect(buttonVariants.danger).toContain('bg-danger');
      expect(buttonVariants.success).toContain('bg-success');
    });

    it('provides transparent backgrounds for ghost, outline, and link', () => {
      expect(buttonVariants.ghost).toContain('bg-transparent');
      expect(buttonVariants.outline).toContain('bg-transparent');
      expect(buttonVariants.link).toContain('bg-transparent');
    });
  });

  describe('buttonSizes dictionary', () => {
    const expectedSizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'icon'];

    it('defines height and padding classes for all required button sizes', () => {
      expectedSizes.forEach((size) => {
        expect(buttonSizes[size]).toBeDefined();
        expect(typeof buttonSizes[size]).toBe('string');
      });
    });

    it('scales height appropriately from xs to xl', () => {
      expect(buttonSizes.xs).toContain('h-7');
      expect(buttonSizes.sm).toContain('h-8');
      expect(buttonSizes.md).toContain('h-9');
      expect(buttonSizes.lg).toContain('h-12');
      expect(buttonSizes.xl).toContain('h-14');
      expect(buttonSizes.icon).toContain('h-9 w-9');
    });
  });
});
