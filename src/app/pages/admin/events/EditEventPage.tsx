import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, Check, Loader2, X, Calendar, Heart, Flag, MessageSquare } from "lucide-react";
import { Event, Feedback } from "../../../types";
import { TagPicker, DatePicker, TimePicker } from 'rsuite';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";


interface TagOption {
  label: string;
  value: string;
}

// Date precision options for the dropdown
const DATE_PRECISION_OPTIONS = [
	{ value: "minute", label: "Minute" },
	{ value: "hour", label: "Hour" },
	{ value: "day", label: "Day" },
	{ value: "month", label: "Month" },
	{ value: "year", label: "Year" },
	{ value: "decade", label: "Decade" },
	{ value: "century", label: "Century" },
	{ value: "millennium", label: "Millennium" },
	{ value: "million-years", label: "Million Years" },
	{ value: "exact", label: "Exact" }
];

const DIFFICULTY_OPTIONS = [
  { value: "1", label: "Primary/Elementary" },
  { value: "2", label: "Intermediate" },
  { value: "3", label: "Secondary/High School" },
  { value: "4", label: "University" },
  { value: "5", label: "PhD" }
];

/**
 * EditEventPage - Admin page for editing a single event
 * 
 * This page allows editing of event fields:
 * - title
 * - description
 * - tags
 * - date precision
 * - date (CE)
 * - dateBCE
 * 
 * Features:
 * - Fetches event data from API on mount
 * - Saves field changes on blur (PATCH to /events/:id)
 * - Shows save status with ProcessIndicator
 * - Navigates back to events list
 * - Displays and manages feedbacks for the event (toggle resolved state)
 */
export function EditEventPage() {

	
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	
	// Event data state
	const [event, setEvent] = useState<Event | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	
	// Save status for each field
	const [saveStatus, setSaveStatus] = useState<{
		title: 'idle' | 'saving' | 'success' | 'error';
		description: 'idle' | 'saving' | 'success' | 'error';
		tags: 'idle' | 'saving' | 'success' | 'error';
		datePrecision: 'idle' | 'saving' | 'success' | 'error';
		date: 'idle' | 'saving' | 'success' | 'error';
		dateBCE: 'idle' | 'saving' | 'success' | 'error';
		difficulty: 'idle' | 'saving' | 'success' | 'error';
	}>({
		title: 'idle',
		description: 'idle',
		tags: 'idle',
		datePrecision: 'idle',
		date: 'idle',
		dateBCE: 'idle',
		difficulty: 'idle',
	});
	
	// Original values for change detection
	const [originalValues, setOriginalValues] = useState<{
		title: string;
		description: string;
		tags: string[];
		datePrecision: string;
		date: Date | null;  // Changed from string
		dateBCE: number;
		difficulty: number;
	}>({
		title: '',
		description: '',
		tags: [],
		datePrecision: 'year',
		date: null,
		dateBCE: 0,
		difficulty: 3
	});

	// State for rsuite TagPicker
	const [tagOptions, setTagOptions] = useState<TagOption[]>([]);

	// Load rsuite CSS dynamically for future date picker
	useEffect(() => {
		import('rsuite/dist/rsuite.min.css');
	}, []);

	// Fetch event data on mount
	useEffect(() => {
		const fetchEvent = async () => {
			try {
				const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
				const response = await fetch(`${apiUrl}/events/${id}/edit`);
				if (!response.ok) {
					throw new Error('Event not found');
				}
				let data = await response.json();

				data.event.date = data.event.date ? new Date(data.event.date) : null;
				console.log('aha?', typeof new Date(data.event.date))
				console.log('data.event.date', typeof data.event.date, data.event.date)

				console.log('response with Date obj', data)

				data.event.feedbacks = data.feedbacks; // the api/db treats them as separate elements, but on this side, i'm putting feedbacks as a subobject.
				
				// Normalize tags to array of strings (data.event.tags may contain objects with _id)
				const normalizedTags = Array.isArray(data.event.tags)
					? data.event.tags.map(tag => (typeof tag === 'string' ? tag : tag._id)).filter(Boolean)
					: [];
				
				// Set event with normalized tags
				setEvent({ ...data.event, tags: normalizedTags });
				
				setOriginalValues({
					title: data.event.title || '',
					description: data.event.description || '',
					tags: normalizedTags,
					datePrecision: data.event.datePrecision || 'year',
					date: data.event.date || '',
					dateBCE: data.event.dateBCE || 0,
					difficulty: data.event.difficulty || 3,
				});
				
				// Pre-populate tagOptions with proper label/value pairs
				if (data.event.tags?.length > 0) {
					const initialOptions = data.event.tags.map((tag) => {
						const tagId = typeof tag === 'string' ? tag : tag._id;
						const tagName = typeof tag === 'string' ? tag : tag.name || tagId;
						return { value: tagId, label: tagName };
					}).filter(Boolean);
					setTagOptions(initialOptions);
				}
			} catch (err) {
				alert('Failed to load event: ' + (err instanceof Error ? err.message : String(err)));
				navigate('/admin/events');
			} finally {
				setIsLoading(false);
			}
		};
		fetchEvent();
	}, [id, navigate]);


	/**
	 * Save a single field to the API via PATCH
	 * Only updates if the value has changed from the original
	 */
	const saveField = async (field: 'title' | 'description' | 'tags' | 'datePrecision' | 'date' | 'dateBCE', value: string | string[] | number | Date) => {
		// Check if value actually changed (use JSON.stringify for array comparison)
		const originalValue = originalValues[field];
		const stringifiedValue = JSON.stringify(value);
		const stringifiedOriginal = JSON.stringify(originalValue);
		
		if (stringifiedValue === stringifiedOriginal) {
			return;
		}
		
		setSaveStatus(prev => ({ ...prev, [field]: 'saving' }));
		
		try {
			const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
			const payload: Record<string, any> = {
				[field]: value
			};
			
			const response = await fetch(`${apiUrl}/events/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});
			
			if (!response.ok) {
				throw new Error(await response.text());
			}
			
			// Update original values and event state on success
			// but first, if it is the date, parse to a date obj
			if(field === 'date' && value) {
				value = new Date(value)
			}
			setOriginalValues(prev => ({ ...prev, [field]: value }));
			setEvent(prev => ({ ...prev!, [field]: value }));
			setSaveStatus(prev => ({ ...prev, [field]: 'success' }));
			
			// Clear success status after 8 seconds
			setTimeout(() => {
				setSaveStatus(prev => ({ ...prev, [field]: 'idle' }));
			}, 8000);
		} catch (err) {
			setSaveStatus(prev => ({ ...prev, [field]: 'error' }));
			alert('Failed to save: ' + (err instanceof Error ? err.message : String(err)));
		}
	};


	const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		saveField('title', e.target.value);
	};

	const handleDescriptionBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
		saveField('description', e.target.value);
	};

	const handleDifficultyBlur = () => {
		if (event) {
			saveField('difficulty', event.difficulty);
		}
	};

	const handleDatePrecisionChange = (newValue: string) => {
		saveField('datePrecision', newValue);
	};

	/**
	 * Handle date picker change - called when user selects a date
	 */
	const handleDateChange = (newDate: Date | null) => {
		if (newDate) {
			saveField('date', newDate); // Store full Date with time
		}
	};

	/**
	 * Handle BCE date input change
	 * Only allows negative numbers (digits with optional minus sign)
	 */
	const handleDateBCEChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value;
		// Only allow digits and optional leading minus sign
		const sanitized = rawValue.replace(/[^\d-]/g, '');
		// Ensure it's a valid negative number or empty
		const finalValue = sanitized === '-' ? '' : sanitized;
		
		const numericValue = finalValue === '' ? 0 : parseInt(finalValue, 10);
		
		// Update local state immediately for responsiveness
		setEvent(prev => prev ? { ...prev, dateBCE: numericValue } : null);
		
		// Save to API on blur (handled by handleDateBCEBlur)
	};

	const handleDateBCEBlur = () => {
		if (event) {
			saveField('dateBCE', event.dateBCE);
		}
	};

	/**
	 * Load tag options from API based on search query
	 * Called by TagPicker when user types in the search box
	 * Merges search results with currently selected tags to preserve their labels
	 */
	const loadTagOptions = async (searchQuery: string) => {
		if (searchQuery.length < 3) return;
		
		try {
			const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
			const response = await fetch(`${apiUrl}/tags?q=${encodeURIComponent(searchQuery)}`);
			if (response.ok) {
				const tags = await response.json();
				const searchOptions = tags.map((tag: { _id: string; name: string }) => ({
					label: tag.name,
					value: tag._id
				}));
				
				// Merge with currently selected tags to preserve their labels
				const selectedTagIds = event?.tags || [];
				const existingOptions = tagOptions.filter(opt =>
					selectedTagIds.includes(opt.value)
				);
				
				// Combine existing selected + new search results, then deduplicate
				const mergedOptions = [...existingOptions, ...searchOptions];
				const uniqueOptions = Array.from(
					new Map(mergedOptions.map(opt => [opt.value, opt])).values()
				);
				setTagOptions(uniqueOptions);
			}
		} catch (err) {
			console.error('Failed to load tag options:', err);
		}
	};

	/**
	 * Handle change in tag selection
	 * Called by TagPicker when user selects/deselects tags
	 */
	const handleTagsChange = (newTagIds: string[]) => {
		// Save tags on change (TagPicker triggers onChange on selection)
		saveField('tags', newTagIds);
	};

	// ==========================================================================
	// FEEDBACK HELPER FUNCTIONS
	// ==========================================================================

	/**
	 * Extract player name from feedback object safely
	 * Handles multiple possible formats: player.username, playerName, or player as string
	 * Falls back to 'Unknown' if no name can be determined
	 */
	const getPlayerName = (feedback: Feedback): string => {
		// Try player object with username first
		if (typeof feedback.player === 'object' && feedback.player?.username) {
			return feedback.player.username;
		}
		// Try direct playerName field
		if (feedback.playerName) {
			return feedback.playerName;
		}
		// Try player as string ID
		if (typeof feedback.player === 'string') {
			return feedback.player;
		}
		// Fallback
		return 'Unknown';
	};

	/**
	 * Format ISO date string with date and time for display
	 * Example: "Sep 4, 2026, 3:42 PM"
	 */
	const formatDateWithTime = (isoString: string): string => {
		try {
			const date = new Date(isoString);
			return date.toLocaleString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch {
			// If date parsing fails, return the raw string
			return isoString;
		}
	};

	const formatDateLabel = (dateObj: Date | null, datePrecision: string): string => {
		if (!dateObj) return 'CE';

		switch (datePrecision) {
			case 'exact':
			case 'minute':
				return dateObj.toLocaleString('en-US', {
					year: 'numeric', month: 'long', day: 'numeric',
					hour: '2-digit', minute: '2-digit'
				});
			case 'hour':
				return dateObj.toLocaleString('en-US', {
					year: 'numeric', month: 'long', day: 'numeric',
					hour: '2-digit'
				});
			case 'day':
				return dateObj.toLocaleDateString('en-US', {
					year: 'numeric', month: 'long', day: 'numeric'
				});
			case 'month':
				return dateObj.toLocaleDateString('en-US', {
					year: 'numeric', month: 'long'
				});
			default: // year, decade, century, millennium, million-years
				return String(dateObj.getFullYear());
		}
	};

	/**
	 * Get user-friendly label for feedback type
	 * Converts lowercase type strings to capitalized display names
	 */
	const getFeedbackTypeLabel = (type: string): string => {
		switch (type) {
			case 'flag': return 'Flag';
			case 'favorite': return 'Favorite';
			case 'comment': return 'Comment';
			default: return type.charAt(0).toUpperCase() + type.slice(1);
		}
	};

	/**
	 * Get the appropriate Lucide icon for a feedback type
	 * Returns the icon component for display
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
	 * Get sorted feedbacks for display
	 * Sort order: unresolved first, then by player name, then by createdAt (oldest first)
	 */
	const getSortedFeedbacks = (): Feedback[] => {
		if (!event?.feedbacks) return [];
		
		return [...event.feedbacks].sort((a, b) => {
			// Sort by isResolved: unresolved (false) comes before resolved (true)
			if (a.isResolved !== b.isResolved) {
				return a.isResolved ? 1 : -1;
			}
			// Then by player name
			const nameA = getPlayerName(a);
			const nameB = getPlayerName(b);
			if (nameA < nameB) return -1;
			if (nameA > nameB) return 1;
			// Then by createdAt chronologically (oldest first)
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		});
	};

	/**
	 * Get information about favorite feedbacks for this event
	 * Returns count and alphabetized list of player names
	 */
	const getFavoriteInfo = (): { count: number; players: string[] } => {
		const favorites = (event?.feedbacks || []).filter(f => f.type === 'favorite');
		// Use Set to ensure unique player names, then sort alphabetically
		const players = [...new Set(favorites.map(f => getPlayerName(f)))].sort();
		return { count: favorites.length, players };
	};
	
	/**
	 * Get sorted feedbacks excluding favorites
	 */
	const getNonFavoriteFeedbacks = (): Feedback[] => {
		return getSortedFeedbacks().filter(f => f.type !== 'favorite');
	};

	/**
	 * Toggle the resolved state of a feedback
	 * Sends PATCH request to /feedbacks/:id with new isResolved value
	 * Updates local state on success
	 */
	const toggleFeedbackResolved = async (feedback: Feedback) => {
		try {
			const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
			const newResolvedState = !feedback.isResolved;
			
			const response = await fetch(`${apiUrl}/feedbacks/${feedback._id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ isResolved: newResolvedState }),
			});
			
			if (response.status === 404) {
				throw new Error('Feedback not found');
			}
			if (!response.ok && response.status !== 204) {
				throw new Error('Failed to update feedback');
			}
			
			// Update local state: toggle the isResolved for this feedback
			setEvent(prev => {
				if (!prev) return prev;
				const updatedFeedbacks = (prev.feedbacks || []).map(f =>
					f._id === feedback._id ? { ...f, isResolved: newResolvedState } : f
				);
				return { ...prev, feedbacks: updatedFeedbacks };
			});
		} catch (err) {
			alert('Failed to update feedback: ' + (err instanceof Error ? err.message : String(err)));
		}
	};


	/**
	 * ProcessIndicator - Shows save status at top-right of page
	 * Displays spinner when saving, checkmark on success, X on error
	 */
	function ProcessIndicator({ status }: { status: 'idle' | 'saving' | 'success' | 'error' }) {
		if (status === 'idle') return null;
		
		return (
			<div className="absolute top-8 right-4">
				{status === 'saving' && (
					<Loader2 className="h-5 w-5 animate-spin text-primary" />
				)}
				{status === 'success' && (
					<Check className="h-5 w-5 text-green-500" />
				)}
				{status === 'error' && (
					<X className="h-5 w-5 text-red-500" />
				)}
			</div>
		);
	}


	// Show loading state
	if (isLoading) {
		return (
			<div className="p-8">
				<Loader2 className="h-8 w-8 animate-spin mx-auto" />
			</div>
		);
	}

	// Show error state if event not found
	if (!event) {
		return <div className="p-8">Event not found</div>;
	}

	console.log('event needed', event)

	return (
		<div className="max-w-2xl mx-auto p-2 space-y-6 relative">
			{/* Process indicators - show if any field is not idle */}
			{Object.values(saveStatus).some(s => s !== 'idle') && (
				<ProcessIndicator 
					status={Object.values(saveStatus).find(s => s !== 'idle') || 'idle'} 
				/>
			)}
			
			{/* Back button */}
			<Button variant="ghost" onClick={() => navigate('/admin/events')} className="gap-2">
				<ArrowLeft className="h-4 w-4" />
				Back to Events
			</Button>
			
			{/* Title */}
			<h1 className="text-3xl font-bold">Edit Event</h1>
			
			{/* Form Card */}
			<Card className="p-6 space-y-4">

				{/* Date fields - BCE input and CE date picker side by side */}
				<div className="space-y-2">
					<Label>Date</Label>
					<div className="flex items-center gap-4">
						{/* BCE Date Input - left side, digits only (negative numbers) */}
						{event.dateBCE && (

							<div className="flex-1">
							<Label className="text-sm font-normal text-muted-foreground">BCE (positive integer)</Label>
							<Input
								type="text"
								value={event.dateBCE && event.dateBCE !== 0 ? String(event.dateBCE) : ''}
								onChange={handleDateBCEChange}
								onBlur={handleDateBCEBlur}
								placeholder="Year BCE"
								className="mt-1"
								/>
							</div>
						)}
						
						{/* CE Date Picker - right side, calendar picker */}
						<div className="flex-1">
						<Label className="text-sm font-normal text-muted-foreground">
							{event.date ? formatDateLabel(event.date, event.datePrecision) : 'CE'}
						</Label>
							{['hour', 'minute', 'exact'].includes(event.datePrecision) ? (
								<div className="flex gap-2">
									<DatePicker
										value={event.date ? event.date : null}
										onChange={handleDateChange}
										format="yyyy-MM-dd"
										className="mt-1"
									/>
									<TimePicker
										value={event.date ? event.date : null}
										onChange={handleDateChange}
										format="HH:mm"
										className="mt-1"
									/>
								</div>
							) : (
								<DatePicker
									value={event.date ? event.date : null}
									onChange={handleDateChange}
									format="yyyy-MM-dd"
									className="mt-1 w-full"
									placeholder="Select CE date"
								/>
							)}
						</div>
					</div>
				</div>


				{/* Title Field */}
				<div className="space-y-2">
					<Label>Title</Label>
					<Input
						type="text"
						value={event.title || ''}
						onChange={(e) => setEvent({ ...event, title: e.target.value })}
						onBlur={handleTitleBlur}
						placeholder="Event title"
						onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
					/>
				</div>
				
				{/* Description Field */}
				<div className="space-y-2">
					<Label>Description</Label>
					<Textarea
						value={event.description || ''}
						onChange={(e) => setEvent({ ...event, description: e.target.value })}
						onBlur={handleDescriptionBlur}
						placeholder="Event description (optional)"
						rows={5}
					/>
				</div>
				
				{/* Tags Field - rsuite TagPicker for selecting multiple tags */}
				<div className="space-y-2">
					<Label>Tags (optional)</Label>
					<TagPicker
						data={tagOptions}
						// value is an array of tag IDs
						value={event.tags?.map(tag => typeof tag === 'string' ? tag : tag._id) || []}
						onSearch={loadTagOptions}
						onChange={handleTagsChange}
						placeholder="Start typing to add tags..."
						multiple
					/>
				</div>

				{/* Difficulty Field */}
				<div className="space-y-2">
					<Label>Difficulty (for someone educated in COUNTRY_TAG)</Label>
					<Select
						value={String(event.difficulty || 3)}
						onValueChange={(value) => setEvent({ ...event!, difficulty: parseInt(value, 10) })}
					>
						<SelectTrigger className="w-full" onBlur={handleDifficultyBlur}>
							<SelectValue placeholder="Select difficulty" />
						</SelectTrigger>
						<SelectContent>
							{DIFFICULTY_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				
				{/* Date Precision Field - dropdown for selecting precision level */}
				<div className="space-y-2">
					<Label>Date Precision</Label>
					<Select
						value={event.datePrecision || 'year'}
						onValueChange={handleDatePrecisionChange}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select precision" />
						</SelectTrigger>
						<SelectContent>
							{DATE_PRECISION_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				
			</Card>

			{/* ======================================================================== */}
			{/* FEEDBACK SECTION - Display all feedbacks for this event */}
			{/* ======================================================================== */}
			<Card className="p-6 space-y-4 relative">
				<h2 className="text-xl font-semibold">Feedback</h2>

				{/* Favorite count badge at top right */}
				{getFavoriteInfo().count > 0 && (
					<div className="absolute top-8 right-6 flex items-center gap-1 text-pink-500" title={getFavoriteInfo().players.join(', ')}>
						<Heart className="h-5 w-5" />
						<span>
							{getFavoriteInfo().count}
						</span>
					</div>
				)}
				
				{/* Filtered feedback list - excludes favorites */}
				{getNonFavoriteFeedbacks().length === 0 ? (
					<p className="text-muted-foreground text-center py-4">
						{getFavoriteInfo().count > 0 ? 'No non-favorite feedbacks for this event.' : 'No feedbacks for this event.'}
					</p>
				) : (
					<div className="space-y-3">
						{getNonFavoriteFeedbacks().map((feedback) => {
							const Icon = getFeedbackIcon(feedback.type);
							const typeLabel = getFeedbackTypeLabel(feedback.type);
							const playerName = getPlayerName(feedback);
							const displayDate = formatDateWithTime(feedback.createdAt);
							
							return (
								<div 
									key={feedback._id} 
									className={`p-4 rounded-lg border ${
										feedback.isResolved 
											? 'bg-muted/50 border-muted-foreground/20 opacity-60' 
											: 'bg-background border-border'
									}`}
								>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											{/* Header row: Icon, type, player name, date */}
											<div className="flex items-center gap-2 mb-1 flex-wrap">
												<Icon className="w-4 h-4 text-muted-foreground" />
												<span className="font-medium">{typeLabel}</span>
												<span className="text-muted-foreground">from {playerName}</span>
												<span className="text-muted-foreground text-sm">{displayDate}</span>
											</div>
											
											{/* Reason - always displayed when it exists */}
											{feedback.reason && (
												<div className="text-sm mt-1">
													<span className="text-muted-foreground">Reason: </span>
													{feedback.reason}
												</div>
											)}
											
											{/* Comment - displayed if it exists */}
											{feedback.text && (
												<div className="text-sm mt-1">
													<span className="text-muted-foreground">Comment: </span>
													{feedback.text}
												</div>
											)}
										</div>
										
										{/* Resolved toggle button */}
										<Button
											variant="outline"
											size="sm"
											onClick={() => toggleFeedbackResolved(feedback)}
											className="ml-4 whitespace-nowrap shrink-0"
										>
											{feedback.isResolved ? 'Mark Unresolved' : 'Mark Resolved'}
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</Card>
		</div>
	);
}
