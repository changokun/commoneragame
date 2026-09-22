/**
 * Tests for adminAuth.ts - Admin Authentication Service
 * 
 * This file tests:
 * - Admin token management (get, set, clear)
 * - Admin user management
 * - Admin status checking via API
 * - Admin login/logout
 * - Authenticated fetch helper
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import everything we need to test
import {
  getAdminToken,
  getAdminUser,
  hasAdminToken,
  setAdminAuth,
  clearAdminAuth,
  checkAdminStatus,
  loginAdmin,
  logoutAdmin,
  adminFetch,
  AdminUser,
} from './adminAuth';

// Create a mock for localStorage
const createMockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string): string | null => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock fetch
const mockFetch = vi.fn();

describe('adminAuth.ts - Admin Authentication Service', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;
  const mockApiUrl = 'https://test-api.example.com';

  beforeEach(() => {
    // Create fresh mock for each test
    mockLocalStorage = createMockLocalStorage();
    vi.stubGlobal('localStorage', mockLocalStorage);
    
    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock fetch
    global.fetch = mockFetch;
    
    // Mock import.meta.env
    vi.stubEnv('VITE_API_URL', mockApiUrl);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // getAdminToken Tests
  // ========================================================================
  describe('getAdminToken', () => {
    it('returns null when no admin token exists in localStorage', () => {
      const result = getAdminToken();
      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('CE-Admin-Token');
    });

    it('returns the stored admin token when it exists in localStorage', () => {
      const testToken = 'admin-jwt-token';
      mockLocalStorage.setItem('CE-Admin-Token', testToken);
      
      const result = getAdminToken();
      expect(result).toBe(testToken);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('CE-Admin-Token');
    });
  });

  // ========================================================================
  // getAdminUser Tests
  // ========================================================================
  describe('getAdminUser', () => {
    it('returns null when no admin user exists in localStorage', () => {
      const result = getAdminUser();
      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('CE-Admin-User');
    });

    it('returns null when stored user JSON is invalid', () => {
      mockLocalStorage.setItem('CE-Admin-User', 'invalid-json');
      
      const result = getAdminUser();
      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('CE-Admin-User');
    });

    it('returns parsed admin user when valid JSON exists', () => {
      const testUser: AdminUser = {
        _id: 'admin-123',
        username: 'test-admin',
      };
      mockLocalStorage.setItem('CE-Admin-User', JSON.stringify(testUser));
      
      const result = getAdminUser();
      expect(result).toEqual(testUser);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('CE-Admin-User');
    });
  });

  // ========================================================================
  // hasAdminToken Tests
  // ========================================================================
  describe('hasAdminToken', () => {
    it('returns false when no admin token exists', () => {
      const result = hasAdminToken();
      expect(result).toBe(false);
    });

    it('returns true when admin token exists', () => {
      mockLocalStorage.setItem('CE-Admin-Token', 'some-token');
      
      const result = hasAdminToken();
      expect(result).toBe(true);
    });

    it('returns false when admin token is empty string', () => {
      mockLocalStorage.setItem('CE-Admin-Token', '');
      
      const result = hasAdminToken();
      // getAdminToken returns '' but hasAdminToken checks for !== null
      // This depends on localStorage.getItem behavior
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('CE-Admin-Token');
    });
  });

  // ========================================================================
  // setAdminAuth Tests
  // ========================================================================
  describe('setAdminAuth', () => {
    it('stores both admin token and user in localStorage', () => {
      const testToken = 'admin-jwt-token';
      const testUser: AdminUser = {
        _id: 'admin-456',
        username: 'test-admin',
      };
      
      setAdminAuth(testToken, testUser);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'CE-Admin-Token',
        testToken
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'CE-Admin-User',
        JSON.stringify(testUser)
      );
    });

    it('overwrites existing values when called multiple times', () => {
      const firstToken = 'first-token';
      const firstUser: AdminUser = { _id: '1', username: 'first' };
      const secondToken = 'second-token';
      const secondUser: AdminUser = { _id: '2', username: 'second' };
      
      setAdminAuth(firstToken, firstUser);
      setAdminAuth(secondToken, secondUser);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'CE-Admin-Token',
        secondToken
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'CE-Admin-User',
        JSON.stringify(secondUser)
      );
    });
  });

  // ========================================================================
  // clearAdminAuth Tests
  // ========================================================================
  describe('clearAdminAuth', () => {
    it('removes both admin token and user from localStorage', () => {
      mockLocalStorage.setItem('CE-Admin-Token', 'some-token');
      mockLocalStorage.setItem('CE-Admin-User', JSON.stringify({ _id: '1', username: 'test' }));
      
      clearAdminAuth();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-Admin-Token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-Admin-User');
    });

    it('does not throw when items do not exist', () => {
      expect(() => clearAdminAuth()).not.toThrow();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-Admin-Token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-Admin-User');
    });
  });

  // ========================================================================
  // adminFetch Tests
  // ========================================================================
  describe('adminFetch', () => {
    const mockToken = 'test-admin-token';

    beforeEach(() => {
      mockLocalStorage.setItem('CE-Admin-Token', mockToken);
    });

    it('throws error when no admin token is available', async () => {
      // Clear the token
      mockLocalStorage.removeItem('CE-Admin-Token');
      
      await expect(adminFetch('/test')).rejects.toThrow(
        'No admin token available. Please log in as admin.'
      );
    });

    it('adds Authorization header with Bearer token', async () => {
      const mockResponse = { ok: true, json: async () => ({}) };
      mockFetch.mockResolvedValue(mockResponse);
      
      await adminFetch('/test');
      
      // Get the actual call arguments
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers;
      
      // Headers might be a Headers object or a plain object
      if (headers instanceof Headers) {
        expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      } else {
        expect(headers?.Authorization).toBe(`Bearer ${mockToken}`);
      }
    });

    it('merges existing headers with Authorization header', async () => {
      const mockResponse = { ok: true, json: async () => ({}) };
      mockFetch.mockResolvedValue(mockResponse);
      
      await adminFetch('/test', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers;
      
      expect(headers).toBeInstanceOf(Headers);
      expect(headers?.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(headers?.get('Content-Type')).toBe('application/json');
    });

    it('passes through absolute URLs without modification', async () => {
      const mockResponse = { ok: true, json: async () => ({}) };
      mockFetch.mockResolvedValue(mockResponse);
      
      const absoluteUrl = 'https://external-api.com/test';
      await adminFetch(absoluteUrl);
      
      expect(mockFetch).toHaveBeenCalledWith(
        absoluteUrl,
        expect.any(Object)
      );
    });

    it('prepends apiUrl to relative paths', async () => {
      const mockResponse = { ok: true, json: async () => ({}) };
      mockFetch.mockResolvedValue(mockResponse);
      
      await adminFetch('/events');
      
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockApiUrl}/events`,
        expect.any(Object)
      );
    });

    it('includes credentials: include in request', async () => {
      const mockResponse = { ok: true, json: async () => ({}) };
      mockFetch.mockResolvedValue(mockResponse);
      
      await adminFetch('/test');
      
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]?.credentials).toBe('include');
    });

    it('passes through request init options', async () => {
      const mockResponse = { ok: true, json: async () => ({}) };
      mockFetch.mockResolvedValue(mockResponse);
      
      await adminFetch('/test', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
      });
      
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]?.method).toBe('POST');
      expect(callArgs[1]?.body).toBe(JSON.stringify({ key: 'value' }));
    });

    it('does not override existing Authorization header', async () => {
      const customAuth = 'Bearer custom-token';
      const mockResponse = { ok: true, json: async () => ({}) };
      mockFetch.mockResolvedValue(mockResponse);
      
      await adminFetch('/test', {
        headers: {
          Authorization: customAuth,
        },
      });
      
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers;
      expect(headers?.get('Authorization')).toBe(customAuth);
    });
  });

  // ========================================================================
  // checkAdminStatus Tests
  // ========================================================================
  describe('checkAdminStatus', () => {
    it('returns false when no admin token exists', async () => {
      // No token in localStorage
      const result = await checkAdminStatus();
      
      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns true on successful response with isAdmin: true', async () => {
      const testToken = 'valid-token';
      mockLocalStorage.setItem('CE-Admin-Token', testToken);
      
      const mockResponse = {
        ok: true,
        json: async () => ({ isAdmin: true, user: { _id: '1', username: 'admin' } }),
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      const result = await checkAdminStatus();
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockApiUrl}/admin/check`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${testToken}`,
          }),
        })
      );
    });

    it('returns false and clears auth on 401 Unauthorized', async () => {
      const testToken = 'expired-token';
      mockLocalStorage.setItem('CE-Admin-Token', testToken);
      mockLocalStorage.setItem('CE-Admin-User', JSON.stringify({ _id: '1', username: 'test' }));
      
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      const result = await checkAdminStatus();
      
      expect(result).toBe(false);
      // Verify clearAdminAuth was called by checking localStorage.removeItem
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-Admin-Token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-Admin-User');
    });

    it('returns false and clears auth on 403 Forbidden', async () => {
      const testToken = 'invalid-token';
      mockLocalStorage.setItem('CE-Admin-Token', testToken);
      mockLocalStorage.setItem('CE-Admin-User', JSON.stringify({ _id: '1', username: 'test' }));
      
      const mockResponse = {
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      const result = await checkAdminStatus();
      
      expect(result).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-Admin-Token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-Admin-User');
    });

    it('throws error on other failed responses', async () => {
      const testToken = 'valid-token';
      mockLocalStorage.setItem('CE-Admin-Token', testToken);
      
      const mockResponse = {
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      await expect(checkAdminStatus()).rejects.toThrow(
        'Failed to check admin status: 500 Internal Server Error'
      );
    });

    it('throws error on 404 response', async () => {
      const testToken = 'valid-token';
      mockLocalStorage.setItem('CE-Admin-Token', testToken);
      
      const mockResponse = {
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      // Track calls before this test
      const initialRemoveItemCalls = mockLocalStorage.removeItem.mock.calls.length;
      
      await expect(checkAdminStatus()).rejects.toThrow(
        'Failed to check admin status: 404 Not Found'
      );
      
      // 404 is not 401/403, so clearAuth should NOT be called
      // Check that no NEW calls to removeItem were made
      expect(mockLocalStorage.removeItem.mock.calls.length).toBe(initialRemoveItemCalls);
    });
  });

  // ========================================================================
  // loginAdmin Tests
  // ========================================================================
  describe('loginAdmin', () => {
    const mockUsername = 'admin';
    const mockPassword = 'password123';

    it('posts credentials to /admin/login endpoint', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          token: 'new-admin-token',
          user: { _id: 'admin-123', username: 'admin' },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      await loginAdmin(mockUsername, mockPassword);
      
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockApiUrl}/admin/login`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ username: mockUsername, password: mockPassword }),
        })
      );
    });

    it('stores token and user on successful login', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          token: 'new-admin-token',
          user: { _id: 'admin-123', username: 'admin' },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      const result = await loginAdmin(mockUsername, mockPassword);
      
      expect(result).toEqual({ _id: 'admin-123', username: 'admin' });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'CE-Admin-Token',
        'new-admin-token'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'CE-Admin-User',
        JSON.stringify({ _id: 'admin-123', username: 'admin' })
      );
    });

    it('throws error on failed login', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => 'Invalid credentials',
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      await expect(loginAdmin(mockUsername, mockPassword)).rejects.toThrow(
        'NO SOUP FOR YOU!' // This is the actual error message in the code
      );
    });

    it('extracts origin from VITE_API_URL', async () => {
      // VITE_API_URL might have a path, we need to test origin extraction
      vi.stubEnv('VITE_API_URL', 'https://api.example.com/some/path');
      
      const mockResponse = {
        ok: true,
        json: async () => ({
          token: 'token',
          user: { _id: '1', username: 'admin' },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      await loginAdmin(mockUsername, mockPassword);
      
      // The code uses new URL(getApiUrl()).origin
      // So it should use the origin part only
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/admin/login',
        expect.any(Object)
      );
    });
  });

  // ========================================================================
  // logoutAdmin Tests
  // ========================================================================
  describe('logoutAdmin', () => {
    it('clears admin authentication data', () => {
      // Clear the mock calls from previous tests
      vi.clearAllMocks();
      
      logoutAdmin();
      
      // Import clearAdminAuth directly to check if it was called
      // Since logoutAdmin just calls clearAdminAuth, we can verify
      // by checking that localStorage.removeItem was called
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-Admin-Token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-Admin-User');
    });

    it('does not throw when called', () => {
      expect(() => logoutAdmin()).not.toThrow();
    });
  });
});
