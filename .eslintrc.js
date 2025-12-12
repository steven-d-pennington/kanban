const contrastViolations = {
  'text-gray-300': ['bg-white', 'bg-gray-50', 'bg-gray-100'],
  'text-gray-400': ['bg-white', 'bg-gray-50', 'bg-gray-100'],
  'text-white': ['bg-gray-100', 'bg-gray-200', 'bg-yellow-100', 'bg-yellow-200'],
  'text-yellow-300': ['bg-white', 'bg-gray-50', 'bg-yellow-50'],
  'text-blue-300': ['bg-white', 'bg-gray-50', 'bg-blue-50'],
  'text-green-300': ['bg-white', 'bg-gray-50', 'bg-green-50'],
  'text-red-300': ['bg-white', 'bg-gray-50', 'bg-red-50'],
  'text-purple-300': ['bg-white', 'bg-gray-50', 'bg-purple-50'],
  'text-pink-300': ['bg-white', 'bg-gray-50', 'bg-pink-50'],
  'text-indigo-300': ['bg-white', 'bg-gray-50', 'bg-indigo-50'],
};

const contrastRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Detect potential color contrast violations in Tailwind CSS classes',
      category: 'Accessibility',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      contrastViolation: 'Potential contrast violation: {{textColor}} with {{bgColor}} may not meet accessibility standards',
    },
  },
  create: function (context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;
        
        if (!node.value || node.value.type !== 'Literal') return;
        
        const classNames = node.value.value.split(/\s+/);
        const textClasses = classNames.filter(cls => cls.startsWith('text-'));
        const bgClasses = classNames.filter(cls => cls.startsWith('bg-'));
        
        textClasses.forEach(textClass => {
          if (contrastViolations[textClass]) {
            bgClasses.forEach(bgClass => {
              if (contrastViolations[textClass].includes(bgClass)) {
                context.report({
                  node,
                  messageId: 'contrastViolation',
                  data: {
                    textColor: textClass,
                    bgColor: bgClass,
                  },
                });
              }
            });
          }
        });
      },
    };
  },
};

module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  plugins: [
    'react-refresh',
    '@typescript-eslint',
    'jsx-a11y',
  ],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_' },
    ],
    'jsx-a11y/contrast-validation': 'off',
    'contrast-validation': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
    },
  ],
  plugins: [
    ...module.exports.plugins,
    {
      rules: {
        'contrast-validation': contrastRule,
      },
    },
  ],
};