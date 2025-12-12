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
      it('should convert hex color to RGB object', () => {
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
        expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      });

      it('should handle 3-character hex codes', () => {
        expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#00f')).toEqual({ r: 0, g: 0, b: 255 });
      });

      it('should handle hex codes without hash', () => {
        expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('f00')).toEqual({ r: 255, g: 0, b: 0 });
      });

      it('should handle case insensitive hex codes', () => {
        expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      });

      it('should return null for invalid hex colors', () => {
        expect(hexToRgb('invalid')).toBeNull();
        expect(hexToRgb('#gg0000')).toBeNull();
        expect(hexToRgb('#ff00')).toBeNull();
        expect(hexToRgb('')).toBeNull();
      });
    });

    describe('rgbToHex', () => {
      it('should convert RGB values to hex string', () => {
        expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
        expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
        expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
        expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
        expect(rgbToHex(0, 0, 0)).toBe('#000000');
      });

      it('should handle partial RGB values', () => {
        expect(rgbToHex(128, 128, 128)).toBe('#808080');
        expect(rgbToHex(17, 34, 51)).toBe('#112233');
      });

      it('should clamp values outside 0-255 range', () => {
        expect(rgbToHex(-1, 0, 0)).toBe('#000000');
        expect(rgbToHex(256, 0, 0)).toBe('#ff0000');
        expect(rgbToHex(255, -1, 300)).toBe('#ff00ff');
      });
    });
  });

  describe('Relative luminance calculation', () => {
    describe('getRelativeLuminance', () => {
      it('should calculate correct luminance for pure colors', () => {
        expect(getRelativeLuminance('#ffffff')).toBeCloseTo(1, 2);
        expect(getRelativeLuminance('#000000')).toBeCloseTo(0, 2);
        expect(getRelativeLuminance('#ff0000')).toBeCloseTo(0.2126, 3);
        expect(getRelativeLuminance('#00ff00')).toBeCloseTo(0.7152, 3);
        expect(getRelativeLuminance('#0000ff')).toBeCloseTo(0.0722, 3);
      });

      it('should handle gray colors correctly', () => {
        expect(getRelativeLuminance('#808080')).toBeCloseTo(0.216, 2);
        expect(getRelativeLuminance('#c0c0c0')).toBeCloseTo(0.598, 2);
      });

      it('should return 0 for invalid colors', () => {
        expect(getRelativeLuminance('invalid')).toBe(0);
        expect(getRelativeLuminance('')).toBe(0);
      });
    });
  });

  describe('Contrast ratio calculation', () => {
    describe('calculateContrastRatio', () => {
      it('should calculate correct contrast ratios', () => {
        expect(calculateContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1);
        expect(calculateContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
        expect(calculateContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
        expect(calculateContrastRatio('#000000', '#000000')).toBeCloseTo(1, 1);
      });

      it('should handle common color combinations', () => {
        expect(calculateContrastRatio('#000000', '#808080')).toBeCloseTo(5.31, 1);
        expect(calculateContrastRatio('#ffffff', '#808080')).toBeCloseTo(3.95, 1);
        expect(calculateContrastRatio('#0066cc', '#ffffff')).toBeCloseTo(6.07, 1);
      });

      it('should return 1 for invalid colors', () => {
        expect(calculateContrastRatio('invalid', '#ffffff')).toBe(1);
        expect(calculateContrastRatio('#ffffff', 'invalid')).toBe(1);
        expect(calculateContrastRatio('', '')).toBe(1);
      });
    });
  });

  describe('WCAG compliance checking', () => {
    describe('isWCAGCompliant', () => {
      it('should correctly identify AA normal compliance', () => {
        expect(isWCAGCompliant('#000000', '#ffffff', WCAG_AA_NORMAL)).toBe(true);
        expect(isWCAGCompliant('#0066cc', '#ffffff', WCAG_AA_NORMAL)).toBe(true);
        expect(isWCAGCompliant('#808080', '#ffffff', WCAG_AA_NORMAL)).toBe(false);
      });

      it('should correctly identify AA large compliance', () => {
        expect(isWCAGCompliant('#000000', '#ffffff', WCAG_AA_LARGE)).toBe(true);
        expect(isWCAGCompliant('#808080', '#ffffff', WCAG_AA_LARGE)).toBe(true);
        expect(isWCAGCompliant('#999999', '#ffffff', WCAG_AA_LARGE)).toBe(false);
      });

      it('should correctly identify AAA compliance', () => {
        expect(isWCAGCompliant('#000000', '#ffffff', WCAG_AAA_NORMAL)).toBe(true);
        expect(isWCAGCompliant('#0066cc', '#ffffff', WCAG_AAA_NORMAL)).toBe(false);
        expect(isWCAGCompliant('#000000', '#ffffff', WCAG_AAA_LARGE)).toBe(true);
      });

      it('should handle edge cases', () => {
        expect(isWCAGCompliant('invalid', '#ffffff', WCAG_AA_NORMAL)).toBe(false);
        expect(isWCAGCompliant('#ffffff', 'invalid', WCAG_AA_NORMAL)).toBe(false);
      });
    });

    describe('getAccessibilityLevel', () => {
      it('should return correct accessibility levels', () => {
        expect(getAccessibilityLevel('#000000', '#ffffff')).toBe('AAA');
        expect(getAccessibilityLevel('#0066cc', '#ffffff')).toBe('AA');
        expect(getAccessibilityLevel('#808080', '#ffffff')).toBe('AA-Large');
        expect(getAccessibilityLevel('#999999', '#ffffff')).toBe('Fail');
      });

      it('should handle invalid colors', () => {
        expect(getAccessibilityLevel('invalid', '#ffffff')).toBe('Fail');
        expect(getAccessibilityLevel('#ffffff', 'invalid')).toBe('Fail');
      });
    });
  });

  describe('Color validation and suggestions', () => {
    describe('validateColorCombination', () => {
      it('should return correct validation results', () => {
        const result = validateColorCombination('#000000', '#ffffff');
        expect(result.isValid).toBe(true);
        expect(result.contrastRatio).toBeCloseTo(21, 1);
        expect(result.level).toBe('AAA');
        expect(result.wcagAA).toBe(true);
        expect(result.wcagAAA).toBe(true);
      });

      it('should handle failing combinations', () => {
        const result = validateColorCombination('#cccccc', '#ffffff');
        expect(result.isValid).toBe(false);
        expect(result.contrastRatio).toBeLessThan(4.5);
        expect(result.level).toBe('Fail');
        expect(result.wcagAA).toBe(false);
        expect(result.wcagAAA).toBe(false);
      });

      it('should provide suggestions for failing combinations', () => {
        const result = validateColorCombination('#cccccc', '#ffffff');
        expect(result.suggestions).toBeInstanceOf(Array);
        expect(result.suggestions.length).toBeGreaterThan(0);
      });
    });

    describe('suggestAccessibleAlternatives', () => {
      it('should suggest accessible alternatives', () => {
        const alternatives = suggestAccessibleAlternatives('#cccccc', '#ffffff');
        expect(alternatives).toBeInstanceOf(Array);
        expect(alternatives.length).toBeGreaterThan(0);
        
        alternatives.forEach(alt => {
          expect(alt).toHaveProperty('foreground');
          expect(alt).toHaveProperty('background');
          expect(alt).toHaveProperty('contrastRatio');
          expect(alt).toHaveProperty('level');
          expect(alt.contrastRatio).toBeGreaterThanOrEqual(4.5);
        });
      });

      it('should return empty array for already accessible combinations', () => {
        const alternatives = suggestAccessibleAlternatives('#000000', '#ffffff');
        expect(alternatives).toEqual([]);
      });

      it('should handle invalid colors gracefully', () => {
        const alternatives = suggestAccessibleAlternatives('invalid', '#ffffff');
        expect(alternatives).toBeInstanceOf(Array);
      });
    });

    describe('generateAccessibleColorVariations', () => {
      it('should generate accessible color variations', () => {
        const variations = generateAccessibleColorVariations('#0066cc');
        expect(variations).toBeInstanceOf(Array);
        expect(variations.length).toBeGreaterThan(0);
        
        variations.forEach(variation => {
          expect(variation).toHaveProperty('color');
          expect(variation).toHaveProperty('onWhite');
          expect(variation).toHaveProperty('onBlack');
          expect(variation.onWhite.contrastRatio).toBeGreaterThanOrEqual(4.5);
        });
      });

      it('should handle invalid colors', () => {
        const variations = generateAccessibleColorVariations('invalid');
        expect(variations).toBeInstanceOf(Array);
        expect(variations.length).toBe(0);
      });

      it('should generate variations with different luminance levels', () => {
        const variations = generateAccessibleColorVariations('#0066cc');
        const luminances = variations.map(v => getRelativeLuminance(v.color));
        expect(new Set(luminances).size).toBeGreaterThan(1);
      });
    });
  });

  describe('Constants and predefined values', () => {
    it('should have correct WCAG threshold constants', () => {
      expect(WCAG_AA_NORMAL).toBe(4.5);
      expect(WCAG_AA_LARGE).toBe(3);
      expect(WCAG_AAA_NORMAL).toBe(7);
      expect(WCAG_AAA_LARGE).toBe(4.5);
    });

    describe('ACCESSIBLE_COLOR_PAIRS', () => {
      it('should contain valid accessible color pairs', () => {
        expect(ACCESSIBLE_COLOR_PAIRS).toBeInstanceOf(Array);
        expect(ACCESSIBLE_COLOR_PAIRS.length).toBeGreaterThan(0);
        
        ACCESSIBLE_COLOR_PAIRS.forEach(pair => {
          expect(pair).toHaveProperty('foreground');
          expect(pair).toHaveProperty('background');
          expect(pair).toHaveProperty('name');
          expect(typeof pair.foreground).toBe('string');
          expect(typeof pair.background).toBe('string');
          expect(typeof pair.name).toBe('string');
          
          const contrastRatio = calculateContrastRatio(pair.foreground, pair.background);
          expect(contrastRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        });
      });

      it('should have unique pair names', () => {
        const names = ACCESSIBLE_COLOR_PAIRS.map(pair => pair.name);
        const uniqueNames = new Set(names);
        expect(names.length).toBe(uniqueNames.size);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(calculateContrastRatio(null as any, '#ffffff')).toBe(1);
      expect(calculateContrastRatio(undefined as any, '#ffffff')).toBe(1);
      expect(isWCAGCompliant(null as any, '#ffffff', WCAG_AA_NORMAL)).toBe(false);
      expect(getAccessibilityLevel(undefined as any, '#ffffff')).toBe('Fail');
    });

    it('should handle empty strings', () => {
      expect(calculateContrastRatio('', '')).toBe(1);
      expect(isWCAGCompliant('', '#ffffff', WCAG_AA_NORMAL)).toBe(false);
      expect(getAccessibilityLevel('', '#ffffff')).toBe('Fail');
    });

    it('should handle malformed hex codes', () => {
      const malformedCodes = ['#', '#ff', '#ffff', '#gggggg', 'rgb(255,0,0)', 'red'];
      
      malformedCodes.forEach(code => {
        expect(hexToRgb(code)).toBeNull();
        expect(getRelativeLuminance(code)).toBe(0);
        expect(calculateContrastRatio(code, '#ffffff')).toBe(1);
      });
    });

    it('should handle extreme RGB values in rgbToHex', () => {
      expect(rgbToHex(-100, -100, -100)).toBe('#000000');
      expect(rgbToHex(1000, 1000, 1000)).toBe('#ffffff');