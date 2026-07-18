import { Card } from "./ui/card";
import { Skull, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Event } from "../types";
import { formatEventDateForDisplay } from "../utils";


interface EventCardProps {
  variant: 'drawn' | 'timeline' | 'incorrect';
  event: Event;
  onClick?: () => void;
  isNewlyPlaced?: boolean;
  badRangeTexts?: string[];
  strikeCount?: number;
  /**
   * Global expanded state - when provided, overrides local state
   * Used for "collapse/expand all" feature
   */
  allExpanded?: boolean | null;
  /**
   * Callback when expand state changes
   * Used to sync with parent for global control
   */
  onExpandChange?: (isExpanded: boolean, eventId: string) => void;
  /**
   * Additional CSS classes for the root Card element
   */
  className?: string;
}


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
export function EventCard({
  variant,
  event,
  onClick,
  isNewlyPlaced = false,
  badRangeTexts,
  strikeCount,
  allExpanded,
  onExpandChange,
  className,
}: EventCardProps) {
  // Local expanded state for this card
  const [isExpanded, setIsExpanded] = useState<boolean | null>(true);

  // Determine display state: use global if provided, else local
  const displayExpanded = allExpanded !== null ? allExpanded : isExpanded;

  // Sync local state when global changes
  useEffect(() => {
    if (allExpanded !== null) {
      setIsExpanded(allExpanded);
    }
  }, [allExpanded]);

  // ==========================================================================
  // CHEVRON TOGGLE - Only for timeline and incorrect cards
  // ==========================================================================
  // Only show chevron for cards that can be collapsed
  const showChevron = (variant === 'timeline' || variant === 'incorrect') && Boolean(event.description);

	const handleToggleExpand = (e: React.MouseEvent) => {
		e.stopPropagation();
	
		// When allExpanded is active, clicking a chevron should:
		// 1. Set this card's local state to the opposite of the global state
		// 2. Tell parent to clear the global override
		if (allExpanded !== null) {
			setIsExpanded(!allExpanded);
			onExpandChange?.(!allExpanded, event._id);
		} else {
			// Normal toggle - just flip local state
			setIsExpanded(prev => !prev);
			onExpandChange?.(!isExpanded, event._id);
		}
	};
	

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
          <span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-red-500 dark:bg-neutral-700 dark:text-white/50 me-4">
            {event.strikes?.length ? 'X'.repeat(event.strikes.length) : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}
          </span>
        );

      case 'timeline':
        return (
          <span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-neutral-500 dark:bg-neutral-700 dark:text-white/50 me-4">
            {formatEventDateForDisplay(event)}
          </span>
        );

      case 'incorrect':
        return (
          <span className="year my-2 rounded-md bg-zinc-100 px-2 py-0 lg:px-3 lg:py-1 text-l uppercase text-red-500 dark:bg-neutral-700 dark:text-white/50 me-2 lg:me-4">
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
  const baseCardClasses = `event-card ${variant} border-secondary-foreground border-1`;
  const shadowClasses = variant === 'drawn' ? "shadow-2xl" : "shadow-lg";

  /**
   * Variant-specific card classes
   */
  const variantCardClasses = {
    drawn: "absolute z-30",
    timeline: "w-full mb-4",
    incorrect: "w-full cursor-pointer hover:bg-muted/50",
  };

  const cardClasses = `${baseCardClasses} ${shadowClasses} ${variantCardClasses[variant]} ${
    isNewlyPlaced ? "card-glow" : ""
  }${
    isNewlyPlaced && variant === 'incorrect' ? "-incorrect" : ""
  }`;

	// console.log(`cardClasses (${variant}, ${isNewlyPlaced})`, cardClasses)






  return (
    <Card className={`${cardClasses}${className ? ' ' + className : ''}`} onClick={onClick}>
      <div className="event-card-liner p-4 relative">
        {/* ================================================================ */}
        {/* CHEVRON BUTTON - Upper right, large hitbox */}
        {/* ================================================================ */}
        {showChevron && (
          <button
            onClick={handleToggleExpand}
            // Large hitbox: extends beyond card padding with negative margins
            className="collapser absolute top-0 right-0 md:p-4 lg:p-6 -m-1 rounded-md cursor-pointer text-muted-foreground transition-transform duration-200"
            aria-label={displayExpanded ? "Collapse description" : "Expand description"}
            aria-expanded={displayExpanded}
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                displayExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}

        <h3 className="font-semibold">
          {renderIndicator()}
          {event.title || event.name || "Event"}
        </h3>

        {renderKnownBads()}

        {/* Description only shown when expanded AND we have one */}
        {event.description && (displayExpanded || variant === 'drawn') && (
          <p className="text-sm mt-2">{event.description}</p>
        )}
      </div>
    </Card>
  );
}