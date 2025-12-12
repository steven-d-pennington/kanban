const { ESLintUtils } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/your-org/eslint-rules/blob/main/docs/${name}.md`
);

const CONTRAST_VIOLATIONS = {
  // Light text on light backgrounds
  'text-white': ['bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-yellow-50', 'bg-yellow-100'],
  'text-gray-50': ['bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-yellow-50', 'bg-yellow-100'],
  'text-gray-100': ['bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-yellow-50', 'bg-yellow-100'],
  'text-gray-200': ['bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-yellow-50', 'bg-yellow-100'],
  'text-gray-300': ['bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-200'],
  'text-yellow-100': ['bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-200'],
  'text-yellow-200': ['bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-200'],

  // Dark text on dark backgrounds
  'text-black': ['bg-black', 'bg-gray-900', 'bg-gray-800', 'bg-gray-700', 'bg-blue-900', 'bg-blue-800'],
  'text-gray-900': ['bg-black', 'bg-gray-900', 'bg-gray-800', 'bg-gray-700', 'bg-blue-900', 'bg-blue-800'],
  'text-gray-800': ['bg-black', 'bg-gray-900', 'bg-gray-800', 'bg-gray-700', 'bg-blue-900', 'bg-blue-800'],
  'text-gray-700': ['bg-black', 'bg-gray-900', 'bg-gray-800', 'bg-gray-700', 'bg-blue-900', 'bg-blue-800'],
  'text-gray-600': ['bg-black', 'bg-gray-900', 'bg-gray-800', 'bg-gray-700', 'bg-gray-600', 'bg-blue-900', 'bg-blue-800'],
  'text-blue-900': ['bg-black', 'bg-gray-900', 'bg-gray-800', 'bg-blue-900', 'bg-blue-800'],
  'text-blue-800': ['bg-black', 'bg-gray-900', 'bg-gray-800', 'bg-blue-900', 'bg-blue-800'],

  // Medium contrast violations
  'text-gray-500': ['bg-gray-400', 'bg-gray-500', 'bg-gray-600'],
  'text-gray-400': ['bg-gray-300', 'bg-gray-400', 'bg-gray-500'],
  'text-blue-500': ['bg-blue-400', 'bg-blue-500', 'bg-blue-600'],
  'text-red-500': ['bg-red-400', 'bg-red-500', 'bg-red-600'],
  'text-green-500': ['bg-green-400', 'bg-green-500', 'bg-green-600'],
};

const SEVERITY_LEVELS = {
  HIGH: ['text-white', 'text-gray-50', 'text-gray-100', 'text-black', 'text-gray-900'],
  MEDIUM: ['text-gray-200', 'text-gray-300', 'text-gray-800', 'text-gray-700'],
  LOW: ['text-gray-400', 'text-gray-500', 'text-gray-600'],
};

function extractClassNames(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(/\s+/).filter(Boolean);
}

function getClassNamesFromNode(node) {
  const classNames = [];
  
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return extractClassNames(node.value);
  }
  
  if (node.type === 'TemplateLiteral') {
    for (const quasi of node.quasis) {
      classNames.push(...extractClassNames(quasi.value.cooked));
    }
  }
  
  if (node.type === 'ConditionalExpression') {
    const consequentClasses = getClassNamesFromNode(node.consequent);
    const alternateClasses = getClassNamesFromNode(node.alternate);
    classNames.push(...consequentClasses, ...alternateClasses);
  }
  
  return classNames;
}

function getSeverity(textClass) {
  if (SEVERITY_LEVELS.HIGH.includes(textClass)) return 'high';
  if (SEVERITY_LEVELS.MEDIUM.includes(textClass)) return 'medium';
  if (SEVERITY_LEVELS.LOW.includes(textClass)) return 'low';
  return 'unknown';
}

function findContrastViolations(classNames) {
  const violations = [];
  const textClasses = classNames.filter(cls => cls.startsWith('text-'));
  const bgClasses = classNames.filter(cls => cls.startsWith('bg-'));
  
  for (const textClass of textClasses) {
    if (CONTRAST_VIOLATIONS[textClass]) {
      for (const bgClass of bgClasses) {
        if (CONTRAST_VIOLATIONS[textClass].includes(bgClass)) {
          violations.push({
            textClass,
            bgClass,
            severity: getSeverity(textClass),
          });
        }
      }
    }
  }
  
  return violations;
}

module.exports = createRule({
  name: 'contrast-validation',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce sufficient color contrast in Tailwind CSS classes',
      recommended: 'error',
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          severity: {
            type: 'string',
            enum: ['error', 'warn'],
            default: 'error',
          },
          ignoreConditional: {
            type: 'boolean',
            default: false,
          },
          customViolations: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      contrastViolation: 'Poor color contrast detected: "{{textClass}}" on "{{bgClass}}" may not meet accessibility standards ({{severity}} severity)',
      contrastViolationSuggestion: 'Consider using darker text colors like "text-gray-900" or "text-black", or lighter backgrounds like "bg-white" or "bg-gray-50"',
    },
  },
  defaultOptions: [
    {
      severity: 'error',
      ignoreConditional: false,
      customViolations: {},
    },
  ],
  create(context, [options = {}]) {
    const { severity = 'error', ignoreConditional = false, customViolations = {} } = options;
    
    // Merge custom violations with default ones
    const allViolations = { ...CONTRAST_VIOLATIONS, ...customViolations };
    
    function checkClassAttribute(node) {
      if (
        node.type !== 'JSXAttribute' ||
        !node.name ||
        node.name.name !== 'className' ||
        !node.value
      ) {
        return;
      }
      
      let classNames = [];
      
      if (node.value.type === 'Literal') {
        classNames = extractClassNames(node.value.value);
      } else if (node.value.type === 'JSXExpressionContainer') {
        if (ignoreConditional && node.value.expression.type === 'ConditionalExpression') {
          return;
        }
        classNames = getClassNamesFromNode(node.value.expression);
      }
      
      const violations = findContrastViolations(classNames);
      
      violations.forEach(violation => {
        context.report({
          node: node.value,
          messageId: 'contrastViolation',
          data: {
            textClass: violation.textClass,
            bgClass: violation.bgClass,
            severity: violation.severity,
          },
          suggest: [
            {
              messageId: 'contrastViolationSuggestion',
              fix: null,
            },
          ],
        });
      });
    }
    
    return {
      JSXAttribute: checkClassAttribute,
    };
  },
});