import { describe, it, expect } from 'vitest';
import { 
  calculateContrastRatio, 
  getTextColorForBackground, 
  isContrastCompliant,
  hexToRgb,
  rgbToHsl,
  getLuminance,
  COLORS 
} from './colors';

describe('hexToRgb', () => {
  it('converts 6-digit hex to RGB', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#3b82f6')).toEqual({ r: 59, g: 130, b: 246 });
  });

  it('converts 3-digit hex to RGB', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('handles hex without hash prefix', () => {
    expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('3b82f6')).toEqual({ r: 59, g: 130, b: 246 });
  });

  it('handles uppercase hex', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#3B82F6')).toEqual({ r: 59, g: 130, b: 246 });
  });

  it('returns null for invalid hex', () => {
    expect(hexToRgb('#gggggg')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull();
    expect(hexToRgb('invalid')).toBeNull();
    expect(hexToRgb('')).toBeNull();
  });
});

describe('rgbToHsl', () => {
  it('converts white to HSL', () => {
    const result = rgbToHsl(255, 255, 255);
    expect(result.l).toBe(100);
  });

  it('converts black to HSL', () => {
    const result = rgbToHsl(0, 0, 0);
    expect(result.l).toBe(0);
  });

  it('converts red to HSL', () => {
    const result = rgbToHsl(255, 0, 0);
    expect(result.h).toBe(0);
    expect(result.s).toBe(100);
    expect(result.l).toBe(50);
  });

  it('converts blue to HSL', () => {
    const result = rgbToHsl(59, 130, 246);
    expect(result.h).toBeCloseTo(219, 0);
    expect(result.s).toBeCloseTo(91, 0);
    expect(result.l).toBeCloseTo(60, 0);
  });

  it('converts gray to HSL', () => {
    const result = rgbToHsl(128, 128, 128);
    expect(result.s).toBe(0);
    expect(result.l).toBeCloseTo(50, 0);
  });
});

describe('getLuminance', () => {
  it('calculates luminance for white', () => {
    const luminance = getLuminance('#ffffff');
    expect(luminance).toBeCloseTo(1, 2);
  });

  it('calculates luminance for black', () => {
    const luminance = getLuminance('#000000');
    expect(luminance).toBeCloseTo(0, 2);
  });

  it('calculates luminance for primary blue', () => {
    const luminance = getLuminance('#3b82f6');
    expect(luminance).toBeGreaterThan(0);
    expect(luminance).toBeLessThan(1);
  });

  it('calculates luminance for gray', () => {
    const luminance = getLuminance('#6b7280');
    expect(luminance).toBeGreaterThan(0);
    expect(luminance).toBeLessThan(1);
  });

  it('returns 0 for invalid colors', () => {
    expect(getLuminance('invalid')).toBe(0);
    expect(getLuminance('')).toBe(0);
  });
});

describe('calculateContrastRatio', () => {
  it('calculates maximum contrast between black and white', () => {
    const ratio = calculateContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 1);
  });

  it('calculates minimum contrast for identical colors', () => {
    const ratio = calculateContrastRatio('#ffffff', '#ffffff');
    expect(ratio).toBe(1);
  });

  it('calculates contrast for primary color on white', () => {
    const ratio = calculateContrastRatio('#3b82f6', '#ffffff');
    expect(ratio).toBeGreaterThan(4.5);
  });

  it('calculates contrast for white text on primary background', () => {
    const ratio = calculateContrastRatio('#ffffff', '#3b82f6');
    expect(ratio).toBeGreaterThan(4.5);
  });

  it('calculates contrast for gray combinations', () => {
    const ratio = calculateContrastRatio('#374151', '#f9fafb');
    expect(ratio).toBeGreaterThan(7);
  });

  it('handles colors with low contrast', () => {
    const ratio = calculateContrastRatio('#f3f4f6', '#ffffff');
    expect(ratio).toBeLessThan(2);
  });

  it('returns consistent results regardless of parameter order', () => {
    const ratio1 = calculateContrastRatio('#000000', '#ffffff');
    const ratio2 = calculateContrastRatio('#ffffff', '#000000');
    expect(ratio1).toBe(ratio2);
  });

  it('handles 3-digit hex colors', () => {
    const ratio = calculateContrastRatio('#000', '#fff');
    expect(ratio).toBeCloseTo(21, 1);
  });

  it('returns 1 for invalid colors', () => {
    expect(calculateContrastRatio('invalid', '#ffffff')).toBe(1);
    expect(calculateContrastRatio('#ffffff', 'invalid')).toBe(1);
    expect(calculateContrastRatio('invalid', 'invalid')).toBe(1);
  });
});

describe('getTextColorForBackground', () => {
  it('returns white for dark backgrounds', () => {
    expect(getTextColorForBackground('#000000')).toBe('#ffffff');
    expect(getTextColorForBackground('#111827')).toBe('#ffffff');
    expect(getTextColorForBackground('#374151')).toBe('#ffffff');
  });

  it('returns black for light backgrounds', () => {
    expect(getTextColorForBackground('#ffffff')).toBe('#000000');
    expect(getTextColorForBackground('#f9fafb')).toBe('#000000');
    expect(getTextColorForBackground('#f3f4f6')).toBe('#000000');
  });

  it('returns white for medium-dark primary colors', () => {
    expect(getTextColorForBackground('#3b82f6')).toBe('#ffffff');
    expect(getTextColorForBackground('#2563eb')).toBe('#ffffff');
    expect(getTextColorForBackground('#1e3a8a')).toBe('#ffffff');
  });

  it('returns black for light primary colors', () => {
    expect(getTextColorForBackground('#dbeafe')).toBe('#000000');
    expect(getTextColorForBackground('#eff6ff')).toBe('#000000');
  });

  it('returns white for semantic colors', () => {
    expect(getTextColorForBackground('#dc2626')).toBe('#ffffff'); // error red
    expect(getTextColorForBackground('#15803d')).toBe('#ffffff'); // success green
  });

  it('returns black for light semantic colors', () => {
    expect(getTextColorForBackground('#fef2f2')).toBe('#000000'); // error light
    expect(getTextColorForBackground('#f0fdf4')).toBe('#000000'); // success light
  });

  it('handles edge case colors around luminance threshold', () => {
    expect(getTextColorForBackground('#808080')).toBe('#ffffff'); // medium gray
  });

  it('returns black for invalid colors', () => {
    expect(getTextColorForBackground('invalid')).toBe('#000000');
    expect(getTextColorForBackground('')).toBe('#000000');
  });
});

describe('isContrastCompliant', () => {
  describe('WCAG AA compliance (4.5:1)', () => {
    it('passes for high contrast combinations', () => {
      expect(isContrastCompliant('#000000', '#ffffff', 'AA')).toBe(true);
      expect(isContrastCompliant('#ffffff', '#000000', 'AA')).toBe(true);
      expect(isContrastCompliant('#374151', '#ffffff', 'AA')).toBe(true);
      expect(isContrastCompliant('#ffffff', '#3b82f6', 'AA')).toBe(true);
    });

    it('fails for low contrast combinations', () => {
      expect(isContrastCompliant('#f3f4f6', '#ffffff', 'AA')).toBe(false);
      expect(isContrastCompliant('#e5e7eb', '#f9fafb', 'AA')).toBe(false);
      expect(isContrastCompliant('#dbeafe', '#eff6ff', 'AA')).toBe(false);
    });

    it('passes for border cases at exactly 4.5:1', () => {
      // Find colors that produce exactly 4.5:1 ratio
      const ratio = calculateContrastRatio('#767676', '#ffffff');
      if (Math.abs(ratio - 4.5) < 0.1) {
        expect(isContrastCompliant('#767676', '#ffffff', 'AA')).toBe(true);
      }
    });
  });

  describe('WCAG AAA compliance (7:1)', () => {
    it('passes for very high contrast combinations', () => {
      expect(isContrastCompliant('#000000', '#ffffff', 'AAA')).toBe(true);
      expect(isContrastCompliant('#111827', '#ffffff', 'AAA')).toBe(true);
      expect(isContrastCompliant('#374151', '#ffffff', 'AAA')).toBe(true);
    });

    it('fails for medium contrast combinations', () => {
      expect(isContrastCompliant('#6b7280', '#ffffff', 'AAA')).toBe(false);
      expect(isContrastCompliant('#3b82f6', '#ffffff', 'AAA')).toBe(false);
    });

    it('fails for combinations that pass AA but not AAA', () => {
      expect(isContrastCompliant('#2563eb', '#ffffff', 'AA')).toBe(true);
      expect(isContrastCompliant('#2563eb', '#ffffff', 'AAA')).toBe(false);
    });
  });

  it('handles invalid colors gracefully', () => {
    expect(isContrastCompliant('invalid', '#ffffff', 'AA')).toBe(false);
    expect(isContrastCompliant('#ffffff', 'invalid', 'AA')).toBe(false);
  });

  it('defaults to AA level when not specified', () => {
    const aaResult = isContrastCompliant('#000000', '#ffffff', 'AA');
    const defaultResult = isContrastCompliant('#000000', '#ffffff');
    expect(defaultResult).toBe(aaResult);
  });
});

describe('COLORS constant', () => {
  it('contains all required primary colors', () => {
    expect(COLORS.primary).toHaveProperty('50');
    expect(COLORS.primary).toHaveProperty('100');
    expect(COLORS.primary).toHaveProperty('500');
    expect(COLORS.primary).toHaveProperty('600');
    expect(COLORS.primary).toHaveProperty('900');
  });

  it('contains all required neutral colors', () => {
    expect(COLORS.neutral).toHaveProperty('50');
    expect(COLORS.neutral).toHaveProperty('100');
    expect(COLORS.neutral).toHaveProperty('200');
    expect(COLORS.neutral).toHaveProperty('500');
    expect(COLORS.neutral).toHaveProperty('700');
    expect(COLORS.neutral).toHaveProperty('800');
    expect(COLORS.neutral).toHaveProperty('900');
  });

  it('contains semantic colors', () => {
    expect(COLORS.success).toHaveProperty('50');
    expect(COLORS.success).toHaveProperty('500');
    expect(COLORS.success).toHaveProperty('700');
  });

  it('has valid hex color values', () => {
    expect(COLORS.primary[500]).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(COLORS.neutral[900]).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(COLORS.success[500]).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('Color contrast compliance scenarios', () => {
  describe('Primary color combinations', () => {
    it('validates primary-500 on white meets AA', () => {
      expect(isContrastCompliant(COLORS.primary[500], '#ffffff', 'AA')).toBe(true);
    });

    it('validates white text on primary-600 meets AA', () => {
      expect(isContrastCompliant('#ffffff', COLORS.primary[600], 'AA')).toBe(true);
    });

    it('identifies failing primary-100 on white', () => {
      expect(isContrastCompliant(COLORS.primary[100], '#ffffff', 'AA')).toBe(false);
    });
  });

  describe('Neutral color combinations', () => {
    it('validates neutral-900 on white meets AAA', () => {
      expect(isContrastCompliant(COLORS.neutral[900], '#ffffff', 'AAA')).toBe(true);
    });

    it('validates neutral-700 on white meets AA', () => {
      expect(isContrastCompliant(COLORS.neutral[700], '#ffffff', 'AA')).toBe(true);
    });

    it('identifies failing neutral-200 on neutral-50', () => {
      expect(isContrastCompliant(COLORS.neutral[200], COLORS.neutral[50], 'AA')).toBe(false);
    });
  });

  describe('Semantic color combinations', () => {
    it('validates success-700 on white meets AA', () => {
      expect(isContrastCompliant(COLORS.success[700], '#ffffff', 'AA')).toBe(true);
    });

    it('validates white on success-500 meets AA', () => {
      expect(isContrastCompliant('#ffffff', COLORS.success[500], 'AA')).toBe(true);
    });

    it('identifies failing success-50 combinations', () => {
      expect(isContrastCompliant(COLORS.success[50], '#ffffff', 'AA')).toBe(false);
    });
  });

  describe('Common UI pattern validations', () => {
    it('validates button primary variant contrast', () => {
      expect(isContrastCompliant('#ffffff', '#2563eb', 'AA')).toBe(true);
    });

    it('validates input text contrast', () => {
      expect(isContrastCompliant('#111827', '#ffffff', 'AA')).toBe(