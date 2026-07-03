// Shared TypeScript interfaces for the Common Era Game
// These interfaces are used across multiple components and pages
// Centralizing them here ensures consistency and makes them easy to update

// ============================================================================
// PLAYER TYPES
// ============================================================================

/**
 * Player interface: represents a player in the game
 * Contains all player data including name, identifier, and score
 * This is the Player object as returned from the backend API
 */
export interface Player {
  _id: string;           // Unique identifier for the player
  username: string;         // Display name of the player
  score?: number;       // Optional: current score (used in competitive mode)
}

// ============================================================================
// USER SESSION TYPES
// ============================================================================

/**
 * UserSession interface: represents the currently logged-in user's session
 * This is stored in localStorage and used to identify the user across all pages
 * 
 * Key points:
 * - This is GLOBAL, not scoped to a specific game
 * - It represents the person sitting in front of the screen
 * - When a game is loaded, we match this user against the game's players array
 * - If there's a match, the user is a participant; otherwise, they're a spectator
 * - Starts as anonymous (isAnonymous: true) until user logs in
 * - The _id should match one of the Player._id values in any game this user joins
 */
export interface UserSession {
  _id: string;           // Unique identifier for the user (matches Player._id)
  username: string;         // Display name of the user
  isAnonymous: boolean; // True if user hasn't logged in (default: true)
  // Future: could add avatar, email, etc. when login system is developed
}

// ============================================================================
// GAME STATE TYPES
// ============================================================================

/**
 * GameState interface: represents the complete state of a game
 * Received from the backend API when fetching /games/:id
 * 
 * Structure notes:
 * - gameMode: collaborative (all players work together) or competitive (players compete)
 * - deviceMode: single (one device per game) or multiple (multiple devices per game)
 * - settings: game configuration like target score and turn order
 * - state: contains the actual game state including timeline, turns, etc.
 * - players: array of Player objects participating in this game
 * - remainingEventCount: how many events are left to draw (optional, from API)
 */
export interface GameState {
  gameMode: "competitive" | "collaborative";
  deviceMode: "single" | "multiple";
  settings: {
    targetScore: number;    // Target score for victory in competitive mode
    strikeLimit: number;
    turnOrder: string;      // Order in which players take turns
  };
  state: {
    state: string;          // Current state: 'lobby', 'underway', 'over'
    victor?: string;        // Player ID of the winner (if game is over)
    timelineCollaborative: any[];  // Array of event IDs in the timeline
    currentTurn: number;    // Index into players array for current turn
    currentEventIndex: number;
    agreedEvents: any[];   // Events that all players have agreed on
    incorrectCardStack: any[];  // Events that were guessed incorrectly
    limbo?: string;        // Event ID of a drawn card that hasn't been guessed yet
  };
  players: Player[];       // Array of Player objects in this game
  remainingEventCount?: number;  // How many events are left to draw
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Event interface: represents a historical event card in the game
 * These are fetched from the /events endpoint or cached in localStorage
 */
export interface Event {
  _id: string;
  title: string;
  name?: string;          // Alternative to title
  date: string;           // ISO date string or year
  description?: string;   // Detailed description of the event
  strikes?: object[];     // Array of {player IDs & the date ranges} who got this wrong
  // Future: could add category, difficulty, imageUrl, etc.
}

// ============================================================================
// GAME END TYPES
// ============================================================================

/**
 * Represents the result of a game for display in GameEndScreen
 * Used to pass data between PlayPage and GameEndScreen component
 */
export interface GameResult {
  isVictory: boolean;     // Whether the game ended in victory
  gameMode: "competitive" | "collaborative";
  players: Player[];
  timelineLength: number;
  incorrectCount: number;
  remainingEvents: number;
}
