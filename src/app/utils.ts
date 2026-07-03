import { Event, GameState } from "./types";

export function formatEventDate(date: string, settings: object = {}): string {
	
	const year = parseInt(date, 10);
	
	if (isNaN(year)) return date;

	if (year < -5000) {
		return `${Math.abs(year) + 2000} years ago`;
	} else if (year < 0) {
		return `${Math.abs(year)} BCE`;
	} else if (year <= 1100) {
		return `${year} CE`;
	} else {
		return `${year}`;
	}
}
