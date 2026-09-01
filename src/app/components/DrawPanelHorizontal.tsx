/**
 * DrawPanelHorizontal - Horizontal layout for draw button and incorrect cards on mobile
 * 
 * This component renders the draw button and incorrect card stack in a single
 * horizontally scrollable row. It is used on small screens (mobile) where the
 * right-hand column is moved below the header.
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

interface DrawPanelHorizontalProps {
  onDraw: () => void;
  incorrectCards: Event[];
  drawStackEmpty: boolean;
  isGameOver: boolean;
  onRedraw: (card: Event) => void;
  newlyIncorrectId: string | null;
  allExpanded?: boolean | null;
  onExpandChange?: (expanded: boolean, eventId: string) => void;
	guideClass?: string;
	drawnCard?: Event | null;
}

export function DrawPanelHorizontal({
  onDraw,
  incorrectCards,
  drawStackEmpty,
  isGameOver,
  onRedraw,
  newlyIncorrectId,
  allExpanded,
  onExpandChange,
	guideClass = 'guide-0',
	drawnCard
}: DrawPanelHorizontalProps) {
  // ==========================================================================
  // This component renders the draw button and incorrect cards in a single
  // horizontally scrollable row for mobile layout
  // ==========================================================================

  return (
    <div className="draw-panel horizontal-draw-panel p-2 overflow-x-auto whitespace-nowrap flex gap-4">
      {/* ====================================================================== */}
      {/* Draw Button - fixed at start of row */}
      {/* ====================================================================== */}
      {/* <div className="inline-block pr-4 h-full"> */}
        <Button
          className={`whitespace-nowrap h-full draw cursor-pointer ${(! drawnCard && ! drawStackEmpty && ! isGameOver) ? guideClass : ''}`}
          size="sm"
          onClick={onDraw}
          disabled={isGameOver || drawStackEmpty}
        >
          {drawStackEmpty ? "No More Events" : "Draw New Event…"}
        </Button>
      {/* </div> */}

      {/* ====================================================================== */}
      {/* Incorrect Cards - inline, scrollable, fixed width */}
      {/* ====================================================================== */}
      {incorrectCards.map((card) => (
        // <div key={card._id} className="inline-block align-top">
          <EventCard
            variant="incorrect"
            event={card}
            strikeCount={card.strikes?.length}
            onClick={() => onRedraw(card)}
            isNewlyPlaced={newlyIncorrectId === card._id}
            allExpanded={allExpanded}
            onExpandChange={onExpandChange}
            className="w-64"
          />
        // </div>
      ))}
    </div>
  );
}
