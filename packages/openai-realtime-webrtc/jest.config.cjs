/**
 * Jest Configuration for OpenAI Realtime WebRTC Package
 * 
 * Comprehensive test configuration supporting both core TypeScript
 * services and React components with proper mocking setup.
 */

module.exports = {
  // Basic configuration
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.spec.{ts,tsx}',
    '!<rootDir>/src/**/__tests__/setup/**',
    '!<rootDir>/src/**/__tests__/utils/**',
    '!<rootDir>/src/**/__tests__/mocks/**'
  ],
  
  // File extensions and module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  },
  
  // Module name mapping for cleaner imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@react/(.*)$': '<rootDir>/src/react/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    // Mock WebRTC APIs
    '^webrtc$': '<rootDir>/src/__tests__/mocks/webrtc.mock.ts',
    // Mock OpenAI Realtime API
    '^@openai/realtime-api-beta$': '<rootDir>/src/__tests__/mocks/openai-realtime.mock.ts'
  },
  
  // Test setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup/jest.setup.ts'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.ts',
    '!src/types/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test timeout for async operations
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Test environment options for jsdom
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Verbose output for better debugging
  verbose: true,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/docs/',
    '<rootDir>/src/__tests__/mocks/',
    '<rootDir>/src/__tests__/integration/',
    '<rootDir>/src/__tests__/performance/',
    '<rootDir>/src/__tests__/memory-leak.test.ts',
    '<rootDir>/src/__tests__/critical-bugs.test.ts'
  ],
  
  // Transform ignore patterns - ensure node_modules are transformed if needed
  transformIgnorePatterns: [
    'node_modules/(?!(@openai/realtime-api-beta)/)'
  ]
};