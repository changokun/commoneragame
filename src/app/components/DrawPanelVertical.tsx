/**
 * DrawPanelVertical - Vertical layout for draw button and incorrect cards on desktop
 * 
 * This component renders the draw button and incorrect card stack in a vertical
 * column layout. It is used on large screens (desktop) in the right-hand sidebar.
 * 
 * @param onDraw - Handler for draw button click
 * @param incorrectCards - Array of event objects for the incorrect card stack
 * @param drawStackEmpty - Whether there are no more events to draw
 * @param isGameOver - Whether the game has ended
 * @param onRedraw - Handler for redrawing an incorrect card
 * @param newlyIncorrectId - ID of the most recently added incorrect card (for glow effect)
 * @param allExpanded - Global expanded state for descriptions (undefined = use local state)
 * @param onExpandChange - Callback when a card's expand state changes
 */

import { Button } from "./ui/button";
import { EventCard } from "./EventCard";
import { Event } from "../types";

interface DrawPanelVerticalProps {
  onDraw: () => void;
  incorrectCards: Event[];
  drawStackEmpty: boolean;
  isGameOver: boolean;
  onRedraw: (card: Event) => void;
  newlyIncorrectId: string | null;
  allExpanded?: boolean | null;
  onExpandChange?: (expanded: boolean, eventId: string) => void;
}

export function DrawPanelVertical({
  onDraw,
  incorrectCards,
  drawStackEmpty,
  isGameOver,
  onRedraw,
  newlyIncorrectId,
  allExpanded,
  onExpandChange,
}: DrawPanelVerticalProps) {
  // ==========================================================================
  // This component renders the draw button and incorrect cards in a vertical
  // column layout for desktop (right-hand sidebar)
  // ==========================================================================

  return (
    <div className="space-y-4 h-full">
      {/* ====================================================================== */}
      {/* Draw Button */}
      {/* ====================================================================== */}
      <div>
        <Button
          className="w-full"
          size="lg"
          onClick={onDraw}
          disabled={isGameOver || drawStackEmpty}
        >
          {drawStackEmpty ? "No More Events" : "Draw New Event..."}
        </Button>
      </div>

      {/* ====================================================================== */}
      {/* Incorrect Guesses Stack */}
      {/* ====================================================================== */}
      {incorrectCards.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">
            {drawStackEmpty
              ? `...and ${incorrectCards.length} incorrect guesses`
              : "...or try one of these again:"}
          </h3>
          <div className="space-y-2">
            {incorrectCards.map((card) => (
              <EventCard
                key={card._id}
                variant="incorrect"
                event={card}
                strikeCount={card.strikes?.length}
                onClick={() => onRedraw(card)}
                isNewlyPlaced={newlyIncorrectId === card._id}
                allExpanded={allExpanded}
                onExpandChange={onExpandChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
