/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  // We might not need these with CommonJS compilation for tests
  // moduleNameMapper: {
  //   '^(\.{1,2}/.*)\.js$': '$1',
  // },
  // extensionsToTreatAsEsm: ['.ts'],
  // transform: {
  //   '^.+\.tsx?$': ['ts-jest', {
  //     useESM: true,
  //   }],
  // },
  // transformIgnorePatterns: [],
};
