import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Loader2, Heart, Flag, MessageSquare } from "lucide-react";
import { Event, Feedback } from "../../../types";
import { formatEventDateForDisplay } from "../../../utils";


export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  // FEEDBACK PILLS - Display unresolved feedback counts by type
  // ==========================================================================

  /**
   * Color mapping for feedback types
   * Matches the color scheme used in feedback action buttons
   */
  const feedbackColors: Record<string, { text: string; bg: string; fill: string }> = {
    favorite: { text: 'text-red-500', bg: 'bg-red-500/10', fill: 'fill-red-500' },
    flag: { text: 'text-amber-500', bg: 'bg-amber-500/10', fill: 'fill-amber-500' },
    comment: { text: 'text-blue-500', bg: 'bg-blue-500/10', fill: 'fill-blue-500' },
  };

  /**
   * Get the appropriate icon component for a feedback type
   */
  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'favorite': return Heart;
      case 'flag': return Flag;
      case 'comment': return MessageSquare;
      default: return MessageSquare;
    }
  };

  /**
   * Get counts of unresolved feedbacks grouped by type for a single event
   * Filters feedbacks where isResolved is false, then groups by type
   * Returns an object with type as key and count as value
   */
  const getUnresolvedFeedbackCounts = useCallback((event: Event) => {
    const counts: Record<string, number> = {};
    
    if (!event.feedbacks) return counts;
    
    // Filter unresolved feedbacks and count by type
    event.feedbacks
      .filter((f: Feedback) => !f.isResolved)
      .forEach((f: Feedback) => {
        counts[f.type] = (counts[f.type] || 0) + 1;
      });
    
    return counts;
  }, []);

  /**
   * Render feedback pills for unresolved feedbacks for a single event
   * Shows icon + count for each feedback type with unresolved items
   */
  const renderFeedbackPills = (event: Event) => {
    const counts = getUnresolvedFeedbackCounts(event);
    const types = Object.keys(counts);
    
    if (types.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {types.map(type => {
          const Icon = getFeedbackIcon(type);
          const colors = feedbackColors[type] || feedbackColors.comment;
          return (
            <span 
              key={type}
              className={`flex items-center gap-1 text-xs ${colors.bg} ${colors.text} px-2 py-0.5 rounded-full whitespace-nowrap`}
            >
              <Icon className={`w-3 h-3 ${colors.fill}`} />
              <span>{counts[type]}</span>
            </span>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
        const response = await fetch(`${apiUrl}/events/?includeFeedbacks=true`);
				const events = await response.json()
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        setEvents(events.events);
				console.log('one', events.events[1])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Failed to fetch events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllEvents();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-3">Loading events...</span>
    </div>
  );

  if (error) return (
    <div className="text-center p-8">
      <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Events</h2>
      <p className="text-muted-foreground mb-4">{error}</p>
      <Button onClick={() => window.location.reload()}>Retry</Button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Events</h1>
        <span className="text-muted-foreground">{events.length} total</span>
      </div>
      <Card className="p-6">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No events found.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event._id} className="p-3 border-b last:border-0 hover:bg-muted/50">
                <Link to={`/admin/events/edit/${event._id}`} className="block">
                  <div className="flex justify-between items-start">
                    <div>
                      {event.date || event.dateBCE ? (
                        <span className="mr-2 text-sm text-muted-foreground">
                          {formatEventDateForDisplay(event)}
                        </span>
                      ) : 'NO DATE ERROR'}
                      <span className="font-semibold">
                        {event.title || event.name || event._id}
                      </span>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      )}
                      {renderFeedbackPills(event)}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}