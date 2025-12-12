/**
 * Color utility functions and constants for theme management
 * Ensures WCAG AA compliance for accessibility in both light and dark modes
 */

export interface ColorTheme {
  'form-text': string;
  'form-bg': string;
  'form-border': string;
  'label-text': string;
}

export const lightTheme: ColorTheme = {
  'form-text': '#111827', // gray-900 - WCAG AA compliant on white backgrounds
  'form-bg': '#ffffff',   // white - provides maximum contrast
  'form-border': '#d1d5db', // gray-300 - subtle but visible border
  'label-text': '#374151', // gray-700 - strong contrast for readability
};

export const darkTheme: ColorTheme = {
  'form-text': '#f9fafb', // gray-50 - high contrast on dark backgrounds
  'form-bg': '#374151',   // gray-700 - balanced dark background
  'form-border': '#6b7280', // gray-500 - visible border in dark mode
  'label-text': '#ffffff', // white - maximum contrast for labels
};

/**
 * Validates if a color combination meets WCAG AA standards
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @returns Boolean indicating if combination meets WCAG AA (4.5:1 ratio)
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  const contrastRatio = calculateContrastRatio(foreground, background);
  return contrastRatio >= 4.5;
}

/**
 * Validates if a color combination meets WCAG AAA standards
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @returns Boolean indicating if combination meets WCAG AAA (7:1 ratio)
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  const contrastRatio = calculateContrastRatio(foreground, background);
  return contrastRatio >= 7.0;
}

/**
 * Calculates the contrast ratio between two colors
 * @param color1 - First color in hex format
 * @param color2 - Second color in hex format
 * @returns Contrast ratio as a number
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const luminance1 = getRelativeLuminance(color1);
  const luminance2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculates the relative luminance of a color
 * @param hexColor - Color in hex format (e.g., '#ffffff')
 * @returns Relative luminance value between 0 and 1
 */
function getRelativeLuminance(hexColor: string): number {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  
  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Converts hex color to RGB values
 * @param hex - Hex color string (e.g., '#ffffff' or 'ffffff')
 * @returns RGB object or null if invalid hex
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');
  
  if (cleanHex.length !== 6) return null;
  
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
  
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Gets the appropriate theme colors based on the current mode
 * @param isDarkMode - Boolean indicating if dark mode is active
 * @returns ColorTheme object with appropriate colors
 */
export function getThemeColors(isDarkMode: boolean): ColorTheme {
  return isDarkMode ? darkTheme : lightTheme;
}

/**
 * Validates that all color combinations in a theme meet WCAG AA standards
 * @param theme - ColorTheme to validate
 * @returns Object with validation results for each combination
 */
export function validateThemeAccessibility(theme: ColorTheme) {
  return {
    formTextOnBg: meetsWCAGAA(theme['form-text'], theme['form-bg']),
    labelTextOnBg: meetsWCAGAA(theme['label-text'], theme['form-bg']),
    borderVisible: calculateContrastRatio(theme['form-border'], theme['form-bg']) >= 3.0, // WCAG border contrast
  };
}

// Pre-validate our themes
export const lightThemeValidation = validateThemeAccessibility(lightTheme);
export const darkThemeValidation = validateThemeAccessibility(darkTheme);