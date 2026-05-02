export default {
  // Ambiente di test
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Pattern file di test
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Pattern per escludere file da test
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],

  // Transform file
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-react',
      ],
    }],
    '^.+\\.css$': 'jest-transform-css',
  },

  // Module name mapping per alias
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/jest.fileMock.js',
  },

  // Coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.jsx',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx}',
    '!src/**/mock*',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Test timeout
  testTimeout: 10000,

  // Verbosity
  verbose: true,

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Coverage reporter
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],

  // Path ignorati per coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],

  // Globals
  globals: {
    __DEV__: true,
    __VERSION__: '2.0.0',
  },

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:5173',
  },

  // Reset modules tra test
  resetModules: true,

  // Restore mocks tra test
  restoreMocks: true,
  clearMocks: true,
};