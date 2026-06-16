// Shared constants for the Common Era Game
// This file contains constants used across multiple components and pages

// Cache key prefix for storing events in localStorage
// Used by both Timeline component and PlayPage to share event data
// Full cache key format: `${EVENT_CACHE_KEY_PREFIX}${gameId}`
export const EVENT_CACHE_KEY_PREFIX = "CE-game-event-cache-";
