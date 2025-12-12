import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ColorClass {
  type: 'text' | 'bg';
  color: string;
  shade: string;
  fullClass: string;
}

interface ContrastIssue {
  file: string;
  line: number;
  textColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagLevel: 'AA' | 'AAA' | 'FAIL';
  element: string;
}

interface AuditReport {
  totalFiles: number;
  filesWithIssues: number;
  totalIssues: number;
  issues: ContrastIssue[];
  summary: {
    failCount: number;
    aaCount: number;
    aaaCount: number;
  };
}

// Tailwind color palette with approximate hex values
const TAILWIND_COLORS: Record<string, Record<string, string>> = {
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  zinc: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  stone: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },
  lime: {
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#a3e635',
    500: '#84cc16',
    600: '#65a30d',
    700: '#4d7c0f',
    800: '#3f6212',
    900: '#365314',
    950: '#1a2e05',
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  violet: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
  fuchsia: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e',
  },
  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    950: '#500724',
  },
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
  white: {
    DEFAULT: '#ffffff',
  },
  black: {
    DEFAULT: '#000000',
  },
};

const SPECIAL_COLORS: Record<string, string> = {
  inherit: 'inherit',
  current: 'currentColor',
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',
};

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get WCAG compliance level for contrast ratio
 */
function getWcagLevel(ratio: number): 'FAIL' | 'AA' | 'AAA' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'FAIL';
}

/**
 * Parse Tailwind color class to hex value
 */
function parseColorClass(colorClass: string): string | null {
  // Handle special colors
  if (SPECIAL_COLORS[colorClass]) {
    return SPECIAL_COLORS[colorClass];
  }

  // Parse color-shade format
  const match = colorClass.match(/^([a-z]+)-?(\d+)?$/);
  if (!match) return null;

  const [, color, shade = 'DEFAULT'] = match;

  if (TAILWIND_COLORS[color]) {
    return TAILWIND_COLORS[color][shade] || null;
  }

  return null;
}

/**
 * Extract color classes from a line of code
 */
function extractColorClasses(line: string): ColorClass[] {
  const classes: ColorClass[] = [];
  const classRegex = /class(?:Name)?=["']([^"']+)["']/g;
  
  let match;
  while ((match = classRegex.exec(line)) !== null) {
    const classString = match[1];
    const individualClasses = classString.split(/\s+/);
    
    for (const cls of individualClasses) {
      // Match text-* classes
      const textMatch = cls.match(/^text-(.+)$/);
      if (textMatch) {
        classes.push({
          type: 'text',
          color: textMatch[1].split('-')[0],
          shade: textMatch[1].split('-')[1] || 'DEFAULT',
          fullClass: cls,
        });
      }
      
      // Match bg-* classes
      const bgMatch = cls.match(/^bg-(.+)$/);
      if (bgMatch) {
        classes.push({
          type: 'bg',
          color: bgMatch[1].split('-')[0],
          shade: bgMatch[1].split('-')[1] || 'DEFAULT',
          fullClass: cls,
        });
      }
    }
  }
  
  return classes;
}

/**
 * Analyze a single file for contrast issues
 */
function analyzeFile(filePath: string): ContrastIssue[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues: ContrastIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colorClasses = extractColorClasses(line);
    
    if (colorClasses.length === 0) continue;

    const textColors = colorClasses.filter(c => c.type === 'text');
    const bgColors = colorClasses.filter(c => c.type === 'bg');

    // Check combinations within the same element
    if (textColors.length > 0 && bgColors.length > 0) {
      for (const textColor of textColors) {
        for (const bgColor of bgColors) {
          const textHex = parseColorClass(`${textColor.color}-${textColor.shade}`);
          const bgHex = parseColorClass(`${bgColor.color}-${bgColor.shade}`);

          if (textHex && bgHex && textHex !== 'inherit' && textHex !== 'currentColor' && 
              bgHex !== 'transparent' && bgHex !== 'inherit' && bgHex !== 'currentColor') {
            const ratio = getContrastRatio(textHex, bgHex);
            const wcagLevel = getWcagLevel(ratio);

            if (wcagLevel === 'FAIL') {
              issues.push({
                file: filePath,
                line: i + 1,
                textColor: textColor.fullClass,
                backgroundColor: bgColor.fullClass,
                contrastRatio: Math.round(ratio * 100) / 100,
                wcagLevel,
                element: line.trim(),
              });
            }
          }
        }
      }
    }

    // Check text colors against common background assumptions
    for (const textColor of textColors) {
      if (bgColors.length === 0) {
        const textHex = parseColorClass(`${textColor.color}-${textColor.shade}`);
        
        if (textHex && textHex !== 'inherit' && textHex !== 'currentColor') {
          // Assume white background by default
          const ratio = getContrastRatio(textHex, '#ffffff');
          const wcagLevel = getWcagLevel(ratio);

          if (wcagLevel === 'FAIL') {
            issues.push({
              file: filePath,
              line: i + 1,
              textColor: textColor.fullClass,
              backgroundColor: 'white (assumed)',
              contrastRatio: Math.round(ratio * 100) / 100,
              wcagLevel,
              element: line.trim(),
            });
          }
        }
      }
    }
  }

  return issues;
}

/**
 * Main audit function
 */
async function auditColors(): Promise<AuditReport> {
  console.log('🔍 Starting color contrast audit...\n');

  // Find all TSX/JSX files
  const files = await glob('**/*.{tsx,jsx}', {
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**'],
  });

  console.log(`📁 Found ${files.length} files to analyze\n`);

  const allIssues: ContrastIssue[] = [];
  let filesWithIssues = 0;

  for (const file of files) {
    const issues = analyzeFile(file);
    if (issues.length > 0) {
      filesWithIssues++;
      allIssues.push(...issues);
      console.log(`⚠️  ${file}: ${issues.length} issue(s)`);
    }
  }

  const summary = {
    failCount: allIssues.filter(i => i.wcagLevel === 'FAIL').length,
    aaCount: allIssues.filter(i => i.wcagLevel === 'AA').length,
    aaaCount: allIssues.filter(i => i.wcagLevel === 'AAA').length,
  };

  const report: AuditReport = {
    totalFiles: files.length,
    filesWithIssues,
    totalIssues: allIssues.length,
    issues: allIssues,
    summary,
  };

  return report;
}

/**
 * Generate detailed report
 */
function generateReport(report: AuditReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 COLOR CONTRAST AUDIT REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Total files scanned: ${report.totalFiles}`);
  console.log(`   Files with issues: ${report.filesWithIssues}`);
  console.log(`   Total contrast issues: ${report.totalIssues}`);
  console.log(`   WCAG AA failures: ${report.summary.failCount}`);
  
  if (report.issues.length > 0) {
    console.log('\n🚨 DETAILED ISSUES:\n');
    
    const issuesByFile = report.issues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, ContrastIssue[]>);

    Object.entries(issuesByFile).forEach(([file, issues]) => {
      console.log(`📄 ${file}:`);
      issues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.textColor} on ${issue.backgroundColor}`);
        console.log(`   Contrast ratio: ${issue.contrastRatio}:1 (${issue.wcagLevel})`);
        console.log(`   Element: ${issue.element.substring(0, 80)}${issue.element.length > 80 ? '...' : ''}`);
        console.log('');
      });
    });
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('   • Use darker text colors on light backgrounds');
  console.log('   • Use lighter text colors on dark backgrounds');
  console.log('   • Aim for contrast ratios of at least 4.5:1 (WCAG AA)');
  console.log('   • Consider 7:1 for better accessibility (WCAG AAA)');
  console.log('   • Test with actual users and accessibility tools');

  // Save report to file
  const reportPath = path.join(process.cwd(), 'color-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📋 Detailed report saved to: ${reportPath}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const report = await auditColors();
    generateReport(report);
    
    if (report.totalIssues > 0) {
      console.log('\n⚠️  Contrast issues found. Please review and fix before deployment.');
      process.exit(1);
    } else {
      console.log('\n✅ No contrast issues found! Great job!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export {
  auditColors,
  generateReport,
  getContrastRatio,
  getWcagLevel,
  parseColorClass,
  type AuditReport,
  type ContrastIssue,
};