/**
 * Auth Service - Manages JWT authentication for the Common Era Game
 * 
 * This service handles:
 * - Storing and retrieving JWT tokens
 * - Storing and retrieving player IDs
 * - Creating anonymous tokens for users who haven't logged in
 * 
 * Users remain anonymous until they explicitly log in (future feature).
 * The token and playerId are stored in localStorage to persist across page refreshes.
 */

const TOKEN_KEY = 'CE-JWT';
const PLAYER_ID_KEY = 'CE-PlayerId';

/**
 * Response from /auth/anonymous endpoint
 */
interface AuthResponse {
  token: string;
  playerId: string;
}

/**
 * Get the stored JWT token from localStorage
 * @returns The JWT token string, or null if not found
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get the stored player ID from localStorage
 * @returns The player ID string, or null if not found
 */
export const getPlayerId = (): string | null => {
  return localStorage.getItem(PLAYER_ID_KEY);
};

/**
 * Store both JWT token and player ID in localStorage
 * @param token - The JWT token to store
 * @param playerId - The player ID to store
 */
export const setAuth = (token: string, playerId: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PLAYER_ID_KEY, playerId);
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PLAYER_ID_KEY);
};

/**
 * Ensure we have authentication credentials.
 * If we already have a token and playerId, return the playerId.
 * Otherwise, create an anonymous token by POSTing to /auth/anonymous.
 * 
 * @returns Promise resolving to the playerId string
 * @throws Error if failed to get anonymous token
 */
export const ensureAuth = async (): Promise<string> => {
  // Check if we already have credentials
  const existingToken = getToken();
  const existingPlayerId = getPlayerId();
  
  if (existingToken && existingPlayerId) {
    return existingPlayerId;
  }

  // No existing credentials - get anonymous token
  const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
  
  const response = await fetch(`${apiUrl}/auth/anonymous`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get even an anonymous token: ${response.status} ${errorText}`);
  }

  const data: AuthResponse = await response.json();
  
  // Store the new credentials
  setAuth(data.token, data.playerId);
  
  return data.playerId;
};
