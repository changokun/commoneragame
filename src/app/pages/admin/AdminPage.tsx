import { Link } from "react-router";
import { Card } from "../../components/ui/card";

/**
 * AdminPage - Main admin dashboard that provides navigation to all admin sub-pages
 * 
 * This is a simple landing page for administrators that lists all available
 * admin pages with direct links. It serves as a central hub for managing
 * game content like tags and events.
 * 
 * @returns A React component with navigation links to admin pages
 */
export function AdminPage() {
	// Define all admin routes with their display names
	// This makes it easy to add new admin pages in the future
	const adminPages = [
		{ name: "Tags", path: "/admin/tags" },
		{ name: "Events", path: "/admin/events" },
	];

	return (
		<div className="max-w-4xl mx-auto p-8">
			{/* Header section */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Admin Dashboard</h1>
				<p className="text-muted-foreground mt-2">
					Manage game content and settings
				</p>
			</div>

			{/* Admin links card */}
			<Card className="p-6">
				<h2 className="text-xl font-semibold mb-6">Admin Pages</h2>
				
				{/* List of admin page links */}
				<div className="space-y-4">
					{adminPages.map((page) => (
						<div key={page.path} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
							<Link to={page.path} className="block">
								<div className="flex justify-between items-center">
									<span className="font-medium text-lg">{page.name}</span>
									{/* Right arrow indicator (could use an icon from lucide-react if preferred) */}
									<span className="text-muted-foreground">→</span>
								</div>
							</Link>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
}
