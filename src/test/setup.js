import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Load real environment variables from .env if available
import dotenv from 'dotenv';
dotenv.config();

// Mock Vite environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'mock-key',
  },
});

// Mock alert if it's not defined in the environment
if (typeof window !== 'undefined' && !window.alert) {
  window.alert = vi.fn();
}

// Ensure localStorage is available globally in the test environment
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

vi.stubGlobal('localStorage', mockLocalStorage);
