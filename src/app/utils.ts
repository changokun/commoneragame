import { Event, GameState } from "./types";

export function formatEventDate(event: Event, settings: object = {}): string {
	const year = parseInt(event.date, 10);
	console.log('format()', event, event.date, year)

	if (isNaN(year)) return event.date;

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
