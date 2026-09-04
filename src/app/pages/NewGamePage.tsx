import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { ArrowLeft, HelpCircle, Loader2, X } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../components/ui/tooltip";
import { ensureAuth, getToken } from "../services/auth";

type GameMode = "competitive" | "collaborative" | null;
type DeviceMode = "single" | "multiple" | null;
type PlayerType = "justMe" | "multiple" | null;

interface FormData {
  gameMode: GameMode;
  playerType: PlayerType;
  deviceMode: DeviceMode;
  playerNames: string[];
  // maxEvents: number;
  strikeLimit: number;
  targetScore: number;
  beginningFrom: string;
  beginningFromNumber: string;
  beginningFromSuffix: string;
  upThrough: string;
  upThroughNumber: string;
  upThroughSuffix: string;
  filterTags: string[];
  difficultyRange: [number, number];
}

interface Preset {
  name: string;
  // maxEvents: number;
  strikeLimit: number;
  beginningFrom: string;
  upThrough: string;
  filterTags: string[];
  topics: string[];
}

const PRESETS: Preset[] = [
  {
    name: "Roman Art History",
    // maxEvents: 30,
    strikeLimit: 3,
    beginningFrom: "100 BCE",
    upThrough: "400 CE",
    filterTags: [],
    topics: ["Rome", "Art", "Architecture"],
  },
  {
    name: "World Wars",
    // maxEvents: 50,
    strikeLimit: 5,
    beginningFrom: "1914",
    upThrough: "1945",
    filterTags: [],
    topics: ["WWI", "WWII"],
  },
  {
    name: "Ancient History",
    // maxEvents: 40,
    strikeLimit: 3,
    beginningFrom: "4000 BCE",
    upThrough: "500 CE",
    filterTags: [],
    topics: ["Rome"],
  },
];

// Time suffix options for composite date inputs
const TIME_SUFFIX_OPTIONS = [
  "billion years ago",
  "million years ago",
  "thousand years ago",
  "years ago",
  "BCE",
  "CE",
];

// Difficulty level labels
const DIFFICULTY_LABELS = {
  1: "Easy",
  2: "Elementary",
  3: "Secondary",
  4: "University",
  5: "PhD",
};

/**
 * CompositeDateInput - A component that combines a numeric input with a time suffix dropdown
 * This allows users to enter dates like "42 million years ago" as separate number and suffix
 * which are then combined into a single string value for API submission
 * 
 * @param numberValue - The numeric part of the date (e.g., "42")
 * @param suffixValue - The suffix part of the date (e.g., "million years ago")
 * @param onNumberChange - Callback when the number input changes
 * @param onSuffixChange - Callback when the suffix dropdown changes
 * @param placeholder - Placeholder text for the number input
 */
function CompositeDateInput({
  numberValue,
  suffixValue,
  onNumberChange,
  onSuffixChange,
  placeholder,
}: {
  numberValue: string;
  suffixValue: string;
  onNumberChange: (value: string) => void;
  onSuffixChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex gap-2">
      {/* Numeric input - only allows digits */}
      <Input
        type="text"
        value={numberValue}
        onChange={(e) => {
          // Only allow numeric input - remove all non-digit characters
          const value = e.target.value.replace(/\D/g, '');
          onNumberChange(value);
        }}
        placeholder={placeholder}
        className="flex-1"
      />
      {/* Suffix dropdown */}
      <Select value={suffixValue} onValueChange={onSuffixChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select suffix" />
        </SelectTrigger>
        <SelectContent>
          {TIME_SUFFIX_OPTIONS.map((suffix) => (
            <SelectItem key={suffix} value={suffix}>
              {suffix}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function NewGamePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    gameMode: 'collaborative',
    playerType: 'justMe',
    deviceMode: 'single',
    playerNames: [""],
    // maxEvents: 30,
    strikeLimit: 3,
    targetScore: 10,
    beginningFrom: "4000 BCE",
    beginningFromNumber: "4000",
    beginningFromSuffix: "BCE",
    upThrough: `${new Date().getFullYear()} CE`,
    upThroughNumber: String(new Date().getFullYear()),
    upThroughSuffix: "CE",
    filterTags: [],
    difficultyRange: [2, 3],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableEvents, setAvailableEvents] = useState<number | null>(null);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);
	const [tags, setTags] = useState<object | null>(null);

  // Combine number and suffix into full date strings for API submission
  // This useEffect automatically updates beginningFrom and upThrough whenever
  // their number or suffix components change
  useEffect(() => {
    // Combine beginningFrom number and suffix
    const newBeginningFrom = formData.beginningFromNumber && formData.beginningFromSuffix
      ? `${formData.beginningFromNumber} ${formData.beginningFromSuffix}`.trim()
      : formData.beginningFromNumber || formData.beginningFromSuffix || "";

    // Combine upThrough number and suffix
    const newUpThrough = formData.upThroughNumber && formData.upThroughSuffix
      ? `${formData.upThroughNumber} ${formData.upThroughSuffix}`.trim()
      : formData.upThroughNumber || formData.upThroughSuffix || "";

    // Only update if the combined values have changed
    if (newBeginningFrom !== formData.beginningFrom || newUpThrough !== formData.upThrough) {
      setFormData((prev) => ({
        ...prev,
        beginningFrom: newBeginningFrom,
        upThrough: newUpThrough,
      }));
    }
  }, [
    formData.beginningFromNumber,
    formData.beginningFromSuffix,
    formData.upThroughNumber,
    formData.upThroughSuffix,
    formData.beginningFrom,
    formData.upThrough,
  ]);

	useEffect(() => {
		const fetchTags = async () => {
			try {
				const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
				
				// Fetch top-level tags
				const response = await fetch(`${apiUrl}/tags`);
				const data = await response.json();
				console.log('API tags data:', data);
				
				// Fetch children for each tag in parallel
				const tagsWithChildren = await Promise.all(
					data.map(async (tag) => {
						const childrenResponse = await fetch(`${apiUrl}/tags/${tag._id}/children`);
						const children = await childrenResponse.json();
						return { ...tag, children };
					})
				);
				
				console.log('Tags with children:', tagsWithChildren);
				setTags(tagsWithChildren);
			} catch (err) {
				console.error('Failed to fetch tags:', err);
			}
		};
		fetchTags();
	}, []);

  const handleGameModeSelect = (mode: GameMode) => {
    setFormData({ ...formData, gameMode: mode });
    setError(null);
  };

  const handlePlayerTypeSelect = (playerType: PlayerType) => {
		if(playerType === 'justMe') {
			setFormData({ ...formData, playerType, deviceMode: 'single', playerNames: [""] });
		} else {
			setFormData({ ...formData, playerType, deviceMode: null, playerNames: [""] });
		}
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
      // Parse date strings into number and suffix parts
      // Handles formats like "4000 BCE" (with space) or "1914" (without space)
      const parseDate = (dateStr: string) => {
        const match = dateStr.match(/^(\d+)\s+(.+)$/);
        if (match) {
          return { number: match[1], suffix: match[2] };
        }
        // If no space found, assume it's a year and default to CE
        // This handles cases like "1914" or "2026"
        return { number: dateStr, suffix: "CE" };
      };

      const beginningParsed = parseDate(preset.beginningFrom);
      const upThroughParsed = parseDate(preset.upThrough);

      setFormData({
        ...formData,
        // maxEvents: preset.maxEvents,
        strikeLimit: preset.strikeLimit,
        beginningFrom: preset.beginningFrom,
        beginningFromNumber: beginningParsed.number,
        beginningFromSuffix: beginningParsed.suffix,
        upThrough: preset.upThrough,
        upThroughNumber: upThroughParsed.number,
        upThroughSuffix: upThroughParsed.suffix,
        filterTags: preset.filterTags
      });
    }
  };

	const toggleTag = (tagId: string) => {
		const newFilterTags = formData.filterTags.includes(tagId)
			? formData.filterTags.filter(id => id !== tagId)  // Remove if exists
			: [...formData.filterTags, tagId];                // Add if not exists
		setFormData({ ...formData, filterTags: newFilterTags });
	};

  // Fetch available events when history settings change
  useEffect(() => {
    const fetchAvailableEvents = async () => {
      setIsFetchingEvents(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';

        const response = await fetch(`${apiUrl}/stack`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: formData.beginningFrom,
            to: formData.upThrough,
            filterTags: formData.filterTags,
            difficultyMin: formData.difficultyRange[0],
            difficultyMax: formData.difficultyRange[1]
          }),
        });
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
    formData.filterTags,
    formData.difficultyRange
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
      // Ensure we have authentication credentials (get or create anonymous token)
      const playerId = await ensureAuth();
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';

      const playerNames = formData.playerType === "justMe"
        ? []
        : formData.playerNames.filter(name => name.trim());

      const response = await fetch(`${apiUrl}/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          playerId,
          gameMode: formData.gameMode,
          deviceMode: formData.deviceMode,
          playerNames,
          // maxEvents: formData.maxEvents,
          strikeLimit: formData.strikeLimit,
          targetScore: formData.targetScore,
          beginningFrom: formData.beginningFrom,
          upThrough: formData.upThrough,
          filterTags: formData.filterTags,
          difficultyMin: formData.difficultyRange[0],
          difficultyMax: formData.difficultyRange[1]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create game. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Store game ID in localStorage
      localStorage.setItem("CEcurrentGameId", data._id);
      navigate(`/play/${data._id}`);
    } catch (err) {
      setError("Server is not available. Please try again later.");
      setIsSubmitting(false);
    }
  };

  const allQuestionsAnswered =
    formData.gameMode &&
    formData.playerType &&
		// (availableEvents && availableEvents >= 9) &&
    (formData.playerType === "justMe" ||
      (formData.deviceMode &&
       (formData.deviceMode === "multiple" ||
        formData.playerNames.filter(name => name.trim()).length >= 2)));

	const difficultyLabel = formData.difficultyRange[0] === formData.difficultyRange[1] ? DIFFICULTY_LABELS[formData.difficultyRange[0]] : `${DIFFICULTY_LABELS[formData.difficultyRange[0]]} to ${DIFFICULTY_LABELS[formData.difficultyRange[1]]}`

  return (
    <TooltipProvider>
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
          Answer the questions below to set up your&nbsp;game
        </p>
      </div>


			<div className="space-y-6">
				{false && (
					<Card className="p-6 space-y-4">
						<h2 className="text-xl font-semibold">
							Would you like to play competitively or&nbsp;collaboratively?
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
									First player to complete their timeline&nbsp;wins
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
									Work together with others to build a single&nbsp;timeline
								</p>
							</button>
						</div>
					</Card>
					)}

        {false && formData.gameMode && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Who’s Playing?</h2>

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

        {false && formData.gameMode && formData.playerType === "multiple" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">
              Do you want to play on only this device or have other players join on their own&nbsp;devices?
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
                  All players will share this screen and take&nbsp;turns
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
                  Players will join from their own&nbsp;devices
                </p>
              </button>
            </div>
          </Card>
        )}

        {false && formData.gameMode && formData.playerType === "multiple" && formData.deviceMode === "single" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Player Names</h2>
            <p className="text-sm text-muted-foreground">
              Enter player or team names (2-20&nbsp;players)
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
                Configure the historical scope and&nbsp;difficulty
              </p>
            </div>

            {/* Preset Selector
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
						*/}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Score Slider - Play until score is reached */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Play until {formData.targetScore} events in a timeline
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      The winner will be the first player to reach a timeline with {formData.targetScore} events.
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Slider
                  min={5}
                  max={25}
                  step={5}
                  value={[formData.targetScore]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, targetScore: value[0] })
                  }
                />
              </div>

              {/* Difficulty Range Slider */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Event Difficulty: {difficultyLabel}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Filter events by difficulty level. Only events within this range will be included.
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={formData.difficultyRange}
                  onValueChange={(value) =>
                    setFormData({ ...formData, difficultyRange: value as [number, number] })
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={formData.difficultyRange[0] <= i + 1 && i + 1 <= formData.difficultyRange[1] ? "font-bold text-primary" : ""}>
                      {DIFFICULTY_LABELS[i + 1 as keyof typeof DIFFICULTY_LABELS]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Event Count Slider
              <div className="space-y-2">
                <Label>{formData.maxEvents} Events in the draw pile
									<Tooltip>
										<TooltipTrigger asChild>
											<HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
										</TooltipTrigger>
										<TooltipContent>
											The game will end in defeat for all players if the draw pile is exhausted.
										</TooltipContent>
									</Tooltip>
								</Label>
                <Slider
                  min={10}
                  max={100}
                  step={5}
                  value={[formData.maxEvents]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, maxEvents: value[0] })
                  }
                />
              </div> */}

              {/* Error Limit */}
              <div className="space-y-2">
                <Label>Error Limit
									<Tooltip>
										<TooltipTrigger asChild>
											<HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
										</TooltipTrigger>
										<TooltipContent>
											If a player gets this many strikes they are immediately defeated.
										</TooltipContent>
									</Tooltip>
								</Label>
                <Select
                  value={formData.strikeLimit.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, strikeLimit: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Any mistake ends the game)</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="13">13</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Beginning From - Composite input with number and suffix */}
              <div className="space-y-2">
                <Label>Beginning from</Label>
                <CompositeDateInput
                  numberValue={formData.beginningFromNumber || ""}
                  suffixValue={formData.beginningFromSuffix || ""}
                  onNumberChange={(value) =>
                    setFormData({ ...formData, beginningFromNumber: value })
                  }
                  onSuffixChange={(value) =>
                    setFormData({ ...formData, beginningFromSuffix: value })
                  }
                  placeholder="4000"
                />
              </div>

              {/* Up Through - Composite input with number and suffix */}
              <div className="space-y-2">
                <Label>Up through</Label>
                <CompositeDateInput
                  numberValue={formData.upThroughNumber || ""}
                  suffixValue={formData.upThroughSuffix || ""}
                  onNumberChange={(value) =>
                    setFormData({ ...formData, upThroughNumber: value })
                  }
                  onSuffixChange={(value) =>
                    setFormData({ ...formData, upThroughSuffix: value })
                  }
                  placeholder="1254"
                />
              </div>
            </div>

						{/* Tag Filters - Dynamic rendering from API */}
						{tags && tags.map((tag) => (
							<div key={tag._id} className="space-y-2">
								<Label>{tag.name}</Label>
								<div className="flex flex-wrap gap-2">
									{tag.children?.map((childTag) => (
										<Badge
											key={childTag._id}
											variant={
												formData.filterTags.includes(childTag._id) 
													? "default" 
													: "outline"
											}
											className="cursor-pointer"
											onClick={() => toggleTag(childTag._id)}
										>
											{childTag.name}
										</Badge>
									))}
								</div>
							</div>
						))}

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
								{availableEvents && availableEvents < 9 && (
									<span className="ml-2 text-red-800">Not enough. Try adding Topics, expanding difficulty, or the time range</span>
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
              disabled={isSubmitting || ! availableEvents || availableEvents < 9}
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
    </TooltipProvider>
  );
}
