// Jest setup file for Chef Jeff AI Recipe Service tests

// Mock environment variables
process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'test-api-key'

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Setup fetch mock for network requests
global.fetch = jest.fn()

// Mock AsyncStorage if needed
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}))

// Increase timeout for async operations
jest.setTimeout(10000) 