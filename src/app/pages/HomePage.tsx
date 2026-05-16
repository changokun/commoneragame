import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { PlusCircle, Users } from "lucide-react";

export function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Common Era
        </h1>

        <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
          Test your knowledge of history! Can you put these events in order?
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
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
