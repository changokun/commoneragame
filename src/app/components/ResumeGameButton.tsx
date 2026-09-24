import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { PlayCircle } from "lucide-react";

/**
 * ResumeGameButton Component
 * 
 * This component checks localStorage for a current game ID (stored as "CEcurrentGameId").
 * If a game ID exists, it renders a button that links to the play page for that game.
 * This allows users to quickly resume their in-progress game.
 * 
 * @returns {JSX.Element | null} The Resume Game button if a game exists, otherwise null
 */
export function ResumeGameButton() {
	const [gameId, setGameId] = useState<string | null>(null);

	// Check localStorage for game ID on mount
	// Using useEffect to avoid SSR issues with localStorage
	useEffect(() => {
		const savedGameId = localStorage.getItem("CEcurrentGameId");
		if (savedGameId) {
			setGameId(savedGameId);
		}
	}, []);

	// If no game ID found, don't render anything
	if (!gameId) {
		return null;
	}

	return (
		<Link to={`/play/${gameId}`} className="block">
			<Button variant="secondary" className="gap-2 w-full max-w-120">
				<PlayCircle className="h-4 w-4" />
				Resume Current Game
			</Button>
		</Link>
	);
}
