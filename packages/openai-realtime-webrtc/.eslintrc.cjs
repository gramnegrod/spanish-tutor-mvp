module.exports = {
  root: true, // Prevent ESLint from looking in parent directories
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // Explicitly disable Next.js specific rules that don't apply to this library
    '@next/next/no-html-link-for-pages': 'off',
    
    // TypeScript specific overrides
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
    
    // General rules
    'no-console': 'warn',
    
    // Common TypeScript issues
    'no-undef': 'off', // TypeScript handles this
  },
  // Library-specific overrides for test files
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.mock.*', '**/mocks/**/*'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': 'off',
      },
    },
    {
      files: ['**/types/example.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
};