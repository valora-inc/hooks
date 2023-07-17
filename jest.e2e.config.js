/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  displayName: 'e2e',
  testMatch: ['**/__tests__/**/e2e/**/*.[tj]s?(x)', '**/?(*.)+(e2e).[tj]s?(x)'],
  testPathIgnorePatterns: ['dist'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Allow absolute imports from the tsconfig baseUrl
  moduleDirectories: ['node_modules', '<rootDir>'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.e2e.setup.js'],
}
