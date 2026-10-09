import { useParams, useNavigate, Link } from "react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Settings, PlusCircle, Users, Flag } from "lucide-react";
import { Button } from "../components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Card } from "../components/ui/card";
import { Timeline } from "../components/Timeline";
import { StrikePlaceholderCard } from "../components/StrikePlaceholderCard";
import { GameEndScreen } from "../components/GameEndScreen";
import { EVENT_CACHE_KEY_PREFIX, USER_SESSION_KEY, CURRENT_GAME_KEY } from "../constants";
import { Player, GameState, UserSession, Event, Strike } from "../types";
import { createNetworkErrorModal, ApiError, NetworkError, ErrorModalConfig, DevelopmentError, InvalidMoveError } from "../errors";
import { ErrorModalDialog } from "../errors/ErrorModalDialog";
import { EventCard } from "../components/EventCard";
import { DrawPanelHorizontal } from "../components/DrawPanelHorizontal";
import { DrawPanelVertical } from "../components/DrawPanelVertical";
import { getToken, getPlayerId, ensureAuth } from "../services/auth";

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
	const [allExpanded, setAllExpanded] = useState<boolean | null>(true);
	const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
	const [playerSurrendered, setPlayerSurrendered] = useState(false);

	// Track whether we've already updated the game state to 'complete' to avoid infinite loops
	const [hasUpdatedGameStateToComplete, setHasUpdatedGameStateToComplete] = useState(false);






	if (!gameId) {
		// no game? go to home page, where lots of options should exist.
		navigate(`/`, { replace: true });
		// it is unclear to me if processing continues, so ...
		console.log('post navigate() processing.')
		return (<h1>yay</h1>)
	}



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
				// Store game ID in localStorage for future visits (as long as user is not a spectator) todo
				localStorage.setItem(CURRENT_GAME_KEY, id);
				console.log('just got this gamestate data', data)
				// Check if there's a limbo event (drawn but not yet guessed)
				if (data.state?.limbo) {
					// Set the limbo event as the drawn card if we found it
					// data.state.limbo should be a prototype with an _id. expand that and then attach whatever else is in data.state.limbo
					const expandedLimbo = await getEventById(data.state.limbo._id);
					setDrawnCard({...expandedLimbo, ...data.state.limbo});
					setIsPaused(true);
				}

			} catch (error) {
				console.error("Failed to fetch game state:", error);
			}
			setIsLoading(false);
			
		};

		// Fetch the game state using the gameId we computed at the top
		fetchGameState(gameId);

	}, [navigate, gameId]);

	useEffect(() => {
		const loadSession = async () => {
			console.log('get user session--------------------')
			try {
				// now try to load the user
				// Use JWT-based authentication instead of UserSession localStorage
				// Check if we have JWT credentials
				const playerId = getPlayerId();
				const token = getToken();

				if (playerId && token) {
					// Already have JWT auth - map to UserSession for compatibility
					const session: UserSession = {
						_id: playerId,
						username: 'Anonymous',
						isAnonymous: true
					};
					console.log('this session already existed...', session)
					setUserSession(session);
					setIsLoadingSession(false);
				} else {
					// No JWT credentials - try to get anonymous token
					try {
						const newPlayerId = await ensureAuth();
						const session: UserSession = {
							_id: newPlayerId,
							username: 'Anonymous',
							isAnonymous: true
						};
						console.log('got a (fresh) anon session...', session)
						setUserSession(session);
						setIsLoadingSession(false);
					} catch (err) {
						console.error('Failed to get auth:', err);
					}
				}
			} catch (error) {
				console.error("Failed to fetch user session:", error);
			}
		};
		loadSession();
	}, [])


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


	const guideLevel = gameState?.state ? Math.max(0, 7 - gameState.state.timelineCollaborative.length) : 5;
	const guideClass = `guide-${guideLevel}`;

	// no more cards left to draw. we will disable the button (permanently) and revise the verbiage.
	const drawStackEmpty = ! drawnCard && (!gameState?.remainingEventCount || gameState.remainingEventCount <= 0);

	const handleToggleAll = () => {
		// Set the global override
		setAllExpanded(prev => !prev);
	};
	
	const handleExpandChange = (expanded: boolean, id: string) => {
		// If any card is toggled individually while allExpanded is active,
		// clear the global override so individual states take over
		if (allExpanded !== null) {
			setAllExpanded(null);
		}
	};
	

	const getStrikeCount = (): number => {
		if (!gameState) {
			// console.warn(`getStrikeCount() short circuit no gameState`)
			return 0;
		}
		// get the lengths of all the card strikes
		let ret = gameState.state.incorrectCardStack.reduce((count: number, card: any) => {
			return count + (card.strikes ? card.strikes.length : 0);
		}, 0);
		// then we must also add any strikes in the drawnCard card.
		// console.log('getStrikeCount thinks this is drawnCard', drawnCard)
		if(drawnCard && drawnCard.strikes) {
			ret += drawnCard.strikes.length;
		}

		// console.log(`getStrikeCount() says`, ret, typeof ret)
		return ret
	}

	const checkForGameEnd = () => {
		setGameState(prevGameState => {
			console.log('checkForGameEnd()', prevGameState?.state.state, userSession)
			if( ! prevGameState) return prevGameState;

			// obv if the game state is already complete, we do nothing.
			if(prevGameState.state.state === 'complete') {
				return prevGameState;
			}
			// obv if the game state is not underway (ie lobby), we do nothing.
			if(prevGameState.state.state !== 'underway') {
				return prevGameState;
			}
	
			if( ! userSession) {
				return prevGameState;
			}

			let newGameState = '';
			let newVictor = '';
			let newGameEndDescription = '';

			
			// now, based on type of game and number of players....
			if (gameState.gameMode === 'collaborative') {

				// maybe when the player surrenders, it marks something in the gamestate and then calls me so that I can handle it.
				if(playerSurrendered) {
					// set game state to complete
					newGameState = 'complete'
					// set victor to empty string
					newVictor = ''
					// set gameEndDescription: `PLAYER NAME made too many mistakes`
					newGameEndDescription = `${userSession.username} gave up!`

					
					// console.log('check against strike limit')
					// Check for DEFEAT: Too many strikes in the incorrect stack
					// console.log (getStrikeCount(), gameState.settings.strikeLimit)
				} else if (getStrikeCount() >= prevGameState.settings.strikeLimit) {
					// set game state to complete
					newGameState = 'complete'
					// set victor to empty string
					newVictor = ''
					// set gameEndDescription: `PLAYER NAME made too many mistakes`
					newGameEndDescription = `${userSession.username} made too many mistakes`
					
					
					// Check if timeline has reached target score (for collaborative mode)
					// console.log('check agains targetScore')
				} else if (prevGameState.state.timelineCollaborative.length >= prevGameState.settings.targetScore) {
					// set game state to complete
					newGameState = 'complete'
					// set victor to playerID
					newVictor = userSession._id
					// set gameEndDescription: `PLAYER NAME successfully arranged ${prevGameState.settings.targetScore} events in their timeline!`
					newGameEndDescription = `${userSession.username} successfully arranged ${prevGameState.settings.targetScore} events in their timeline!`
					
					
					// console.log('check agains empty draw stack')
					// Check for DEFEAT: no cards left in draw stack
				} else if (drawStackEmpty) {
					// set game state to complete
					newGameState = 'complete'
					// set victor to playerID
					newVictor = userSession._id
					// set gameEndDescription: 'The entire draw pile was exhausted!'
					newGameEndDescription = `The entire draw pile was exhausted!`
				}


				if(newGameState || newVictor) {
					// also update the api (asynchronous)
					(async () => {
						try {
							const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
							console.log('updating EOGame state with API')
							const response = await fetch(`${apiUrl}/games/${gameId}/state`, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'Authorization': `Bearer ${getToken()}`,
								},
								body: JSON.stringify({
									state: newGameState,
									victor: newVictor
								})
							});
							// console.log('game state update response', response)
							// Expect 204 No Content response - no response body to parse
							if (response.status !== 204) {
								console.error('Unexpected response status:', response.status);
							}
						} catch (error) {
							console.error('Failed to report game state to API:', error);
						}
					})();
					


					return {
						...prevGameState,
						state: {
							...prevGameState.state,
							state: newGameState,
							victor: newVictor
						},
						viewData: {
							...prevGameState.viewData,
							gameEndDescription: newGameEndDescription
						}
					};

				} else {
					console.log('nop! not end of game')
				}
				
				
			} else {
				console.warn('not yet developed for competetive play.')
			}
			
			return prevGameState;
		})

	}



	

	const isGameOver = gameState && gameState.state.state === 'complete'
	const isVictory = gameState && userSession && gameState.state.victor === userSession._id
	const gameEndDescription = gameState?.viewData?.gameEndDescription || "Game Over, Man!"



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
			// disabled in api?
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
		checkForGameEnd()

		// Report the successful move to the server
		const response = await reportMove(drawnCardId, true);
		if (response?.ok) {
			// Success - event was recorded on the server
		}
	}

	const handleIncorrectMove = async (placement: { a: string; b: string, aDisplay: string, bDisplay: string }) => {
		console.log("WRONG BOOOO", isSpectator, isUserTurn, placement, 'drawnCard in memory here on api', drawnCard)
		const {a, b, aDisplay, bDisplay} = placement
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
			strike.rangeKnownBad = `Must be before ${aDisplay} or after ${bDisplay}`
		} else if (a) {
			strike.rangeKnownBad = `Must be before ${aDisplay}`
		} else if (b) {
			strike.rangeKnownBad = `Must be after ${bDisplay}`
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
		checkForGameEnd();

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

			// console.log('POSTING TO UDPATE RE_DRAWN CARD. NO DATA, JUST THE ID ON THE URL', card._id)
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

	/**
	 * Surrender the game - immediately puts the game in defeat state
	 * This will end the game with a loss for the current player
	 */
	const handleSurrender = async () => {
		// Show confirmation dialog instead of surrendering immediately
		setShowSurrenderConfirm(true);
	};

	/**
	 * Confirmed surrender - actually executes the surrender after user confirmation
	 */
	const confirmSurrender = async () => {
		setShowSurrenderConfirm(false);
		if (!gameId || !userSession || isSpectator || isGameOver) return;
		setPlayerSurrendered(true);

		checkForGameEnd(); // handles api updates and more
	};

	let strikeCountdown = gameState.settings.strikeLimit - getStrikeCount();

	// console.log('drawnCard before render', drawnCard)
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
						{/* <Button variant="ghost" size="icon">
							<Settings className="h-4 w-4" />
						</Button> */}
					</div>
				</div>

				{/* Row 2 (mobile) / inline (desktop): status pill + spectator + stats */}
				<div className="flex items-center gap-3 flex-wrap">
					<span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full whitespace-nowrap">
						{statusText}
					</span>
					{isSpectator && (
						<span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded whitespace-nowrap">
							Spectating
						</span>
					)}

					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						{isCollaborative ? (
							<>
								<span title="Timeline length">Score: {gameState.state.timelineCollaborative.length - 2}</span>
								{/* <span title="Remaining events">Remaining Events: {gameState.remainingEventCount ?? 0}</span> */}
								<span title="Missed guesses">Misses: {gameState.state.incorrectCardStack.length}/{gameState.settings.strikeLimit}</span>
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
						<Button variant="secondary" className="hover:bg-accent/50 cursor-pointer" onClick={handleToggleAll}>{allExpanded ? 'Collapse All' : 'Expand All'}</Button>
						
						<Button 
							variant="secondary" 
							onClick={() => setShowSurrenderConfirm(true)}
							disabled={isSpectator || isGameOver}
							className="gap-1 hover:bg-destructive/90 cursor-pointer"
						>
							<Flag className="h-3 w-3" />
							Surrender
						</Button>

							{/* Surrender Confirmation Dialog */}
							<AlertDialog open={showSurrenderConfirm} onOpenChange={setShowSurrenderConfirm}>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Are you sure you want to surrender?</AlertDialogTitle>
										<AlertDialogDescription>
											This will immediately end the game in defeat. You cannot undo this action.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={confirmSurrender}>
											Surrender
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>


						
					</div>
				</div>
			</header>

			{/* Mobile: Draw + Incorrect Stack Row - shown below header on small screens */}
			{isUserTurn && (
				<div className={`lg:hidden flex-shrink-0 border-b border-border ${isPaused ? "opacity-50 pointer-events-none" : ""}`}>
					<DrawPanelHorizontal
						onDraw={handleDrawCard}
						incorrectCards={gameState.state.incorrectCardStack}
						drawStackEmpty={drawStackEmpty}
						isGameOver={isGameOver}
						onRedraw={handleRedrawCard}
						newlyIncorrectId={newlyIncorrectId}
						allExpanded={allExpanded}
						onExpandChange={handleExpandChange}
						guideClass={guideClass}
						drawnCard={drawnCard}
						gameState={gameState}
					/>
				</div>
			)}

			{/* Main game area */}
			<div className="flex-1 flex justify-center overflow-hidden relative">
				<div className="w-full max-w-[1200px] flex flex-col lg:flex-row overflow-hidden relative">
					{/* Desktop: Left Column - Timeline */}
					{/* Mobile Waiting: Stacked section */}
					<div className={`flex flex-col h-[calc(100vh-89px-49px)] lg:h-[calc(100vh-53px)] lg:max-w-[800px] lg:flex-1 relative z-20 overflow-y-auto`}>


						{/* Timeline Cards - scrollable container */}
						{/* <div className="flex-1 p-4 pt-0"> */}
							<Timeline
								events={gameState.state.timelineCollaborative}
								gameId={gameId}
								drawnCard={drawnCard}
								handleCorrectMove={handleCorrectMove}
								handleIncorrectMove={handleIncorrectMove}
								newlyPlacedId={newlyPlacedId}
								allExpanded={allExpanded}
								onExpandChange={handleExpandChange}
								guideClass={guideClass}
								gameState={gameState}
							/>
						{/* </div> */}

						{/* Drawn Card - absolutely positioned over right middle of timeline */}
						{drawnCard && (
							<EventCard
								variant="drawn"
								event={drawnCard}
								badRangeTexts={badRangeTexts}
								allExpanded={allExpanded}
								onExpandChange={handleExpandChange}
								isNewlyPlaced={false}
								guideClass={guideClass}
								gameState={gameState}
							/>
						)}
					</div>

					{/* Desktop: Middle Column - Draw + Incorrect Stack */}
					{/* Mobile Waiting: Stacked section */}
					{/* h-[calc(100vh-120px)] */}
					{isUserTurn && (
						<div className={`hidden lg:block lg:max-w-[400px] lg:flex-shrink-0 border-l border-border p-4 overflow-y-auto ${isPaused ? "opacity-50 pointer-events-none" : ""}`}>
								<DrawPanelVertical
									onDraw={handleDrawCard}
									incorrectCards={gameState.state.incorrectCardStack}
									drawStackEmpty={drawStackEmpty}
									isGameOver={isGameOver}
									onRedraw={handleRedrawCard}
									newlyIncorrectId={newlyIncorrectId}
									allExpanded={allExpanded}
									onExpandChange={handleExpandChange}
									guideClass={guideClass}
									drawnCard={drawnCard}
									gameState={gameState}
								/>
							</div>
					)}



				</div> {/* end 1200px container */}
			</div> {/* end main game area */}
			{isGameOver && showEndScreen && (
				<GameEndScreen
					isVictory={isVictory}
					gameMode={gameState.gameMode}
					players={gameState.players}
					gameEndDescription={gameEndDescription}
					timelineLenth={gameState.state.timelineCollaborative.length}
					incorrectCount={gameState.state.incorrectCardStack.length}
					remainingEvents={gameState.remainingEventCount ?? 0}
					onViewTimeline={() => setShowEndScreen(false)}
				/>
			)}
		</div>
	);
}