import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Override rootDir so TypeScript can compile files in both src/ and tests/
          rootDir: '.',
          noImplicitAny: false,
        },
      },
    ],
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        suiteName: 'Backend Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],
  // Keep coverage off by default – enable via --coverage when needed
  collectCoverage: false,
};

export default config;
