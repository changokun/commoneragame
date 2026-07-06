import { X, Skull } from "lucide-react";
import { Card } from "../components/ui/card";

export function StrikePlaceholderCard({ id }: { id: string }) {
	// console.log('StrikePlaceholderCard', id)

	return (
		<Card className={`p-4 cursor-not-allowed border-dashed min-h-[100px]`}>
			{id === 'imminent' ? (
				<Skull className="w-20 h-20 text-red-300 dark:text-red-900 animate-bounce relative top-2" />
			) : id === 'sph1' ? (
				<Skull className="w-10 h-10 text-red-300 dark:text-red-800" />
			) : (
				<X className="w-10 h-10 text-red-300 dark:text-red-800" />
			)}
		</Card>
	)

}
