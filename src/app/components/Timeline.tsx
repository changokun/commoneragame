import { useState, useEffect } from "react";
import { Card } from "./ui/card";

interface TimelineCardProps {
  event: any;
  index: number;
}

function TimelineCard({ event, index }: TimelineCardProps) {
	console.log('event for TimelineCard', event)
  return (
    <Card key={index} className="p-4">
      <div className="space-y-2">
        <h3 className="font-semibold"><span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-neutral-500 dark:bg-neutral-700 dark:text-white/50 md:me-4">{event.date}</span> {event.title || `Event ${index + 1}`}</h3>
        {event.year && (
          <p className="text-sm text-muted-foreground">
            {event.year}
          </p>
        )}
        {event.description && (
          <p className="text-sm">{event.description}</p>
        )}
      </div>
    </Card>
  );
}

interface TimelineProps {
  events: any[];
  gameId: string | null;
}

const CACHE_KEY_PREFIX = "game-event-cache-";

function sortEventsByDate(events: any[]): any[] {
  return [...events].sort((a, b) => {
		if(a.date < b.date) return -1;
		if(a.date > b.date) return 1;
		return 0;
  });
}

export function Timeline({ events: eventIds, gameId }: TimelineProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Don't load if gameId is not available
    if (!gameId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    const loadEvents = async () => {
      setIsLoading(true);
      
      const cacheKey = `CE-${CACHE_KEY_PREFIX}${gameId}`;
      const cachedData: Record<string, any> = JSON.parse(
        localStorage.getItem(cacheKey) || "{}"
      );

      // Separate cached and missing event IDs
      const cachedEvents: any[] = [];
      const missingIds: string[] = [];

      for (const id of eventIds) {
        const eventId = typeof id === "string" ? id : String(id);
        if (cachedData[eventId]) {
          cachedEvents.push(cachedData[eventId]);
        } else {
          missingIds.push(eventId);
        }
      }

      // If there are missing IDs, fetch them in one batch
      if (missingIds.length > 0) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
          const idsParam = missingIds.join(",");
          const response = await fetch(`${apiUrl}/events?ids=${idsParam}`);
          const data = await response.json();

          if (response.ok && Array.isArray(data.events)) {
            // Update cache with newly fetched events
            const newCache: Record<string, any> = { ...cachedData };
            for (const event of data.events) {
              if (event._id) {
                newCache[event._id] = event;
              }
            }
            localStorage.setItem(cacheKey, JSON.stringify(newCache));

            // Merge fetched events with cached ones and sort by date
            const fetchedMap = new Map(data.events.map((e: any) => [e._id, e]));
            let allEvents = eventIds.map((id) => {
              const eventId = typeof id === "string" ? id : String(id);
              return newCache[eventId] || fetchedMap.get(eventId);
            }).filter(Boolean);
            
            // Sort by date when we have newly fetched events
            allEvents = sortEventsByDate(allEvents);
            setEvents(allEvents);
          }
        } catch (err) {
          console.error("Failed to fetch events:", err);
          // Fall back to whatever we have cached
          setEvents(eventIds.map((id) => {
            const eventId = typeof id === "string" ? id : String(id);
            return cachedData[eventId];
          }).filter(Boolean));
        }
      } else {
        // All events are cached
        const allEvents = eventIds.map((id) => {
          const eventId = typeof id === "string" ? id : String(id);
          return cachedData[eventId];
        }).filter(Boolean);
        setEvents(sortEventsByDate(allEvents));
      }

      setIsLoading(false);
    };

    loadEvents();
  }, [eventIds, gameId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {eventIds.length > 0 ? (
          eventIds.map((_, index) => (
            <Card key={index} className="p-4 animate-pulse">
              <div className="h-20 bg-muted rounded" />
            </Card>
          ))
        ) : (
          <Card className="p-4 border-2 border-dashed border-muted-foreground/50">
            <p className="text-center text-muted-foreground">No events in timeline yet</p>
          </Card>
        )}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="p-4 border-2 border-dashed border-muted-foreground/50">
        <p className="text-center text-muted-foreground">No events in timeline yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <TimelineCard key={index} event={event} index={index} />
      ))}
    </div>
  );
}
