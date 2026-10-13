import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "../../../components/ui/button";
import { Loader2, Heart, Flag, MessageSquare, ChevronUp, ChevronDown, Download, Upload } from "lucide-react";
import { Event, Feedback } from "../../../types";
import { formatEventDateForDisplay } from "../../../utils";
import { adminFetch } from "../../../services/adminAuth";
import { DIFFICULTY_LABELS, STATUS_LABELS } from "../../../constants";

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

// Import Input component for search
import { Input } from "../../../components/ui/input";

// Import Checkbox and Label components for difficulty filter
import { Checkbox } from "../../../components/ui/checkbox";
import { Label } from "../../../components/ui/label";


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

  // Search state - regex pattern for filtering events
  const [searchQuery, setSearchQuery] = useState('');

  // Difficulty filter state - array of selected difficulty numbers (1-5)
  // Empty array means all difficulties (no filtering)
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>([]);

  // Status filter state - array of selected status strings
  // Empty array means all statuses (no filtering)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Difficulty levels configuration for rendering checkboxes
  // Maps numeric difficulty values to display labels
  const DIFFICULTY_LEVELS = [
    { value: 1, label: 'Easy' },
    { value: 2, label: 'Elementary' },
    { value: 3, label: 'Secondary' },
    { value: 4, label: 'University' },
    { value: 5, label: 'PhD' },
  ];

  // Status levels configuration for rendering checkboxes
  // Maps status enum values to display labels
  const STATUS_LEVELS = [
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'published', label: 'Published' },
  ];

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

  // ==========================================================================
  // SEARCH & FILTERING LOGIC
  // ==========================================================================

  /**
   * Filter events based on search query, difficulty, and status selection
   * Uses regex for search if valid, falls back to simple string includes
   * Filters by selected difficulty levels and status values if any are selected
   */
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter - if searchQuery is empty, always passes
      let matchesSearch = true;
      if (searchQuery) {
        try {
          const regex = new RegExp(searchQuery, 'i');
          const title = event.title || event.name || '';
          const description = event.description || '';
          matchesSearch = regex.test(title) || regex.test(description);
        } catch (e) {
          const query = searchQuery.toLowerCase();
          const title = (event.title || event.name || '').toLowerCase();
          const description = (event.description || '').toLowerCase();
          matchesSearch = title.includes(query) || description.includes(query);
        }
      }
      
      // Difficulty filter - if no difficulties selected, always passes
      const matchesDifficulty = selectedDifficulties.length === 0 ||
        selectedDifficulties.includes(event.difficulty || 0);
      
      // Status filter - if no statuses selected, always passes
      const matchesStatus = selectedStatuses.length === 0 ||
        selectedStatuses.includes(event.status || '');
      
      return matchesSearch && matchesDifficulty && matchesStatus;
    });
  }, [events, searchQuery, selectedDifficulties, selectedStatuses]);

  // Calculate pagination derived values using useMemo for performance
  // Only recalculates when filteredEvents, currentPage, or itemsPerPage change
  const totalCount = filteredEvents.length;
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
   * For status: maps to numeric priority (published=0, pending=1, rejected=2) for sorting
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
      case 'status':
        // Map status to numeric priority for consistent sorting
        // published first (0), then pending (1), then rejected (2)
        switch (event.status) {
          case 'published': return 0;
          case 'pending': return 1;
          case 'rejected': return 2;
          default: return 3; // unknown status - sort last
        }
      default:
        return null;
    }
  }, [sortBy, getFavoriteCount, getUnresolvedFlagCount]);

  // Sort and slice events array for the current page
  const paginatedEvents = useMemo(() => {
    // Create a copy of filteredEvents to sort
    let sortedEvents = [...filteredEvents];
    
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
  }, [filteredEvents, currentPage, itemsPerPage, sortBy, sortDirection, getSortValue]);

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

  // Handler for search input change
  // Resets to first page when search changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  // ==========================================================================
  // DOWNLOAD & UPLOAD LOGIC
  // ==========================================================================

  // State for upload functionality
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; isError: boolean } | null>(null);

  /**
   * Handler for downloading filtered events as JSON file
   * Uses browser-native Blob URL approach for client-side download
   * Downloads ALL filtered events (not just current page) to match visible data
   */
  const handleDownload = useCallback(() => {
    // Create JSON string from filtered events (all visible events, not just paginated)
    const jsonString = JSON.stringify(filteredEvents, null, 2);
    
    // Create Blob with JSON data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create object URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `events-${new Date().toISOString().split('T')[0]}.json`;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up object URL to free memory
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [filteredEvents]);

  /**
   * Handler for file selection - stores the selected file in state
   * Resets upload status when a new file is selected
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
      setUploadStatus(null);
    }
  }, []);

  /**
   * Handler for uploading JSON file to the API
   * Sends file as multipart/form-data to /admin/events/upload endpoint
   * Validates JSON before sending, but sends the file itself via FormData
   * Expects 204 on success or error messages on failure
   */
  const handleUpload = useCallback(async () => {
    if (!uploadFile) {
      setUploadStatus({ message: 'No file selected', isError: true });
      return;
    }

    try {
      // Validate JSON before sending
      // Read file content and parse to ensure it's valid JSON array
      const fileContent = await uploadFile.text();
      let eventsData;
      try {
        eventsData = JSON.parse(fileContent);
        if (!Array.isArray(eventsData)) {
          throw new Error('JSON root should be an array of events');
        }
      } catch (parseError) {
        setUploadStatus({ 
          message: `Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          isError: true 
        });
        return;
      }

      // Create FormData and append the file
      // Browser will automatically set Content-Type with boundary for multipart/form-data
      const formData = new FormData();
      formData.append('file', uploadFile);

      // Send to API endpoint using multipart/form-data
      const response = await adminFetch('/admin/events/upload', {
        method: 'POST',
        // Do NOT set Content-Type header - browser will set it automatically
        // with the correct boundary parameter for multipart/form-data
        body: formData,
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Upload failed: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If can't parse error response, use status text
          errorMessage = response.statusText || errorMessage;
        }
        setUploadStatus({ message: errorMessage, isError: true });
        return;
      }

      // Success - 204 No Content expected
      setUploadStatus({ message: 'Upload successful (reload)', isError: false });
      setUploadFile(null);
      
      // Clear the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (err) {
      setUploadStatus({ 
        message: `Upload error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        isError: true 
      });
    }
  }, [uploadFile]);

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
			{/* SEARCH INPUT - Filter by title or description */}
			<div className="mb-4">
				<div className="flex items-center gap-2">
					<label htmlFor="search" className="text-sm font-medium whitespace-nowrap">
						Search:
					</label>
					<Input
						id="search"
						type="text"
						placeholder="Title or description (regex supported)"
						value={searchQuery}
						onChange={handleSearchChange}
						className="w-[300px]"
					/>
					{searchQuery && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setSearchQuery('');
								setCurrentPage(1);
							}}
						>
							Clear
						</Button>
					)}
				</div>
			</div>

			{/* DIFFICULTY FILTER - Checkboxes for each difficulty level */}
			<div className="mb-4">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-sm font-medium whitespace-nowrap">Difficulty:</span>
					{DIFFICULTY_LEVELS.map(level => (
						<div key={level.value} className="flex items-center gap-1">
							<Checkbox
								id={`difficulty-${level.value}`}
								checked={selectedDifficulties.includes(level.value)}
								onCheckedChange={(checked) => {
									if (checked) {
										setSelectedDifficulties(prev => [...prev, level.value]);
									} else {
										setSelectedDifficulties(prev => prev.filter(d => d !== level.value));
									}
									setCurrentPage(1);
								}}
							/>
							<Label htmlFor={`difficulty-${level.value}`} className="text-sm">
								{level.label}
							</Label>
						</div>
					))}
					{selectedDifficulties.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setSelectedDifficulties([]);
								setCurrentPage(1);
							}}
						>
							Clear
						</Button>
					)}
				</div>
			</div>

			{/* STATUS FILTER - Checkboxes for each status */}
			<div className="mb-4">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-sm font-medium whitespace-nowrap">Status:</span>
					{STATUS_LEVELS.map(status => (
						<div key={status.value} className="flex items-center gap-1">
							<Checkbox
								id={`status-${status.value}`}
								checked={selectedStatuses.includes(status.value)}
								onCheckedChange={(checked) => {
									if (checked) {
										setSelectedStatuses(prev => [...prev, status.value]);
									} else {
										setSelectedStatuses(prev => prev.filter(s => s !== status.value));
									}
									setCurrentPage(1);
								}}
							/>
							<Label htmlFor={`status-${status.value}`} className="text-sm">
								{status.label}
							</Label>
						</div>
					))}
					{selectedStatuses.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setSelectedStatuses([]);
								setCurrentPage(1);
							}}
						>
							Clear
						</Button>
					)}
				</div>
			</div>

			{/* DOWNLOAD BUTTON - Download all filtered events as JSON */}
			<Button
				variant="outline"
				size="sm"
				onClick={handleDownload}
				disabled={totalCount === 0}
				className="ml-auto"
			>
				<Download className="w-4 h-4 mr-1" />
				Download ({totalCount})
			</Button>
			
			{/* UPLOAD BUTTON & FILE INPUT - Upload JSON file to create events for review */}
			<div className="flex items-center gap-2">
				<input
					type="file"
					id="file-upload"
					accept=".json,application/json"
					onChange={handleFileChange}
					className="hidden"
				/>
				<Button
					variant="outline"
					size="sm"
					onClick={() => document.getElementById('file-upload')?.click()}
				>
					<Upload className="w-4 h-4 mr-1" />
					Upload .json
				</Button>
				{uploadFile && (
					<>
						<span className="text-sm text-muted-foreground">
							{uploadFile.name}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={handleUpload}
						>
							Send to API
						</Button>
					</>
				)}
				{uploadStatus && (
					<span className={`text-sm ${uploadStatus.isError ? 'text-destructive' : 'text-green-500'}`}>
						{uploadStatus.message}
					</span>
				)}
			</div>

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
						{/* Status column - sortable by status */}
						<SortableTableHead column="status" className="w-[100px] text-center">
							Status
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
								{event.difficulty ? DIFFICULTY_LABELS[event.difficulty as keyof typeof DIFFICULTY_LABELS] : "-"}
							</TableCell>
							{/* Status column */}
							<TableCell className="text-center">
								{event.status ? STATUS_LABELS[event.status as keyof typeof STATUS_LABELS] : "-"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{/* PAGINATION CONTROLS - BOTTOM */}
			<PaginationControls />
    </div>
  );
}
