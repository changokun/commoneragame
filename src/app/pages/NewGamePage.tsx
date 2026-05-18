import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";

type GameMode = "competitive" | "collaborative" | null;
type DeviceMode = "single" | "multiple" | null;
type PlayerType = "justMe" | "multiple" | null;

interface FormData {
  gameMode: GameMode;
  playerType: PlayerType;
  deviceMode: DeviceMode;
  playerNames: string[];
  eventCount: number;
  errorLimit: number;
  beginningFrom: string;
  upThrough: string;
  geographicLimits: string[];
  topics: string[];
}

interface Preset {
  name: string;
  eventCount: number;
  errorLimit: number;
  beginningFrom: string;
  upThrough: string;
  geographicLimits: string[];
  topics: string[];
}

const PRESETS: Preset[] = [
  {
    name: "Roman Art History",
    eventCount: 30,
    errorLimit: 3,
    beginningFrom: "100 BCE",
    upThrough: "400 CE",
    geographicLimits: ["Europe"],
    topics: ["Rome", "Art", "Architecture"],
  },
  {
    name: "World Wars",
    eventCount: 50,
    errorLimit: 5,
    beginningFrom: "1914",
    upThrough: "1945",
    geographicLimits: ["World"],
    topics: ["WWI", "WWII"],
  },
  {
    name: "Ancient History",
    eventCount: 40,
    errorLimit: 3,
    beginningFrom: "4000 BCE",
    upThrough: "500 CE",
    geographicLimits: ["World"],
    topics: ["Rome"],
  },
];

const GEOGRAPHIC_OPTIONS = [
  "Europe",
  "Asia",
  "Pacific",
  "The Americas",
  "U.S.A.",
  "Africa",
  "World",
];

const TOPIC_OPTIONS = [
  "WWI",
  "WWII",
  "Art",
  "Rome",
  "Food",
  "Architecture",
  "Science",
  "Math",
  "Astronomy",
];

export function NewGamePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    gameMode: null,
    playerType: null,
    deviceMode: null,
    playerNames: [""],
    eventCount: 30,
    errorLimit: 3,
    beginningFrom: "4000 BCE",
    upThrough: "2026 CE",
    geographicLimits: [],
    topics: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableEvents, setAvailableEvents] = useState<number | null>(null);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);

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

  const handlePresetSelect = (presetName: string) => {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setFormData({
        ...formData,
        eventCount: preset.eventCount,
        errorLimit: preset.errorLimit,
        beginningFrom: preset.beginningFrom,
        upThrough: preset.upThrough,
        geographicLimits: preset.geographicLimits,
        topics: preset.topics,
      });
    }
  };

  const toggleGeographicLimit = (geo: string) => {
    const newLimits = formData.geographicLimits.includes(geo)
      ? formData.geographicLimits.filter((g) => g !== geo)
      : [...formData.geographicLimits, geo];
    setFormData({ ...formData, geographicLimits: newLimits });
  };

  const toggleTopic = (topic: string) => {
    const newTopics = formData.topics.includes(topic)
      ? formData.topics.filter((t) => t !== topic)
      : [...formData.topics, topic];
    setFormData({ ...formData, topics: newTopics });
  };

  // Fetch available events when history settings change
  useEffect(() => {
    const fetchAvailableEvents = async () => {
      setIsFetchingEvents(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const queryParams = new URLSearchParams({
          beginningFrom: formData.beginningFrom,
          upThrough: formData.upThrough,
          geographicLimits: formData.geographicLimits.join(","),
          topics: formData.topics.join(","),
        });

        const response = await fetch(`${apiUrl}/events?${queryParams}`);
        const data = await response.json();

        if (response.ok) {
          setAvailableEvents(data.count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch available events:", err);
      } finally {
        setIsFetchingEvents(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchAvailableEvents, 500);
    return () => clearTimeout(timeoutId);
  }, [
    formData.beginningFrom,
    formData.upThrough,
    formData.geographicLimits,
    formData.topics,
  ]);

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
          eventCount: formData.eventCount,
          errorLimit: formData.errorLimit,
          beginningFrom: formData.beginningFrom,
          upThrough: formData.upThrough,
          geographicLimits: formData.geographicLimits,
          topics: formData.topics,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create game. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Store game ID in localStorage
      localStorage.setItem("currentGameId", data.gameId);
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

        {formData.playerType && (
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">What history should we cover?</h2>
              <p className="text-sm text-muted-foreground">
                Configure the historical scope and difficulty
              </p>
            </div>

            {/* Preset Selector */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <Select onValueChange={handlePresetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a preset (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Count Slider */}
              <div className="space-y-2">
                <Label>How many events? ({formData.eventCount})</Label>
                <Slider
                  min={10}
                  max={100}
                  step={5}
                  value={[formData.eventCount]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, eventCount: value[0] })
                  }
                />
              </div>

              {/* Error Limit */}
              <div className="space-y-2">
                <Label>Error Limit</Label>
                <Select
                  value={formData.errorLimit.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, errorLimit: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Beginning From */}
              <div className="space-y-2">
                <Label>Beginning from</Label>
                <Input
                  type="text"
                  value={formData.beginningFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, beginningFrom: e.target.value })
                  }
                  placeholder="4000 BCE"
                />
              </div>

              {/* Up Through */}
              <div className="space-y-2">
                <Label>Up through</Label>
                <Input
                  type="text"
                  value={formData.upThrough}
                  onChange={(e) =>
                    setFormData({ ...formData, upThrough: e.target.value })
                  }
                  placeholder="2026 CE"
                />
              </div>
            </div>

            {/* Geographic Limits */}
            <div className="space-y-2">
              <Label>Geographic Limits</Label>
              <div className="flex flex-wrap gap-2">
                {GEOGRAPHIC_OPTIONS.map((geo) => (
                  <Badge
                    key={geo}
                    variant={formData.geographicLimits.includes(geo) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleGeographicLimit(geo)}
                  >
                    {geo}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <Label>Topics</Label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_OPTIONS.map((topic) => (
                  <Badge
                    key={topic}
                    variant={formData.topics.includes(topic) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Available Events Info */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">
                {isFetchingEvents ? (
                  "Checking available events..."
                ) : availableEvents !== null ? (
                  `Available events with these filters: ${availableEvents}`
                ) : (
                  "Enter filter criteria to see available events"
                )}
              </p>
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
