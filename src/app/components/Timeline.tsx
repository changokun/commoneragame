import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { EVENT_CACHE_KEY_PREFIX } from "../constants";
import { formatEventDateForComparison } from "../utils";
import { EventCard } from "./EventCard";
import { Event } from "../types";

// interface TimelineCardProps {
//   event: any;
//   index: number;
// 	isNew?: boolean;
// }

function PlacementOption({ spliceStartIndex, before, after, drawnCard, onPlace }: PlacementOptionProps) {
	const b = before ? formatEventDateForComparison(before) : null
	const a = after ? formatEventDateForComparison(after) : null
	
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
		<div className="snapper">
			<Button
				variant={drawnCard ? "secondary" : "outline"}
				size="lg"
				className={`w-full justify-start transition-none ${drawnCard ? "opacity-100 cursor-pointer" : "opacity-20 pointer-events-none text-muted-foreground/50"}`}
				data-splicestartindex={spliceStartIndex}
				onClick={() => onPlace({ a, b })}
				tabIndex={drawnCard ? 0 : -1}
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
	newlyPlacedId?: string | null;
	onPlace?: (placement: { after: string | null; before: string | null }) => void;
	allExpanded: boolean | null;
	onExpandChange: (expanded: boolean, id: string) => void;
}

interface PlacementOptionProps {
  spliceStartIndex: number;
  before?: any;
  after?: any;
	drawnCard: any;
  onPlace: (placement: { a: string; b: string }) => void; 
}

function sortEventsByDate(events: Event[]): Event[] {
  return events.sort((a, b) => {
		if(a.dateBCE && b.dateBCE) {
			// todo still ignoring months/days
			if(a.dateBCE < b.dateBCE) return -1;
			if(a.dateBCE > b.dateBCE) return 1;
			return 0;
		} else if(a.dateBCE && ! b.dateBCE) {
			return -1
		} else if(!a.dateBCE && b.dateBCE) {
			return 1
		}
		if(a.date < b.date) return -1;
		if(a.date > b.date) return 1;
		return 0;
  });
}

function doNotDoAnything() {
	console.log('nuttin doin')
}

export function Timeline({ events: eventIds, gameId, drawnCard, handleCorrectMove, handleIncorrectMove, newlyPlacedId, allExpanded, onExpandChange }: TimelineProps) {
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

	let correctPosition = -9 // known wrong. valid values are 0 and up
	if(drawnCard) {
		// console.log('events[0].date', events[0].date)
		// console.log('events[events.length - 1].date', events[events.length - 1].date, events.length - 1)
		// which is the correct position?
		if(drawnCard.dateBCE) {
			// BCE
			console.log('drawnCard.dateBCE must be BCE', drawnCard.date)
			// todo - dates BCE can still have months/days stored in an arbitrary year in the event.date.
			if(! events[0].dateBCE || drawnCard.dateBCE < events[0].dateBCE) {
				correctPosition = 0
			} else if(events[events.length - 1].dateBCE && drawnCard.dateBCE > events[events.length - 1].dateBCE) {
				correctPosition = events.length
			} else {
				events.forEach((event, index) => {
					if(correctPosition === -9) { // still not set
						console.log('index', index, event.dateBCE)
						if(event.dateBCE && event.dateBCE > drawnCard.dateBCE) {
							correctPosition = index
						}
					}
				})
			}
		} else {
			// CE
			console.log('drawnCard.date must be CE', drawnCard.date)
			if(events[0].date && drawnCard.date < events[0].date) {
				correctPosition = 0
			} else if(events[events.length - 1].date && drawnCard.date > events[events.length - 1].date) {
				correctPosition = events.length
			} else {
				events.forEach((event, index) => {
					if(correctPosition === -9) { // still not set
						console.log('index', index, event.date)
						if(event.date && event.date > drawnCard.date) {
							correctPosition = index
						}
					}
				})
			}
		}
		console.log('correctPosition', correctPosition)
	}

	const onPlace = drawnCard? handleIncorrectMove : doNotDoAnything;

	// so that we can have keys on things, and fewer <>s.
	let items = []

	
	// add one more timeline card container with no content, to help with scroll positions.
	items.push(
		<div 
			key={999991} 
			className="timeline-card-container min-h-screen"
		>
			
		</div>
	)

	
	items.push(
		<PlacementOption key={`po-1`} spliceStartIndex={0} before={events[0]} drawnCard={drawnCard} onPlace={drawnCard && correctPosition === 0 ? handleCorrectMove : onPlace} />
	)

	events.forEach((event, index) => {
		// const isNew = event._id === newlyPlacedId;
		items.push(
			// <div
			// 	key={index}
			// 	className="timeline-card-container relative"
			// >
			<EventCard
				key={index}
				variant="timeline"
				event={event}
				isNewlyPlaced={newlyPlacedId === event._id}
				allExpanded={allExpanded}
				onExpandChange={onExpandChange}
			/>
			// </div>
		)
		
		items.push(
			<PlacementOption key={`po${index}`} spliceStartIndex={index + 1} before={events[index + 1]} after={events[index]} drawnCard={drawnCard} onPlace={drawnCard && correctPosition === index + 1 ? handleCorrectMove : onPlace} />
		)
	})
	
	// add one more timeline card container with no content, to help with scroll positions.
	items.push(
		<div 
			key={999919} 
			className="timeline-card-container min-h-screen"
		>
			
		</div>
	)

	return (
		// the height on this seems to be unimportant, but we may want it if we add a fixed footer.
		// h-[calc(100vh-53px)]
		<div className="timeline space-y-4 overflow-y-auto px-4">
			{items}
		</div>
	)

}
