import { z } from 'zod';

/**
 * Color schema for validation
 */
const ColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

/**
 * WCAG contrast level type
 */
export type ContrastLevel = 'AA' | 'AAA';

/**
 * RGB color interface
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Contrast ratio result interface
 */
export interface ContrastResult {
  ratio: number;
  isAccessible: boolean;
  level: ContrastLevel;
}

/**
 * Convert hex color to RGB values
 * @param hex - Hex color string (e.g., '#ff0000')
 * @returns RGB color object
 */
export const hexToRgb = (hex: string): RGBColor => {
  const validatedHex = ColorSchema.parse(hex);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(validatedHex);
  
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
};

/**
 * Convert RGB color to hex string
 * @param rgb - RGB color object
 * @returns Hex color string
 */
export const rgbToHex = (rgb: RGBColor): string => {
  const toHex = (n: number): string => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

/**
 * Calculate relative luminance of a color
 * @param rgb - RGB color object
 * @returns Relative luminance value (0-1)
 */
export const getRelativeLuminance = (rgb: RGBColor): number => {
  const { r, g, b } = rgb;

  // Normalize RGB values to 0-1 range
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;

  // Apply gamma correction
  const linearize = (c: number): number => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLinear = linearize(rs);
  const gLinear = linearize(gs);
  const bLinear = linearize(bs);

  // Calculate relative luminance using WCAG formula
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

/**
 * Calculate contrast ratio between two colors
 * @param color1 - First color (hex string)
 * @param color2 - Second color (hex string)
 * @returns Contrast ratio (1-21)
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const luminance1 = getRelativeLuminance(rgb1);
  const luminance2 = getRelativeLuminance(rgb2);

  // Ensure lighter color is numerator for proper ratio calculation
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast ratio meets WCAG accessibility standards
 * @param foreground - Foreground color (hex string)
 * @param background - Background color (hex string)
 * @param level - WCAG compliance level ('AA' or 'AAA')
 * @returns Boolean indicating if contrast is accessible
 */
export const isAccessibleContrast = (
  foreground: string,
  background: string,
  level: ContrastLevel = 'AA'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const threshold = level === 'AAA' ? 7 : 4.5;
  
  return ratio >= threshold;
};

/**
 * Get detailed contrast analysis
 * @param foreground - Foreground color (hex string)
 * @param background - Background color (hex string)
 * @returns Detailed contrast result
 */
export const getContrastAnalysis = (
  foreground: string,
  background: string
): ContrastResult & {
  meetsAA: boolean;
  meetsAAA: boolean;
  largeTextAA: boolean;
  largeTextAAA: boolean;
} => {
  const ratio = getContrastRatio(foreground, background);
  
  return {
    ratio,
    isAccessible: ratio >= 4.5,
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'AA',
    meetsAA: ratio >= 4.5,
    meetsAAA: ratio >= 7,
    largeTextAA: ratio >= 3,
    largeTextAAA: ratio >= 4.5,
  };
};

/**
 * Generate accessible color palette based on a base color
 * @param baseColor - Base color (hex string)
 * @param steps - Number of color variations to generate
 * @returns Array of accessible color combinations
 */
export const generateAccessiblePalette = (
  baseColor: string,
  steps: number = 5
): Array<{ color: string; onColor: string; contrast: number }> => {
  const baseRgb = hexToRgb(baseColor);
  const palette: Array<{ color: string; onColor: string; contrast: number }> = [];

  for (let i = 0; i < steps; i++) {
    const lightness = (i / (steps - 1)) * 0.8 + 0.1; // 0.1 to 0.9
    
    // Generate color by adjusting lightness
    const adjustedRgb: RGBColor = {
      r: Math.round(baseRgb.r * lightness),
      g: Math.round(baseRgb.g * lightness),
      b: Math.round(baseRgb.b * lightness),
    };
    
    const color = rgbToHex(adjustedRgb);
    
    // Determine accessible text color (white or black)
    const whiteContrast = getContrastRatio(color, '#ffffff');
    const blackContrast = getContrastRatio(color, '#000000');
    
    const onColor = whiteContrast >= blackContrast ? '#ffffff' : '#000000';
    const contrast = Math.max(whiteContrast, blackContrast);
    
    palette.push({
      color,
      onColor,
      contrast,
    });
  }

  return palette.filter(item => item.contrast >= 4.5);
};

/**
 * Find the most accessible color from a list of options
 * @param backgroundColor - Background color (hex string)
 * @param colorOptions - Array of color options (hex strings)
 * @param level - WCAG compliance level
 * @returns Most accessible color option or null if none meet requirements
 */
export const findMostAccessibleColor = (
  backgroundColor: string,
  colorOptions: string[],
  level: ContrastLevel = 'AA'
): string | null => {
  let bestColor: string | null = null;
  let bestRatio = 0;

  for (const color of colorOptions) {
    try {
      const ratio = getContrastRatio(backgroundColor, color);
      
      if (ratio > bestRatio && isAccessibleContrast(backgroundColor, color, level)) {
        bestColor = color;
        bestRatio = ratio;
      }
    } catch (error) {
      // Skip invalid colors
      continue;
    }
  }

  return bestColor;
};

/**
 * Validate color accessibility for text content
 * @param textColor - Text color (hex string)
 * @param backgroundColor - Background color (hex string)
 * @param fontSize - Font size in pixels
 * @param fontWeight - Font weight (normal or bold)
 * @returns Accessibility validation result
 */
export const validateTextAccessibility = (
  textColor: string,
  backgroundColor: string,
  fontSize: number = 16,
  fontWeight: 'normal' | 'bold' = 'normal'
): {
  isAccessible: boolean;
  ratio: number;
  requiredRatio: number;
  level: ContrastLevel | 'fail';
  isLargeText: boolean;
} => {
  const ratio = getContrastRatio(textColor, backgroundColor);
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold');
  
  const normalTextAAThreshold = 4.5;
  const normalTextAAAThreshold = 7;
  const largeTextAAThreshold = 3;
  const largeTextAAAThreshold = 4.5;
  
  const requiredRatio = isLargeText ? largeTextAAThreshold : normalTextAAThreshold;
  const aaaRequiredRatio = isLargeText ? largeTextAAAThreshold : normalTextAAAThreshold;
  
  let level: ContrastLevel | 'fail' = 'fail';
  if (ratio >= aaaRequiredRatio) {
    level = 'AAA';
  } else if (ratio >= requiredRatio) {
    level = 'AA';
  }
  
  return {
    isAccessible: ratio >= requiredRatio,
    ratio,
    requiredRatio,
    level,
    isLargeText,
  };
};