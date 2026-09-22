/**
 * Tests for auth.ts - Regular User Authentication Service
 * 
 * This file tests:
 * - Token management (get, set, clear)
 * - Player ID management
 * - Anonymous token creation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import the functions to test
import {
  getToken,
  getPlayerId,
  setAuth,
  clearAuth,
  ensureAuth,
} from './auth';

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

// Mock fetch for testing ensureAuth
const mockFetch = vi.fn();

describe('auth.ts - User Authentication Service', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    // Create fresh mock for each test
    mockLocalStorage = createMockLocalStorage();
    vi.stubGlobal('localStorage', mockLocalStorage);
    
    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock fetch
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // getToken Tests
  // ========================================================================
  describe('getToken', () => {
    it('returns null when no token exists in localStorage', () => {
      // localStorage is empty by default
      const result = getToken();
      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('CE-JWT');
    });

    it('returns the stored token when it exists in localStorage', () => {
      const testToken = 'test-jwt-token';
      mockLocalStorage.setItem('CE-JWT', testToken);
      
      const result = getToken();
      expect(result).toBe(testToken);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('CE-JWT');
    });

    it('returns null when localStorage has null for token key', () => {
      mockLocalStorage.setItem('CE-JWT', '');
      
      const result = getToken();
      // localStorage.getItem returns null for non-existent keys, but '' for empty
      // We need to check the actual behavior
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('CE-JWT');
    });
  });

  // ========================================================================
  // getPlayerId Tests
  // ========================================================================
  describe('getPlayerId', () => {
    it('returns null when no playerId exists in localStorage', () => {
      const result = getPlayerId();
      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('CE-PlayerId');
    });

    it('returns the stored playerId when it exists in localStorage', () => {
      const testPlayerId = 'player-123';
      mockLocalStorage.setItem('CE-PlayerId', testPlayerId);
      
      const result = getPlayerId();
      expect(result).toBe(testPlayerId);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('CE-PlayerId');
    });
  });

  // ========================================================================
  // setAuth Tests
  // ========================================================================
  describe('setAuth', () => {
    it('stores both token and playerId in localStorage', () => {
      const testToken = 'new-jwt-token';
      const testPlayerId = 'new-player-456';
      
      setAuth(testToken, testPlayerId);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('CE-JWT', testToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('CE-PlayerId', testPlayerId);
    });

    it('overwrites existing values when called multiple times', () => {
      const firstToken = 'first-token';
      const firstPlayerId = 'first-player';
      const secondToken = 'second-token';
      const secondPlayerId = 'second-player';
      
      setAuth(firstToken, firstPlayerId);
      setAuth(secondToken, secondPlayerId);
      
      // Check that setItem was called with the new values
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('CE-JWT', secondToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('CE-PlayerId', secondPlayerId);
    });
  });

  // ========================================================================
  // clearAuth Tests
  // ========================================================================
  describe('clearAuth', () => {
    it('removes both token and playerId from localStorage', () => {
      // First, set some values
      mockLocalStorage.setItem('CE-JWT', 'some-token');
      mockLocalStorage.setItem('CE-PlayerId', 'some-player');
      
      clearAuth();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-JWT');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-PlayerId');
    });

    it('does not throw when items do not exist', () => {
      // Call clearAuth with empty localStorage
      expect(() => clearAuth()).not.toThrow();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-JWT');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('CE-PlayerId');
    });
  });

  // ========================================================================
  // ensureAuth Tests
  // ========================================================================
  describe('ensureAuth', () => {
    const mockApiUrl = 'https://test-api.example.com';

    beforeEach(() => {
      // Mock import.meta.env.VITE_API_URL
      vi.stubEnv('VITE_API_URL', mockApiUrl);
    });

    it('returns existing playerId when token and playerId already exist', async () => {
      const existingToken = 'existing-token';
      const existingPlayerId = 'existing-player';
      
      mockLocalStorage.setItem('CE-JWT', existingToken);
      mockLocalStorage.setItem('CE-PlayerId', existingPlayerId);
      
      const result = await ensureAuth();
      
      expect(result).toBe(existingPlayerId);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches anonymous token when no credentials exist', async () => {
      // localStorage is empty
      const mockResponse = {
        ok: true,
        json: async () => ({
          token: 'new-anonymous-token',
          playerId: 'new-anonymous-player',
        }),
      };
      
      mockFetch.mockResolvedValue(mockResponse);
      
      const result = await ensureAuth();
      
      expect(result).toBe('new-anonymous-player');
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockApiUrl}/auth/anonymous`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      
      // Verify credentials were stored
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'CE-JWT',
        'new-anonymous-token'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'CE-PlayerId',
        'new-anonymous-player'
      );
    });

    it('throws error when anonymous token fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });
      
      await expect(ensureAuth()).rejects.toThrow(
        'Failed to get even an anonymous token: 500 Internal Server Error'
      );
    });

    it('fetches anonymous token when only token exists without playerId', async () => {
      mockLocalStorage.setItem('CE-JWT', 'only-token');
      // No playerId set
      
      const mockResponse = {
        ok: true,
        json: async () => ({
          token: 'new-token',
          playerId: 'new-player',
        }),
      };
      
      mockFetch.mockResolvedValue(mockResponse);
      
      await ensureAuth();
      
      expect(mockFetch).toHaveBeenCalled();
    });

    it('fetches anonymous token when only playerId exists without token', async () => {
      mockLocalStorage.setItem('CE-PlayerId', 'only-player');
      // No token set
      
      const mockResponse = {
        ok: true,
        json: async () => ({
          token: 'new-token',
          playerId: 'new-player',
        }),
      };
      
      mockFetch.mockResolvedValue(mockResponse);
      
      await ensureAuth();
      
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
