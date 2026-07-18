import { Event } from "./types";

export function formatEventDateForDisplay(event: Event): string {
	let year;
	if(event.dateBCE) {
		// todo this is english heavy.
		// todo months and days.
		year = event.dateBCE
	} else {
		// CE
		year = new Date(event.date).getFullYear()
	}

	if (year < -9999) {
		return `${new Intl.NumberFormat().format(Math.abs(year))} years ago`;
	} else if (year < 0) {
		return `${Math.abs(year)} BCE`;
	} else if (year <= 1100) {
		return `${year} CE`;
	} else {
		return `${year}`;
	}

}

export function formatEventDateForComparison(event: Event): number {
	if(event.dateBCE) {
		// BCE - the number is correct as is. however it may still have a date. todo.
		return event.dateBCE
	} else {
		// CE
		// todo figure out months and days for compare. initial thoughts, put the month as .01 thru 0.12 and the same for the day. easy float comparison.
		return new Date(event.date).getFullYear()
	}
}
