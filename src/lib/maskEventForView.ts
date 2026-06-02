import type { CalendarEventRecord } from "@/lib/calendarEventTypes";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatHm(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 閲覧トークン向け: 非公開は「HH:mm-HH:mm 予定あり」または終日 */
export function maskEventForView(ev: CalendarEventRecord): CalendarEventRecord {
  if (ev.visibility === "public") return ev;
  if (ev.allDay) {
    return { ...ev, title: "終日 予定あり", memo: "" };
  }
  const s = new Date(ev.start);
  const e = new Date(ev.end);
  const range = `${formatHm(s)}-${formatHm(e)}`;
  return { ...ev, title: `${range} 予定あり`, memo: "" };
}
