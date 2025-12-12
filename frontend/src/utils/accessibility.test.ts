import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  calculateContrastRatio,
  getRelativeLuminance,
  hexToRgb,
  rgbToHex,
  isWCAGCompliant,
  getAccessibilityLevel,
  generateAccessibleColorVariations,
  validateColorCombination,
  suggestAccessibleAlternatives,
  WCAG_AA_NORMAL,
  WCAG_AA_LARGE,
  WCAG_AAA_NORMAL,
  WCAG_AAA_LARGE,
  ACCESSIBLE_COLOR_PAIRS
} from './accessibility';

describe('accessibility utilities', () => {
  describe('Color conversion utilities', () => {
    describe('hexToRgb', () => {
      it('should convert valid hex colors to RGB', () => {
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
        expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      });

      it('should handle uppercase hex colors', () => {
        expect(hexToRgb('#FF00AA')).toEqual({ r: 255, g: 0, b: 170 });
        expect(hexToRgb('#ABCDEF')).toEqual({ r: 171, g: 205, b: 239 });
      });

      it('should handle mixed case hex colors', () => {
        expect(hexToRgb('#aB3DeF')).toEqual({ r: 171, g: 61, b: 239 });
      });

      it('should throw error for invalid hex colors', () => {
        expect(() => hexToRgb('#gggggg')).toThrow('Invalid hex color format');
        expect(() => hexToRgb('#12345')).toThrow('Invalid hex color format');
        expect(() => hexToRgb('123456')).toThrow('Invalid hex color format');
        expect(() => hexToRgb('')).toThrow('Invalid hex color format');
      });
    });

    describe('rgbToHex', () => {
      it('should convert RGB values to hex colors', () => {
        expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
        expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
        expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
        expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
        expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff');
      });

      it('should handle single digit values with leading zeros', () => {
        expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
        expect(rgbToHex({ r: 15, g: 16, b: 17 })).toBe('#0f1011');
      });

      it('should throw error for values outside 0-255 range', () => {
        expect(() => rgbToHex({ r: -1, g: 0, b: 0 })).toThrow('RGB values must be between 0 and 255');
        expect(() => rgbToHex({ r: 0, g: 256, b: 0 })).toThrow('RGB values must be between 0 and 255');
        expect(() => rgbToHex({ r: 0, g: 0, b: 300 })).toThrow('RGB values must be between 0 and 255');
      });

      it('should handle non-integer values by rounding', () => {
        expect(rgbToHex({ r: 127.4, g: 127.6, b: 128.8 })).toBe('#7f8081');
      });
    });
  });

  describe('Relative luminance calculation', () => {
    describe('getRelativeLuminance', () => {
      it('should calculate correct luminance for pure colors', () => {
        // Black should have luminance of 0
        expect(getRelativeLuminance('#000000')).toBeCloseTo(0, 3);
        
        // White should have luminance of 1
        expect(getRelativeLuminance('#ffffff')).toBeCloseTo(1, 3);
        
        // Pure red luminance
        expect(getRelativeLuminance('#ff0000')).toBeCloseTo(0.2126, 3);
        
        // Pure green luminance
        expect(getRelativeLuminance('#00ff00')).toBeCloseTo(0.7152, 3);
        
        // Pure blue luminance
        expect(getRelativeLuminance('#0000ff')).toBeCloseTo(0.0722, 3);
      });

      it('should calculate luminance for gray colors', () => {
        expect(getRelativeLuminance('#808080')).toBeCloseTo(0.2159, 3);
        expect(getRelativeLuminance('#404040')).toBeCloseTo(0.0515, 3);
        expect(getRelativeLuminance('#c0c0c0')).toBeCloseTo(0.5276, 3);
      });

      it('should handle edge cases in sRGB to linear conversion', () => {
        // Test values around the 0.03928 threshold
        expect(getRelativeLuminance('#010101')).toBeCloseTo(0.0003, 4);
        expect(getRelativeLuminance('#020202')).toBeCloseTo(0.0011, 4);
      });

      it('should throw error for invalid hex colors', () => {
        expect(() => getRelativeLuminance('#invalid')).toThrow();
        expect(() => getRelativeLuminance('')).toThrow();
      });
    });
  });

  describe('Contrast ratio calculation', () => {
    describe('calculateContrastRatio', () => {
      it('should calculate exact contrast ratios for known color pairs', () => {
        // Black on white should be 21:1
        expect(calculateContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
        
        // White on black should be 21:1 (order doesn't matter)
        expect(calculateContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1);
        
        // Same color should be 1:1
        expect(calculateContrastRatio('#ff0000', '#ff0000')).toBe(1);
        expect(calculateContrastRatio('#808080', '#808080')).toBe(1);
      });

      it('should calculate contrast for common color combinations', () => {
        // Blue (#0000ff) on white
        expect(calculateContrastRatio('#0000ff', '#ffffff')).toBeCloseTo(8.59, 1);
        
        // Red (#ff0000) on white
        expect(calculateContrastRatio('#ff0000', '#ffffff')).toBeCloseTo(3.97, 1);
        
        // Green (#00ff00) on white
        expect(calculateContrastRatio('#00ff00', '#ffffff')).toBeCloseTo(1.37, 1);
      });

      it('should handle medium contrast combinations', () => {
        // Dark gray on light gray
        expect(calculateContrastRatio('#333333', '#cccccc')).toBeCloseTo(9.74, 1);
        
        // Navy on light blue
        expect(calculateContrastRatio('#003366', '#cce7ff')).toBeGreaterThan(4.5);
      });

      it('should return values between 1 and 21', () => {
        const ratio1 = calculateContrastRatio('#ff0000', '#00ff00');
        const ratio2 = calculateContrastRatio('#123456', '#abcdef');
        const ratio3 = calculateContrastRatio('#888888', '#777777');
        
        expect(ratio1).toBeGreaterThanOrEqual(1);
        expect(ratio1).toBeLessThanOrEqual(21);
        expect(ratio2).toBeGreaterThanOrEqual(1);
        expect(ratio2).toBeLessThanOrEqual(21);
        expect(ratio3).toBeGreaterThanOrEqual(1);
        expect(ratio3).toBeLessThanOrEqual(21);
      });

      it('should be commutative (order independent)', () => {
        const color1 = '#123456';
        const color2 = '#abcdef';
        
        expect(calculateContrastRatio(color1, color2))
          .toBe(calculateContrastRatio(color2, color1));
      });

      it('should throw error for invalid colors', () => {
        expect(() => calculateContrastRatio('#invalid', '#ffffff')).toThrow();
        expect(() => calculateContrastRatio('#ffffff', '#invalid')).toThrow();
        expect(() => calculateContrastRatio('', '#ffffff')).toThrow();
      });
    });
  });

  describe('WCAG compliance validation', () => {
    describe('isWCAGCompliant', () => {
      it('should correctly identify AA normal compliance', () => {
        // Black on white (21:1) should pass all levels
        expect(isWCAGCompliant('#000000', '#ffffff', 'AA', 'normal')).toBe(true);
        
        // 4.5:1 ratio should pass AA normal
        expect(isWCAGCompliant('#757575', '#ffffff', 'AA', 'normal')).toBe(true);
        
        // 3:1 ratio should fail AA normal
        expect(isWCAGCompliant('#949494', '#ffffff', 'AA', 'normal')).toBe(false);
      });

      it('should correctly identify AA large compliance', () => {
        // 3:1 ratio should pass AA large
        expect(isWCAGCompliant('#949494', '#ffffff', 'AA', 'large')).toBe(true);
        
        // 2.5:1 ratio should fail AA large
        expect(isWCAGCompliant('#a6a6a6', '#ffffff', 'AA', 'large')).toBe(false);
      });

      it('should correctly identify AAA normal compliance', () => {
        // 7:1 ratio should pass AAA normal
        expect(isWCAGCompliant('#595959', '#ffffff', 'AAA', 'normal')).toBe(true);
        
        // 6:1 ratio should fail AAA normal
        expect(isWCAGCompliant('#666666', '#ffffff', 'AAA', 'normal')).toBe(false);
      });

      it('should correctly identify AAA large compliance', () => {
        // 4.5:1 ratio should pass AAA large
        expect(isWCAGCompliant('#757575', '#ffffff', 'AAA', 'large')).toBe(true);
        
        // 3.5:1 ratio should fail AAA large
        expect(isWCAGCompliant('#808080', '#ffffff', 'AAA', 'large')).toBe(false);
      });

      it('should handle edge cases at exact thresholds', () => {
        // Test colors that are exactly at the threshold
        const mockCalculateContrastRatio = vi.fn();
        
        mockCalculateContrastRatio.mockReturnValue(4.5);
        expect(isWCAGCompliant('#test1', '#test2', 'AA', 'normal')).toBe(true);
        
        mockCalculateContrastRatio.mockReturnValue(4.49);
        expect(isWCAGCompliant('#test1', '#test2', 'AA', 'normal')).toBe(false);
      });
    });

    describe('getAccessibilityLevel', () => {
      it('should return correct accessibility levels for various ratios', () => {
        // High contrast should return AAA for both sizes
        expect(getAccessibilityLevel('#000000', '#ffffff')).toEqual({
          normal: 'AAA',
          large: 'AAA'
        });
        
        // Medium-high contrast
        expect(getAccessibilityLevel('#404040', '#ffffff')).toEqual({
          normal: 'AAA',
          large: 'AAA'
        });
      });

      it('should handle ratios that only meet AA standards', () => {
        // Should meet AA but not AAA for normal text
        const result = getAccessibilityLevel('#757575', '#ffffff');
        expect(result.normal).toBe('AA');
        expect(result.large).toBe('AAA');
      });

      it('should handle ratios that only meet AA large standards', () => {
        // Should only meet AA for large text
        const result = getAccessibilityLevel('#949494', '#ffffff');
        expect(result.normal).toBe('fail');
        expect(result.large).toBe('AA');
      });

      it('should return fail for insufficient contrast', () => {
        // Very low contrast should fail all standards
        const result = getAccessibilityLevel('#cccccc', '#ffffff');
        expect(result.normal).toBe('fail');
        expect(result.large).toBe('fail');
      });
    });
  });

  describe('Color validation and suggestions', () => {
    describe('validateColorCombination', () => {
      it('should return detailed validation results', () => {
        const result = validateColorCombination('#000000', '#ffffff');
        
        expect(result).toMatchObject({
          isAccessible: true,
          contrastRatio: expect.any(Number),
          level: expect.objectContaining({
            normal: expect.any(String),
            large: expect.any(String)
          }),
          passes: expect.objectContaining({
            'AA-normal': true,
            'AA-large': true,
            'AAA-normal': true,
            'AAA-large': true
          })
        });
      });

      it('should correctly identify failing combinations', () => {
        const result = validateColorCombination('#cccccc', '#ffffff');
        
        expect(result.isAccessible).toBe(false);
        expect(result.passes['AA-normal']).toBe(false);
        expect(result.passes['AA-large']).toBe(false);
        expect(result.passes['AAA-normal']).toBe(false);
        expect(result.passes['AAA-large']).toBe(false);
      });

      it('should handle partial compliance', () => {
        const result = validateColorCombination('#949494', '#ffffff');
        
        expect(result.passes['AA-normal']).toBe(false);
        expect(result.passes['AA-large']).toBe(true);
        expect(result.passes['AAA-normal']).toBe(false);
        expect(result.passes['AAA-large']).toBe(false);
      });
    });

    describe('generateAccessibleColorVariations', () => {
      it('should generate variations for insufficient contrast', () => {
        const variations = generateAccessibleColorVariations('#cccccc', '#ffffff');
        
        expect(variations).toHaveProperty('lighter');
        expect(variations).toHaveProperty('darker');
        expect(Array.isArray(variations.lighter)).toBe(true);
        expect(Array.isArray(variations.darker)).toBe(true);
      });

      it('should generate variations that meet accessibility standards', () => {
        const variations = generateAccessibleColorVariations('#cccccc', '#ffffff');
        
        // Check that generated variations actually have better contrast
        variations.darker.forEach(color => {
          const ratio = calculateContrastRatio(color, '#ffffff');
          expect(ratio).toBeGreaterThan(calculateContrastRatio('#cccccc', '#ffffff'));