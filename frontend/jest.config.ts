import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Points to the Next.js app root so next/jest can load next.config.ts and .env files
  dir: './',
});

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  // Setup file that runs AFTER the Jest testing framework is installed in the
  // environment. Adds @testing-library/jest-dom custom matchers globally.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        suiteName: 'Frontend Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],
  // Keep coverage off by default – enable via --coverage when needed
  collectCoverage: false,
};

export default createJestConfig(config);
