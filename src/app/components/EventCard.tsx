import { Card } from "./ui/card";
// Import feedback icons from lucide-react
// Heart = favorite, Flag = flag/report, MessageSquare = comment
import { Skull, X, ChevronDown, Heart, Flag, MessageSquare, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Event } from "../types";
import { formatEventDateForDisplay } from "../utils";
import { getToken } from "../services/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

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
  // FEEDBACK STATE - For favorite, flag, and comment actions
  // ==========================================================================
  // Type for feedback action states:
  // - 'idle': default state, icon is monotone/empty
  // - 'saving': API call in progress, show spinner
  // - 'success': API call succeeded, icon is filled with color
  // - 'error': API call failed
  type FeedbackState = 'idle' | 'saving' | 'success' | 'error';

  // Track the state of each feedback action
  // This allows us to show visual feedback (spinner, filled icon) for each action
  const [feedbackStates, setFeedbackStates] = useState<{
    favorite: FeedbackState;
    flag: FeedbackState;
    comment: FeedbackState;
  }>({
    favorite: 'idle',
    flag: 'idle',
    comment: 'idle',
  });

  // Track whether the comment input field is visible
  const [showCommentInput, setShowCommentInput] = useState(false);

  // Track the text the user types for a comment
  const [commentText, setCommentText] = useState('');

  // Refs to store timeout IDs so we can clear them if the component unmounts
  // This prevents memory leaks and state updates on unmounted components
  const timeoutRefs = useRef<{
    favorite?: NodeJS.Timeout;
    flag?: NodeJS.Timeout;
    comment?: NodeJS.Timeout;
  }>({});

  // Clean up timeouts when component unmounts
  // useEffect with empty dependency array runs only on mount and unmount
  useEffect(() => {
    return () => {
      // Clear all pending timeouts to prevent memory leaks
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

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
  // FEEDBACK API FUNCTION
  // ==========================================================================
  // Generic function to submit feedback to the server
  // Used by all three feedback actions (favorite, flag, comment)
  // useCallback memoizes this so it doesn't recreate on every render
	const submitFeedback = useCallback(async (type: 'favorite' | 'flag' | 'comment', text: string = '', reason?: string) => {
		const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
		
		const body: { type: string; text?: string; reason?: string } = { type };
		if (text) body.text = text;
		if (reason) body.reason = reason;
		
    try {
			const response = await fetch(`${apiUrl}/events/${event._id}/feedback`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${getToken()}`,
				},
				body: JSON.stringify(body),
			});

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to submit feedback');
      }

      return true; // Success
    } catch (err) {
      console.error('Feedback submission error:', err);
      return false; // Failure
    }
  }, [event._id]);


  // ==========================================================================
  // FEEDBACK HANDLERS
  // ==========================================================================

  /**
   * Handle favorite button click
   * Toggles favorite state and submits to API
   */
  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from firing
    
    // Set state to 'saving' to show spinner
    setFeedbackStates(prev => ({ ...prev, favorite: 'saving' }));

    // Submit feedback to API
    const success = await submitFeedback('favorite', '');

    // Update state based on result
    setFeedbackStates(prev => ({
      ...prev,
      favorite: success ? 'success' : 'error',
    }));

    // Clear the state after 8 seconds (auto-revert as requested)
    const timeout = setTimeout(() => {
      setFeedbackStates(prev => ({ ...prev, favorite: 'idle' }));
    }, 8000);

    // Store timeout ref so we can clear it on unmount
    timeoutRefs.current.favorite = timeout;
  }, [submitFeedback]);


  /**
   * Handle flag button click
   * Submits flag feedback to API
   */
	const handleFlagSelect = useCallback(async (reason: string) => {
		setFeedbackStates(prev => ({ ...prev, flag: 'saving' }));
		
		const success = await submitFeedback('flag', '', reason.toLowerCase());
		
		setFeedbackStates(prev => ({
			...prev,
			flag: success ? 'success' : 'error',
		}));
		
		const timeout = setTimeout(() => {
			setFeedbackStates(prev => ({ ...prev, flag: 'idle' }));
		}, 8000);
		
		timeoutRefs.current.flag = timeout;
	}, [submitFeedback]);


  /**
   * Handle comment button click
   * Shows the comment input field instead of immediately submitting
   */
  const handleCommentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from firing
    setShowCommentInput(true);
    setCommentText('');
  }, []);


  /**
   * Handle comment submission
   * Submits comment feedback to API and hides the input field
   */
  const handleCommentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!commentText.trim()) {
      // Don't submit empty comments
      setShowCommentInput(false);
      return;
    }

    setFeedbackStates(prev => ({ ...prev, comment: 'saving' }));

    const success = await submitFeedback('comment', commentText);

    setFeedbackStates(prev => ({
      ...prev,
      comment: success ? 'success' : 'error',
    }));

    // Hide input and clear text
    setShowCommentInput(false);
    setCommentText('');

    // Clear the state after 8 seconds
    const timeout = setTimeout(() => {
      setFeedbackStates(prev => ({ ...prev, comment: 'idle' }));
    }, 8000);

    timeoutRefs.current.comment = timeout;
  }, [submitFeedback, commentText]);


  /**
   * Handle comment input cancel
   * Hides the input field without submitting
   */
  const handleCommentCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCommentInput(false);
    setCommentText('');
  }, []);


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

        {/* ================================================================ */}
        {/* FEEDBACK ICONS - Only for timeline and incorrect variants */}
        {/* Shows at bottom right when card is expanded or always for these variants */}
        {/* ================================================================ */}
        {(variant === 'timeline') && (
          <div className="feedback-actions absolute bottom-0 right-0 p-2 flex gap-2">
            {/* Favorite/Heart button */}
            <button
              onClick={handleFavoriteClick}
              className={`feedback-btn cursor-pointer transition-all duration-300 ${
                feedbackStates.favorite === 'saving' ? 'animate-spin' : ''
              }`}
              aria-label="Favorite this event"
              disabled={feedbackStates.favorite === 'saving'}
            >
              {feedbackStates.favorite === 'saving' ? (
                <Loader2 className="w-4 h-4 text-red-500" />
              ) : (
                <Heart
                  className={`w-4 h-4 ${
                    feedbackStates.favorite === 'success' 
                      ? 'text-red-500 fill-red-500' 
                      : 'text-muted-foreground opacity-60 hover:opacity-100'
                  }`}
                />
              )}
            </button>

            {/* Flag button */}
						<DropdownMenu onOpenChange={(open) => {
							if (!open && feedbackStates.flag === 'saving') {
								setFeedbackStates(prev => ({ ...prev, flag: 'idle' }));
							}
						}}>
							<DropdownMenuTrigger asChild>
								<button
									className={`feedback-btn cursor-pointer transition-all duration-300 ${
										feedbackStates.flag === 'saving' ? 'animate-spin' : ''
									}`}
									aria-label="Flag this event"
									disabled={feedbackStates.flag === 'saving'}
								>
									{feedbackStates.flag === 'saving' ? (
										<Loader2 className="w-4 h-4 text-amber-500" />
									) : (
										<Flag
											className={`w-4 h-4 ${
												feedbackStates.flag === 'success' 
													? 'text-amber-500 fill-amber-500' 
													: 'text-muted-foreground opacity-60 hover:opacity-100'
											}`}
										/>
									)}
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onSelect={() => handleFlagSelect('Offensive')}>
									Offensive
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => handleFlagSelect('Inaccurate')}>
									Inaccurate
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => handleFlagSelect('Confusing')}>
									Confusing
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => handleFlagSelect('Duplicate')}>
									Duplicate
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => handleFlagSelect('Other')}>
									Other (please also leave a comment)
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

            {/* Comment button */}
            <button
              onClick={showCommentInput ? undefined : handleCommentClick}
              className="feedback-btn cursor-pointer transition-all duration-300"
              aria-label="Comment on this event"
            >
              {feedbackStates.comment === 'saving' ? (
                <Loader2 className="w-4 h-4 text-blue-500" />
              ) : (
                <MessageSquare
                  className={`w-4 h-4 ${
                    feedbackStates.comment === 'success' 
                      ? 'text-blue-500 fill-blue-500' 
                      : 'text-muted-foreground opacity-60 hover:opacity-100'
                  }`}
                />
              )}
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* COMMENT INPUT FIELD - Appears when comment button is clicked */}
        {/* ================================================================ */}
        {(variant === 'timeline' || variant === 'incorrect') && showCommentInput && (
					<form
						onSubmit={handleCommentSubmit}
						className="comment-input block p-4 pt-4 mt-4 border-t border-border"
					>
						<p className="info mb-4 text-neutral-400">Your comment will not be public, only the admins will see it.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-sm bg-background border border-muted-foreground/20 rounded px-3 py-2 focus:outline-none focus:border-primary"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || feedbackStates.comment === 'saving'}
                className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {feedbackStates.comment === 'saving' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Post'}
              </button>
              <button
                type="button"
                onClick={handleCommentCancel}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}