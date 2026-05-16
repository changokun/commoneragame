import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { ArrowLeft, Loader2 } from "lucide-react";

type GameMode = "competitive" | "collaborative" | null;

interface FormData {
  gameMode: GameMode;
}

export function NewGamePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    gameMode: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGameModeSelect = (mode: GameMode) => {
    setFormData({ gameMode: mode });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.gameMode) {
      setError("Please select a game mode");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameMode: formData.gameMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from server
        setError(data.error || "Failed to create game");
        setIsSubmitting(false);
        return;
      }

      // Success - navigate to play page
      navigate(`/play/${data.gameId}`);
    } catch (err) {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create New Game</h1>
        <p className="text-muted-foreground">
          Answer a few questions to set up your game
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Would you like to play competitively or collaboratively?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleGameModeSelect("competitive")}
              className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                formData.gameMode === "competitive"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <h3 className="font-semibold text-lg mb-2">Play to Win</h3>
              <p className="text-sm text-muted-foreground">
                Compete against other players to achieve the highest score
              </p>
            </button>

            <button
              onClick={() => handleGameModeSelect("collaborative")}
              className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                formData.gameMode === "collaborative"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <h3 className="font-semibold text-lg mb-2">Play to Build</h3>
              <p className="text-sm text-muted-foreground">
                Work together with others to build a thriving civilization
              </p>
            </button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.gameMode || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Game"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
