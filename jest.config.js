/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
require('ts-node/register') // allows us to use typescript for setup script
require('./scripts/loadProductionEnvVars.ts')

module.exports = {
  projects: ['<rootDir>/jest.unit.config.js', '<rootDir>/jest.e2e.config.js'],
  setupFiles: ['<rootDir>/scripts/loadProductionEnvVars.ts'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    global: {
      lines: 90,
    },
  },
}
