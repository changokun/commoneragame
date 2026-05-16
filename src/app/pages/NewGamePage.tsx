import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { Input } from "../components/ui/input";

type GameMode = "competitive" | "collaborative" | null;
type DeviceMode = "single" | "multiple" | null;

interface FormData {
  gameMode: GameMode;
  deviceMode: DeviceMode;
  playerNames: string[];
  isSolo: boolean;
}

export function NewGamePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    gameMode: null,
    deviceMode: null,
    playerNames: [""],
    isSolo: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGameModeSelect = (mode: GameMode) => {
    setFormData({ ...formData, gameMode: mode });
    setError(null);
  };

  const handleDeviceModeSelect = (mode: DeviceMode) => {
    setFormData({ ...formData, deviceMode: mode });
    setError(null);
  };

  const handleSoloSelect = () => {
    setFormData({ ...formData, isSolo: true, playerNames: [] });
    setError(null);
  };

  const handleMultiplayerSelect = () => {
    setFormData({ ...formData, isSolo: false, playerNames: [""] });
    setError(null);
  };

  const handlePlayerNameChange = (index: number, value: string) => {
    const newPlayerNames = [...formData.playerNames];
    newPlayerNames[index] = value;

    // If this is the last input and it's filled, add a new blank one (up to 20 players)
    if (index === newPlayerNames.length - 1 && value.trim() && newPlayerNames.length < 20) {
      newPlayerNames.push("");
    }

    setFormData({ ...formData, playerNames: newPlayerNames });
  };

  const handleRemovePlayer = (index: number) => {
    const newPlayerNames = formData.playerNames.filter((_, i) => i !== index);
    // Ensure at least one input remains
    if (newPlayerNames.length === 0) {
      newPlayerNames.push("");
    }
    setFormData({ ...formData, playerNames: newPlayerNames });
  };

  const handleSubmit = async () => {
    if (!formData.gameMode || !formData.deviceMode) {
      setError("Please complete all questions");
      return;
    }

    // Validate player names for single device mode
    if (formData.deviceMode === "single" && !formData.isSolo) {
      const filledNames = formData.playerNames.filter(name => name.trim());
      if (filledNames.length < 2) {
        setError("Please enter at least 2 player names or select solo mode");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      // Filter out empty player names
      const playerNames = formData.isSolo
        ? []
        : formData.playerNames.filter(name => name.trim());

      const response = await fetch(`${apiUrl}/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameMode: formData.gameMode,
          deviceMode: formData.deviceMode,
          playerNames,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from server
        setError(data.error || "Failed to create game. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success - navigate to play page
      navigate(`/play/${data.gameId}`);
    } catch (err) {
      // Network error - server not available
      setError("Server is not available. Please try again later.");
      setIsSubmitting(false);
    }
  };

  const allQuestionsAnswered =
    formData.gameMode &&
    formData.deviceMode &&
    (formData.deviceMode === "multiple" ||
     formData.isSolo ||
     formData.playerNames.filter(name => name.trim()).length >= 2);

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
          Answer the questions below to set up your game
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6 space-y-4">
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
        </Card>

        {formData.gameMode && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">
              Do you want to play on only this device or have other players join on their own devices?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleDeviceModeSelect("single")}
                className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                  formData.deviceMode === "single"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">Only this Device</h3>
                <p className="text-sm text-muted-foreground">
                  All players will share this screen and take turns
                </p>
              </button>

              <button
                onClick={() => handleDeviceModeSelect("multiple")}
                className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                  formData.deviceMode === "multiple"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">They got their own devices</h3>
                <p className="text-sm text-muted-foreground">
                  Players will join from their own devices
                </p>
              </button>
            </div>
          </Card>
        )}

        {formData.deviceMode === "single" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Who's Playing?</h2>

            <div className="space-y-4">
              <button
                onClick={handleSoloSelect}
                className={`w-full p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                  formData.isSolo
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">Just Me - Solo</h3>
                <p className="text-sm text-muted-foreground">
                  Play by yourself
                </p>
              </button>

              <div className="space-y-3">
                <button
                  onClick={handleMultiplayerSelect}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all hover:border-primary ${
                    !formData.isSolo && formData.playerNames.length > 0
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <h3 className="font-semibold mb-2">Multiple Players</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter player or team names (2-20 players)
                  </p>

                  {!formData.isSolo && (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      {formData.playerNames.map((name, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="text"
                            placeholder={`Player ${index + 1}`}
                            value={name}
                            onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                            className="flex-1"
                            maxLength={50}
                          />
                          {formData.playerNames.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePlayer(index)}
                              className="shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {formData.playerNames.length >= 20 && (
                        <p className="text-sm text-muted-foreground">
                          Maximum 20 players reached
                        </p>
                      )}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {allQuestionsAnswered && (
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
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
        )}
      </div>
    </div>
  );
}
