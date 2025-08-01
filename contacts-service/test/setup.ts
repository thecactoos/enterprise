import { Test } from '@nestjs/testing';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test_user:test_password@localhost:5433/test_crm_db';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.REDIS_URL = 'redis://localhost:6380'; // Different port for test Redis if needed
});

// Global test teardown
afterAll(async () => {
  // Cleanup any global resources if needed
});

// Mock console methods in test environment to reduce noise
global.console = {
  ...console,
  // Keep error and warn for debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Increase timeout for database operations
jest.setTimeout(30000);