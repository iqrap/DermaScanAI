module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverageFrom: [
    'utils/**/*.js',
    'middleware/**/*.js',
    'services/**/*.js',
    'config/**/*.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testMatch: ['**/__tests__/**/*.test.js'],
};
