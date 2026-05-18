# Common Era Game - Frontend

A text-based strategy game where you guide civilizations through the ages.

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