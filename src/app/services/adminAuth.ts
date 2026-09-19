/**
 * Admin Auth Service - Manages admin authentication for the Common Era Game
 * 
 * This service handles:
 * - Storing and retrieving admin JWT tokens
 * - Checking if the current user is an admin via API
 * - Logging in as admin by POSTing credentials to /admin/login
 * 
 * Admin authentication is separate from regular user authentication.
 * Admin tokens are stored in localStorage to persist across page refreshes.
 */

const ADMIN_TOKEN_KEY = 'CE-Admin-Token';
const ADMIN_USER_KEY = 'CE-Admin-User';

/**
 * Interface for admin user data returned from the backend
 * This represents an authenticated admin user
 */
export interface AdminUser {
  _id: string;
  username: string;
  // Future: could add email, role, etc.
}

/**
 * Interface for successful login response from /admin/login endpoint
 */
export interface AdminLoginResponse {
  token: string;
  user: AdminUser;
}

/**
 * Interface for admin status check response from /admin/check endpoint
 */
export interface AdminCheckResponse {
  isAdmin: boolean;
  user?: AdminUser;
}

/**
 * Get the stored admin JWT token from localStorage
 * @returns The admin JWT token string, or null if not found
 */
export const getAdminToken = (): string | null => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

/**
 * Get the stored admin user data from localStorage
 * @returns The admin user object, or null if not found
 */
export const getAdminUser = (): AdminUser | null => {
  const userJson = localStorage.getItem(ADMIN_USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as AdminUser;
  } catch {
    return null;
  }
};

/**
 * Check if there is a stored admin token (synchronous check, no API call)
 * @returns true if admin token exists, false otherwise
 */
export const hasAdminToken = (): boolean => {
  return getAdminToken() !== null;
};

/**
 * Store both admin JWT token and user data in localStorage
 * @param token - The admin JWT token to store
 * @param user - The admin user data to store
 */
export const setAdminAuth = (token: string, user: AdminUser) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
};

/**
 * Clear admin authentication data from localStorage
 */
export const clearAdminAuth = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
};

/**
 * Get the API base URL from environment variables
 * Falls back to production URL if not configured
 * @returns The API base URL string
 */
const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL;
};

/**
 * Check if the current user is an admin by making an API request
 * This validates the stored admin token with the backend
 * 
 * @returns Promise resolving to true if user is admin, false otherwise
 * @throws Error if the API request fails
 */
export const checkAdminStatus = async (): Promise<boolean> => {
  const apiUrl = getApiUrl();
  const token = getAdminToken();
  
  // If no token stored, definitely not admin
  if (!token) {
    return false;
  }
  
  // Make API request to check admin status
  // The backend should validate the token in the Authorization header
  const response = await fetch(`${apiUrl}/admin/check`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include', // Include cookies if needed
  });
  
  if (!response.ok) {
    // Token is invalid or expired
    if (response.status === 401 || response.status === 403) {
      clearAdminAuth();
      return false;
    }
    // For other errors, still treat as not admin but don't clear token
    // (might be temporary network issue)
    const errorText = await response.text();
    throw new Error(`Failed to check admin status: ${response.status} ${errorText}`);
  }
  
  const data: AdminCheckResponse = await response.json();
  return data.isAdmin;
};

/**
 * Login as an admin user by POSTing credentials to /admin/login
 * On success, stores the admin token and user data
 * 
 * @param username - The admin username
 * @param password - The admin password
 * @returns Promise resolving to the admin user data on success
 * @throws Error if login fails
 */
export const loginAdmin = async (username: string, password: string): Promise<AdminUser> => {
  const apiUrl = new URL(getApiUrl()).origin;
  const response = await fetch(`${apiUrl}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
    credentials: 'include', // Include cookies if needed
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NO SOUP FOR YOU!`);
    // throw new Error(`Admin login failed: ${response.status} ${errorText}`);
  }
	
  const data: AdminLoginResponse = await response.json();
  
  // Store the admin authentication data
  setAdminAuth(data.token, data.user);
  
  return data.user;
};

/**
 * Helper to make authenticated admin API calls
 * Automatically includes the admin JWT token in the Authorization header
 * 
 * This should be used for all API calls made from admin pages that require
 * admin authentication. The backend will return 401/403 if the token is invalid.
 * 
 * @param input - URL or RequestInfo to fetch
 * @param init - Optional fetch init options (headers will be merged with Authorization)
 * @returns Promise resolving to the fetch Response
 * @throws Error if no admin token is available
 */
export const adminFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const token = getAdminToken();
  if (!token) {
    throw new Error('No admin token available. Please log in as admin.');
  }
  
  // Merge headers, adding Authorization if not already present
  const headers = new Headers(init?.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Get the API base URL
  const apiUrl = getApiUrl();
  
  // If input is a string, prepend apiUrl if it's a relative path
  let url = input;
  if (typeof input === 'string' && !input.startsWith('http')) {
    url = `${apiUrl}${input}`;
  }
  
  return fetch(url, {
    ...init,
    headers,
    credentials: 'include', // Include cookies if needed
  });
};

/**
 * Logout admin user by clearing stored authentication data
 */
export const logoutAdmin = () => {
  clearAdminAuth();
};
