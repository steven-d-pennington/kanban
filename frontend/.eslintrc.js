module.exports = {
  root: true,
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
    // Accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/mouse-events-have-key-events': 'error',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-autofocus': 'warn',
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/tabindex-no-positive': 'error',
    
    // Custom Tailwind contrast rules
    'tailwind-contrast/no-poor-contrast': 'warn',
  ],
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
};

// Custom rule for Tailwind contrast checking
const tailwindContrastRule = {
  'tailwind-contrast/no-poor-contrast': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Warn about poor color contrast in Tailwind classes',
        category: 'Accessibility',
      },
      schema: [],
      messages: {
        poorContrast: 'Poor color contrast detected: {{background}} background with {{text}} text may not meet accessibility standards',
        lightOnLight: 'Light text on light background detected: consider using darker text or background',
        darkOnDark: 'Dark text on dark background detected: consider using lighter text or background',
      },
    },
    create(context) {
      const lightBackgrounds = [
        'bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200',
        'bg-slate-50', 'bg-slate-100', 'bg-slate-200',
        'bg-zinc-50', 'bg-zinc-100', 'bg-zinc-200',
        'bg-neutral-50', 'bg-neutral-100', 'bg-neutral-200',
        'bg-stone-50', 'bg-stone-100', 'bg-stone-200',
        'bg-red-50', 'bg-red-100', 'bg-red-200',
        'bg-orange-50', 'bg-orange-100', 'bg-orange-200',
        'bg-amber-50', 'bg-amber-100', 'bg-amber-200',
        'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-200',
        'bg-lime-50', 'bg-lime-100', 'bg-lime-200',
        'bg-green-50', 'bg-green-100', 'bg-green-200',
        'bg-emerald-50', 'bg-emerald-100', 'bg-emerald-200',
        'bg-teal-50', 'bg-teal-100', 'bg-teal-200',
        'bg-cyan-50', 'bg-cyan-100', 'bg-cyan-200',
        'bg-sky-50', 'bg-sky-100', 'bg-sky-200',
        'bg-blue-50', 'bg-blue-100', 'bg-blue-200',
        'bg-indigo-50', 'bg-indigo-100', 'bg-indigo-200',
        'bg-violet-50', 'bg-violet-100', 'bg-violet-200',
        'bg-purple-50', 'bg-purple-100', 'bg-purple-200',
        'bg-fuchsia-50', 'bg-fuchsia-100', 'bg-fuchsia-200',
        'bg-pink-50', 'bg-pink-100', 'bg-pink-200',
        'bg-rose-50', 'bg-rose-100', 'bg-rose-200',
      ];

      const lightText = [
        'text-white', 'text-gray-50', 'text-gray-100', 'text-gray-200',
        'text-slate-50', 'text-slate-100', 'text-slate-200',
        'text-zinc-50', 'text-zinc-100', 'text-zinc-200',
        'text-neutral-50', 'text-neutral-100', 'text-neutral-200',
        'text-stone-50', 'text-stone-100', 'text-stone-200',
        'text-red-50', 'text-red-100', 'text-red-200',
        'text-orange-50', 'text-orange-100', 'text-orange-200',
        'text-amber-50', 'text-amber-100', 'text-amber-200',
        'text-yellow-50', 'text-yellow-100', 'text-yellow-200',
        'text-lime-50', 'text-lime-100', 'text-lime-200',
        'text-green-50', 'text-green-100', 'text-green-200',
        'text-emerald-50', 'text-emerald-100', 'text-emerald-200',
        'text-teal-50', 'text-teal-100', 'text-teal-200',
        'text-cyan-50', 'text-cyan-100', 'text-cyan-200',
        'text-sky-50', 'text-sky-100', 'text-sky-200',
        'text-blue-50', 'text-blue-100', 'text-blue-200',
        'text-indigo-50', 'text-indigo-100', 'text-indigo-200',
        'text-violet-50', 'text-violet-100', 'text-violet-200',
        'text-purple-50', 'text-purple-100', 'text-purple-200',
        'text-fuchsia-50', 'text-fuchsia-100', 'text-fuchsia-200',
        'text-pink-50', 'text-pink-100', 'text-pink-200',
        'text-rose-50', 'text-rose-100', 'text-rose-200',
      ];

      const darkBackgrounds = [
        'bg-gray-800', 'bg-gray-900', 'bg-gray-950', 'bg-black',
        'bg-slate-800', 'bg-slate-900', 'bg-slate-950',
        'bg-zinc-800', 'bg-zinc-900', 'bg-zinc-950',
        'bg-neutral-800', 'bg-neutral-900', 'bg-neutral-950',
        'bg-stone-800', 'bg-stone-900', 'bg-stone-950',
      ];

      const darkText = [
        'text-gray-800', 'text-gray-900', 'text-gray-950', 'text-black',
        'text-slate-800', 'text-slate-900', 'text-slate-950',
        'text-zinc-800', 'text-zinc-900', 'text-zinc-950',
        'text-neutral-800', 'text-neutral-900', 'text-neutral-950',
        'text-stone-800', 'text-stone-900', 'text-stone-950',
      ];

      function checkClassNames(node, classValue) {
        if (typeof classValue !== 'string') return;

        const classes = classValue.split(/\s+/).filter(Boolean);
        const backgroundClass = classes.find(cls => cls.startsWith('bg-'));
        const textClass = classes.find(cls => cls.startsWith('text-'));

        if (backgroundClass && textClass) {
          const isLightBg = lightBackgrounds.includes(backgroundClass);
          const isLightText = lightText.includes(textClass);
          const isDarkBg = darkBackgrounds.includes(backgroundClass);
          const isDarkText = darkText.includes(textClass);

          if (isLightBg && isLightText) {
            context.report({
              node,
              messageId: 'lightOnLight',
            });
          } else if (isDarkBg && isDarkText) {
            context.report({
              node,
              messageId: 'darkOnDark',
            });
          } else if ((isLightBg && !isDarkText && !textClass.includes('gray-')) || 
                     (isDarkBg && !isLightText && !textClass.includes('gray-'))) {
            context.report({
              node,
              messageId: 'poorContrast',
              data: {
                background: backgroundClass,
                text: textClass,
              },
            });
          }
        }
      }

      return {
        JSXAttribute(node) {
          if (node.name.name === 'className') {
            if (node.value && node.value.type === 'Literal') {
              checkClassNames(node, node.value.value);
            } else if (node.value && node.value.type === 'JSXExpressionContainer') {
              const expression = node.value.expression;
              if (expression.type === 'Literal') {
                checkClassNames(node, expression.value);
              } else if (expression.type === 'TemplateLiteral') {
                expression.quasis.forEach(quasi => {
                  if (quasi.value.raw) {
                    checkClassNames(node, quasi.value.raw);
                  }
                });
              }
            }
          }
        },
      };
    },
  },
};

module.exports.rules = {
  ...module.exports.rules,
  ...tailwindContrastRule,
};