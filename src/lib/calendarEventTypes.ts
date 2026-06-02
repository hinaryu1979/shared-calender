import type { EventInput } from "@fullcalendar/core";

export type EventVisibility = "public" | "private";

export type CalendarEventRecord = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  visibility: EventVisibility;
  memo: string;
};

export function toEventInput(r: CalendarEventRecord): EventInput {
  return {
    id: r.id,
    title: r.title,
    start: r.start,
    end: r.end,
    allDay: r.allDay,
    extendedProps: {
      visibility: r.visibility,
      memo: r.memo,
    },
  };
}
