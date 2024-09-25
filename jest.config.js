/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  projects: ['<rootDir>/jest.unit.config.js', '<rootDir>/jest.e2e.config.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    global: {
      lines: 89,
    },
  },
}
