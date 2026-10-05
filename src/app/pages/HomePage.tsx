import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "../components/ui/button";
import { PlusCircle, Users, Loader2 } from "lucide-react";
import { ResumeGameButton } from "../components/ResumeGameButton";
import { createSimpleGame } from "../services/game";

export function HomePage() {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState(false);

	/**
	 * startSimpleGame - Creates a new game with beginner-friendly default settings
	 * This is the same quick-start option available on the New Game page
	 * Uses collaborative mode, single player, medium difficulty, and broad historical range
	 * Note: Does NOT increment the games created counter since this is a trial from the homepage
	 */
	const startSimpleGame = async () => {
		setIsSubmitting(true);

		try {
			const data = await createSimpleGame();

			// Store game ID in localStorage
			localStorage.setItem("CEcurrentGameId", data._id);

			navigate(`/play/${data._id}`);
		} catch (err) {
			console.error("Failed to create simple game:", err);
			setIsSubmitting(false);
		}
	};
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Common Era
        </h1>

        <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
          Test your knowledge of history! Can you put these events in order?
        </p>

				<ResumeGameButton />

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Button size="lg" className="w-full sm:w-auto gap-2" onClick={startSimpleGame} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <PlusCircle className="h-5 w-5" />
                Show me how to play
              </>
            )}
          </Button>

          <Link to="/new-game">
            <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
              <PlusCircle className="h-5 w-5" />
              Create New Game
            </Button>
          </Link>

          <Link to="/join-game">
            <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
              <Users className="h-5 w-5" />
              Join Existing Game
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
