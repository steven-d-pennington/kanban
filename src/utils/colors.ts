import { z } from 'zod';

/**
 * Color constants for consistent theming
 */
export const COLORS = {
  // Primary colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    900: '#1e3a8a',
  },
  // Neutral colors
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    500: '#6b7280',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Semantic colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    700: '#a16207',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    700: '#b91c1c',
  },
  // Text colors
  text: {
    light: '#ffffff',
    dark: '#111827',
    muted: '#6b7280',
  },
} as const;

/**
 * Color schema for validation
 */
const colorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format');

/**
 * RGB color interface
 */
interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB values
 * @param hex - Hex color string (e.g., '#ffffff' or '#fff')
 * @returns RGB color object
 */
export function hexToRgb(hex: string): RGBColor {
  const validatedHex = colorSchema.parse(hex);
  const cleanHex = validatedHex.replace('#', '');
  
  // Handle 3-character hex codes
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;

  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);

  return { r, g, b };
}

/**
 * Calculate relative luminance of a color
 * @param rgb - RGB color object
 * @returns Relative luminance value (0-1)
 */
export function calculateLuminance(rgb: RGBColor): number {
  const { r, g, b } = rgb;
  
  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 * @param color1 - First color in hex format
 * @param color2 - Second color in hex format
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const luminance1 = calculateLuminance(rgb1);
  const luminance2 = calculateLuminance(rgb2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate if contrast ratio meets WCAG standards
 * @param backgroundColor - Background color in hex format
 * @param textColor - Text color in hex format
 * @param level - WCAG compliance level ('AA' or 'AAA')
 * @param isLargeText - Whether the text is considered large (18pt+ or 14pt+ bold)
 * @returns Whether the contrast meets the specified standard
 */
export function validateContrast(
  backgroundColor: string,
  textColor: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const contrastRatio = calculateContrastRatio(backgroundColor, textColor);
  
  const thresholds = {
    AA: isLargeText ? 3 : 4.5,
    AAA: isLargeText ? 4.5 : 7,
  };
  
  return contrastRatio >= thresholds[level];
}

/**
 * Get appropriate text color (light or dark) for a given background color
 * @param backgroundColor - Background color in hex format
 * @param lightColor - Light text color (default: white)
 * @param darkColor - Dark text color (default: dark gray)
 * @returns Appropriate text color
 */
export function getTextColorForBackground(
  backgroundColor: string,
  lightColor: string = COLORS.text.light,
  darkColor: string = COLORS.text.dark
): string {
  const lightContrast = calculateContrastRatio(backgroundColor, lightColor);
  const darkContrast = calculateContrastRatio(backgroundColor, darkColor);
  
  return lightContrast > darkContrast ? lightColor : darkColor;
}

/**
 * Generate color palette variations
 * @param baseColor - Base color in hex format
 * @param steps - Number of variations to generate
 * @returns Array of color variations from light to dark
 */
export function generateColorPalette(baseColor: string, steps: number = 9): string[] {
  const baseRgb = hexToRgb(baseColor);
  const palette: string[] = [];
  
  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    
    // Create lighter and darker variations
    let r: number, g: number, b: number;
    
    if (factor <= 0.5) {
      // Lighter variations
      const lightFactor = 1 - factor * 2;
      r = Math.round(baseRgb.r + (255 - baseRgb.r) * lightFactor);
      g = Math.round(baseRgb.g + (255 - baseRgb.g) * lightFactor);
      b = Math.round(baseRgb.b + (255 - baseRgb.b) * lightFactor);
    } else {
      // Darker variations
      const darkFactor = (factor - 0.5) * 2;
      r = Math.round(baseRgb.r * (1 - darkFactor));
      g = Math.round(baseRgb.g * (1 - darkFactor));
      b = Math.round(baseRgb.b * (1 - darkFactor));
    }
    
    const hexR = r.toString(16).padStart(2, '0');
    const hexG = g.toString(16).padStart(2, '0');
    const hexB = b.toString(16).padStart(2, '0');
    
    palette.push(`#${hexR}${hexG}${hexB}`);
  }
  
  return palette;
}

/**
 * Check if a color is considered 'light' or 'dark'
 * @param color - Color in hex format
 * @returns Whether the color is light (true) or dark (false)
 */
export function isLightColor(color: string): boolean {
  const rgb = hexToRgb(color);
  const luminance = calculateLuminance(rgb);
  return luminance > 0.5;
}

/**
 * Get CSS custom property for a color
 * @param colorPath - Dot notation path to color (e.g., 'primary.500')
 * @returns CSS custom property string
 */
export function getColorVariable(colorPath: string): string {
  return `var(--color-${colorPath.replace('.', '-')})`;
}

/**
 * Generate CSS custom properties from color constants
 * @returns CSS custom properties object
 */
export function generateCSSVariables(): Record<string, string> {
  const cssVariables: Record<string, string> = {};
  
  const flatten = (obj: any, prefix: string = '') => {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}-${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        flatten(value, newKey);
      } else {
        cssVariables[`--color-${newKey}`] = value;
      }
    });
  };
  
  flatten(COLORS);
  return cssVariables;
}