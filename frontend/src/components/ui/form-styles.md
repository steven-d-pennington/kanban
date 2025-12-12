# Form Styles Audit

## Overview
This document audits all form-related components and their styling patterns to identify accessibility issues and maintain consistency across the application.

## Current Form Components

### Input Components

#### Standard Input
**File**: `components/ui/input.tsx`
**Current Styles**: 
```css
border border-gray-300 bg-white text-gray-900
focus:border-blue-500 focus:ring-blue-500
disabled:bg-gray-50 disabled:text-gray-500
```
**Status**: ✅ Good contrast

#### Search Input
**File**: `components/ui/search-input.tsx`
**Current Styles**:
```css
bg-gray-50 border-gray-300 text-gray-900
placeholder:text-gray-500
```
**Status**: ✅ Good contrast

#### Password Input
**File**: `components/ui/password-input.tsx`
**Current Styles**:
```css
border-gray-300 bg-white text-gray-900
focus:border-blue-500 focus:ring-blue-500
```
**Status**: ✅ Good contrast

### Select Components

#### Standard Select
**File**: `components/ui/select.tsx`
**Current Styles**:
```css
border-gray-300 bg-white text-gray-900
focus:border-blue-500 focus:ring-blue-500
disabled:bg-gray-50 disabled:text-gray-500
```
**Status**: ✅ Good contrast

#### Multi Select
**File**: `components/ui/multi-select.tsx`
**Current Styles**:
```css
border-gray-300 bg-white text-gray-900
selected-item: bg-blue-100 text-blue-800
```
**Status**: ✅ Good contrast

### Button Components

#### Primary Button
**File**: `components/ui/button.tsx`
**Current Styles**:
```css
bg-blue-600 text-white hover:bg-blue-700
focus:ring-4 focus:ring-blue-300
```
**Status**: ✅ Good contrast

#### Secondary Button
**File**: `components/ui/button.tsx`
**Current Styles**:
```css
bg-gray-200 text-gray-900 hover:bg-gray-300
border border-gray-300
```
**Status**: ✅ Good contrast

#### Outline Button
**File**: `components/ui/button.tsx`
**Current Styles**:
```css
border border-gray-300 bg-white text-gray-700
hover:bg-gray-50
```
**Status**: ✅ Good contrast

### Form Control Components

#### Label
**File**: `components/ui/label.tsx`
**Current Styles**:
```css
text-sm font-medium text-gray-700
```
**Status**: ✅ Good contrast

#### Help Text
**File**: `components/ui/help-text.tsx`
**Current Styles**:
```css
text-sm text-gray-500
```
**Status**: ✅ Good contrast

#### Error Message
**File**: `components/ui/error-message.tsx`
**Current Styles**:
```css
text-sm text-red-600
```
**Status**: ✅ Good contrast

### Checkbox and Radio Components

#### Checkbox
**File**: `components/ui/checkbox.tsx`
**Current Styles**:
```css
border-gray-300 text-blue-600 bg-white
focus:ring-blue-500
checked:bg-blue-600 checked:border-blue-600
```
**Status**: ✅ Good contrast

#### Radio Button
**File**: `components/ui/radio.tsx`
**Current Styles**:
```css
border-gray-300 text-blue-600 bg-white
focus:ring-blue-500
checked:bg-blue-600 checked:border-blue-600
```
**Status**: ✅ Good contrast

## Problematic Patterns Identified

### ❌ Light-on-Light Issues

#### Issue 1: Disabled State Visibility
**Location**: Various input components
**Problem**: 
```css
disabled:text-gray-300 disabled:bg-gray-100
```
**Contrast Ratio**: ~1.4:1 (fails WCAG AA)
**Fix**: Use `disabled:text-gray-500 disabled:bg-gray-50`

#### Issue 2: Placeholder Text
**Location**: Input placeholders
**Problem**: 
```css
placeholder:text-gray-300
```
**Contrast Ratio**: ~1.4:1 (fails WCAG AA)
**Fix**: Use `placeholder:text-gray-500`

#### Issue 3: Subtle Borders
**Location**: Form containers
**Problem**: 
```css
border-gray-200 bg-gray-50
```
**Contrast Ratio**: ~1.2:1 (fails WCAG AA)
**Fix**: Use `border-gray-300` or add more visual separation

### ⚠️ Dark-on-Dark Issues

#### Issue 1: Dark Mode Secondary Text
**Location**: Help text in dark mode
**Problem**: 
```css
dark:text-gray-600 dark:bg-gray-800
```
**Contrast Ratio**: ~1.8:1 (fails WCAG AA)
**Fix**: Use `dark:text-gray-400`

## Recommended Style Patterns

### Color Palette
```css
/* Primary Colors */
--primary-50: #eff6ff;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Gray Scale */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-300: #d1d5db;
--gray-500: #6b7280;
--gray-700: #374151;
--gray-900: #111827;

/* Status Colors */
--success-600: #16a34a;
--warning-600: #d97706;
--error-600: #dc2626;
```

### Standard Form Element Styles

#### Input Base
```css
.form-input {
  @apply border border-gray-300 bg-white px-3 py-2 text-gray-900;
  @apply focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20;
  @apply disabled:bg-gray-50 disabled:text-gray-500;
  @apply placeholder:text-gray-500;
}
```

#### Button Base
```css
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 font-medium;
  @apply hover:bg-blue-700 focus:ring-4 focus:ring-blue-300;
  @apply disabled:bg-gray-300 disabled:text-gray-500;
}

.btn-secondary {
  @apply bg-white border border-gray-300 text-gray-700 px-4 py-2;
  @apply hover:bg-gray-50 focus:ring-4 focus:ring-gray-200;
  @apply disabled:bg-gray-50 disabled:text-gray-400;
}
```

#### Label and Text
```css
.form-label {
  @apply text-sm font-medium text-gray-700;
}

.form-help {
  @apply text-sm text-gray-600;
}

.form-error {
  @apply text-sm text-red-600;
}
```

## Accessibility Guidelines

### Contrast Requirements
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text (18px+)**: Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio

### Focus States
- All interactive elements must have visible focus indicators
- Focus rings should be at least 2px wide
- Use `focus:ring-2 focus:ring-[color]/20` pattern

### States
- Disabled elements should have 3:1 contrast minimum
- Error states should use semantic colors (red)
- Success states should use semantic colors (green)

## Migration Plan

### Phase 1: Critical Fixes
1. Fix disabled state colors: `text-gray-300` → `text-gray-500`
2. Fix placeholder colors: `text-gray-300` → `text-gray-500`
3. Update border contrasts: `border-gray-200` → `border-gray-300`

### Phase 2: Standardization
1. Create shared form component styles
2. Implement consistent focus states
3. Add proper dark mode support

### Phase 3: Enhancement
1. Add semantic color tokens
2. Implement design system tokens
3. Create comprehensive form validation styles

## Testing Checklist

- [ ] All form elements pass WCAG AA contrast requirements
- [ ] Focus states are visible on all interactive elements
- [ ] Disabled states maintain adequate contrast
- [ ] Error messages are clearly visible
- [ ] Dark mode variants maintain proper contrast
- [ ] Form validation states are semantically correct