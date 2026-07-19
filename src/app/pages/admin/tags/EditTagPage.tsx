import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { TagPicker } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';



interface Tag {
  _id: string;
  name: string;
  description?: string;
  parent?: Tag | null;
}


export function EditTagPage() {

	
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	
	// Tag data state with parent field
	const [tag, setTag] = useState<Tag | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	
	// Save status for each field including parent
	const [saveStatus, setSaveStatus] = useState<{
		name: 'idle' | 'saving' | 'success' | 'error';
		description: 'idle' | 'saving' | 'success' | 'error';
		parent: 'idle' | 'saving' | 'success' | 'error';
	}>({
		name: 'idle',
		description: 'idle',
		parent: 'idle',
	});
	
	// Original values for change detection including parent
	const [originalValues, setOriginalValues] = useState<{
		name: string;
		description: string;
		parent: Tag | null;
	}>({ name: '', description: '', parent: null });

	// State for rsuite TagPicker search
	const [tagOptions, setTagOptions] = useState<Array<{ label: string; value: string }>>([]);

	
	
	useEffect(() => {
		const fetchTag = async () => {
			try {
				const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
				const response = await fetch(`${apiUrl}/tags/${id}?includeParent=1`);
				if (!response.ok) {
					throw new Error('Tag not found');
				}
				const data = await response.json();
				console.log('sdiguhdfdata', data)
				setTag(data);
				setOriginalValues({
					name: data.name || '',
					description: data.description || '',
					parent: data.parent || null,
				});
				// if the tag has a parent, that must be included in the tagOptions (used by the parent selector)
				if(data.parent) {
					setTagOptions([{label:data.parent.name, value: data.parent._id}])
				}
			} catch (err) {
				alert('Failed to load tag: ' + err.message);
				navigate('/admin/tags');
			} finally {
				setIsLoading(false);
			}
		};
		fetchTag();
	}, [id, navigate]);


	const saveField = async (field: 'name' | 'description' | 'parent', value: string | Tag | null) => {
		console.log('saveField()', field, value)
		// Check if value actually changed
		if (value === originalValues[field]) {
			console.log('no need to update, this is the current value.')
			return;
		}
		
		setSaveStatus(prev => ({ ...prev, [field]: 'saving' }));
		
		try {
			const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
			// For parent field, send the parent ID or null
			const payload: Record<string, any> = {};
			if (field === 'parent') {
				payload.parent = value ? (value as Tag)._id : null;
			} else {
				payload[field] = value;
			}
			
			const response = await fetch(`${apiUrl}/tags/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});
			
			if (!response.ok) {
				throw new Error(await response.text());
			}
			
			// Update original values and tag state on success
			setOriginalValues(prev => ({ ...prev, [field]: value }));
			if (field === 'parent') {
				if(value) {
					// console.log('sdigusfgdtghdfhdfdata', { ...tag!, "parent": {_id: value}})
					// setTag({ ...tag!, "parent": {_id: value}});
					setTag({ ...tag!, "parent": value}); /// something else is expanding this... hmmm
					
				} else {
					//erasing the parent field.
					setTag({ ...tag!, "parent": null});
				}
			} else {
				console.log('sdigusfgdtghdfnoyparenthdfdata', { ...tag!, [field]: value })
				setTag({ ...tag!, [field]: value });
			}
			setSaveStatus(prev => ({ ...prev, [field]: 'success' }));
			
			// Clear success status after 8 seconds
			setTimeout(() => {
				setSaveStatus(prev => ({ ...prev, [field]: 'idle' }));
			}, 8000);
		} catch (err) {
			setSaveStatus(prev => ({ ...prev, [field]: 'error' }));
			alert('Failed to save: ' + err.message);
		}
	};


	const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		saveField('name', e.target.value);
	};

	const handleDescriptionBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		saveField('description', e.target.value);
	};

	const handleParentChange = (newParentIds: string[]) => {
		console.log('handleParentChange()', newParentIds)
		let pTag: Tag | null
	
		if (!newParentIds || newParentIds.length === 0) {
			pTag = null
		} else {
			const parentId = newParentIds[0]
			pTag = { _id: parentId, name: tagOptions.find(o => o.value === parentId)?.label || 'Unknown' }
		}
	
		console.log('handleParentChange() POST', pTag)
		saveField('parent', pTag); // will call setTag
	};
	
	const loadTagOptions = async (searchQuery: string) => {
		if (searchQuery.length < 3) return;
		
		try {
			const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
			const response = await fetch(`${apiUrl}/tags?q=${encodeURIComponent(searchQuery)}`);
			if (response.ok) {
				const tags: Tag[] = await response.json();
				console.log(`queried these tags with ${searchQuery}`, tags)
				const options = tags.map(tag => ({
					label: tag.name,
					value: tag._id
				}));
				console.log('setting tagoptions with', options)
				setTagOptions(options);
			}
		} catch (err) {
			console.error('Failed to load tag options:', err);
		}
	};


	/**
	 * ProcessIndicator - Shows save status at top-right of page
	 * Displays spinner when saving, checkmark on success, X on error
	 */
	function ProcessIndicator({ status }: { status: 'idle' | 'saving' | 'success' | 'error' }) {
		if (status === 'idle') return null;
		
		return (
			<div className="fixed top-4 right-4">
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



	if (isLoading) {
		return (
			<div className="p-8">
				<Loader2 className="h-8 w-8 animate-spin mx-auto" />
			</div>
		);
	}

	if (!tag) {
		return <div className="p-8">Tag not found</div>;
	}
	console.log('tagOptions before render', JSON.stringify(tagOptions))
	console.log('tag before render', JSON.stringify(tag))
	return (
		<div className="max-w-2xl mx-auto p-8 space-y-6">
			{/* Process indicators - show if any field is not idle */}
			{Object.values(saveStatus).some(s => s !== 'idle') && (
				<ProcessIndicator 
					status={Object.values(saveStatus).find(s => s !== 'idle') || 'idle'} 
				/>
			)}
			
			{/* Back button */}
			<Button variant="ghost" onClick={() => navigate('/admin/tags')} className="gap-2">
				<ArrowLeft className="h-4 w-4" />
				Back to Tags
			</Button>
			
			{/* Title */}
			<h1 className="text-3xl font-bold">Edit Tag</h1>
			
			{/* Form Card */}
			<Card className="p-6 space-y-4">
				{/* Parent Field - rsuite TagPicker for selecting parent tag */}
				<div className="space-y-2">
					<Label>Parent (optional)</Label>
					<TagPicker
						data={tagOptions}
						value={tag.parent && tag.parent._id ? [tag.parent._id] : tag.parent? [tag.parent] : []}
						onSearch={loadTagOptions}
						onChange={handleParentChange}
						placeholder="Start typing to add a parent tag…"
					/>
				</div>

				{/* Name Field */}
				<div className="space-y-2">
					<Label>Name</Label>
					<Input
						type="text"
						value={tag.name || ''}
						onChange={(e) => setTag({ ...tag, name: e.target.value })}
						onBlur={handleNameBlur}
						placeholder="Tag name"
						onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
					/>
				</div>
				
				{/* Description Field */}
				<div className="space-y-2">
					<Label>Description</Label>
					<Input
						type="text"
						value={tag.description || ''}
						onChange={(e) => setTag({ ...tag, description: e.target.value })}
						onBlur={handleDescriptionBlur}
						placeholder="Tag description (optional)"
						onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
					/>
				</div>
			</Card>
		</div>
	);



}
