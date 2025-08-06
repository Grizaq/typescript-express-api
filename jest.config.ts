/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",

  // A path to a module which exports an async function that is triggered once before all test suites
  globalSetup: '<rootDir>/src/test/setup/global-setup.ts',

  // A path to a module which exports an async function that is triggered once after all test suites
  globalTeardown: '<rootDir>/src/test/setup/global-teardown.ts',

  // The test environment that will be used for testing
  testEnvironment: "jest-environment-node",

  // Set up files that run before each test
  setupFilesAfterEnv: ['<rootDir>/src/test/setup/jest-setup.ts'],

  // A list of paths to directories that Jest should use to search for files in
  roots: [
    "<rootDir>/src"
  ],

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/__tests__/**/*.ts",
    "**/?(*.)+(spec|test).ts"
  ],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    "/node_modules/"
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.ts$": "ts-jest"
  },

  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // The maximum amount of workers used to run your tests
  maxWorkers: "50%",
  
  // Allows for longer timeout - useful for database operations
  testTimeout: 30000,
  
  // Forces Jest to use real timers instead of fake timers
  // This is important for database connection testing
  fakeTimers: {
    enableGlobally: false
  },
  
  // Automatically reset mock state before every test
  resetMocks: true,
  
  // Set environment variables for tests
  testEnvironmentOptions: {
    NODE_ENV: "test"
  }
};

export default config;