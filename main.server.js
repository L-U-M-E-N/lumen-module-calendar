import ical from 'node-ical';
import fs from 'fs';

export default class Calendar {
	static init() {
		Calendar.update();

		Calendar.interval = setInterval(Calendar.update, 3 * 60 * 60 * 1000); // Update every 3 hour
	}

	static update() {
		for(const calendarName in config.calendars) {
			Calendar.syncCalendar(
				calendarName,
				config.calendars[calendarName]
			);
		}
	}

	static fixErrors(field, ev) {
		// No end date
		if(typeof ev.end === 'undefined' || typeof field.end === 'undefined' || Number.isNaN(field.end)) {
			field.end = new Date(field.start);
			field.end.setMinutes(field.end.getMinutes() + 1);
		}

		// No null/undefined description
		if(typeof field.description !== 'string') {
			field.description = '';
		}

		return field;
	}

	static async insertEvent(origin, maxDate, calendarData, event) {
		if (event.type === 'VEVENT') {
			// TODO: update if lastmodified > last calendar sync

			let field = {
				id: event.uid,
				title: event.summary,
				description: event.description,
				start: event.start.toISOString(),
				end: (typeof event.end !== 'undefined') ? event.end.toISOString() : undefined,
				origin
			};

			if((new Date(field.start)).getTime() > maxDate.getTime()) {
				return;
			}

			field = Calendar.fixErrors(field, event);

			if(!!calendarData.start && (new Date(field.start)).getTime() < calendarData.start.getTime()) {
				return;
			}
			if(!!calendarData.end && (new Date(field.end)).getTime() > calendarData.end.getTime()) {
				return;
			}

			const res = (await Database.execQuery('SELECT id FROM calendar WHERE id = $1', [field.id]));
			if(!res || !res.rows || res.rows.length === 0) {
				const [query, values] = Database.buildInsertQuery('calendar', field);

				Database.execQuery(
					query,
					values
				);
			}
		}
	}

	static async syncCalendar(origin, calendarData) {
		const maxDate = new Date();
		maxDate.setDate(maxDate.getDate() - 1);

		calendarData.start = calendarData.start && new Date(calendarData.start);
		calendarData.end = calendarData.end && new Date(calendarData.end);

		const response = await fetch(calendarData.url);
		const responseBody = await response.text();

		const data = ical.parseICS(responseBody);

		for (const k in data) {
			if (data.hasOwnProperty(k)) {
				Calendar.insertEvent(origin, maxDate, calendarData, data[k]);
			}
		}

		log(`Imported calendar "${calendarData.url}"`, 'info');
	}
}
