import { useParams, useNavigate, Link } from "react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Settings, PlusCircle, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Timeline } from "../components/Timeline";
import { StrikePlaceholderCard } from "../components/StrikePlaceholderCard";
import { GameEndScreen } from "../components/GameEndScreen";
import { EVENT_CACHE_KEY_PREFIX, USER_SESSION_KEY, CURRENT_GAME_KEY } from "../constants";
import { Player, GameState, UserSession, Event, Strike } from "../types";
import { formatEventDate } from "../utils";
import { createNetworkErrorModal, ApiError, NetworkError, ErrorModalConfig, DevelopmentError, InvalidMoveError } from "../errors";
import { ErrorModalDialog } from "../errors/ErrorModalDialog";


export function PlayPage() {
	const { gameId: urlGameId } = useParams();
	const navigate = useNavigate();

	// ==========================================================================
	// GAME ID
	// ==========================================================================
	// gameId is derived from URL params or localStorage and never changes
	// It's required for the page to function, so if it doesn't exist we show an error
	// We don't use useState because it's computed once and never modified
	const gameId = urlGameId || localStorage.getItem(CURRENT_GAME_KEY) || null;


	// ==========================================================================
	// USER SESSION
	// ==========================================================================
	// User session is GLOBAL - it represents the person in front of the screen
	// It is NOT scoped to a specific game
	// When a game is loaded, we match this user against the game's players array
	// If there's a match, the user is a participant; otherwise, they're a spectator
	const [userSession, setUserSession] = useState<UserSession | null>(null);
	const [isLoadingSession, setIsLoadingSession] = useState(true);

	// Flag to indicate if the current user is a spectator (not a player in this game)
	// This is computed based on whether userSession._id matches any player in gameState.players
	const [isSpectator, setIsSpectator] = useState(false);

	// Flag to indicate if the current user is the one whose turn it is
	// This is computed based on whether the user matches the current player
	const [isUserTurn, setIsUserTurn] = useState(false);

	// ==========================================================================
	// GAME STATE
	// ==========================================================================
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isPaused, setIsPaused] = useState(false);
	const [drawnCard, setDrawnCard] = useState<Event | null>(null);
	const [newlyPlacedId, setNewlyPlacedId] = useState<string | null>(null);
	const [newlyIncorrectId, setNewlyIncorrectId] = useState<string | null>(null);
	const [showEndScreen, setShowEndScreen] = useState(true);
	const [errorModal, setErrorModal] = useState<ErrorModalConfig | null>(null);

	if (!gameId) {
		// no game? go to home page, where lots of options should exist.
		navigate(`/`, { replace: true });
		// it is unclear to me if processing continues, so ...
		console.log('post navigate() processing.')
		return (<h1>yay</h1>)
	}

	let anonymous_user_id = '42' // i think this can move inside fetchGameState()



	// Fetch game state before session jazz, because i'm going to get the anonymous user_id first.
	useEffect(() => {
		const fetchGameState = async (id: string) => {
			try {
				console.log('GETTING GAME STATE FROM API')
				const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
				const response = await fetch(`${apiUrl}/games/${id}`);
				const data = await response.json();

				// Transform any ID-only items in incorrectCardStack to full objects
				if (data.state?.incorrectCardStack?.length > 0) {
					data.state.incorrectCardStack = await Promise.all(
						data.state.incorrectCardStack.map(async (cardOrId) => {
							console.log('transform cardOrId', typeof cardOrId, cardOrId)
							if (typeof cardOrId === 'string') {
								return await getEventById(cardOrId);
							} else if (cardOrId.title) {
								return cardOrId;
							} else if (cardOrId._id) {
								// console.log('cardOrId', cardOrId)
								const event = await getEventById(cardOrId._id)
								// console.log('event', event)
								event.strikes = cardOrId.strikes ? cardOrId.strikes : [];
								// console.log('event', event)
								return event;
							} else {
								console.error('oh fuck')
							}
						})
					);
					// Filter out null and undefined
					// data.state.incorrectCardStack = transformedStack.filter(Boolean);
				}
				setGameState(data);
				// Store game ID in localStorage for future visits
				localStorage.setItem(CURRENT_GAME_KEY, id);
				console.log('just got this gamestate data', data)
				// Check if there's a limbo event (drawn but not yet guessed)
				if (data.state?.limbo) {
					// Set the limbo event as the drawn card if we found it
					// data.state.limbo should be a prototype with an _id. expand that and then attach whatever else is in data.state.limbo
					const expandedLimbo = await getEventById(data.state.limbo._id);
					setDrawnCard({...expandedLimbo, ...data.state.limbo});
				}

				// now try to load the user
				// if any of the players have the anonymous id (really only ever the solo player) then record its id for later comparisons (the id changes if the database is wiped.)
				data.players.forEach((player: { username: string; _id: string; }) => {
					if (player.username === 'Anonymous') {
						anonymous_user_id = player._id
					}
				});

				// Check if we have a session stored in localStorage
				const storedSession = localStorage.getItem(USER_SESSION_KEY);
				if (storedSession) {
					console.log('found this session in local storage', storedSession)
					try {
						const parsed = JSON.parse(storedSession) as UserSession;
						// Validate that it has the required fields
						// console.log(parsed)
						if (parsed && parsed._id && parsed.username !== undefined && parsed.isAnonymous !== undefined) {
							setUserSession(parsed);
						}
					} catch (e) {
						console.error('Failed to parse stored user session:', e);
					}

				} else {

					// No stored session, try to fetch from API
					try {
						console.log('LOADING A SESSION FROM THE API');
						const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
						const response = await fetch(`${apiUrl}/user`);

						if (response.ok) {
							const data = await response.json();
							// API returns user data, create session from it
							console.log('NOT TESTED api sent this from /user:', data)
							console.log('api sent this from /user:', data)
							console.log('api sent this from /user:', data)
							console.log('api sent this from /user:', data)
							const session: UserSession = {
								_id: data._id || data.id,
								username: data.name || data.username || 'WHAT!?',
								isAnonymous: data.isAnonymous || false
							};
							// Store in localStorage for future use
							localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
							setUserSession(session);
						} else if (response.status === 404) {
							// User endpoint returns 404 for anonymous users
							// This means we should create an anonymous session
							console.log('No user session on server, creating anonymous session');
						}
					} catch (error) {
						console.error('Failed to fetch user session from API:', error);
					}
				}

				// If we get here, use the anonymous user
				const anonymous_user: UserSession = {
					_id: anonymous_user_id,
					username: 'Anonymous',
					isAnonymous: true
				}
				localStorage.setItem(USER_SESSION_KEY, JSON.stringify(anonymous_user));
				setUserSession(anonymous_user)










			} catch (error) {
				console.error("Failed to fetch game state:", error);
			}
			setIsLoading(false);
			setIsLoadingSession(false);
		};

		// Fetch the game state using the gameId we computed at the top
		fetchGameState(gameId);

	}, [navigate, gameId]);


	/**
	 * Whenever gameState or userSession changes, update isSpectator and isUserTurn flags
	 */
	useEffect(() => {
		// console.log('check for turn and spectate', userSession, gameState)
		if (!userSession || !gameState) {
			setIsSpectator(false);
			setIsUserTurn(false);
			return;
		}

		// Check if user is a spectator (userSession._id doesn't match any player in the game)
		setIsSpectator(!gameState.players.some(player => player._id === userSession._id));

		// Check if it's the user's turn
		// currentTurn is an index into the players array
		setIsUserTurn(gameState.players[gameState.state.currentTurn]?._id === userSession._id);

	}, [gameState, userSession]);



	// no more cards left to draw. we will disable the button (permanently) and revise the verbiage.
	const drawStackEmpty = !gameState?.remainingEventCount || gameState.remainingEventCount <= 0;


	const getStrikeCount = (): number => {
		if (!gameState) {
			console.warn(`getStrikeCount() short circuit no gameState`)
			return 0;
		}
		// get the lengths of all the card strikes
		let ret = gameState.state.incorrectCardStack.reduce((count: number, card: any) => {
			return count + (card.strikes ? card.strikes.length : 0);
		}, 0);
		// then we must also add any strikes in the drawnCard card.
		console.log('getStrikeCount thinks this is drawnCard', drawnCard)
		if(drawnCard && drawnCard.strikes) {
			ret += drawnCard.strikes.length;
		}

		console.log(`getStrikeCount() says`, ret, typeof ret)
		return ret
	}

	/**
	 * Checks if the game has ended and whether it was a victory or defeat
	 * Game ends in:
	 * - DEFEAT: When the number of strikes in the incorrect stack meets or exceeds a limit
	 * - VICTORY: When the timeline is full OR when there are no more events to draw AND no incorrect cards
	 * 
	 * Note: The strike limit should come from gameState.settings, but for now we'll use a reasonable default
	 */
	const checkGameStatus = useCallback((): { isGameOver: boolean; isVictory: boolean } => {
		// console.log('inside checkGameStatus')
		if (!gameState) {
			return { isGameOver: false, isVictory: false };
		}
		const { isGameOver, isVictory } = _checkGameStatus();
		// report changes to api. todo
		return { isGameOver: isGameOver, isVictory: isVictory };
	}, [gameState?.state])

	const _checkGameStatus = (): { isGameOver: boolean; isVictory: boolean } => {
		// console.log('inside _checkGameStatus')
		if (!gameState) {
			return { isGameOver: false, isVictory: false };
		}
		// First, check if the game state says it's already over
		// This handles the case when we're loading an already-completed game from the API
		// console.log('gameState.state', gameState.state)
		if (gameState.state.state === 'over') {
			console.error('not yet developed')
			// If there's a victor and it matches user.id, it was a victory. Otherwise, it was a defeat
			const isVictory = gameState.state.victor;
			return { isGameOver: true, isVictory };
		}

		// Check for DEFEAT: Too many strikes in the incorrect stack
		if (getStrikeCount() >= gameState.settings.strikeLimit) {
			return { isGameOver: true, isVictory: false };
		}

		// Check for VICTORY: No more events to draw AND all events have been correctly placed
		// Victory happens when:
		// 1. The draw stack is empty (no more events to draw)
		// 2. AND the incorrect stack is empty (all events were placed correctly)
		// OR
		// 3. The timeline has reached the target score (for collaborative mode)
		if (drawStackEmpty && gameState.state.incorrectCardStack.length === 0) {
			return { isGameOver: true, isVictory: true };
		}

		// Check if timeline has reached target score (for collaborative mode)
		// Note: In competitive mode, this would check individual player scores
		if (gameState.gameMode === 'collaborative') {
			const targetScore = gameState.settings?.targetScore || 4;
			if (gameState.state.timelineCollaborative.length >= targetScore) {
				return { isGameOver: true, isVictory: true };
			}
		}

		// Game is still in progress
		return { isGameOver: false, isVictory: false };
	};

	// Use the checkGameStatus function to get current game status
	const { isGameOver, isVictory } = checkGameStatus();
	// const isGameOver = false;
	// const isVictory = true;



	// If we have a gameId in localStorage but not in the URL, update the URL
	// useEffect(() => {
	//   if (!urlGameId && gameId) {
	//     navigate(`/play/${gameId}`, { replace: true });
	//   }
	// }, [urlGameId, gameId, navigate]);

	// Helper function to fetch event(s) by ID from cache or API
	// This consolidates the caching logic used in multiple places
	// @param eventId - Single event ID string or array of event IDs
	// @returns Promise resolving to the event object(s) or null if not found
	const getEventById = async (eventId: string | string[]): Promise<any | any[] | null> => {
		if (!gameId) return null;

		// Build cache key using the game ID
		// Matches the cache key format used in Timeline.tsx
		const cacheKey = `${EVENT_CACHE_KEY_PREFIX}${gameId}`;
		const cachedData: Record<string, any> = JSON.parse(
			localStorage.getItem(cacheKey) || "{}"
		);

		// Normalize to array for consistent handling
		const ids = Array.isArray(eventId) ? eventId : [eventId];

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
			console.log('LOADING ONE OR MORE EVENTS FROM THE API', idsParam);
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


	// Show loading state while either game or user session is loading
	if (isLoadingSession) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Loading player…</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Loading game…</p>
			</div>
		);
	}

	// Game ID exists but failed to load game state
	if (!gameState) {
		localStorage.removeItem(CURRENT_GAME_KEY);
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">Game not found</p>
					<Button onClick={() => {
						navigate("/play");
					}}>
						Carry on…
					</Button>
				</div>
			</div>
		);
	}

	const isCollaborative = gameState.gameMode === "collaborative";

	// Get the current player's name from the players array
	// currentTurn is an index into the players array
	const currentPlayerName = gameState.players[gameState.state.currentTurn]?.username || "Player " + (gameState.state.currentTurn + 1);

	// Determine what to show in the status pill
	// If user is a participant and it's their turn, show "Your turn"
	// If user is a participant but not their turn, show "{currentPlayerName}'s turn (Watching)"
	// If user is a spectator, show "{currentPlayerName}'s turn (Spectating)"
	const statusText = isSpectator
		? `${currentPlayerName}’s turn (Spectating)`
		: isUserTurn
			? "Your turn"
			: `${currentPlayerName}’s turn`;

	const handleDrawCard = async () => {
		console.log('handleDrawCard()', 'isUserTurn:', isUserTurn, 'isSpectator:', isSpectator)
		if (!isUserTurn || isSpectator) return;

		setIsPaused(true);

		try {
			console.log('DRAWING ONE EVENT FROM API')
			const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
			const response = await fetch(`${apiUrl}/games/${gameId}/draw`);
			let data = await response.json();
			console.log('response', response, 'data', data, typeof data)

			if(response.ok) {
				if(typeof data === 'string' && data.length === 24) {
					// the api supplied only an event id. it must expect us to already have it cached.
					// stick it into itself
					data = {_id: data}
					console.log('new data ', data)
				}
				
				if (data.title) {
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
						console.log('handle Drw card running getEventById')
						setGameState({
							...gameState,
							remainingEventCount: (gameState?.remainingEventCount || 1) - 1
						});
					}
				} else if (data.message) {
					if (data.message.indexOf('o events') !== -1) {
						throw new DevelopmentError();
					} else {
						throw new ApiError("Unexpected message from draw endpoint: " + data.message, response.status, response.statusText, response);
					}
				} else {
					throw new ApiError("Unexpected response from draw endpoint", response.status, response.statusText, response);
				}
	
			} else {
				if(data.message?.indexOf('current event first') !== 0) {
					throw new InvalidMoveError('We cannot draw a new event because there is already one in play, waiting for a player.')
				}
				throw new NetworkError('Trying to draw a new event but something went wrong')
			}



		} catch (err) {
			console.error('Error in handleDrawCard()…', err)
			setIsPaused(false);
			if (err instanceof ApiError) {
				// show error modal - try again etc.
				setErrorModal({
					title: "Ow! I hit my head!",
					message: 'oink',
					userMust: [],
					userMay: [{
						text: "Cancel, maybe try later",
						variant: 'cancel'
					}],
					close: () => setErrorModal(null)
				})

			} else if (err instanceof InvalidMoveError) {
				// show error modal - try again etc.
				setErrorModal({
					title: "Wait, what?",
					message: err.message + ' Try reloading the page?',
					userMay: [],
					userMust: [{
						text: "Cancel, maybe try later",
						variant: 'cancel'
					}],
					close: () => setErrorModal(null)
				})


			} else if (err instanceof NetworkError) {
				// show error modal - try again etc.
				setErrorModal(createNetworkErrorModal(
					err.message ? err.message : 'I could not complete a task.',
					[],
					[{
						text: "Cancel, maybe try later",
						variant: 'cancel'
					}, {
						text: "Try to Draw Again",
						method: handleDrawCard
					}],
					() => setErrorModal(null)
				));
			}
		}
	};

	// Helper function to report a move to the server
	// Used by both handleCorrectMove and handleIncorrectMove to avoid code duplication
	// @param eventId - The ID of the event that was placed
	// @param success - Whether the placement was correct
	// Note: Uses userSession._id to identify which user is making the move
	const reportMove = async (eventId: string, success: boolean, a:string, b:string): Promise<Response | null> => {
		if (!gameState || !userSession) return null;

		try {
			const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';

			// Use the userSession._id to identify the user making the move
			// This ensures the correct player is credited with the move
			console.log('POSTING MOVE REPORT TO API')
			const response = await fetch(`${apiUrl}/games/${gameId}/player/${userSession._id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventId, success, a, b })
			});
			return response;
		} catch (error) {
			console.error("Failed to report move:", error);
			return null;
		}
	};

	const handleCorrectMove = async (placement: { a: string; b: string }) => {
		console.log("CORRECT YAY")
		// we don't do anything with the args, see the Incorrect process.

		// Spectators cannot make moves
		if (isSpectator || !isUserTurn) return;

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
		setNewlyPlacedId(drawnCardId);
		setTimeout(() => setNewlyPlacedId(null), 6000);

		// Report the successful move to the server
		const response = await reportMove(drawnCardId, true);
		if (response?.ok) {
			// Success - event was recorded on the server
		}
	}

	const handleIncorrectMove = async (placement: { a: string; b: string }) => {
		console.log("WRONG BOOOO", isSpectator, isUserTurn, placement, 'drawnCard in memory here on api', drawnCard)
		const {a, b} = placement
		// Spectators cannot make moves
		if (isSpectator || !isUserTurn) return;

		if ( ! drawnCard) {
			console.error('no drawn card in memory but user is reporting incorrect move')
			return;
		}

		// Store the drawn card ID before clearing it, so we can use it below
		const drawnCardId = drawnCard._id;

		// Use userSession._id to track which user got this wrong
		// This ensures strikes are attributed to the correct player
		if (!userSession) return;

		const strike:Strike = {playerId: userSession._id};
		if(a && b) {
			// strike.rangeKnownBad = `NOT before ${b} and NOT after ${a}`
			strike.rangeKnownBad = `Must be before ${a} or after ${b}`
		} else if (a) {
			// strike.rangeKnownBad = `NOT after ${a}`
			strike.rangeKnownBad = `Must be before ${a}`
		} else if (b) {
			// strike.rangeKnownBad = `NOT before ${b}`
			strike.rangeKnownBad = `Must be after ${b}`
		}

		if (drawnCard.strikes) {
			drawnCard.strikes.push(strike)
		} else {
			drawnCard.strikes = [strike];
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
		setNewlyIncorrectId(drawnCardId);
		setTimeout(() => setNewlyIncorrectId(null), 6000);

		// Report the incorrect move to the server
		reportMove(drawnCardId, false, a, b);
	}

	// Helper function to redraw a card from the incorrect stack
	// Called when user clicks on an incorrect card instead of a random draw
	const handleRedrawCard = async (card: any) => {
		if (!gameState) return;

		console.log('user wants this card again', card)
		setIsPaused(true);

		// Call API to redraw this specific event
		try {

			// Remove from incorrect stack
			const newIncorrectStack = gameState.state.incorrectCardStack.filter(
				(c: any) => c._id !== card._id
			);

			// Set as drawn card and update state
			setGameState({
				...gameState,
				state: {
					...gameState.state,
					incorrectCardStack: newIncorrectStack
				}
			});
			setDrawnCard(card);

			console.log('POSTING TO UDPATE RE_DRAWN CARD. NO DATA, JUST THE ID ON THE URL', card._id)
			const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
			const response = await fetch(`${apiUrl}/games/${gameId}/draw/${card._id}`, {
				method: 'POST'
			});
			if (response.status === 201) {

			}
		} catch (error) {
			console.error("Failed to redraw card:", error);
		}
	};

	let strikeCountdown = gameState.settings.strikeLimit - getStrikeCount();

	console.log('drawnCard before render', drawnCard)
	let badRangeTexts:string[] = []
	if(drawnCard?.strikes?.length) {
		drawnCard.strikes.forEach(strike => {
			if(strike.rangeKnownBad) {
				badRangeTexts.push(strike.rangeKnownBad)
			}
		})
	}

	// console.log('errorModal before render', errorModal)
	return (
		<div className={`${isPaused ? "is-paused " : ""}h-full w-full flex flex-col overflow-hidden relative`}>



		{errorModal && (
			<div>
				<ErrorModalDialog {...errorModal} />
			</div>
		)}




			{/* Compact header: two rows on mobile, single row on desktop */}
			<header className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:gap-3 px-4 py-2 border-b border-border">
				{/* Row 1: title + settings */}
				<div className="flex items-center">
					<h1 className="text-lg font-bold text-muted-foreground mr-2">
						Common Era
					</h1>
					<div className="ml-auto lg:ml-0 flex items-center gap-1">
						{isGameOver && !showEndScreen && (
							<Button variant="outline" size="sm" onClick={() => setShowEndScreen(true)}>
								Results
							</Button>
						)}
						<Button variant="ghost" size="icon">
							<Settings className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Row 2 (mobile) / inline (desktop): status pill + stats */}
				<div className="flex items-center gap-3 flex-wrap">
					<span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full whitespace-nowrap">
						{statusText}
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
									{player.username}: {player.score ?? 0}
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
								newlyPlacedId={newlyPlacedId}
							/>
						{/* </div> */}

						{/* Drawn Card - absolutely positioned over right middle of timeline */}
						{drawnCard && (
							<Card className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 lg:w-88 min-h-40 shadow-2xl border-secondary-foreground border-1 z-30">
								<div className="p-4">
									<h3 className="font-semibold">
									<span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-red-500 dark:bg-neutral-700 dark:text-white/50 md:me-4">
    {drawnCard.strikes?.length ? 'X'.repeat(drawnCard.strikes.length) : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}
</span>
														{/* <span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-neutral-500 dark:bg-neutral-700 dark:text-white/50 md:me-4">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
														 */}
														 {drawnCard.title || drawnCard.name || "Event"}
														 </h3>
									{!!badRangeTexts.length && (
										<div className="knownBads flex flex-wrap gap-1 mt-4">
											{badRangeTexts.map((t) => (
												<span key={t} className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full whitespace-nowrap" title="This is based on the previous incorrect attempts to insert into the timeline">{t}</span>
											))}
										</div>
									)}
									{drawnCard.description && (
										<p className="text-sm mt-2">{drawnCard.description}</p>
									)}
								</div>
							</Card>
						)}
					</div>

					{/* Desktop: Middle Column - Draw + Incorrect Stack */}
					{/* Mobile Waiting: Stacked section */}
					{isUserTurn && (
						<div className={`w-full lg:max-w-[400px] lg:flex-shrink-0 border-t lg:border-t-0 lg:border-l border-border p-4 h-[calc(100vh-120px)] overflow-y-auto ${isPaused ? "opacity-50 pointer-events-none" : ""}`}>
							<div className="space-y-4">
								{/* Draw Button - Only show for participants who are waiting for their turn (not spectators) */}
								<div>
									<Button
										className="w-full"
										size="lg"
										onClick={handleDrawCard}
										disabled={isPaused || drawStackEmpty || isGameOver}
									>
										{drawStackEmpty ? "No More Events" : "Draw New Event…"}
									</Button>
								</div>

								{/* Spectator Message - Only show for spectators */}
								{isSpectator && (
									<div className="p-4 border rounded-lg bg-muted/50">
										<p className="text-sm text-center text-muted-foreground">
											This is the current state of the game that other people are playing. It does not automatically update, you can try refreshing, but really this is not developed.
										</p>
									</div>
								)}

								{/* Incorrect Guesses Stack */}
								<div>
									{gameState.state.incorrectCardStack.length > 0 ? (
										<h3 className="text-sm font-semibold mb-2">
											{drawStackEmpty ? `…and ${gameState.state.incorrectCardStack.length} incorrect guesses` : "…or try one of these again:"}
										</h3>
									) : ''}
									<div className="space-y-2">
										
										{gameState.state.incorrectCardStack.map((card) => (
											<div key={card._id}>
												<Card
													className={`p-4 ${isGameOver ? "cursor-default" : "cursor-pointer hover:bg-muted/50"}${newlyIncorrectId === card._id ? " card-glow-incorrect" : ""}`}
													onClick={!isGameOver ? () => handleRedrawCard(card) : undefined}
												>
													<h3 className="font-semibold">
														<span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-red-500 dark:bg-neutral-700 dark:text-white/50 md:me-4">
															{isGameOver ? formatEventDate(card.date) : 'X'.repeat(card.strikes?.length || 0)}
														</span>
														{card.title || card.name || "Event"}
													</h3>
													{card.description && (
														<p className="text-sm mt-2">{card.description}</p>
													)}
												</Card>
											</div>
										))}
										


										{strikeCountdown === 1? (
											<StrikePlaceholderCard id={`imminent`} />
										) : (
												[...Array(strikeCountdown)].map((_, i) => <StrikePlaceholderCard id={`sph${strikeCountdown - i}`} />)
										)}

									</div>
								</div>
							</div>
						</div>
					)}



				</div> {/* end 1200px container */}
			</div> {/* end main game area */}
			{isGameOver && showEndScreen && (
				<GameEndScreen
					isVictory={isVictory}
					gameMode={gameState.gameMode}
					players={gameState.players}
					timelineLenth={gameState.state.timelineCollaborative.length}
					incorrectCount={gameState.state.incorrectCardStack.length}
					remainingEvents={gameState.remainingEventCount ?? 0}
					onViewTimeline={() => setShowEndScreen(false)}
				/>
			)}
		</div>
	);
}