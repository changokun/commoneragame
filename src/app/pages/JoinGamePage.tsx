import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";

export function JoinGamePage() {
  const navigate = useNavigate();

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
        <h1 className="text-3xl font-bold">Join Existing Game</h1>
        <p className="text-muted-foreground">
          Enter a game code to join an ongoing game
        </p>
      </div>

      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
