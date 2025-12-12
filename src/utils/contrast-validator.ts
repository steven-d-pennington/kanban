import { hexToRgb, rgbToHex } from './color-utils';

/**
 * Converts RGB values to relative luminance
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Relative luminance value (0-1)
 */
const getRelativeLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculates the contrast ratio between two colors
 * @param color1 - First color (hex, rgb, or rgba string)
 * @param color2 - Second color (hex, rgb, or rgba string)
 * @returns Contrast ratio (1-21)
 */
export const calculateContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format provided');
  }

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Parses a color string and returns RGB values
 * @param color - Color string (hex, rgb, or rgba)
 * @returns RGB object or null if invalid
 */
const parseColor = (color: string): { r: number; g: number; b: number } | null => {
  const normalizedColor = color.trim().toLowerCase();

  // Handle hex colors
  if (normalizedColor.startsWith('#')) {
    return hexToRgb(normalizedColor);
  }

  // Handle rgb/rgba colors
  const rgbMatch = normalizedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Handle named colors (basic set)
  const namedColors: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    gray: '#808080',
    grey: '#808080',
  };

  if (namedColors[normalizedColor]) {
    return hexToRgb(namedColors[normalizedColor]);
  }

  return null;
};

/**
 * Validates color contrast ratio against WCAG standards
 * @param foreground - Foreground color
 * @param background - Background color
 * @param level - WCAG compliance level ('AA' | 'AAA')
 * @param size - Text size category ('normal' | 'large')
 * @returns Whether the contrast meets the specified standard
 */
export const validateContrast = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean => {
  try {
    const ratio = calculateContrastRatio(foreground, background);
    
    const thresholds = {
      AA: { normal: 4.5, large: 3 },
      AAA: { normal: 7, large: 4.5 },
    };

    return ratio >= thresholds[level][size];
  } catch {
    return false;
  }
};

/**
 * Gets the contrast ratio category based on WCAG standards
 * @param foreground - Foreground color
 * @param background - Background color
 * @returns Contrast category and ratio
 */
export const getContrastInfo = (
  foreground: string,
  background: string
): {
  ratio: number;
  aa: { normal: boolean; large: boolean };
  aaa: { normal: boolean; large: boolean };
  grade: 'Fail' | 'AA' | 'AAA';
} => {
  try {
    const ratio = calculateContrastRatio(foreground, background);
    
    const aa = {
      normal: ratio >= 4.5,
      large: ratio >= 3,
    };
    
    const aaa = {
      normal: ratio >= 7,
      large: ratio >= 4.5,
    };

    let grade: 'Fail' | 'AA' | 'AAA' = 'Fail';
    if (aaa.normal && aaa.large) {
      grade = 'AAA';
    } else if (aa.normal && aa.large) {
      grade = 'AA';
    }

    return { ratio, aa, aaa, grade };
  } catch {
    return {
      ratio: 0,
      aa: { normal: false, large: false },
      aaa: { normal: false, large: false },
      grade: 'Fail',
    };
  }
};

/**
 * Suggests accessible color alternatives
 * @param foreground - Current foreground color
 * @param background - Current background color
 * @param target - Target compliance level
 * @returns Suggested colors that meet the target contrast
 */
export const suggestAccessibleColors = (
  foreground: string,
  background: string,
  target: 'AA' | 'AAA' = 'AA'
): {
  lighterForeground?: string;
  darkerForeground?: string;
  lighterBackground?: string;
  darkerBackground?: string;
} => {
  const suggestions: {
    lighterForeground?: string;
    darkerForeground?: string;
    lighterBackground?: string;
    darkerBackground?: string;
  } = {};

  try {
    const currentRatio = calculateContrastRatio(foreground, background);
    const targetRatio = target === 'AAA' ? 7 : 4.5;

    if (currentRatio >= targetRatio) {
      return suggestions;
    }

    const fgRgb = parseColor(foreground);
    const bgRgb = parseColor(background);

    if (!fgRgb || !bgRgb) {
      return suggestions;
    }

    // Suggest darker foreground
    const darkerFg = adjustColorBrightness(foreground, -20);
    if (darkerFg && calculateContrastRatio(darkerFg, background) >= targetRatio) {
      suggestions.darkerForeground = darkerFg;
    }

    // Suggest lighter foreground
    const lighterFg = adjustColorBrightness(foreground, 20);
    if (lighterFg && calculateContrastRatio(lighterFg, background) >= targetRatio) {
      suggestions.lighterForeground = lighterFg;
    }

    // Suggest lighter background
    const lighterBg = adjustColorBrightness(background, 20);
    if (lighterBg && calculateContrastRatio(foreground, lighterBg) >= targetRatio) {
      suggestions.lighterBackground = lighterBg;
    }

    // Suggest darker background
    const darkerBg = adjustColorBrightness(background, -20);
    if (darkerBg && calculateContrastRatio(foreground, darkerBg) >= targetRatio) {
      suggestions.darkerBackground = darkerBg;
    }

    return suggestions;
  } catch {
    return suggestions;
  }
};

/**
 * Adjusts color brightness by a percentage
 * @param color - Color to adjust
 * @param percent - Percentage to adjust (-100 to 100)
 * @returns Adjusted color or null if invalid
 */
const adjustColorBrightness = (color: string, percent: number): string | null => {
  const rgb = parseColor(color);
  if (!rgb) return null;

  const factor = percent / 100;
  const adjust = (value: number) => {
    if (factor > 0) {
      return Math.round(value + (255 - value) * factor);
    } else {
      return Math.round(value * (1 + factor));
    }
  };

  const newRgb = {
    r: Math.max(0, Math.min(255, adjust(rgb.r))),
    g: Math.max(0, Math.min(255, adjust(rgb.g))),
    b: Math.max(0, Math.min(255, adjust(rgb.b))),
  };

  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};