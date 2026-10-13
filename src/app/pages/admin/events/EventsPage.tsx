import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "../../../components/ui/button";
import { Loader2, Heart, Flag, MessageSquare, ChevronUp, ChevronDown } from "lucide-react";
import { Event, Feedback } from "../../../types";
import { formatEventDateForDisplay } from "../../../utils";
import { adminFetch } from "../../../services/adminAuth";

// Import Table components for structured data display
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../../components/ui/table";

// Import Pagination components for navigation
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "../../../components/ui/pagination";

// Import Select components for items per page dropdown
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/select";


export function EventsPage() {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  // currentPage: which page the user is currently viewing (1-indexed)
  // itemsPerPage: how many events to show per page, with options for user selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Sorting state
  // sortBy: which column to sort by (date, difficulty, favorites, unresolved)
  // sortDirection: ascending or descending order
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
   * Get the count of favorite feedbacks for an event
   * Counts all favorite type feedbacks regardless of resolved status
   */
  const getFavoriteCount = useCallback((event: Event) => {
    if (!event.feedbacks) return 0;
    return event.feedbacks.filter((f: Feedback) => f.type === 'favorite').length;
  }, []);

  /**
   * Get the count of unresolved flag feedbacks for an event
   * Counts only flag type feedbacks that are not yet resolved
   */
  const getUnresolvedFlagCount = useCallback((event: Event) => {
    if (!event.feedbacks) return 0;
    return event.feedbacks.filter((f: Feedback) => f.type === 'flag' && !f.isResolved).length;
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
      <div className="flex flex-wrap gap-1">
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

  // ==========================================================================
  // PAGINATION LOGIC
  // ==========================================================================

  // useEffect: fetch all events on component mount
  // No dependencies array means this runs once when component mounts
  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        // Fetch all events with feedbacks included
        // Currently client-side pagination; could be changed to server-side
        // by adding &page=${currentPage}&limit=${itemsPerPage} if backend supports it
        const response = await adminFetch('/admin/events/?includeFeedbacks=true');
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const data = await response.json();
        setEvents(data.events);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Failed to fetch events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllEvents();
  }, []);

  // Calculate pagination derived values using useMemo for performance
  // Only recalculates when events, currentPage, or itemsPerPage change
  const totalCount = events.length;
  const totalPages = useMemo(() => Math.ceil(totalCount / itemsPerPage), [totalCount, itemsPerPage]);

  // ==========================================================================
  // SORTING LOGIC
  // ==========================================================================

  /**
   * Handler for changing the sort column
   * If clicking the same column, toggles direction
   * If clicking a different column, sorts ascending by default
   */
  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      // Toggle direction if clicking the same column
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Sort ascending by default when clicking a new column
      setSortBy(column);
      setSortDirection('asc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  }, [sortBy]);

  /**
   * Get the sort value for an event based on the current sort column
   * Returns a comparable value for sorting
   */
  const getSortValue = useCallback((event: Event): number | Date | null => {
    switch (sortBy) {
      case 'date':
				if( ! event.dateSortIndex) {
					if (typeof event.dateBCE === 'number' && event.dateBCE < 0) {
						// dateBCE is negative: -500 = 500 BCE, -1000 = 1000 BCE
						// Multiply by large factor to ensure BCE dates sort before CE dates
						// More negative dateBCE = earlier date = more negative result
						event.dateSortIndex = event.dateBCE * 10_000_000_000_000;
					} else if (event.date) {
						console.log(event.date, typeof event.date)
						event.dateSortIndex = new Date(event.date).getTime();
					} else {
						event.dateSortIndex = Infinity; // No date - sort last
					}
					console.log('event.dateSortIndex', event.dateSortIndex)
				}

				return event.dateSortIndex;
      case 'difficulty':
        return event.difficulty || 0;
      case 'favorites':
        return getFavoriteCount(event);
      case 'unresolved':
        return getUnresolvedFlagCount(event);
      default:
        return null;
    }
  }, [sortBy, getFavoriteCount, getUnresolvedFlagCount]);

  // Sort and slice events array for the current page
  const paginatedEvents = useMemo(() => {
    // Create a copy of events to sort
    let sortedEvents = [...events];
    
    // Sort if a sort column is selected
    if (sortBy) {
      sortedEvents.sort((a, b) => {
        const aVal = getSortValue(a);
        const bVal = getSortValue(b);
        
        // Handle null values (events without the field)
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1; // nulls last
        if (bVal === null) return -1; // nulls last
        
        // Compare values
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // For Date objects, convert to timestamp for comparison
        if (aVal instanceof Date && bVal instanceof Date) {
          const aTime = aVal.getTime();
          const bTime = bVal.getTime();
          return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
        }
        
        return 0;
      });
    }
    
    // Slice for pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [events, currentPage, itemsPerPage, sortBy, sortDirection, getSortValue]);

  // Handler for changing the current page
  // Ensures page stays within valid range (1 to totalPages)
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Handler for going to next page
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, totalPages]);

  // Handler for going to previous page
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  // Handler for changing items per page
  // Resets to first page to avoid showing empty results
  const handleItemsPerPageChange = useCallback((value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }, []);

  // ==========================================================================
  // SORTABLE TABLE HEADER COMPONENT
  // ==========================================================================

  /**
   * SortableTableHead component - a table header that can be clicked to sort
   * Shows sort direction indicator when active
   */
  const SortableTableHead = ({ 
    column, 
    children, 
    className = ""
  }: { 
    column: string;
    children: React.ReactNode;
    className?: string;
  }) => {
    const isSorted = sortBy === column;
    return (
      <TableHead 
        className={`cursor-pointer select-none ${className}`}
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center justify-center gap-1">
          {children}
          {isSorted && (
            sortDirection === 'asc' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )
          )}
        </div>
      </TableHead>
    );
  };

  // ==========================================================================
  // PAGINATION CONTROLS COMPONENT
  // Reusable component for top and bottom of the table
  // ==========================================================================

  /**
   * PaginationControls component - displays pagination info and navigation
   * Shows: items per page selector, showing X-Y of Z, and page navigation buttons
   */
  const PaginationControls = () => (
    <div className="flex items-center justify-between py-2">
      {/* Left side: Items per page selector and showing info */}
      <div className="flex items-center gap-4 grow-0 whitespace-nowrap">
        <span className="text-sm text-muted-foreground">
          Showing {totalCount === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm">Per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right side: Page navigation buttons */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={goToPreviousPage}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="text-sm px-2">
              Page {currentPage} of {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={goToNextPage}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );

  // ==========================================================================
  // LOADING AND ERROR STATES
  // ==========================================================================

  // Show loading spinner while events are being fetched
  if (isLoading) return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-3">Loading events...</span>
    </div>
  );

  // Show error message if fetching failed
  if (error) return (
    <div className="text-center p-8">
      <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Events</h2>
      <p className="text-muted-foreground mb-4">{error}</p>
      <Button onClick={() => window.location.reload()}>Retry</Button>
    </div>
  );

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Events</h1>
        <span className="text-muted-foreground">{totalCount} total</span>
      </div>
      {totalCount === 0 ? (
        // Show message if no events exist
        <p className="text-muted-foreground text-center py-8">No events found.</p>
      ) : (
        <>
          {/* PAGINATION CONTROLS - TOP */}
          <PaginationControls />

          {/* TABLE - Displays paginated events */}
          <Table>
            <TableHeader>
              <TableRow>
                {/* Date column - sortable by date */}
                <SortableTableHead column="date" className="w-[120px]">
                  Date
                </SortableTableHead>
                {/* Title column - NOT sortable per user request */}
                <TableHead>Title</TableHead>
                {/* Description column - NOT sortable per user request */}
                <TableHead>Description</TableHead>
                {/* Favorites column - sortable by favorite count */}
                <SortableTableHead column="favorites" className="w-[80px] text-center">
                  Favorites
                </SortableTableHead>
                {/* Unresolved column - sortable by unresolved flag count */}
                <SortableTableHead column="unresolved" className="w-[80px] text-center">
                  Unresolved
                </SortableTableHead>
                {/* Difficulty column - sortable by difficulty rating */}
                <SortableTableHead column="difficulty" className="w-[80px] text-center">
                  Difficulty
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEvents.map((event) => (
                // Make entire row clickable to open edit page in new tab
                <TableRow 
                  key={event._id}
                  onClick={() => window.open(`/admin/events/edit/${event._id}`, '_blank')}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {/* Date column */}
                  <TableCell>
                    {event.date || event.dateBCE ? (
                      <span className="text-sm text-muted-foreground">
												{/* {event.dateSortIndex} | 
												{event.dateBCE} | 
												{event.date} |  */}
                        {formatEventDateForDisplay(event)}
                      </span>
                    ) : (
                      <span className="text-destructive">NO DATE</span>
                    )}
                  </TableCell>
                  
                  {/* Title column */}
                  <TableCell className="font-medium">
                    {event.title || event.name || event._id}
                  </TableCell>
                  
                  {/* Description column - truncated to prevent overflow */}
                  <TableCell className="max-w-[300px] truncate">
                    {event.description || "-"}
                  </TableCell>
                  
                  {/* Favorites column - shows count of favorite feedbacks */}
                  <TableCell className="text-center">
                    {getFavoriteCount(event) > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        <span>{getFavoriteCount(event)}</span>
                      </div>
                    ) : "-"}
                  </TableCell>
                  
                  {/* Unresolved column - shows count of unresolved flag feedbacks */}
                  <TableCell className="text-center">
                    {getUnresolvedFlagCount(event) > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        <Flag className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span>{getUnresolvedFlagCount(event)}</span>
                      </div>
                    ) : "-"}
                  </TableCell>
                  
                  {/* Difficulty column */}
                  <TableCell className="text-center">
                    {event.difficulty ? `${event.difficulty}/5` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* PAGINATION CONTROLS - BOTTOM */}
          <PaginationControls />
        </>
      )}
    </div>
  );
}
