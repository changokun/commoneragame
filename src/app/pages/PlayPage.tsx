import { useParams } from "react-router";

export function PlayPage() {
  const { gameId } = useParams();

  return (
    <div className="max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-4">Play Game</h1>
      <p className="text-muted-foreground">
        Game ID: {gameId || "No game ID provided"}
      </p>
      <p className="text-muted-foreground mt-4">Game interface coming soon...</p>
    </div>
  );
}
