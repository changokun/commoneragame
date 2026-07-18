import { Link } from "react-router";
import { Button } from "./ui/button";
import { PlusCircle, ScrollText } from "lucide-react";

interface Player {
  _id: string;
  name: string;
  score?: number;
}

interface GameEndScreenProps {
  isVictory: boolean;
  gameMode: "collaborative" | "competitive";
  players: Player[];
	gameEndDescription: string;
  timelineLenth: number;
  incorrectCount: number;
  remainingEvents: number;
  onViewTimeline: () => void;
}

export function GameEndScreen({
  isVictory,
  gameMode,
  players,
	gameEndDescription,
  timelineLenth,
  incorrectCount,
  remainingEvents,
  onViewTimeline,
}: GameEndScreenProps) {
  const sortedPlayers = [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const winner = sortedPlayers[0];

  return (
    <div className={`game-end-screen ${isVictory ? "game-end-screen--victory" : "game-end-screen--defeat"}`}>
      {/* Large backdrop starburst */}
      <div className={`game-end-burst ${isVictory ? "game-end-burst--victory" : "game-end-burst--defeat"}`} aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full gap-8">

        {/* Headline */}
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest opacity-60">
            {isVictory ? "Common Era" : "Common Era"}
          </p>
          <h1 className={`text-6xl font-bold tracking-tight ${isVictory ? "text-amber-700 dark:text-amber-400" : "text-red-800 dark:text-red-400"}`}>
            {isVictory ? "Victory" : "Defeated"}
          </h1>
          <p className="text-muted-foreground text-base">
            {gameEndDescription
						? `${gameEndDescription}`
						:isVictory
              ? gameMode === "collaborative"
                ? "The team placed every event in its proper place."
                : `${winner?.name} takes the win.`
              : "The timeline could not be completed."}
          </p>
        </div>

        {/* Stats */}
        <div className="w-full rounded-xl border border-border bg-background/70 backdrop-blur-sm divide-y divide-border">
          <div className="flex justify-between items-center px-5 py-3">
            <span className="text-sm text-muted-foreground">Events placed</span>
            <span className="font-semibold tabular-nums">{timelineLenth}</span>
          </div>
          <div className="flex justify-between items-center px-5 py-3">
            <span className="text-sm text-muted-foreground">Incorrect guesses</span>
            <span className="font-semibold tabular-nums">{incorrectCount}</span>
          </div>
          <div className="flex justify-between items-center px-5 py-3">
            <span className="text-sm text-muted-foreground">Events remaining</span>
            <span className="font-semibold tabular-nums">{remainingEvents}</span>
          </div>
        </div>

        {/* Competitive scoreboard */}
        {gameMode === "competitive" && players.length > 1 && (
          <div className="w-full rounded-xl border border-border bg-background/70 backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Final Scores</h2>
            </div>
            {sortedPlayers.map((player, index) => (
              <div
                key={player._id || index}
                className={`flex justify-between items-center px-5 py-3 ${index < sortedPlayers.length - 1 ? "border-b border-border" : ""} ${index === 0 ? "bg-amber-50 dark:bg-amber-950/30" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                  <span className={`font-medium ${index === 0 ? "text-amber-700 dark:text-amber-400" : ""}`}>
                    {player.name}
                  </span>
                </div>
                <span className="font-semibold tabular-nums">{player.score ?? 0}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="w-full flex flex-col gap-3">
          <Button variant="outline" size="lg" className="w-full gap-2" onClick={onViewTimeline}>
            <ScrollText className="h-5 w-5" />
            View Timeline
          </Button>
          <Link to="/new-game" className="w-full">
            <Button size="lg" className="w-full gap-2">
              <PlusCircle className="h-5 w-5" />
              New Game
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
