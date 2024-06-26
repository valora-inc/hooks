/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
require('ts-node/register') // allows us to use typescript for setup script
require('./scripts/loadProductionEnvVars.ts')

module.exports = {
  displayName: 'e2e',
  testMatch: ['**/__tests__/**/e2e/**/*.[tj]s?(x)', '**/?(*.)+(e2e).[tj]s?(x)'],
  testPathIgnorePatterns: ['dist'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  // Allow absolute imports from the tsconfig baseUrl
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  setupFiles: ['<rootDir>/scripts/loadProductionEnvVars.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.e2e.setup.js'],
}
