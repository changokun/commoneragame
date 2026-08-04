import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Loader2 } from "lucide-react";

interface Tag {
  _id: string;
  name: string;
  description?: string;
  parent?: Tag | null;
}

export function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://game-phase.sarumino.com/common-era';
        const response = await fetch(`${apiUrl}/tags/all`);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        setTags(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Failed to fetch tags:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllTags();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-3">Loading tags...</span>
    </div>
  );

  if (error) return (
    <div className="text-center p-8">
      <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Tags</h2>
      <p className="text-muted-foreground mb-4">{error}</p>
      <Button onClick={() => window.location.reload()}>Retry</Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tags</h1>
      </div>
      <Card className="p-6">
        {tags.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No tags found.</p>
        ) : (
          <div className="space-y-4">
            {tags.map((tag) => (
              <div key={tag._id} className="p-4 border rounded-lg hover:bg-muted/50">
                <Link to={`/admin/tags/edit/${tag._id}`} className="block">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">{tag.name}</span>
                    {tag.description && (
                      <span className="text-sm text-muted-foreground truncate max-w-xs">
                        {tag.description}
                      </span>
                    )}
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