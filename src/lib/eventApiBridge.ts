import type { EventApi } from "@fullcalendar/core";
import type { CalendarEventRecord, EventVisibility } from "@/lib/calendarEventTypes";
import { addLocalDays, formatDateLocal, formatDateTimeLocal } from "@/lib/dateTimeLocal";

export function eventApiToRecord(ev: EventApi): CalendarEventRecord {
  const xp = ev.extendedProps as { visibility?: EventVisibility; memo?: string };
  const allDay = !!ev.allDay;

  if (allDay) {
    const startStr = (ev.startStr ?? "").slice(0, 10);
    let endStr = (ev.endStr ?? "").slice(0, 10);
    if (!endStr && startStr) {
      endStr = formatDateLocal(addLocalDays(new Date(startStr + "T00:00:00"), 1));
    }
    return {
      id: String(ev.id),
      title: ev.title || "",
      start: startStr,
      end: endStr,
      allDay: true,
      visibility: xp.visibility === "private" ? "private" : "public",
      memo: typeof xp.memo === "string" ? xp.memo : "",
    };
  }

  if (!ev.start || !ev.end) {
    const s = ev.start ? new Date(ev.start.getTime()) : new Date();
    const e = ev.end ? new Date(ev.end.getTime()) : new Date(s.getTime() + 60 * 60 * 1000);
    return {
      id: String(ev.id),
      title: ev.title || "",
      start: formatDateTimeLocal(s),
      end: formatDateTimeLocal(e),
      allDay: false,
      visibility: xp.visibility === "private" ? "private" : "public",
      memo: typeof xp.memo === "string" ? xp.memo : "",
    };
  }

  return {
    id: String(ev.id),
    title: ev.title || "",
    start: formatDateTimeLocal(ev.start),
    end: formatDateTimeLocal(ev.end),
    allDay: false,
    visibility: xp.visibility === "private" ? "private" : "public",
    memo: typeof xp.memo === "string" ? xp.memo : "",
  };
}
