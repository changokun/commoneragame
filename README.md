# Common Era Game - Frontend

A game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```
VITE_API_URL=http://localhost:3000
```

For production, set:
```
VITE_API_URL=https://game-phase.sarumino.com/common-era
```

## Development

Run the dev server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

Build for production:
```bash
npm run build
```

## Environment Variables

- `VITE_API_URL` - Base URL for the game API backend

## Narrative Summary

The Big Picture: Common Era Game is a browser-based history game where players arrange historical events in chronological order. The application is a React frontend that communicates with a backend API, with the browser's localStorage serving as short-term memory between sessions.

The User Journey Begins: A visitor lands on the homepage and sees three paths forward. A tutorial-style game can be started immediately with "Show me how to play," which creates a simple collaborative game with beginner-friendly settings. A deeper configuration path is available through "Create New Game," which presents options for game mode, player configuration, difficulty, date ranges, and content tags. A third option for joining existing games is reserved for future multiplayer functionality.

As a game is created, the application fetches available presets (topics like "Europe" or "Ancient History") and tags from the API, allowing event filtering by time period, difficulty level, and category. A dynamic count of matching events is maintained as filters change, ensuring the game will have sufficient cards. Once configured, the settings are packaged and sent to the `/games` endpoint to instantiate a new game.

Entering the Game: Upon game creation or resumption, the PlayPage initializes. The application first verifies user identity: if unknown, an anonymous session is automatically created by calling `/auth/anonymous`, which returns a JWT token and player ID stored in localStorage. This anonymous identity persists across sessions, allowing return visitors to maintain their history. The game state itself resides on the backend, but the page caches it locally and stores the game ID in localStorage under `CE-currentGameId` for later resumption.

The core gameplay loop follows a draw-think-place pattern. When it is a player's turn, clicking "Draw Card" invokes `/games/{id}/draw` to pull a random event from the deck. Event data is returned as either an ID or full object. The application checks its local cache, organized by game ID as `CE-game-event-cache-{gameId}`, and fetches any missing data from `/events?ids={...}`. This caching mechanism is essential because events are reused across sessions and games.

The Timeline Dance: Once drawn, a card hovers above the timeline, which is a list of event IDs that have been successfully placed in chronological order. The player determines where the new event belongs by hovering over gaps between existing cards, where placement options appear: "Place between 1865 CE and 1945 CE" or "Place before 500 BCE." When a placement is committed, the application reports the move to `/games/{id}/player/{playerId}` with the event ID and a success flag. Correct placements add the event ID to the timeline. Incorrect placements send the card to the "incorrect stack" and record which player earned the strike, along with the known-bad date range for future reference. Each incorrect card can be clicked to attempt again, invoking `/games/{id}/draw/{eventId}` to return it to play.

Where the Truth Lives: The backend is the source of truth. Every game state change, card draw, and move is reported back to the API. The frontend maintains local caches for responsiveness and offline resilience. Events are cached per-game in localStorage. Game IDs are remembered for resumption. User sessions (anonymous or admin) persist in localStorage with their JWT tokens. The synchronization points are explicit: drawing a card, placing a card, or surrendering all trigger immediate backend updates. The backend returns updated state, which the frontend uses to refresh its local representation.

The Auth Story: Two parallel authentication systems operate within the application. Regular users receive anonymous tokens automatically through `/auth/anonymous`, requiring no login. This token identifies users across games and sessions. Administrator users follow a separate flow: they authenticate via `/admin/login`, receive an admin-specific JWT, and all admin API calls utilize the `adminFetch` helper which automatically attaches this token. Protected admin routes are wrapped by the `AdminAuthWrapper` component, which verifies a valid admin token before rendering child components.

The Admin Side: Administrators manage the content that powers the game. Through dedicated interfaces, they can edit events (historical cards) and tags (categories). The EventsPage displays all events with feedback indicators—badges showing counts of unresolved favorites, flags, or comments. Each event can be edited through a detailed form. The tag system supports hierarchical organization, with parent tags containing child tags for granular categorization.

The Feedback Loop: Players can interact with events beyond placement. Each card includes feedback actions: heart for marking favorites, flag for reporting issues, and comment for leaving private notes. These submissions are sent to `/events/{id}/feedback` with the user's token for identification. Feedback is attached to the event and surfaces in the admin interface as unresolved counts until an administrator marks them as resolved. The feedback system tracks type (favorite, flag, comment), optional text or reasons, resolution status, and timestamps.

Game End Conditions: The application monitors for victory or defeat conditions. Victory is achieved when the collaborative timeline reaches the configured target score. Defeat occurs when accumulated strikes meet or exceed the configured limit, or when the draw pile is exhausted. Upon either condition, the application reports the final state to the backend via `/games/{id}/state` and displays the end screen. The game ID is cleared from localStorage to ensure users begin fresh in subsequent sessions. Surrender is also supported, allowing immediate defeat through `/games/{id}/surrender`.

The Technical Foundation: React Router handles navigation between pages. Component state is managed through React hooks, with data passed through props between components. Radix UI provides accessible component primitives. Tailwind CSS handles styling. localStorage bridges sessions, remembering user identity, game preferences, and in-progress games. The application also maintains a count of games created per user in localStorage under `ce-numberOfGamesCreated` to tailor the first-time experience.