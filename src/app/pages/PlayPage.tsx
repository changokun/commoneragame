import { useParams, useNavigate, Link } from "react-router";
import { useEffect, useState } from "react";
import { Settings, PlusCircle, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Timeline } from "../components/Timeline";

interface GameState {
  gameMode: "competitive" | "collaborative";
  deviceMode: "single" | "multiple";
  playerNames: string[];
  settings: {
    targetScore: number;
    turnOrder: string;
  };
  state: {
    timelineCollaborative: any[];
    currentTurn: number;
    currentEventIndex: number;
    agreedEvents: any[];
  };
  status: string;
  players: any[];
  remainingEventCount?: number;
}

export function PlayPage() {
  const { gameId: urlGameId } = useParams();
  const navigate = useNavigate();
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [activeCard, setActiveCard] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [drawnCard, setDrawnCard] = useState<any>(null);

  useEffect(() => {
    // Check for game ID in URL params or localStorage
    let foundGameId = urlGameId || null;

    if (!foundGameId) {
      // Check localStorage
      const storedGameId = localStorage.getItem("currentGameId");
      if (storedGameId) {
        foundGameId = storedGameId;
        // Update URL to include the game ID
        navigate(`/play/${storedGameId}`, { replace: true });
      }
    }

    setGameId(foundGameId);

    // Fetch game state if we have a game ID
    const fetchGameState = async (id: string) => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const response = await fetch(`${apiUrl}/games/${id}`);
        const data = await response.json();
        setGameState(data);
        // Store game ID in localStorage for future visits
        localStorage.setItem("currentGameId", id);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch game state:", error);
        setIsLoading(false);
      }
    };

    if (foundGameId) {
      fetchGameState(foundGameId);
    } else {
      setIsLoading(false);
    }
  }, [urlGameId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    );
  }

  // No game ID found in URL or localStorage
  if (!gameId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">No Active Games</h1>
            <p className="text-muted-foreground">
              You don't have any active games. Start a new game or join an existing one.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/new-game">
              <Button size="lg" className="w-full sm:w-auto gap-2">
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

  // Game ID exists but failed to load game state
  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Game not found</p>
          <Button onClick={() => {
            localStorage.removeItem("currentGameId");
            navigate("/play");
          }}>
            Clear and Return
          </Button>
        </div>
      </div>
    );
  }

  const isCollaborative = gameState.gameMode === "collaborative";
  const currentPlayerName = gameState.playerNames[gameState.state.currentTurn] || "Player";

  const handleDrawCard = async () => {
    if (!gameId) return;

    setIsPaused(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/games/${gameId}/draw`);
      const data = await response.json();

      if (response.ok && Array.isArray(data) && data.length > 0) {
				// todo also add this to the localStorage cache.
        setDrawnCard(data[0]);
      } else {
        console.error("Unexpected response from draw endpoint:", data);
        setIsPaused(false);
      }
    } catch (err) {
      console.error("Failed to draw card:", err);
      setIsPaused(false);
    }
  };

	console.log('gameState', gameState)

  return (
    <div className="h-full w-full flex flex-col lg:flex-row overflow-hidden relative">
      {/* Pause overlay - dims/disables non-timeline areas when paused */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/20 z-10 pointer-events-auto lg:pointer-events-none" />
      )}

      {/* Desktop: Left Column - Timeline */}
      {/* Mobile Waiting: Stacked section */}
      <div className={`flex-1 flex flex-col ${isMyTurn ? "lg:flex-1" : ""} relative z-20`}>
        <div className="p-4 pb-0">
          <h2 className="text-xl font-semibold">Timeline</h2>
          <p className="text-sm text-muted-foreground">
            {isCollaborative ? "Shared Timeline" : "Your Timeline"}
          </p>
        </div>

        {/* Timeline Cards - scrollable container */}
        <div className="flex-1 overflow-y-auto p-4 pt-0">
          <Timeline events={gameState.state.timelineCollaborative} gameId={gameId} />
        </div>

        {/* Drawn Card - absolutely positioned over right middle of timeline */}
        {drawnCard && (
          <Card className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 lg:w-88 min-h-40 shadow-2xl border-secondary-foreground border-1 z-30">
            <div className="p-4">
              <h3 className="font-semibold"><span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-neutral-500 dark:bg-neutral-700 dark:text-white/50 md:me-4">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>{drawnCard.title || drawnCard.name || "Event"}</h3>
              {drawnCard.description && (
                <p className="text-sm mt-2">{drawnCard.description}</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Desktop: Middle Column - Draw + Incorrect Stack */}
      {/* Mobile Waiting: Stacked section */}
      {!isMyTurn && (
        <div className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border p-4 overflow-y-auto ${isPaused ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="space-y-4">
            {/* Draw Button */}
            <div>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleDrawCard}
                disabled={isPaused}
              >
                Draw Event Card
              </Button>
            </div>

            {/* Incorrect Guesses Stack */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Incorrect Guesses</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <Card className="p-4 border-2 border-dashed border-muted-foreground/50">
                  <p className="text-center text-muted-foreground text-sm">
                    Incorrect cards will appear here
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Right Column - Player Info & Stats */}
      {/* Mobile Waiting: Stacked section */}
      {!isMyTurn && (
        <div className={`w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-border p-4 overflow-y-auto ${isPaused ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="space-y-4">
            {/* Settings */}
            <div className="flex justify-end">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>

            {/* Status/Prompt */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Waiting for {currentPlayerName} to play...</p>
            </div>

            {/* Collaborative Stats or Player List */}
            {isCollaborative ? (
              <div>
                <h3 className="text-sm font-semibold mb-2">Game Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeline Length:</span>
                    <span className="font-medium">{gameState.state.timelineCollaborative.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining Events:</span>
                    <span className="font-medium">{gameState.remainingEventCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Missed Guesses:</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold mb-2">Players</h3>
                <div className="space-y-2">
                  {gameState.playerNames.map((name, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        index === gameState.state.currentTurn
                          ? "bg-primary/10 border border-primary"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{name}</span>
                        <span className="text-sm text-muted-foreground">Score: 0</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Turn View - Simplified (Mobile) or Overlay (Desktop) */}
      {isMyTurn && activeCard && (
        <div className="absolute inset-0 bg-background z-50 lg:relative lg:z-auto">
          <div className="h-full flex">
            {/* Timeline (scrollable) */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-center text-muted-foreground">
                Timeline with active card interaction
              </p>
            </div>

            {/* Active Card (fixed position, overlapping) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-48 lg:w-64">
              <Card className="p-4 shadow-2xl border-primary border-2">
                <p className="text-center font-medium">Active Event Card</p>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Scroll timeline to position
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
