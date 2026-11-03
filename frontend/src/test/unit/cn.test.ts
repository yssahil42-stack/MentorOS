import { describe, it, expect } from 'vitest';
import { cn } from '../../utils/cn';

describe('cn utility', () => {
  it('joins class names with spaces', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
  });

  it('handles empty strings and falsy values', () => {
    expect(cn('foo', '', null, undefined, false, 'bar')).toBe('foo bar');
  });

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('handles objects with boolean values', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('handles mixed arguments', () => {
    expect(cn('base', { active: true, disabled: false }, ['extra', 'classes'])).toBe(
      'base active extra classes'
    );
  });

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });
});
