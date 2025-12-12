import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  calculateContrastRatio,
  getRelativeLuminance,
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

// Mock colorjs.io/fn
vi.mock('colorjs.io/fn', () => ({
  sRGB: vi.fn(),
  LCH: vi.fn()
}));

describe('accessibility utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRelativeLuminance', () => {
    it('should calculate correct luminance for white', () => {
      const result = getRelativeLuminance('#ffffff');
      expect(result).toBe(1);
    });

    it('should calculate correct luminance for black', () => {
      const result = getRelativeLuminance('#000000');
      expect(result).toBe(0);
    });

    it('should calculate luminance for mid-tone colors', () => {
      const result = getRelativeLuminance('#808080');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should handle rgb format', () => {
      const result = getRelativeLuminance('rgb(128, 128, 128)');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should handle rgba format', () => {
      const result = getRelativeLuminance('rgba(128, 128, 128, 1)');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should throw error for invalid color format', () => {
      expect(() => getRelativeLuminance('invalid-color')).toThrow();
    });

    it('should handle 3-digit hex codes', () => {
      const result = getRelativeLuminance('#fff');
      expect(result).toBe(1);
    });

    it('should handle uppercase hex codes', () => {
      const result = getRelativeLuminance('#FFFFFF');
      expect(result).toBe(1);
    });
  });

  describe('calculateContrastRatio', () => {
    it('should return 21:1 for black text on white background', () => {
      const ratio = calculateContrastRatio('#000000', '#ffffff');
      expect(ratio).toBe(21);
    });

    it('should return 1:1 for same colors', () => {
      const ratio = calculateContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBe(1);
    });

    it('should return same ratio regardless of parameter order', () => {
      const ratio1 = calculateContrastRatio('#000000', '#ffffff');
      const ratio2 = calculateContrastRatio('#ffffff', '#000000');
      expect(ratio1).toBe(ratio2);
    });

    it('should calculate ratio for mid-tone colors', () => {
      const ratio = calculateContrastRatio('#666666', '#ffffff');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(21);
    });

    it('should handle different color formats', () => {
      const ratio1 = calculateContrastRatio('#000000', 'rgb(255, 255, 255)');
      const ratio2 = calculateContrastRatio('black', 'white');
      expect(ratio1).toBe(21);
      expect(ratio2).toBe(21);
    });

    it('should return precise decimal values', () => {
      const ratio = calculateContrastRatio('#767676', '#ffffff');
      expect(ratio).toBeCloseTo(4.54, 2);
    });

    it('should handle edge case colors', () => {
      const ratio = calculateContrastRatio('#010101', '#fefefe');
      expect(ratio).toBeCloseTo(20.6, 1);
    });
  });

  describe('WCAG compliance constants', () => {
    it('should have correct WCAG AA normal text threshold', () => {
      expect(WCAG_AA_NORMAL).toBe(4.5);
    });

    it('should have correct WCAG AA large text threshold', () => {
      expect(WCAG_AA_LARGE).toBe(3.0);
    });

    it('should have correct WCAG AAA normal text threshold', () => {
      expect(WCAG_AAA_NORMAL).toBe(7.0);
    });

    it('should have correct WCAG AAA large text threshold', () => {
      expect(WCAG_AAA_LARGE).toBe(4.5);
    });

    it('should have AAA thresholds higher than AA', () => {
      expect(WCAG_AAA_NORMAL).toBeGreaterThan(WCAG_AA_NORMAL);
      expect(WCAG_AAA_LARGE).toBeGreaterThan(WCAG_AA_LARGE);
    });
  });

  describe('isWCAGCompliant', () => {
    it('should return true for black text on white background (AA normal)', () => {
      const result = isWCAGCompliant('#000000', '#ffffff', 'AA', 'normal');
      expect(result).toBe(true);
    });

    it('should return true for black text on white background (AAA normal)', () => {
      const result = isWCAGCompliant('#000000', '#ffffff', 'AAA', 'normal');
      expect(result).toBe(true);
    });

    it('should return false for low contrast combinations', () => {
      const result = isWCAGCompliant('#cccccc', '#ffffff', 'AA', 'normal');
      expect(result).toBe(false);
    });

    it('should be more lenient for large text', () => {
      const result = isWCAGCompliant('#767676', '#ffffff', 'AA', 'large');
      expect(result).toBe(true);
    });

    it('should handle edge cases at exact thresholds', () => {
      // Mock a color combination that gives exactly 4.5:1 ratio
      const mockCalculateContrastRatio = vi.fn().mockReturnValue(4.5);
      vi.stubGlobal('calculateContrastRatio', mockCalculateContrastRatio);
      const result = isWCAGCompliant('#mock1', '#mock2', 'AA', 'normal');
      expect(result).toBe(true);
      vi.unstubAllGlobals();
    });

    it('should default to AA normal when parameters not specified', () => {
      const result = isWCAGCompliant('#000000', '#ffffff');
      expect(result).toBe(true);
    });

    it('should handle invalid level parameter', () => {
      expect(() => isWCAGCompliant('#000000', '#ffffff', 'invalid' as any)).toThrow();
    });

    it('should handle invalid size parameter', () => {
      expect(() => isWCAGCompliant('#000000', '#ffffff', 'AA', 'invalid' as any)).toThrow();
    });
  });

  describe('getAccessibilityLevel', () => {
    it('should return AAA for high contrast combinations', () => {
      const level = getAccessibilityLevel('#000000', '#ffffff', 'normal');
      expect(level).toBe('AAA');
    });

    it('should return AA for moderate contrast combinations', () => {
      // Mock a ratio between AA and AAA thresholds
      const mockCalculateContrastRatio = vi.fn().mockReturnValue(5.5);
      vi.stubGlobal('calculateContrastRatio', mockCalculateContrastRatio);
      const level = getAccessibilityLevel('#mock1', '#mock2', 'normal');
      expect(level).toBe('AA');
      vi.unstubAllGlobals();
    });

    it('should return fail for low contrast combinations', () => {
      const mockCalculateContrastRatio = vi.fn().mockReturnValue(2.0);
      vi.stubGlobal('calculateContrastRatio', mockCalculateContrastRatio);
      const level = getAccessibilityLevel('#mock1', '#mock2', 'normal');
      expect(level).toBe('fail');
      vi.unstubAllGlobals();
    });

    it('should have different thresholds for large text', () => {
      const mockCalculateContrastRatio = vi.fn().mockReturnValue(4.0);
      vi.stubGlobal('calculateContrastRatio', mockCalculateContrastRatio);
      const normalLevel = getAccessibilityLevel('#mock1', '#mock2', 'normal');
      const largeLevel = getAccessibilityLevel('#mock1', '#mock2', 'large');
      
      expect(normalLevel).toBe('fail');
      expect(largeLevel).toBe('AA');
      vi.unstubAllGlobals();
    });

    it('should default to normal text size', () => {
      const level1 = getAccessibilityLevel('#000000', '#ffffff');
      const level2 = getAccessibilityLevel('#000000', '#ffffff', 'normal');
      expect(level1).toBe(level2);
    });
  });

  describe('validateColorCombination', () => {
    it('should return valid result for compliant combinations', () => {
      const result = validateColorCombination('#000000', '#ffffff');
      expect(result.isValid).toBe(true);
      expect(result.contrastRatio).toBe(21);
      expect(result.wcagLevel).toBe('AAA');
      expect(result.issues).toHaveLength(0);
    });

    it('should return invalid result for non-compliant combinations', () => {
      const result = validateColorCombination('#cccccc', '#ffffff');
      expect(result.isValid).toBe(false);
      expect(result.contrastRatio).toBeLessThan(4.5);
      expect(result.wcagLevel).toBe('fail');
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should include specific issues in the result', () => {
      const result = validateColorCombination('#cccccc', '#ffffff');
      expect(result.issues).toContain('Does not meet WCAG AA standards for normal text');
    });

    it('should validate for specific text size', () => {
      const result = validateColorCombination('#767676', '#ffffff', 'large');
      expect(result.textSize).toBe('large');
    });

    it('should include recommendations for improvement', () => {
      const result = validateColorCombination('#cccccc', '#ffffff');
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle color parsing errors gracefully', () => {
      const result = validateColorCombination('invalid-color', '#ffffff');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid color format');
    });
  });

  describe('generateAccessibleColorVariations', () => {
    it('should generate darker variations for light colors', () => {
      const variations = generateAccessibleColorVariations('#cccccc', '#ffffff');
      expect(variations.length).toBeGreaterThan(0);
      variations.forEach(variation => {
        expect(variation.contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should generate lighter variations for dark colors', () => {
      const variations = generateAccessibleColorVariations('#333333', '#000000');
      expect(variations.length).toBeGreaterThan(0);
    });

    it('should limit the number of variations', () => {
      const variations = generateAccessibleColorVariations('#888888', '#ffffff');
      expect(variations.length).toBeLessThanOrEqual(10);
    });

    it('should include contrast ratios in results', () => {
      const variations = generateAccessibleColorVariations('#888888', '#ffffff');
      variations.forEach(variation => {
        expect(variation.contrastRatio).toBeDefined();
        expect(typeof variation.contrastRatio).toBe('number');
      });
    });

    it('should include WCAG levels in results', () => {
      const variations = generateAccessibleColorVariations('#888888', '#ffffff');
      variations.forEach(variation => {
        expect(['AA', 'AAA']).toContain(variation.wcagLevel);
      });
    });

    it('should return empty array for already compliant colors', () => {
      const variations = generateAccessibleColorVariations('#000000', '#ffffff');
      expect(variations.length).toBe(0);
    });
  });

  describe('suggestAccessibleAlternatives', () => {
    it('should suggest alternatives for non-compliant combinations', () => {
      const suggestions = suggestAccessibleAlternatives('#cccccc', '#ffffff');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should include both text and background alternatives', () => {
      const suggestions = suggestAccessibleAlternatives('#cccccc', '#ffffff');
      const textAlternatives = suggestions.filter(s => s.type === 'text');
      const backgroundAlternatives = suggestions.filter(s => s.type === 'background');
      
      expect(textAlternatives.length).toBeGreaterThan(0);
      expect(backgroundAlternatives.length).toBeGreaterThan(0);
    });

    it('should prioritize minimal changes', () => {
      const suggestions = suggestAccessibleAlternatives('#cccccc', '#ffffff');
      const firstSuggestion = suggestions[0];
      expect(firstSuggestion.priority).toBe('high');
    });

    it('should include color distance information', () => {
      const suggestions = suggestAccessibleAlternatives('#cccccc', '#ffffff');
      suggestions.forEach(suggestion => {
        expect(suggestion.colorDistance).toBeDefined();
        expect(typeof suggestion.colorDistance).toBe('number');
      });
    });

    it('should return empty array for compliant combinations', () => {
      const suggestions = suggestAccessibleAlternatives('#000000', '#ffffff');
      expect(suggestions.length).toBe(0);
    });

    it('should handle edge cases gracefully', () => {
      const suggestions = suggestAccessibleAlternatives('#fefefe', '#ffffff');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('ACCESSIBLE_COLOR_PAIRS', () => {
    it('should have light theme color pairs', () => {
      expect(ACCESSIBLE_COLOR_PAIRS.light).toBeDefined();
      expect(ACCESSIBLE_COLOR_PAIRS.light.background).toBe('#ffffff');
      expect(ACCESSIBLE_COLOR_PAIRS.light.text).toBe('#1a1a1a');
    });

    it('should have dark theme color pairs', () => {
      expect(ACCESSIBLE_COLOR_PAIRS.dark).toBeDefined();
    });

    it('should have all required color categories', () => {
      const requiredColors = ['background', 'text', 'textSecondary', 'textMuted', 'primary', 'success', 'warning', 'error'];
      
      requiredColors.forEach(color => {
        expect(ACCESSIBLE_COLOR_PAIRS.light[color]).toBeDefined();
        expect(typeof ACCESSIBLE_COLOR_PAIRS.light[color]).toBe('string');
      });
    });

    it('should have WCAG compliant color combinations', () => {
      const { light } = ACCESSIBLE_COLOR_PAIRS;
      const textOnBackground = calculateContrastRatio(light.text, light.background);
      const primaryOnBackground = calculateContrastRatio(light.primary, light.background);
      
      expect(textOnBackground).toBeGreaterThanOrEqual(4.5);
      expect(primaryOnBackground).toBeGreaterThanOrEqual(4.5);
    });

    it('should maintain color contrast across semantic colors', () => {
      const { light } = ACCESSIBLE_COLOR_PAIRS;
      const semanticColors = ['success', 'warning', 'error'];
      
      semanticColors.forEach(color => {
        const ratio = calculateContrastRatio(light[color], light.background);
        expect(ratio).toBeGreaterThanOrEqual(3.0); // At least AA Large
      });
    });
  });

  describe('integration tests', () => {
    it('should handle complete workflow for color accessibility validation', () => {
      const textColor = '#666666';
      const backgroundColor = '#ffffff';
      
      // Validate the combination
      const validation = validateColorCombination(textColor, backgroundColor);
      expect(validation).toBeDefined();
      
      // If not compliant, get suggestions
      if (!validation.isValid) {
        const suggestions = suggestAccessibleAlternatives(textColor, backgroundColor);
        expect(suggestions.length).toBeGreaterThan(0);
        
        // Test the first suggestion
        const firstSuggestion = suggestions[0];
        const newValidation = validateColorCombination(
          firstSuggestion.type === 'text' ? firstSuggestion.color : textColor,
          firstSuggestion.type === 'background' ? firstSuggestion.color : backgroundColor
        );
        expect(newValidation.isValid).toBe(true);
      }
    });

    it('should provide consistent results across different functions', () => {
      const textColor = '#000000';
      const backgroundColor = '#ffffff';
      
      const contrastRatio = calculateContrastRatio(textColor, backgroundColor);
      const isCompliant = isWCAGCompliant(textColor, backgroundColor, 'AA', 'normal');
      const accessibilityLevel = getAccessibilityLevel(textColor, backgroundColor, 'normal');
      const validation = validateColorCombination(textColor, backgroundColor);
      
      expect(validation.contrastRatio).toBe(contrastRatio);
      expect(validation.isValid).toBe(isCompliant);
      expect(validation.wcagLevel).toBe(accessibilityLevel);
    });

    it('should handle error cases gracefully in the full workflow', () => {
      const invalidColor = 'invalid-color';
      const validColor = '#ffffff';
      
      const validation = validateColorCombination(invalidColor, validColor);
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Invalid color format');
      
      const suggestions = suggestAccessibleAlternatives(invalidColor, validColor);
      expect(suggestions.length).toBe(0);
    });
  });
});