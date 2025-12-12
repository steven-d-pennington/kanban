import { LCH, sRGB } from 'colorjs.io/fn';

// WCAG AA compliance levels
export const WCAG_AA_NORMAL = 4.5;
export const WCAG_AA_LARGE = 3.0;
export const WCAG_AAA_NORMAL = 7.0;
export const WCAG_AAA_LARGE = 4.5;

// Accessible color pairs for text on backgrounds
export const ACCESSIBLE_COLOR_PAIRS = {
  light: {
    background: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textMuted: '#6a6a6a',
    primary: '#2563eb',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
  },
  dark: {
    background: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#d1d5db',
    textMuted: '#9ca3af',
    primary: '#60a5fa',
    success: '#10b981',
    warning: '#fbbf24',
    error: '#f87171',
  },
} as const;

export const HIGH_CONTRAST_PAIRS = {
  light: {
    background: '#ffffff',
    text: '#000000',
    primary: '#0066cc',
    success: '#006600',
    warning: '#cc6600',
    error: '#cc0000',
  },
  dark: {
    background: '#000000',
    text: '#ffffff',
    primary: '#3399ff',
    success: '#00ff00',
    warning: '#ffcc00',
    error: '#ff3333',
  },
} as const;

/**
 * Converts a hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculates the relative luminance of a color
 * Based on WCAG 2.1 specification
 */
export function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const { r, g, b } = rgb;

  // Convert to 0-1 range
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates the contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if color combination meets WCAG contrast requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  const thresholds = {
    AA: isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL,
    AAA: isLargeText ? WCAG_AAA_LARGE : WCAG_AAA_NORMAL,
  };

  return ratio >= thresholds[level];
}

/**
 * Gets the appropriate text color (black or white) for a given background
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio('#ffffff', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);

  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}

/**
 * Validates if a color is accessible for the given context
 */
export function validateColorAccessibility(
  foreground: string,
  background: string,
  options: {
    level?: 'AA' | 'AAA';
    isLargeText?: boolean;
    minContrast?: number;
  } = {}
): {
  isAccessible: boolean;
  contrastRatio: number;
  recommendation?: string;
} {
  const { level = 'AA', isLargeText = false, minContrast } = options;
  const contrastRatio = getContrastRatio(foreground, background);
  
  const threshold = minContrast || (level === 'AA'
    ? (isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL)
    : (isLargeText ? WCAG_AAA_LARGE : WCAG_AAA_NORMAL));

  const isAccessible = contrastRatio >= threshold;

  let recommendation: string | undefined;
  if (!isAccessible) {
    const needed = threshold - contrastRatio;
    recommendation = `Increase contrast by ${needed.toFixed(1)} points to meet ${level} standards`;
  }

  return {
    isAccessible,
    contrastRatio: Math.round(contrastRatio * 100) / 100,
    recommendation,
  };
}

/**
 * Generates accessible color variations
 */
export function generateAccessibleColors(baseColor: string): {
  light: string;
  dark: string;
  contrastRatios: {
    lightOnWhite: number;
    darkOnBlack: number;
  };
} {
  try {
    const srgb = new sRGB(baseColor);
    const lch = srgb.to('lch');
    
    // Generate lighter version (increase lightness)
    const lightLch = lch.clone();
    lightLch.l = Math.min(85, lch.l + 20);
    const light = lightLch.to('srgb').toString({ format: 'hex' });
    
    // Generate darker version (decrease lightness)
    const darkLch = lch.clone();
    darkLch.l = Math.max(15, lch.l - 20);
    const dark = darkLch.to('srgb').toString({ format: 'hex' });

    return {
      light,
      dark,
      contrastRatios: {
        lightOnWhite: getContrastRatio(light, '#ffffff'),
        darkOnBlack: getContrastRatio(dark, '#000000'),
      },
    };
  } catch (error) {
    // Fallback for invalid colors
    return {
      light: '#f3f4f6',
      dark: '#1f2937',
      contrastRatios: {
        lightOnWhite: 1.2,
        darkOnBlack: 12.6,
      },
    };
  }
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Sets focus to the first focusable element in a container
   */
  focusFirst: (container: HTMLElement): boolean => {
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    if (focusable) {
      focusable.focus();
      return true;
    }
    return false;
  },

  /**
   * Traps focus within a container
   */
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },
};

/**
 * Screen reader utilities
 */
export const screenReaderUtils = {
  /**
   * Announces text to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only absolute -left-[10000px] w-px h-px overflow-hidden';
    
    document.body.appendChild(announcer);
    
    // Slight delay to ensure screen readers pick up the change
    setTimeout(() => {
      announcer.textContent = message;
      setTimeout(() => {
        document.body.removeChild(announcer);
      }, 1000);
    }, 100);
  },
};

/**
 * Keyboard navigation utilities
 */
export const keyboardUtils = {
  /**
   * Common keyboard event handlers
   */
  isActivationKey: (event: KeyboardEvent): boolean => {
    return event.key === 'Enter' || event.key === ' ';
  },

  isEscapeKey: (event: KeyboardEvent): boolean => {
    return event.key === 'Escape';
  },

  isArrowKey: (event: KeyboardEvent): boolean => {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
  },
};