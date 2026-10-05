/**
 * Game Service - Provides game creation and management utilities
 * This module contains functions for creating games with predefined settings
 */

import { getToken, ensureAuth } from "./auth";
import { GAMES_CREATED_COUNT_KEY } from "../constants";

/**
 * Default settings for a simple/beginner game
 * Uses collaborative mode, single player, medium difficulty, and broad historical range
 */
export const SIMPLE_GAME_SETTINGS = {
	gameMode: "collaborative" as const,
	deviceMode: "single" as const,
	playerNames: [] as string[],
	strikeLimit: 3,
	targetScore: 10,
	beginningFrom: "2000 BCE",
	upThrough: `${new Date().getFullYear()} CE`,
	filterTags: [] as string[],
	difficultyMin: 2,
	difficultyMax: 3,
};

/**
 * Creates a new game with beginner-friendly default settings
 * This is used for the "Show me how to play" quick start option
 * 
 * @param apiUrl - The API base URL (defaults to env variable)
 * @returns Promise resolving to the created game data with _id
 * @throws Error if game creation fails
 */
export async function createSimpleGame(apiUrl?: string) {
	// Ensure we have authentication credentials (get or create anonymous token)
	const playerId = await ensureAuth();

	// todo revise the SIMPLE_GAME_SETTINGS into something appropriate for the user's expected education: based on language, and possibly ip

	const baseUrl = apiUrl || import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';

	const response = await fetch(`${baseUrl}/games`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${getToken()}`,
		},
		body: JSON.stringify({
			playerId,
			...SIMPLE_GAME_SETTINGS,
		}),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || "Failed to create game. Please try again.");
	}

	return data;
}

/**
 * Increments the games created counter in localStorage
 * Used to track user experience and simplify UI for new users
 */
export function incrementGamesCreatedCount(): number {
	const currentCount = parseInt(localStorage.getItem(GAMES_CREATED_COUNT_KEY) || "0", 10);
	const newCount = currentCount + 1;
	localStorage.setItem(GAMES_CREATED_COUNT_KEY, newCount.toString());
	return newCount;
}
