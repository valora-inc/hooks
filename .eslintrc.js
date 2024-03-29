module.exports = {
  extends: ['@valora/eslint-config-typescript'],
  parserOptions: {
    project: './tsconfig.test.json',
  },
  rules: {
    // Maybe move it to @valora/eslint-config-typescript?
    'jest/valid-title': ['error', { ignoreTypeOfDescribeName: true }],
    'jest/expect-expect': [
      'error',
      { assertFunctionNames: ['expect*', 'request.**.expect'] },
    ],
  },
  ignorePatterns: ['tsconfig.json'],
}
