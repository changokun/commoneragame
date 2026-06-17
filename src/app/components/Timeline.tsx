import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { EVENT_CACHE_KEY_PREFIX } from "../constants";

interface TimelineCardProps {
  event: any;
  index: number;
}

function TimelineCard({ event, index }: TimelineCardProps) {
  return (
    <Card key={index} className="p-4 h-30 timeline-card">
      <div className="space-y-2">
        <h3 className="font-semibold"><span className="year my-2 rounded-md bg-zinc-100 px-3 pb-1.5 pt-2 text-l uppercase text-neutral-500 dark:bg-neutral-700 dark:text-white/50 md:me-4">{event.date}</span> {event.title || `Event ${index + 1}`}</h3>
        {event.description && (
          <p className="text-sm">{event.description}</p>
        )}
      </div>
    </Card>
  );
}

function PlacementOption({ spliceStartIndex, before, after, drawnCard, onPlace }: PlacementOptionProps) {
	const b = before?.date
	const a = after?.date
	
	// Build placement description - one line, maybe two
	let label = "Place card";
	if (a && b) {
		label = `Place between ${a} and ${b}`;
	} else if (b) {
		label = `Place before ${b}`;
	} else if (a) {
		label = `Place after ${a}`;
	}

	// Determine placement position for the handler
	// const placement = {
	// 	after: a ? after._id : null,
	// 	before: b ? before._id : null
	// };

	return (
		// -scroll-my-4 huh?
		<div className="snapper">
			<Button 
				variant="outline" 
				size="lg"
				className="w-full max-w-xs justify-start cursor-pointer"
				data-splicestartindex={spliceStartIndex}
				onClick={onPlace}
			>
				{label}
			</Button>
		</div>
	)
}

interface TimelineProps {
  events: any[];
  gameId: string | null;
	drawnCard: any | null;
	handleCorrectMove?: any;
	handleIncorrectMove?: any;
	onPlace?: (placement: { after: string | null; before: string | null }) => void;
}

interface PlacementOptionProps {
  spliceStartIndex: number;
  before?: any;
  after?: any;
	drawnCard: any;
  onPlace: any;
}

function sortEventsByDate(events: any[]): any[] {
  return [...events].sort((a, b) => {
		if(a.date < b.date) return -1;
		if(a.date > b.date) return 1;
		return 0;
  });
}

function doNotDoAnything() {
	console.log('nuttin doin')
}

export function Timeline({ events: eventIds, gameId, drawnCard, handleCorrectMove, handleIncorrectMove }: TimelineProps) {
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
      
      // Build cache key using the shared constant from ../constants
      const cacheKey = `${EVENT_CACHE_KEY_PREFIX}${gameId}`;
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

	let correctPosition = -9
	if(drawnCard) {
		console.log('drawnCard.date', drawnCard.date)
		console.log('events[0].date', events[0].date)
		console.log('events[events.length - 1].date', events[events.length - 1].date, events.length - 1)
		// which is the correct position?
		if(drawnCard.date < events[0].date) {
			correctPosition = 0
		} else if(drawnCard.date > events[events.length - 1].date) {
			correctPosition = events.length
		} else {
			events.forEach((event, index) => {
				if(correctPosition === -9) {
					console.log('index', index, event.date)
					if(event.date > drawnCard.date) {
						correctPosition = index
					}
				}
			})
		}
		console.log('correctPosition', correctPosition)
	}

	const onPlace = drawnCard? handleIncorrectMove : doNotDoAnything;

	// so that we can have keys on things, and fewer <>s.
	let items = []
	items.push(
		<PlacementOption key={`po-1`} spliceStartIndex={0} before={events[0]} drawnCard={drawnCard} onPlace={drawnCard && correctPosition === 0 ? handleCorrectMove : onPlace} />
	)

	events.forEach((event, index) => {
		items.push(
			<div 
				key={index} 
				className="timeline-card-container"
			>
				<TimelineCard event={event} index={index} />
			</div>
		)

		items.push(
			<PlacementOption key={`po${index}`} spliceStartIndex={index + 1} before={events[index + 1]} after={events[index]} drawnCard={drawnCard} onPlace={drawnCard && correctPosition === index + 1 ? handleCorrectMove : onPlace} />
		)
	})

	return (
		<div className="timeline space-y-4 overflow-y-auto h-[calc(100vh-53px)] pr-4">
			{items}
		</div>
	)


		// return (
		// 	<>
		// 	{drawnCard?
		// 		index == 0 ? "" : <PlacementOption key={`po${index}`} spliceStartIndex={index} before={events[index]} after={events[index - 1]} onPlace={onPlace} />
		// 		:''}
		// 	<div 
		// 		key={index} 
		// 		className="timeline-card-container"
		// 	>
		// 		<TimelineCard event={event} index={index} />
		// 	</div>
		// 	</>
		// );
	// })}

  // return (
  //   <div className="timeline space-y-4 overflow-y-auto">
	// 		{drawnCard?
	// 			<PlacementOption key={`po0`} spliceStartIndex={0} before={events[0]} onPlace={onPlace} />
	// 			:''}
  //     {events.map((event, index) => {
	// 			// Add extra margin bottom for the card above the gap
  //       return (
	// 				<>
	// 				{drawnCard?
	// 					index == 0 ? "" : <PlacementOption key={`po${index}`} spliceStartIndex={index} before={events[index]} after={events[index - 1]} onPlace={onPlace} />
	// 					:''}
	// 				<div 
	// 					key={index} 
	// 					className="timeline-card-container"
  //         >
  //           <TimelineCard event={event} index={index} />
  //         </div>
	// 				</>
  //       );
  //     })}
	// 		{drawnCard?
	// 			<PlacementOption key={`po${events.length}`} spliceStartIndex={events.length} after={events[events.length - 1]} onPlace={onPlace} />
	// 		:''}
  //   </div>
  // );
}
