import { describe, it, expect } from 'vitest';
import {
  calculateContrastRatio,
  isWCAGCompliant,
  getWCAGLevel,
  validateAccessibility,
  getRelativeLuminance
} from '../contrast-validator';

describe('contrast-validator', () => {
  describe('calculateContrastRatio', () => {
    it('calculates correct contrast ratio for black text on white background', () => {
      const ratio = calculateContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('calculates correct contrast ratio for white text on black background', () => {
      const ratio = calculateContrastRatio('#ffffff', '#000000');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('calculates correct contrast ratio for gray-800 on white', () => {
      const ratio = calculateContrastRatio('#1f2937', '#ffffff');
      expect(ratio).toBeGreaterThan(10);
      expect(ratio).toBeLessThan(11);
    });

    it('calculates correct contrast ratio for gray-500 on white', () => {
      const ratio = calculateContrastRatio('#6b7280', '#ffffff');
      expect(ratio).toBeGreaterThan(4.6);
      expect(ratio).toBeLessThan(4.7);
    });

    it('handles identical colors returning ratio of 1', () => {
      const ratio = calculateContrastRatio('#ff0000', '#ff0000');
      expect(ratio).toBe(1);
    });

    it('handles colors with different cases', () => {
      const ratio1 = calculateContrastRatio('#FF0000', '#ffffff');
      const ratio2 = calculateContrastRatio('#ff0000', '#FFFFFF');
      expect(ratio1).toBeCloseTo(ratio2, 2);
    });

    it('handles 3-digit hex colors', () => {
      const ratio = calculateContrastRatio('#000', '#fff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('handles RGB color values', () => {
      const ratio = calculateContrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('calculates ratio for similar colors', () => {
      const ratio = calculateContrastRatio('#808080', '#787878');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(1.2);
    });

    it('maintains precision for edge case ratios', () => {
      const ratio = calculateContrastRatio('#767676', '#ffffff');
      expect(ratio).toBeGreaterThan(4.5);
      expect(ratio).toBeLessThan(4.6);
    });
  });

  describe('getRelativeLuminance', () => {
    it('calculates correct luminance for pure white', () => {
      const luminance = getRelativeLuminance(255, 255, 255);
      expect(luminance).toBe(1);
    });

    it('calculates correct luminance for pure black', () => {
      const luminance = getRelativeLuminance(0, 0, 0);
      expect(luminance).toBe(0);
    });

    it('calculates correct luminance for middle gray', () => {
      const luminance = getRelativeLuminance(128, 128, 128);
      expect(luminance).toBeGreaterThan(0.2);
      expect(luminance).toBeLessThan(0.25);
    });

    it('handles low RGB values correctly', () => {
      const luminance = getRelativeLuminance(10, 10, 10);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(0.01);
    });

    it('handles individual color components', () => {
      const redLuminance = getRelativeLuminance(255, 0, 0);
      const greenLuminance = getRelativeLuminance(0, 255, 0);
      const blueLuminance = getRelativeLuminance(0, 0, 255);
      
      expect(greenLuminance).toBeGreaterThan(redLuminance);
      expect(greenLuminance).toBeGreaterThan(blueLuminance);
      expect(redLuminance).toBeGreaterThan(blueLuminance);
    });
  });

  describe('isWCAGCompliant', () => {
    it('returns true for AA compliant contrast (>= 4.5:1)', () => {
      expect(isWCAGCompliant(4.5, 'AA')).toBe(true);
      expect(isWCAGCompliant(4.6, 'AA')).toBe(true);
      expect(isWCAGCompliant(7.0, 'AA')).toBe(true);
    });

    it('returns false for non-AA compliant contrast (< 4.5:1)', () => {
      expect(isWCAGCompliant(4.4, 'AA')).toBe(false);
      expect(isWCAGCompliant(3.0, 'AA')).toBe(false);
      expect(isWCAGCompliant(1.5, 'AA')).toBe(false);
    });

    it('returns true for AAA compliant contrast (>= 7:1)', () => {
      expect(isWCAGCompliant(7.0, 'AAA')).toBe(true);
      expect(isWCAGCompliant(8.5, 'AAA')).toBe(true);
      expect(isWCAGCompliant(21.0, 'AAA')).toBe(true);
    });

    it('returns false for non-AAA compliant contrast (< 7:1)', () => {
      expect(isWCAGCompliant(6.9, 'AAA')).toBe(false);
      expect(isWCAGCompliant(5.0, 'AAA')).toBe(false);
      expect(isWCAGCompliant(4.5, 'AAA')).toBe(false);
    });

    it('handles large text AA requirements (>= 3:1)', () => {
      expect(isWCAGCompliant(3.0, 'AA', true)).toBe(true);
      expect(isWCAGCompliant(3.5, 'AA', true)).toBe(true);
      expect(isWCAGCompliant(2.9, 'AA', true)).toBe(false);
    });

    it('handles large text AAA requirements (>= 4.5:1)', () => {
      expect(isWCAGCompliant(4.5, 'AAA', true)).toBe(true);
      expect(isWCAGCompliant(5.0, 'AAA', true)).toBe(true);
      expect(isWCAGCompliant(4.4, 'AAA', true)).toBe(false);
    });

    it('handles edge case exactly at threshold', () => {
      expect(isWCAGCompliant(4.5, 'AA')).toBe(true);
      expect(isWCAGCompliant(7.0, 'AAA')).toBe(true);
      expect(isWCAGCompliant(3.0, 'AA', true)).toBe(true);
      expect(isWCAGCompliant(4.5, 'AAA', true)).toBe(true);
    });
  });

  describe('getWCAGLevel', () => {
    it('returns AAA for high contrast ratios', () => {
      expect(getWCAGLevel(21.0)).toBe('AAA');
      expect(getWCAGLevel(10.0)).toBe('AAA');
      expect(getWCAGLevel(7.0)).toBe('AAA');
    });

    it('returns AA for medium contrast ratios', () => {
      expect(getWCAGLevel(6.9)).toBe('AA');
      expect(getWCAGLevel(5.5)).toBe('AA');
      expect(getWCAGLevel(4.5)).toBe('AA');
    });

    it('returns Fail for low contrast ratios', () => {
      expect(getWCAGLevel(4.4)).toBe('Fail');
      expect(getWCAGLevel(3.0)).toBe('Fail');
      expect(getWCAGLevel(1.5)).toBe('Fail');
      expect(getWCAGLevel(1.0)).toBe('Fail');
    });

    it('handles large text requirements', () => {
      expect(getWCAGLevel(4.4, true)).toBe('AA');
      expect(getWCAGLevel(3.0, true)).toBe('AA');
      expect(getWCAGLevel(2.9, true)).toBe('Fail');
      expect(getWCAGLevel(4.5, true)).toBe('AAA');
      expect(getWCAGLevel(7.0, true)).toBe('AAA');
    });

    it('handles edge cases at thresholds', () => {
      expect(getWCAGLevel(7.0)).toBe('AAA');
      expect(getWCAGLevel(6.99)).toBe('AA');
      expect(getWCAGLevel(4.5)).toBe('AA');
      expect(getWCAGLevel(4.49)).toBe('Fail');
    });
  });

  describe('validateAccessibility', () => {
    it('validates accessible color combinations', () => {
      const result = validateAccessibility('#1f2937', '#ffffff');
      
      expect(result.isCompliant).toBe(true);
      expect(result.contrastRatio).toBeGreaterThan(4.5);
      expect(result.wcagLevel).toBe('AAA');
      expect(result.severity).toBe('low');
    });

    it('identifies non-compliant color combinations', () => {
      const result = validateAccessibility('#cccccc', '#ffffff');
      
      expect(result.isCompliant).toBe(false);
      expect(result.contrastRatio).toBeLessThan(4.5);
      expect(result.wcagLevel).toBe('Fail');
      expect(result.severity).toBe('critical');
    });

    it('validates AA compliant but not AAA combinations', () => {
      const result = validateAccessibility('#6b7280', '#ffffff');
      
      expect(result.isCompliant).toBe(true);
      expect(result.contrastRatio).toBeGreaterThan(4.5);
      expect(result.contrastRatio).toBeLessThan(7.0);
      expect(result.wcagLevel).toBe('AA');
      expect(result.severity).toBe('medium');
    });

    it('handles similar colors correctly', () => {
      const result = validateAccessibility('#f0f0f0', '#ffffff');
      
      expect(result.isCompliant).toBe(false);
      expect(result.contrastRatio).toBeLessThan(2.0);
      expect(result.wcagLevel).toBe('Fail');
      expect(result.severity).toBe('critical');
    });

    it('validates colors with transparency', () => {
      const result = validateAccessibility('rgba(0, 0, 0, 0.87)', '#ffffff');
      
      expect(result.isCompliant).toBe(true);
      expect(result.contrastRatio).toBeGreaterThan(4.5);
    });

    it('returns appropriate severity levels', () => {
      const criticalResult = validateAccessibility('#f5f5f5', '#ffffff');
      const warningResult = validateAccessibility('#888888', '#ffffff');
      const successResult = validateAccessibility('#000000', '#ffffff');
      
      expect(criticalResult.severity).toBe('critical');
      expect(warningResult.severity).toBe('medium');
      expect(successResult.severity).toBe('low');
    });

    it('validates form-specific color combinations', () => {
      const textResult = validateAccessibility('#111827', '#ffffff');
      const placeholderResult = validateAccessibility('#6b7280', '#ffffff');
      const borderResult = validateAccessibility('#d1d5db', '#ffffff');
      
      expect(textResult.isCompliant).toBe(true);
      expect(placeholderResult.isCompliant).toBe(true);
      expect(borderResult.isCompliant).toBe(false);
    });

    it('handles invalid color formats gracefully', () => {
      expect(() => validateAccessibility('invalid', '#ffffff')).not.toThrow();
      expect(() => validateAccessibility('#ffffff', 'invalid')).not.toThrow();
      expect(() => validateAccessibility('', '')).not.toThrow();
    });

    it('validates button color combinations', () => {
      const primaryResult = validateAccessibility('#ffffff', '#2563eb');
      const secondaryResult = validateAccessibility('#374151', '#f9fafb');
      
      expect(primaryResult.isCompliant).toBe(true);
      expect(secondaryResult.isCompliant).toBe(true);
    });
  });

  describe('edge cases with similar colors', () => {
    it('distinguishes between very similar grays', () => {
      const ratio1 = calculateContrastRatio('#808080', '#818181');
      const ratio2 = calculateContrastRatio('#808080', '#828282');
      
      expect(ratio1).toBeGreaterThan(1.0);
      expect(ratio2).toBeGreaterThan(ratio1);
      expect(ratio1).toBeLessThan(1.05);
    });

    it('handles near-identical colors', () => {
      const ratio = calculateContrastRatio('#ffffff', '#fefefe');
      
      expect(ratio).toBeGreaterThan(1.0);
      expect(ratio).toBeLessThan(1.02);
    });

    it('validates colors differing by single hex value', () => {
      const result1 = validateAccessibility('#777777', '#ffffff');
      const result2 = validateAccessibility('#767676', '#ffffff');
      
      expect(result1.wcagLevel).toBe('Fail');
      expect(result2.wcagLevel).toBe('AA');
    });

    it('handles colors with minimal luminance difference', () => {
      const darkGray1 = '#2a2a2a';
      const darkGray2 = '#2b2b2b';
      
      const ratio = calculateContrastRatio(darkGray1, darkGray2);
      expect(ratio).toBeGreaterThan(1.0);
      expect(ratio).toBeLessThan(1.1);
    });

    it('validates subtle color variations in forms', () => {
      const borderNormal = '#d1d5db';
      const borderHover = '#9ca3af';
      
      const ratio = calculateContrastRatio(borderNormal, borderHover);
      expect(ratio).toBeGreaterThan(1.2);
      expect(ratio).toBeLessThan(2.0);
    });

    it('handles RGB values with small differences', () => {
      const color1 = 'rgb(128, 128, 128)';
      const color2 = 'rgb(129, 128, 128)';
      
      const ratio = calculateContrastRatio(color1, color2);
      expect(ratio).toBeGreaterThan(1.0);
      expect(ratio).toBeLessThan(1.01);
    });
  });
});