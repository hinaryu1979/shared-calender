import type { CalendarEventRecord } from "@/lib/calendarEventTypes";
import { addLocalDays, parseDateLocal } from "@/lib/dateTimeLocal";

function eventRangeBounds(ev: CalendarEventRecord): { startMs: number; endMs: number } {
  if (ev.allDay) {
    const start = parseDateLocal(ev.start.slice(0, 10));
    const endExclusive = parseDateLocal(ev.end.slice(0, 10));
    return { startMs: start.getTime(), endMs: endExclusive.getTime() };
  }
  return { startMs: new Date(ev.start).getTime(), endMs: new Date(ev.end).getTime() };
}

/** 指定期間 [startDate, endDate]（いずれも YYYY-MM-DD・終日含む）と重なる予定を返す */
export function filterEventsByRange(
  events: CalendarEventRecord[],
  startDate: string,
  endDate: string,
): CalendarEventRecord[] {
  const rangeStart = parseDateLocal(startDate).getTime();
  const rangeEndExclusive = addLocalDays(parseDateLocal(endDate), 1).getTime();

  return events.filter((ev) => {
    const { startMs, endMs } = eventRangeBounds(ev);
    return startMs < rangeEndExclusive && endMs > rangeStart;
  });
}
