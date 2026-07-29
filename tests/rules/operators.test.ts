import { describe, it, expect } from 'vitest';
import { applyOperator } from '@/lib/rules/operators';

describe('applyOperator', () => {
  it('returns null when the answer is missing', () => {
    expect(applyOperator('gte', undefined, 66)).toBeNull();
  });

  describe('gte', () => {
    it('is true when the answer is greater', () => {
      expect(applyOperator('gte', 70, 66)).toBe(true);
    });
    it('is true at the boundary', () => {
      expect(applyOperator('gte', 66, 66)).toBe(true);
    });
    it('is false below the boundary', () => {
      expect(applyOperator('gte', 65, 66)).toBe(false);
    });
    it('throws when the answer is not a number', () => {
      expect(() => applyOperator('gte', 'sixty-six', 66)).toThrow(/expects numbers/);
    });
  });

  describe('lte', () => {
    it('is true below the boundary', () => {
      expect(applyOperator('lte', 100, 16000)).toBe(true);
    });
    it('is false above the boundary', () => {
      expect(applyOperator('lte', 20000, 16000)).toBe(false);
    });
  });

  describe('eq', () => {
    it('compares booleans', () => {
      expect(applyOperator('eq', false, false)).toBe(true);
      expect(applyOperator('eq', true, false)).toBe(false);
    });
    it('compares strings', () => {
      expect(applyOperator('eq', 'england', 'england')).toBe(true);
    });
  });

  describe('in', () => {
    it('is true when the answer is in the list', () => {
      expect(applyOperator('in', 'wales', ['england', 'wales', 'scotland'])).toBe(true);
    });
    it('is false when it is not', () => {
      expect(applyOperator('in', 'france', ['england', 'wales'])).toBe(false);
    });
    it('throws when the expected value is not an array', () => {
      expect(() => applyOperator('in', 'wales', 'wales')).toThrow(/expects an array/);
    });
  });

  describe('is_true', () => {
    it('is true only for boolean true', () => {
      expect(applyOperator('is_true', true, undefined)).toBe(true);
      expect(applyOperator('is_true', false, undefined)).toBe(false);
    });
    it('throws when the answer is not a boolean', () => {
      expect(() => applyOperator('is_true', 'yes', undefined)).toThrow(/expects a boolean/);
    });
  });
});
