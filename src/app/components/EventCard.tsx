import { Card } from "./ui/card";
import { Skull, X } from "lucide-react";
import { Event } from "../types";
import { formatEventDate } from "../utils";

/**
 * EventCard - Unified component for displaying events in different contexts
 *
 * @param variant - Determines the display mode and styling:
 *   - 'drawn': Floating card with strike indicators and bad ranges (for active drawn card)
 *   - 'timeline': Standard timeline card showing the event date
 *   - 'incorrect': Incorrect stack card showing strike count and clickable to redraw
 * @param event - The event data to display
 * @param onClick - Optional click handler (used for incorrect cards to redraw)
 * @param isNewlyPlaced - Whether this card was just placed (adds glow effect)
 * @param badRangeTexts - Array of text showing known bad ranges (drawn card only)
 * @param strikeCount - Number of strikes on this card (incorrect card only)
 */
interface EventCardProps {
  variant: 'drawn' | 'timeline' | 'incorrect';
  event: Event;
  onClick?: () => void;
  isNewlyPlaced?: boolean;
  badRangeTexts?: string[];
  strikeCount?: number;
}

export function EventCard({
  variant,
  event,
  onClick,
  isNewlyPlaced = false,
  badRangeTexts,
  strikeCount,
}: EventCardProps) {
  // ==========================================================================
  // COMMON PROPS - All variants share these
  // ==========================================================================
  const showTitle = true;
  const showDescription = Boolean(event.description);

  // ==========================================================================
  // VARIANT-SPECIFIC RENDERING
  // ==========================================================================

  /**
   * Date/Strike Indicator - Different for each variant:
   * - drawn: Shows strike X's or empty space
   * - timeline: Shows formatted date
   * - incorrect: Shows X's for strike count
   */
  const renderIndicator = () => {
    switch (variant) {
      case 'drawn':
        return (
          <span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-red-500 dark:bg-neutral-700 dark:text-white/50 md:me-4">
            {event.strikes?.length ? 'X'.repeat(event.strikes.length) : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}
          </span>
        );

      case 'timeline':
        return (
          <span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-neutral-500 dark:bg-neutral-700 dark:text-white/50 md:me-4">
            {formatEventDate(event.date)}
          </span>
        );

      case 'incorrect':
        return (
          <span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-red-500 dark:bg-neutral-700 dark:text-white/50 md:me-4">
            {'X'.repeat(strikeCount || event.strikes?.length || 0)}
          </span>
        );
    }
  };

  /**
   * Known Bad Ranges - Only shown for drawn variant
   */
  const renderKnownBads = () => {
    if (variant !== 'drawn' || !badRangeTexts?.length) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {badRangeTexts.map((t) => (
          <span key={t} className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full whitespace-nowrap">
            {t}
          </span>
        ))}
      </div>
    );
  };

  // ==========================================================================
  // CARD STYLING - Different for each variant
  // ==========================================================================

  /**
   * Base card classes that all variants share
   */
  const baseCardClasses = "event-card border-secondary-foreground border-1";
  const shadowClasses = variant === 'drawn' ? "shadow-2xl" : "shadow-lg";

  /**
   * Variant-specific card classes
   */
  const variantCardClasses = {
    drawn: "absolute -right-20 top-1/2 -translate-y-1/2 w-64 lg:w-88 min-h-40 z-30",
    timeline: "w-full mb-4", // or whatever your timeline needs
    incorrect: "w-full cursor-pointer hover:bg-muted/50",
  };

  const cardClasses = `${baseCardClasses} ${shadowClasses} ${variantCardClasses[variant]} ${
    isNewlyPlaced ? "card-glow" : ""
	}${
		isNewlyPlaced && variant === 'incorrect' ? "-incorrect" : ""
  }`;

	console.log(`cardClasses (${variant}, ${isNewlyPlaced})`, cardClasses)






	return (
    <Card className={cardClasses} onClick={onClick}>
      <div className="p-4">
        <h3 className="font-semibold">
          {renderIndicator()}
          {event.title || event.name || "Event"}
        </h3>

        {renderKnownBads()}

        {showDescription && (
          <p className="text-sm mt-2">{event.description}</p>
        )}
      </div>
    </Card>
  );
}