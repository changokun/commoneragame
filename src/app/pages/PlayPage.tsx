import { useParams, useNavigate, Link } from "react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import { Settings, PlusCircle, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Timeline } from "../components/Timeline";
import { EVENT_CACHE_KEY_PREFIX } from "../constants";

// Player interface: represents a player in the game
// Contains all player data including name, identifier, and score
interface Player {
  _id: string;
  name: string;
  score?: number;
}

// GameState interface: represents the complete state of a game
// Received from the backend API - players array now contains Player objects instead of separate playerNames
interface GameState {
  gameMode: "competitive" | "collaborative";
  deviceMode: "single" | "multiple";
  settings: {
    targetScore: number;
    turnOrder: string;
  };
  state: {
    timelineCollaborative: any[];
    currentTurn: number;
    currentEventIndex: number;
    agreedEvents: any[];
		incorrectCardStack: any[];
    limbo?: string; // Event ID of a drawn card that hasn't been guessed yet
  };
  status: string;
  players: Player[]; // Array of Player objects - source of truth for player data
  remainingEventCount?: number;
}

export function PlayPage() {
  const { gameId: urlGameId } = useParams();
  const navigate = useNavigate();
  
  // gameId is derived from URL params or localStorage and never changes
  // It's required for the page to function, so if it doesn't exist we show an error
  // We don't use useState because it's computed once and never modified
  const gameId = urlGameId || localStorage.getItem("CEcurrentGameId") || null;
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [activeCard, setActiveCard] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [drawnCard, setDrawnCard] = useState<any>(null);


  // If we have a gameId in localStorage but not in the URL, update the URL
  useEffect(() => {
    if (!urlGameId && gameId) {
      navigate(`/play/${gameId}`, { replace: true });
    }
  }, [urlGameId, gameId, navigate]);

  // Helper function to fetch event(s) by ID from cache or API
  // This consolidates the caching logic used in multiple places
  // @param eventId - Single event ID string or array of event IDs
  // @returns Promise resolving to the event object(s) or null if not found
  const getEventById = async (eventId: string | string[]): Promise<any | any[] | null> => {
		console.log('getEventById()', eventId, 'gameId', gameId)
    if (!gameId) return null;

    // Build cache key using the game ID
    // Matches the cache key format used in Timeline.tsx
    const cacheKey = `${EVENT_CACHE_KEY_PREFIX}${gameId}`;
    const cachedData: Record<string, any> = JSON.parse(
      localStorage.getItem(cacheKey) || "{}"
    );

    // Normalize to array for consistent handling
    const ids = Array.isArray(eventId) ? eventId : [eventId];

		console.log('getEventById()', ids, 'cachedData', cachedData)
    // Check which events are cached and which need fetching
    const cachedEvents: any[] = [];
    const missingIds: string[] = [];

    for (const id of ids) {
      if (cachedData[id]) {
        cachedEvents.push(cachedData[id]);
      } else {
        missingIds.push(id);
      }
    }

    // If all events are cached, return them
    if (missingIds.length === 0) {
      return Array.isArray(eventId) ? cachedEvents : cachedEvents[0];
    }

    // Fetch missing events from API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
      const idsParam = missingIds.join(",");
      const response = await fetch(`${apiUrl}/events?ids=${idsParam}`);
      const data = await response.json();

      if (response.ok && data.events?.length > 0) {
        // Update cache with newly fetched events
        const newCache = { ...cachedData };
        for (const event of data.events) {
          if (event._id) {
            newCache[event._id] = event;
          }
        }
        localStorage.setItem(cacheKey, JSON.stringify(newCache));

        // Merge fetched events with cached ones and return
        const fetchedMap = new Map(data.events.map((e: any) => [e._id, e]));
        const allEvents = ids.map((id) => newCache[id] || fetchedMap.get(id)).filter(Boolean);

        return Array.isArray(eventId) ? allEvents : allEvents[0];
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
      // Return whatever we have cached
      return Array.isArray(eventId) ? cachedEvents : cachedEvents[0] || null;
    }

    // If we couldn't fetch missing events, return what we have
    return Array.isArray(eventId) ? cachedEvents : cachedEvents[0] || null;
  };

  // Fetch game state
  useEffect(() => {
    // We already have gameId computed at the top from URL or localStorage
    // Just fetch the game state if we have a valid gameId
    if (!gameId) {
      setIsLoading(false);
      return;
    }

    const fetchGameState = async (id: string) => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
        const response = await fetch(`${apiUrl}/games/${id}`);
        const data = await response.json();

				// Transform any ID-only items in incorrectCardStack to full objects
				if (data.state?.incorrectCardStack?.length > 0) {
					data.state.incorrectCardStack = await Promise.all(
						data.state.incorrectCardStack.map(async (cardOrId) => {
							if(typeof cardOrId === 'string') {
								return await getEventById(cardOrId);
							} else if(cardOrId.title) {
								return cardOrId;
							} else if(cardOrId.eventId) {
									console.log('cardOrId', cardOrId)
									const event = await getEventById(cardOrId.eventId)
									console.log('event', event)
									event.strikes = cardOrId.strikes ? cardOrId.strikes : [];
									console.log('event', event)
									return event;
								}
							}
						)
					);
				}
        setGameState(data);
        // Store game ID in localStorage for future visits
        localStorage.setItem("CEcurrentGameId", id);
        console.log('just got this gamestate data', data)
        // Check if there's a limbo event (drawn but not yet guessed)
        // If so, load it as the drawn card using our helper function
        if (data.state?.limbo) {
					console.log('yes data.state.limbo', data.state.limbo)
          const limboEvent = await getEventById(data.state.limbo);
          // Set the limbo event as the drawn card if we found it
					console.log('limboEvent', limboEvent)
          if (limboEvent) {
            setDrawnCard(limboEvent);
						// in this case, the game data we just got should be correct as to gameState.remainingEventCount
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch game state:", error);
        setIsLoading(false);
      }
    };

    // Fetch the game state using the gameId we computed at the top
    fetchGameState(gameId);
  }, [urlGameId, navigate, gameId]);

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
            localStorage.removeItem("CEcurrentGameId");
            navigate("/play");
          }}>
            Clear and Return
          </Button>
        </div>
      </div>
    );
  }

  const isCollaborative = gameState.gameMode === "collaborative";
  // Get the current player's name from the players array
  // currentTurn is an index into the players array
  const currentPlayerName = gameState.players[gameState.state.currentTurn]?.name || "Player " + (gameState.state.currentTurn + 1);

  const handleDrawCard = async () => {
    if (!gameId) return;

    setIsPaused(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
      const response = await fetch(`${apiUrl}/games/${gameId}/draw`);
      const data = await response.json();
			console.log('just got this from api', data)

      if (response.ok && data.date && data.title) {
				// data is already the full event. cache it, and continue.
				// We have the full event, cache it directly
				const cacheKey = `${EVENT_CACHE_KEY_PREFIX}${gameId}`;
				const cachedData: Record<string, any> = JSON.parse(
					localStorage.getItem(cacheKey) || "{}"
				);
				cachedData[data._id] = data;
				localStorage.setItem(cacheKey, JSON.stringify(cachedData));
				setDrawnCard(data);
				setGameState({
					...gameState,
					remainingEventCount: (gameState?.remainingEventCount || 1) - 1
				});

			} else if (data._id) {
				// Only have the ID, need to fetch the full event
				const fullEvent = await getEventById(data._id);
				if (fullEvent) {
					// Use the full event from the cache/API
					setDrawnCard(fullEvent);
					setGameState({
						...gameState,
						remainingEventCount: (gameState?.remainingEventCount || 1) - 1
					});
				}
			} else if (data.message) {
				if(data.message.indexOf('o events') !== -1) {

				} else {
					console.error("Unexpected message from draw endpoint:", data);
				}
			} else {
				console.error("Unexpected response from draw endpoint:", data);
				setIsPaused(false);
			}

       
    } catch (err) {
      console.error("Failed to draw card:", err);
      setIsPaused(false);
    }
  };

	// Helper function to report a move to the server
	// Used by both handleCorrectMove and handleIncorrectMove to avoid code duplication
	// @param eventId - The ID of the event that was placed
	// @param success - Whether the placement was correct
	const reportMove = async (eventId: string, success: boolean): Promise<Response | null> => {
		if (!gameId || !gameState) return null;
		
		try {
			const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
			const playerId = gameState.players[gameState.state.currentTurn]?._id || gameState.state.currentTurn;
			const response = await fetch(`${apiUrl}/games/${gameId}/player/${playerId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventId, success })
			});
			return response;
		} catch (error) {
			console.error("Failed to report move:", error);
			return null;
		}
	};

	const handleCorrectMove = async () => {
		console.log("CORRECT YAY")
		
		// Store the drawn card ID before clearing it, so we can use it below
		const drawnCardId = drawnCard._id;
		
		// Update the timeline immediately with the new event ID
		// This ensures the UI updates right away, before the API call
		setGameState({
			...gameState,                         // Copy all top-level properties
			state: {
				...gameState.state,                 // Copy all state properties
				timelineCollaborative: [...gameState.state.timelineCollaborative, drawnCardId]
			}
		});
		
		setDrawnCard(null);
		setIsPaused(false);
		
		// Report the successful move to the server
		const response = await reportMove(drawnCardId, true);
		if (response?.ok) {
			// Success - event was recorded on the server
		}
	}
	
	const handleIncorrectMove = () => {
		console.log("WRONG BOOOO")
		// Store the drawn card ID before clearing it, so we can use it below
		const drawnCardId = drawnCard._id;
		const playerId = gameState.players[gameState.state.currentTurn]?._id || gameState.state.currentTurn;
		if(drawnCard.strikes) {
			drawnCard.strikes.push(playerId)
		} else {
			drawnCard.strikes = [playerId];
		}

		setGameState({
			...gameState,
			state: {
				...gameState.state,
				incorrectCardStack: [...gameState.state.incorrectCardStack, drawnCard]
			}
		});

		setDrawnCard(null);
		setIsPaused(false);
		
		// Report the incorrect move to the server
		reportMove(drawnCardId, false);
	}

	console.log('gameState', gameState)
	// no more cards left to draw. we will disable the button (permanently) and revise the verbiage.
	const drawStackEmpty = !gameState?.remainingEventCount || gameState.remainingEventCount <= 0;

  return (
		<div className={`${isPaused ? "is-paused " : ""}h-full w-full flex flex-col overflow-hidden relative`}>

      {/* Compact header: two rows on mobile, single row on desktop */}
      <header className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:gap-3 px-4 py-2 border-b border-border">
        {/* Row 1: title + settings */}
        <div className="flex items-center">
          <h1 className="text-lg font-bold text-muted-foreground mr-2">Common Era</h1>
          <div className="ml-auto lg:ml-0">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Row 2 (mobile) / inline (desktop): status pill + stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full whitespace-nowrap">
            {currentPlayerName}&apos;s turn
          </span>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {isCollaborative ? (
              <>
                <span title="Timeline length">Score: {gameState.state.timelineCollaborative.length}</span>
                <span title="Remaining events">Remaining Events: {gameState.remainingEventCount ?? 0}</span>
                <span title="Missed guesses">Misses: {gameState.state.incorrectCardStack.length}</span>
              </>
            ) : (
              gameState.players.map((player, index) => (
                <span
                  key={player._id || index}
                  className={`px-2 py-0.5 rounded ${index === gameState.state.currentTurn ? "bg-primary/20 font-semibold" : ""}`}
                >
                  {player.name}: {player.score ?? 0}
                </span>
              ))
            )}
          </div>
        </div>
      </header>

      {/* Main game area */}
      <div className="flex-1 flex justify-center overflow-hidden relative">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row overflow-hidden relative">
      {/* Desktop: Left Column - Timeline */}
      {/* Mobile Waiting: Stacked section */}
      <div className={`flex flex-col h-[calc(100vh-53px)] lg:max-w-[800px] lg:flex-1 relative z-20`}>
        {/* <div className="p-4 pb-0">
          <h2 className="text-xl font-semibold">Timeline</h2>
          <p className="text-sm text-muted-foreground">
            {isCollaborative ? "Shared Timeline" : "Your Timeline"}
          </p>
        </div> */}

        {/* Timeline Cards - scrollable container */}
        {/* <div className="flex-1 p-4 pt-0"> */}
          <Timeline 
            events={gameState.state.timelineCollaborative} 
            gameId={gameId}
						drawnCard={drawnCard}
						handleCorrectMove={handleCorrectMove}
						handleIncorrectMove={handleIncorrectMove}
          />
        {/* </div> */}

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
        <div className={`w-full lg:max-w-[400px] lg:flex-shrink-0 border-t lg:border-t-0 lg:border-l border-border p-4 h-[calc(100vh-120px)] overflow-y-auto ${isPaused ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="space-y-4">
            {/* Draw Button */}
            <div>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleDrawCard}
                disabled={isPaused || drawStackEmpty}
              >
                {drawStackEmpty ? "No More Events" : "Draw New Event…"}
              </Button>
            </div>

            {/* Incorrect Guesses Stack */}
            <div>
              {gameState.state.incorrectCardStack.length > 0 ? (
              	<h3 className="text-sm font-semibold mb-2">{drawStackEmpty ? `…and ${gameState.state.incorrectCardStack.length} incorrect guesses` : "…or try one of these again:"}</h3>
							) : ''}
              <div className="space-y-2">
                {gameState.state.incorrectCardStack.length > 0 ? (
                  gameState.state.incorrectCardStack.map((card) => (
                    <Card key={card._id} className="p-4">
                      <h3 className="font-semibold">
                        <span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-red-500 dark:bg-neutral-700 dark:text-white/50 md:me-4">
                          {'X'.repeat(card.strikes.length)}
                        </span>
                        {card.title || card.name || "Event"}
                      </h3>
                      {card.description && (
                        <p className="text-sm mt-2">{card.description}</p>
                      )}
                    </Card>
                  ))
                ) : (
                  <Card className="p-4 border-2 border-dashed border-muted-foreground/50">
                    <p className="text-center text-muted-foreground text-sm">
                      Incorrect cards will appear here. You can try them again.
                    </p>
                  </Card>
                )}
              </div>
            </div>
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
      </div> {/* end 1200px container */}
      </div> {/* end main game area */}
    </div>
  );
}
