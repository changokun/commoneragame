import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { Input } from "../components/ui/input";

type GameMode = "competitive" | "collaborative" | null;
type DeviceMode = "single" | "multiple" | null;
type PlayerType = "justMe" | "multiple" | null;

interface FormData {
  gameMode: GameMode;
  playerType: PlayerType;
  deviceMode: DeviceMode;
  playerNames: string[];
}

export function NewGamePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    gameMode: null,
    playerType: null,
    deviceMode: null,
    playerNames: [""],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGameModeSelect = (mode: GameMode) => {
    setFormData({ ...formData, gameMode: mode });
    setError(null);
  };

  const handlePlayerTypeSelect = (playerType: PlayerType) => {
    setFormData({ ...formData, playerType, deviceMode: null, playerNames: [""] });
    setError(null);
  };

  const handleDeviceModeSelect = (mode: DeviceMode) => {
    setFormData({ ...formData, deviceMode: mode });
    setError(null);
  };

  const handlePlayerNameChange = (index: number, value: string) => {
    const newPlayerNames = [...formData.playerNames];
    newPlayerNames[index] = value;

    if (index === newPlayerNames.length - 1 && value.trim() && newPlayerNames.length < 20) {
      newPlayerNames.push("");
    }

    setFormData({ ...formData, playerNames: newPlayerNames });
  };

  const handleRemovePlayer = (index: number) => {
    const newPlayerNames = formData.playerNames.filter((_, i) => i !== index);
    if (newPlayerNames.length === 0) {
      newPlayerNames.push("");
    }
    setFormData({ ...formData, playerNames: newPlayerNames });
  };

  const handleSubmit = async () => {
    if (!formData.gameMode || !formData.playerType) {
      setError("Please complete all questions");
      return;
    }

    if (formData.playerType === "multiple" && !formData.deviceMode) {
      setError("Please complete all questions");
      return;
    }

    // Validate player names for single device with multiple players
    if (formData.playerType === "multiple" && formData.deviceMode === "single") {
      const filledNames = formData.playerNames.filter(name => name.trim());
      if (filledNames.length < 2) {
        setError("Please enter at least 2 player names");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      const playerNames = formData.playerType === "justMe"
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
        setError(data.error || "Failed to create game. Please try again.");
        setIsSubmitting(false);
        return;
      }

      navigate(`/play/${data.gameId}`);
    } catch (err) {
      setError("Server is not available. Please try again later.");
      setIsSubmitting(false);
    }
  };

  const allQuestionsAnswered =
    formData.gameMode &&
    formData.playerType &&
    (formData.playerType === "justMe" ||
      (formData.deviceMode &&
       (formData.deviceMode === "multiple" ||
        formData.playerNames.filter(name => name.trim()).length >= 2)));

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
            <h2 className="text-xl font-semibold">Who's Playing?</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handlePlayerTypeSelect("justMe")}
                className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                  formData.playerType === "justMe"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">Just Me</h3>
                <p className="text-sm text-muted-foreground">
                  Play by yourself
                </p>
              </button>

              <button
                onClick={() => handlePlayerTypeSelect("multiple")}
                className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                  formData.playerType === "multiple"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">Multiple Players</h3>
                <p className="text-sm text-muted-foreground">
                  Playing with others
                </p>
              </button>
            </div>
          </Card>
        )}

        {formData.gameMode && formData.playerType === "multiple" && (
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

        {formData.gameMode && formData.playerType === "multiple" && formData.deviceMode === "single" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Player Names</h2>
            <p className="text-sm text-muted-foreground">
              Enter player or team names (2-20 players)
            </p>

            <div className="space-y-2">
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
