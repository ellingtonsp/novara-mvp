import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for testing
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:4200',
    origin: 'http://localhost:4200',
    pathname: '/',
  },
  writable: true,
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock environment variables
vi.stubEnv('VITE_API_URL', 'http://localhost:9002');
vi.stubEnv('VITE_ENV', 'test');
vi.stubEnv('VITE_DEBUG', 'true'); 