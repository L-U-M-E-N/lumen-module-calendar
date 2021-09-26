const ical = require('ical');
const fs = require('fs');

module.exports = class Calendar {
	static init() {
		Calendar.update();

		Calendar.interval = setInterval(Calendar.update, 60 * 60 * 1000); // Update every hour
	}

	static update() {
		for(const calendarName in calendars) {
			Calendar.syncCalendar(
				calendarName,
				calendars[calendarName]
			);
		}
	}

	static fixErrors(field, ev) {
		// No end date
		if(typeof ev.end === 'undefined' || typeof field.end === 'undefined' || Number.isNaN(field.end)) {
			field.end = new Date(field.start);
			field.end.setMinutes(field.end.getMinutes() + 1);
		}

		// No null description
		if(typeof field.description !== 'string') {
			field.description = '';
		}

		return field;
	}

	static syncCalendar(origin, calendarData) {
		const maxDate = new Date();
		maxDate.setDate(maxDate.getDate() - 1);

		ical.fromURL(calendarData.url, {}, async function (err, data) {
			for (const k in data) {
				if (data.hasOwnProperty(k)) {
					const ev = data[k];
					if (data[k].type === 'VEVENT') {
						//console.log(ev);

						// TODO: update if lastmodified > last calendar sync

						let field = {
							id: ev.uid,
							title: ev.summary,
							description: ev.description,
							start: new Date(ev.start),
							end: new Date(ev.end),
							origin
						};

						if(field.start.getTime() > maxDate.getTime()) {
							continue;
						}

						field = Calendar.fixErrors(field, ev);

						if(!!calendarData.start && field.start < calendarData.start) { continue; }
						if(!!calendarData.end && field.end > calendarData.end) { continue; }

						if((await Database.execQuery('SELECT id FROM calendar WHERE id = $1', [field.id])).rows.length === 0) {
							const [query, values] = Database.buildInsertQuery('calendar', field);

							Database.execQuery(
								query,
								values,
								ev
							);
						}
					}
				}
			}

			log(`Imported calendar "${calendarData.url}"`, 'info');
		});
	}
};