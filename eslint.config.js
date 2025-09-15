const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const reactNative = require('eslint-plugin-react-native');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      prettier,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Your custom rules (formatting rules removed as they're handled by Prettier)
      'camelcase': 'off',
      
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'error',
      
      // React Native rules
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'error',
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'off',
      'react-native/no-raw-text': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      
      // Prettier
      'prettier/prettier': [
        'error',
        {
          semi: false,
          printWidth: 80,
          bracketSpacing: true,
          singleQuote: true,
          trailingComma: 'es5',
          endOfLine: 'auto',
        },
      ],
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'build/**',
      'dist/**',
      '*.config.js',
      '*.config.ts',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'coverage/**',
      '.next/**',
      'out/**',
      '*.log',
      '.DS_Store',
    ],
  }
);
