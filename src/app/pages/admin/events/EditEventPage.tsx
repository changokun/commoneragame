import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, Check, Loader2, X, Calendar } from "lucide-react";
import { Event } from "../../../types";
import { TagPicker, DatePicker } from 'rsuite';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";


interface TagOption {
  label: string;
  value: string;
}

// Date precision options for the dropdown
const DATE_PRECISION_OPTIONS = [
  { value: "year", label: "Year" },
  { value: "decade", label: "Decade" },
  { value: "century", label: "Century" },
  { value: "millennium", label: "Millennium" },
];



/**
 * EditEventPage - Admin page for editing a single event
 * 
 * This page allows editing of event fields:
 * - title
 * - description
 * 
 * Features:
 * - Fetches event data from API on mount
 * - Saves field changes on blur (PATCH to /events/:id)
 * - Shows save status with ProcessIndicator
 * - Navigates back to events list
 * 
 * Future: date/dateBCE editing will be added
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
	}>({
		title: 'idle',
		description: 'idle',
		tags: 'idle',
		datePrecision: 'idle',
		date: 'idle',
		dateBCE: 'idle',
	});
	
	// Original values for change detection
	const [originalValues, setOriginalValues] = useState<{
		title: string;
		description: string;
		tags: string[];
		datePrecision: string;
		date: string;
		dateBCE: number;
	}>({ title: '', description: '', tags: [], datePrecision: 'year', date: '', dateBCE: 0 });

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
				const data = await response.json();
				console.log('response', data)
				
				// Normalize tags to array of strings (data.tags may contain objects with _id)
				const normalizedTags = Array.isArray(data.tags)
					? data.tags.map(tag => (typeof tag === 'string' ? tag : tag._id)).filter(Boolean)
					: [];
				
				// Set event with normalized tags
				setEvent({ ...data, tags: normalizedTags });
				
				setOriginalValues({
					title: data.title || '',
					description: data.description || '',
					tags: normalizedTags,
					datePrecision: data.datePrecision || 'year',
					date: data.date || '',
					dateBCE: data.dateBCE || 0,
				});
				
				// Pre-populate tagOptions with proper label/value pairs
				if (data.tags?.length > 0) {
					const initialOptions = data.tags.map((tag) => {
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

	const handleDescriptionBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		saveField('description', e.target.value);
	};

	const handleDatePrecisionChange = (newValue: string) => {
		saveField('datePrecision', newValue);
	};

	/**
	 * Handle date picker change - called when user selects a date
	 */
	const handleDateChange = (newDate: Date | null) => {
		if (newDate) {
			// Convert Date to ISO string for storage
			const isoDate = newDate.toISOString().split('T')[0]; // YYYY-MM-DD
			saveField('date', isoDate);
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
					<Input
						type="text"
						value={event.description || ''}
						onChange={(e) => setEvent({ ...event, description: e.target.value })}
						onBlur={handleDescriptionBlur}
						placeholder="Event description (optional)"
						onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
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
				
				{/* Date fields - BCE input and CE date picker side by side */}
				<div className="space-y-2">
					<Label>Date</Label>
					<div className="flex items-center gap-4">
						{/* BCE Date Input - left side, digits only (negative numbers) */}
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
						
						{/* CE Date Picker - right side, calendar picker */}
						<div className="flex-1">
							<Label className="text-sm font-normal text-muted-foreground">CE</Label>
							<DatePicker
								value={event.date ? new Date(event.date) : null}
								onChange={handleDateChange}
								format="yyyy-MM-dd"
								className="mt-1 w-full"
								placeholder="Select CE date"
							/>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
