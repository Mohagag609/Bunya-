module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // General rules
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-unused-vars': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    
    // Code style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    'keyword-spacing': 'error',
    'space-infix-ops': 'error',
    'eol-last': 'error',
    'no-trailing-spaces': 'error',
    
    // Best practices
    'eqeqeq': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-assign': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'prefer-promise-reject-errors': 'error',
    'radix': 'error',
    'yoda': 'error',
    
    // Variables
    'no-undef': 'error',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-use-before-define': 'error',
    
    // Functions
    'func-call-spacing': 'error',
    'no-duplicate-imports': 'error',
    'no-useless-rename': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    
    // Objects
    'object-shorthand': 'error',
    'prefer-destructuring': 'error',
    
    // Comments
    'spaced-comment': ['error', 'always'],
    
    // Arabic text support
    'no-control-regex': 'off'
  },
  globals: {
    // Global variables
    'window': 'readonly',
    'document': 'readonly',
    'console': 'readonly',
    'localStorage': 'readonly',
    'sessionStorage': 'readonly',
    'fetch': 'readonly',
    'Promise': 'readonly',
    'setTimeout': 'readonly',
    'setInterval': 'readonly',
    'clearTimeout': 'readonly',
    'clearInterval': 'readonly',
    'requestAnimationFrame': 'readonly',
    'cancelAnimationFrame': 'readonly',
    
    // Application specific globals
    'state': 'writable',
    'routes': 'readonly',
    'nav': 'readonly',
    'showModal': 'readonly',
    'hideModal': 'readonly',
    'showLoadingIndicator': 'readonly',
    'hideLoadingIndicator': 'readonly',
    'toast': 'readonly',
    'skeleton': 'readonly',
    'theme': 'readonly',
    'modernUI': 'readonly',
    'performanceOptimizer': 'readonly'
  }
};