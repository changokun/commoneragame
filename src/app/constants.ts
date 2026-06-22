// Shared constants for the Common Era Game
// This file contains constants used across multiple components and pages

// Cache key prefix for storing events in localStorage
// Used by both Timeline component and PlayPage to share event data
// Full cache key format: `${EVENT_CACHE_KEY_PREFIX}${gameId}`
export const EVENT_CACHE_KEY_PREFIX = "CE-game-event-cache-";

// Storage key for the user session in localStorage
// This is a GLOBAL session that identifies the user across all games
// The session contains: { _id: string, name: string, isAnonymous: boolean }
// When a user is not logged in, isAnonymous will be true and name will be something like "Anonymous-<uuid>"
export const USER_SESSION_KEY = "CE-userSession";

// Storage key for the current game ID in localStorage
// Used to remember which game the user was last viewing
// This allows returning to the same game after page refresh or navigation
export const CURRENT_GAME_KEY = "CE-currentGameId";
