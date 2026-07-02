import { X, Skull } from "lucide-react";
import { Card } from "../components/ui/card";

export function StrikePlaceholderCard({id}: {id: string}) {
  // console.log('StrikePlaceholderCard', id)

	return (
		<Card className={`p-4 cursor-not-allowed border-dashed min-h-[100px]`}>
			{id === 'sph1' ? (
				<Skull className={`w-5 h-5 ${"text-red-300 dark:text-red-800"}`} />
			) : (
				<X className={`w-4 h-4 ${"text-red-300 dark:text-red-800"}`} />
			)}
		</Card>
	)

}
