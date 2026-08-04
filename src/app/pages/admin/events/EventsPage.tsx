import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Loader2 } from "lucide-react";
import { Event } from "../../../types";
import { formatEventDateForDisplay } from "../../../utils";


export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
        const response = await fetch(`${apiUrl}/events/`);
				const events = await response.json()
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        setEvents(events.events);
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